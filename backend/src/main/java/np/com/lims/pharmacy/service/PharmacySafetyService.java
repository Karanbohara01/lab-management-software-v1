package np.com.lims.pharmacy.service;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.pharmacy.dto.PharmacyDtos.*;
import np.com.lims.pharmacy.entity.PharmacyDrugInteraction;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacyPatientAllergy;
import np.com.lims.pharmacy.repository.PharmacyDrugInteractionRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacyPatientAllergyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class PharmacySafetyService {

    private final PharmacyDrugInteractionRepository interactionRepository;
    private final PharmacyPatientAllergyRepository allergyRepository;
    private final PharmacyItemRepository itemRepository;

    public PharmacySafetyService(
            PharmacyDrugInteractionRepository interactionRepository,
            PharmacyPatientAllergyRepository allergyRepository,
            PharmacyItemRepository itemRepository
    ) {
        this.interactionRepository = interactionRepository;
        this.allergyRepository = allergyRepository;
        this.itemRepository = itemRepository;
    }

    public DrugSafetyCheckResponse checkSafety(CheckSafetyRequest request) {
        if (request == null || request.itemIds() == null || request.itemIds().isEmpty()) {
            return new DrugSafetyCheckResponse(false, false, List.of(), List.of(), List.of());
        }

        List<PharmacyItem> items = itemRepository.findAllById(request.itemIds());
        if (items.isEmpty()) {
            return new DrugSafetyCheckResponse(false, false, List.of(), List.of(), List.of());
        }

        List<PharmacyDrugInteraction> allRules = interactionRepository.findByActiveTrue();
        List<DrugInteractionAlertDto> matchedAlerts = new ArrayList<>();
        boolean hasSevere = false;
        Set<String> counselingTips = new LinkedHashSet<>();

        // Cross-compare every pair of items in the cart
        for (int i = 0; i < items.size(); i++) {
            PharmacyItem itemA = items.get(i);
            String genA = (itemA.getGenericName() != null ? itemA.getGenericName() : itemA.getName()).toUpperCase();

            for (int j = i + 1; j < items.size(); j++) {
                PharmacyItem itemB = items.get(j);
                String genB = (itemB.getGenericName() != null ? itemB.getGenericName() : itemB.getName()).toUpperCase();

                for (PharmacyDrugInteraction rule : allRules) {
                    String ruleA = rule.getDrugAGeneric();
                    String ruleB = rule.getDrugBGeneric();

                    boolean directMatch = matchesDrug(genA, ruleA) && matchesDrug(genB, ruleB);
                    boolean reverseMatch = matchesDrug(genA, ruleB) && matchesDrug(genB, ruleA);

                    if (directMatch || reverseMatch) {
                        boolean isSevere = "SEVERE_CONTRAINDICATED".equalsIgnoreCase(rule.getSeverity());
                        if (isSevere) {
                            hasSevere = true;
                        }

                        matchedAlerts.add(new DrugInteractionAlertDto(
                                rule.getDrugAGeneric(),
                                rule.getDrugBGeneric(),
                                itemA.getName(),
                                itemB.getName(),
                                rule.getSeverity(),
                                rule.getInteractionTitle(),
                                rule.getClinicalEffect(),
                                rule.getRecommendation()
                        ));

                        if (rule.getRecommendation() != null && !rule.getRecommendation().isBlank()) {
                            counselingTips.add(rule.getRecommendation());
                        }
                    }
                }
            }
        }

        // Check patient drug allergies if patient is identified
        List<PatientAllergyAlertDto> allergyAlerts = new ArrayList<>();
        boolean hasAllergy = false;

        if (request.patientId() != null) {
            List<PharmacyPatientAllergy> allergies = allergyRepository.findByPatientId(request.patientId());
            for (PharmacyPatientAllergy allergy : allergies) {
                String allergen = allergy.getAllergenGeneric();
                for (PharmacyItem item : items) {
                    String itemGen = (item.getGenericName() != null ? item.getGenericName() : item.getName()).toUpperCase();
                    if (matchesAllergen(itemGen, allergen)) {
                        hasAllergy = true;
                        allergyAlerts.add(new PatientAllergyAlertDto(
                                request.patientId(),
                                allergy.getAllergenGeneric(),
                                item.getName(),
                                allergy.getSeverity(),
                                allergy.getReactionDetails()
                        ));
                    }
                }
            }
        }

        return new DrugSafetyCheckResponse(
                hasSevere,
                hasAllergy,
                matchedAlerts,
                allergyAlerts,
                new ArrayList<>(counselingTips)
        );
    }

    public List<PharmacyDrugInteraction> listAllRules() {
        return interactionRepository.findByActiveTrue();
    }

    @Transactional
    public PharmacyPatientAllergy recordPatientAllergy(Long patientId, String allergen, String severity, String reactionDetails) {
        PharmacyPatientAllergy allergy = new PharmacyPatientAllergy();
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        allergy.setOrganizationId(tenantId);
        allergy.setPatientId(patientId);
        allergy.setAllergenGeneric(allergen);
        allergy.setSeverity(severity != null ? severity : "SEVERE");
        allergy.setReactionDetails(reactionDetails);
        return allergyRepository.save(allergy);
    }

    private boolean matchesDrug(String itemGeneric, String ruleDrug) {
        if (itemGeneric == null || ruleDrug == null) return false;
        return itemGeneric.contains(ruleDrug) || ruleDrug.contains(itemGeneric);
    }

    private boolean matchesAllergen(String itemGeneric, String allergen) {
        if (itemGeneric == null || allergen == null) return false;
        if (itemGeneric.contains(allergen) || allergen.contains(itemGeneric)) {
            return true;
        }
        // Common cross-reactivity groupings (Beta-lactams / Penicillins)
        if ("PENICILLIN".equalsIgnoreCase(allergen)) {
            return itemGeneric.contains("AMOXICILLIN") ||
                   itemGeneric.contains("AMPICILLIN") ||
                   itemGeneric.contains("CLAVULANATE") ||
                   itemGeneric.contains("PIPERACILLIN");
        }
        if ("SULFA".equalsIgnoreCase(allergen)) {
            return itemGeneric.contains("SULFAMETHOXAZOLE") ||
                   itemGeneric.contains("COTRIMOXAZOLE") ||
                   itemGeneric.contains("SULFASALAZINE");
        }
        if ("NSAID".equalsIgnoreCase(allergen)) {
            return itemGeneric.contains("IBUPROFEN") ||
                   itemGeneric.contains("DICLOFENAC") ||
                   itemGeneric.contains("ACECLOFENAC") ||
                   itemGeneric.contains("NAPROXEN") ||
                   itemGeneric.contains("ASPIRIN") ||
                   itemGeneric.contains("KETOROLAC");
        }
        return false;
    }
}
