package np.com.lims.commission;

import np.com.lims.billing.entity.Invoice;
import np.com.lims.commission.dto.CommissionDtos.DoctorSummary;
import np.com.lims.commission.dto.CommissionDtos.EntryRow;
import np.com.lims.commission.dto.CommissionDtos.PayoutRequest;
import np.com.lims.commission.dto.CommissionDtos.PayoutRow;
import np.com.lims.commission.entity.CommissionEntry;
import np.com.lims.commission.entity.CommissionPayout;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.doctor.DoctorRepository;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.order.entity.LabOrder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommissionService {

    private static final String MODULE = "COMMISSION";

    private final CommissionEntryRepository entryRepository;
    private final CommissionPayoutRepository payoutRepository;
    private final DoctorRepository doctorRepository;
    private final AuditService auditService;

    public CommissionService(CommissionEntryRepository entryRepository, CommissionPayoutRepository payoutRepository,
                             DoctorRepository doctorRepository, AuditService auditService) {
        this.entryRepository = entryRepository;
        this.payoutRepository = payoutRepository;
        this.doctorRepository = doctorRepository;
        this.auditService = auditService;
    }

    /**
     * Called from {@code InvoiceService.issue()} right after an invoice is minted — earns
     * commission for the order's referring doctor if one is set and has a nonzero rate. Silently
     * does nothing otherwise (no doctor, no rate, or a zero rate are all legitimate "no
     * commission" states, not errors). One entry per invoice, enforced by a unique constraint —
     * an invoice is only ever issued once, so this never double-earns.
     */
    @Transactional
    public void earnOnInvoiceIssued(Invoice invoice) {
        LabOrder order = invoice.getOrder();
        Doctor doctor = order.getReferringDoctor();
        if (doctor == null || doctor.getCommissionRate() == null || doctor.getCommissionRate().signum() <= 0) {
            return;
        }
        if (entryRepository.findByInvoiceId(invoice.getId()).isPresent()) {
            return;
        }
        CommissionEntry entry = CommissionEntry.earn(doctor.getId(), invoice.getId(), invoice.getInvoiceNumber(),
                order.getId(), order.getOrderNumber(), invoice.getTaxableAmount(), doctor.getCommissionRate());
        entryRepository.save(entry);
        auditService.record(MODULE, "EARN", "CommissionEntry", entry.getId(),
                "Earned " + entry.getCommissionAmount() + " commission for " + doctor.getFullName()
                        + " on invoice " + invoice.getInvoiceNumber() + " (" + doctor.getCommissionRate() + "%)",
                null, null);
    }

    /** Null if this invoice never earned commission (no referring doctor, no rate set, or not yet issued). */
    @Transactional(readOnly = true)
    public BigDecimal commissionForInvoice(Long invoiceId) {
        return entryRepository.findByInvoiceId(invoiceId).map(CommissionEntry::getCommissionAmount).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<EntryRow> entriesForDoctor(Long doctorId) {
        Doctor doctor = findDoctor(doctorId);
        return entryRepository.findByDoctorIdOrderByEarnedAtDesc(doctorId).stream()
                .map(e -> EntryRow.from(e, doctor.getFullName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PayoutRow> payoutsForDoctor(Long doctorId) {
        return payoutRepository.findByDoctorIdOrderByPaidAtDesc(doctorId).stream().map(PayoutRow::from).toList();
    }

    /** One row per doctor who has ever earned commission (even if their rate has since changed to zero). */
    @Transactional(readOnly = true)
    public List<DoctorSummary> summary() {
        Map<Long, BigDecimal> earned = new HashMap<>();
        entryRepository.sumEarnedByDoctorGrouped().forEach(t -> earned.put(t.getDoctorId(), t.getTotal()));
        Map<Long, BigDecimal> paid = new HashMap<>();
        payoutRepository.sumPaidByDoctorGrouped().forEach(t -> paid.put(t.getDoctorId(), t.getTotal()));

        Map<Long, Doctor> doctors = doctorRepository.findAllById(earned.keySet()).stream()
                .collect(java.util.stream.Collectors.toMap(Doctor::getId, d -> d));

        return earned.keySet().stream()
                .map(doctorId -> {
                    Doctor doctor = doctors.get(doctorId);
                    BigDecimal totalEarned = earned.getOrDefault(doctorId, BigDecimal.ZERO);
                    BigDecimal totalPaid = paid.getOrDefault(doctorId, BigDecimal.ZERO);
                    return new DoctorSummary(doctorId, doctor == null ? "Unknown" : doctor.getFullName(),
                            doctor == null ? null : doctor.getCommissionRate(),
                            totalEarned, totalPaid, totalEarned.subtract(totalPaid));
                })
                .sorted((a, b) -> b.outstanding().compareTo(a.outstanding()))
                .toList();
    }

    @Transactional
    public PayoutRow recordPayout(PayoutRequest request) {
        Doctor doctor = findDoctor(request.doctorId());
        BigDecimal outstanding = entryRepository.sumEarnedByDoctor(doctor.getId())
                .subtract(payoutRepository.sumPaidByDoctor(doctor.getId()));
        if (request.amount().compareTo(outstanding) > 0) {
            throw ApiException.conflict("Payout of " + request.amount() + " exceeds " + doctor.getFullName()
                    + "'s outstanding commission balance of " + outstanding);
        }
        CommissionPayout payout = CommissionPayout.record(doctor.getId(), request.amount(), request.method(),
                trimToNull(request.reference()), trimToNull(request.note()), CurrentUser.username());
        CommissionPayout saved = payoutRepository.save(payout);
        auditService.record(MODULE, "PAYOUT", "CommissionPayout", saved.getId(),
                "Paid " + request.amount() + " commission to " + doctor.getFullName() + " via " + request.method(),
                null, null);
        return PayoutRow.from(saved);
    }

    private Doctor findDoctor(Long id) {
        return doctorRepository.findById(id).orElseThrow(() -> ApiException.notFound("Doctor", id));
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
