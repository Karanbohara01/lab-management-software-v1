package np.com.lims.order;

import np.com.lims.branch.BranchRepository;
import np.com.lims.branch.entity.Branch;
import np.com.lims.catalog.LabTestService;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.doctor.DoctorRepository;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.order.dto.OrderDtos.Detail;
import np.com.lims.order.dto.OrderDtos.ItemRequest;
import np.com.lims.order.dto.OrderDtos.ListItem;
import np.com.lims.order.dto.OrderDtos.Pricing;
import np.com.lims.order.dto.OrderDtos.PreviewRequest;
import np.com.lims.order.dto.OrderDtos.SaveRequest;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.OrderStatus;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import np.com.lims.sample.SampleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LabOrderService {

    private static final String MODULE = "LAB_ORDER";
    private static final String ORDER_SEQUENCE = "ORDER_NUMBER";

    private final LabOrderRepository orderRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final BranchRepository branchRepository;
    private final LabTestService labTestService;
    private final OrderPricingCalculator pricingCalculator;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final SampleService sampleService;

    public LabOrderService(LabOrderRepository orderRepository,
                           PatientRepository patientRepository,
                           DoctorRepository doctorRepository,
                           BranchRepository branchRepository,
                           LabTestService labTestService,
                           OrderPricingCalculator pricingCalculator,
                           SequenceService sequenceService,
                           AuditService auditService,
                           SampleService sampleService) {
        this.orderRepository = orderRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.branchRepository = branchRepository;
        this.labTestService = labTestService;
        this.pricingCalculator = pricingCalculator;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.sampleService = sampleService;
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(Long patientId, OrderStatus status, Long branchId, String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        // A branch-restricted user's own scope always wins over whatever the client asked for.
        Long effectiveBranchId = CurrentUser.branchId() != null ? CurrentUser.branchId() : branchId;
        return orderRepository.search(patientId, status, effectiveBranchId, normalized, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public List<ListItem> forPatient(Long patientId) {
        return orderRepository.findByPatientIdOrderByOrderedAtDesc(patientId).stream().map(ListItem::from).toList();
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(load(id));
    }

    /** Stateless pricing preview - no persistence, used by the order builder UI. */
    @Transactional(readOnly = true)
    public Pricing preview(PreviewRequest request) {
        LabOrder scratch = LabOrder.open("PREVIEW", null, null, null);
        addItems(scratch, request.items());
        return Pricing.from(pricingCalculator.calculate(scratch.getItems(),
                request.discountType(), request.discountValue(), request.taxRate()));
    }

    @Transactional
    public Detail create(SaveRequest request) {
        Patient patient = patientRepository.findWithDoctorById(request.patientId())
                .orElseThrow(() -> ApiException.notFound("Patient", request.patientId()));
        if (!patient.isActive()) {
            throw ApiException.conflict("Patient " + patient.getMrn() + " is inactive");
        }
        Doctor doctor = resolveDoctor(request.referringDoctorId(), patient);
        Branch branch = resolveBranch(request.branchId());

        String number = sequenceService.nextFormatted(ORDER_SEQUENCE, "ORD", 6);
        LabOrder order = LabOrder.open(number, patient, doctor, branch, trimToNull(request.clinicalNotes()));
        order.applyPriority(request.priority());
        addItems(order, request.items());
        repriceAndPersist(order, request);

        LabOrder saved = orderRepository.save(order);
        if (request.confirm()) {
            saved.confirm();
            sampleService.generateForOrder(saved);
        }
        auditService.record(MODULE, request.confirm() ? "CREATE_CONFIRMED" : "CREATE", "LabOrder", saved.getId(),
                "Created order " + number + " for " + patient.getFullName(), null, Detail.from(saved));
        return Detail.from(saved);
    }

    @Transactional
    public Detail update(Long id, SaveRequest request) {
        LabOrder order = load(id);
        order.assertEditable();
        Detail before = Detail.from(order);

        Doctor doctor = resolveDoctor(request.referringDoctorId(), order.getPatient());
        order.updateHeader(doctor, trimToNull(request.clinicalNotes()));
        order.applyPriority(request.priority());
        order.clearItems();
        addItems(order, request.items());
        repriceAndPersist(order, request);

        if (request.confirm()) {
            order.confirm();
            sampleService.generateForOrder(order);
        }
        auditService.record(MODULE, "UPDATE", "LabOrder", id,
                "Updated order " + order.getOrderNumber(), before, Detail.from(order));
        return Detail.from(order);
    }

    @Transactional
    public Detail confirm(Long id) {
        LabOrder order = load(id);
        order.confirm();
        sampleService.generateForOrder(order);
        auditService.record(MODULE, "CONFIRM", "LabOrder", id,
                "Confirmed order " + order.getOrderNumber(), null, Detail.from(order));
        return Detail.from(order);
    }

    @Transactional
    public Detail cancel(Long id, String reason) {
        LabOrder order = load(id);
        order.cancel(trimToNull(reason));
        auditService.record(MODULE, "CANCEL", "LabOrder", id,
                "Cancelled order " + order.getOrderNumber()
                        + (reason == null ? "" : " – " + reason.trim()), null, Detail.from(order));
        return Detail.from(order);
    }

    // ----- helpers ----------------------------------------------------

    private void addItems(LabOrder order, List<ItemRequest> items) {
        Map<Long, ItemRequest> byTest = new LinkedHashMap<>();
        for (ItemRequest item : items) {
            if (byTest.putIfAbsent(item.testId(), item) != null) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        "Test " + item.testId() + " is listed more than once – increase the quantity instead");
            }
        }
        List<Long> testIds = List.copyOf(byTest.keySet());
        Map<Long, LabTest> tests = new LinkedHashMap<>();
        labTestService.requireActiveTests(testIds).forEach(t -> tests.put(t.getId(), t));

        for (Long testId : testIds) {
            ItemRequest req = byTest.get(testId);
            order.addItem(tests.get(testId), req.quantity(), req.lineDiscount());
        }
    }

    private void repriceAndPersist(LabOrder order, SaveRequest request) {
        OrderPricingCalculator.Result result = pricingCalculator.calculate(
                order.getItems(), request.discountType(), request.discountValue(), request.taxRate());
        order.applyPricing(result.discountType(), result.discountValue(), result.taxRate(),
                result.subtotal(), result.discountAmount(), result.taxableAmount(),
                result.taxAmount(), result.totalAmount());
    }

    private Doctor resolveDoctor(Long doctorId, Patient patient) {
        if (doctorId == null) {
            return patient.getReferringDoctor();
        }
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> ApiException.notFound("Doctor", doctorId));
    }

    /**
     * Explicit request branch wins; otherwise the acting user's home branch; otherwise (HQ user,
     * no branch chosen) the first active branch, so single-branch labs never have to think about this.
     */
    private Branch resolveBranch(Long requestedBranchId) {
        if (requestedBranchId != null) {
            return branchRepository.findById(requestedBranchId)
                    .orElseThrow(() -> ApiException.notFound("Branch", requestedBranchId));
        }
        if (CurrentUser.branchId() != null) {
            return branchRepository.findById(CurrentUser.branchId())
                    .orElseThrow(() -> ApiException.notFound("Branch", CurrentUser.branchId()));
        }
        return branchRepository.findFirstByActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "No active branch is configured"));
    }

    private LabOrder load(Long id) {
        return orderRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Order", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
