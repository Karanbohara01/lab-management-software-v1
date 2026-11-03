package np.com.lims.revenue;

import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.billing.entity.PaymentStatus;
import np.com.lims.catalog.entity.TestType;
import np.com.lims.patient.entity.PatientCategory;
import np.com.lims.patient.entity.PayerType;
import np.com.lims.settings.entity.LaboratoryProfile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Response shapes for the revenue module. Every amount is a 2-decimal {@link BigDecimal} that was
 * summed in the database from the stored, already-rounded invoice/payment/refund figures — the
 * client never derives money from other money.
 */
public final class RevenueDtos {

    private RevenueDtos() {
    }

    /** The resolved reporting window, echoed back so the screen and the printout can name it exactly. */
    public record Period(LocalDate from, LocalDate to, long days, String zone, Instant start, Instant endExclusive) {
        static Period from(RevenuePeriod.Range r) {
            return new Period(r.from(), r.to(), r.days(), RevenuePeriod.ZONE.getId(), r.start(), r.endExclusive());
        }
    }

    /**
     * What was BILLED: invoices issued in the period (by {@code issuedAt}), cancelled ones excluded.
     * {@code collectedToDate} and {@code outstanding} describe those same invoices as they stand
     * now — they are not period cash figures (see {@link CollectionSummary} for those).
     */
    public record BillingSummary(
            long invoiceCount,
            long itemCount,
            long testsOrdered,
            BigDecimal grossCharges,
            BigDecimal lineDiscounts,
            BigDecimal invoiceDiscounts,
            BigDecimal totalDiscounts,
            BigDecimal subtotal,
            BigDecimal taxableAmount,
            BigDecimal taxAmount,
            BigDecimal totalBilled,
            BigDecimal collectedToDate,
            BigDecimal outstanding,
            long outstandingInvoiceCount
    ) {
    }

    public record MethodTotal(PaymentMethod method, long transactions, BigDecimal amount) {
    }

    public record CashierTotal(String receivedBy, long transactions, BigDecimal amount) {
    }

    /**
     * What was COLLECTED: every payment received in the period (by {@code receivedAt}), whatever
     * later happened to it — a reversal is reported as a refund on its own date, never by hiding
     * the payment. {@code onAccount} is the CREDIT method: a settlement booked against a
     * customer's account, not money in the till, so it is split out of {@code cashAndBank}.
     */
    public record CollectionSummary(
            long paymentCount,
            BigDecimal grossCollected,
            BigDecimal cashAndBank,
            BigDecimal onAccount,
            List<MethodTotal> byMethod,
            List<CashierTotal> byCashier
    ) {
    }

    /** Refunds APPROVED in the period (by {@code decidedAt}); requested or rejected ones move no money. */
    public record RefundSummary(long count, BigDecimal amount) {
    }

    /**
     * Cancellations, reported but never counted as revenue. {@code count}/{@code amount} are the
     * invoices voided during the period (by {@code cancelledAt}).
     *
     * <p>{@code issuedThenCancelledCount}/{@code issuedThenCancelledAmount} are a different
     * population: invoices ISSUED in this period that have since been voided, whenever that
     * happened. They are the bridge to what the period was billed at the time —
     * {@code billedAsIssued = totalBilled + issuedThenCancelledAmount} — so re-running a closed
     * period explains its own difference from the copy filed back then rather than just
     * disagreeing with it.
     */
    public record CancelledSummary(
            long count, BigDecimal amount,
            long issuedThenCancelledCount, BigDecimal issuedThenCancelledAmount,
            BigDecimal billedAsIssued
    ) {
    }

    /** Every issued invoice still carrying a balance, as of now — a point-in-time figure, not a period one. */
    public record OutstandingSummary(BigDecimal amount, long invoiceCount) {
    }

    /** The headline figures of a window, for period-over-period comparison. */
    public record Comparison(
            Period period,
            BigDecimal totalBilled,
            BigDecimal grossCollected,
            BigDecimal refunds,
            BigDecimal netCollected,
            long invoiceCount,
            long paymentCount
    ) {
    }

    public record LabHeader(
            String name, String addressLine, String city, String phone, String email, String panNumber,
            String logoDataUri, boolean printLetterhead
    ) {
        static LabHeader from(LaboratoryProfile lab) {
            return new LabHeader(lab.getName(), lab.getAddressLine(), lab.getCity(), lab.getPhone(), lab.getEmail(),
                    lab.getPanNumber(), lab.getLogoDataUri(), lab.isPrintInvoiceLetterhead());
        }
    }

    public record Summary(
            Period period,
            BillingSummary billing,
            CollectionSummary collections,
            RefundSummary refunds,
            BigDecimal netCollected,
            CancelledSummary cancelled,
            OutstandingSummary outstanding,
            Comparison previous,
            LabHeader lab,
            Instant generatedAt,
            String generatedBy
    ) {
    }

    /**
     * One billed test (or profile) across the period's invoices. {@code collected} and
     * {@code outstanding} are the invoice's net payment / balance allocated to this line in
     * proportion to the line's share of the invoice subtotal — an invoice is paid as a whole, so a
     * per-line cash figure can only ever be an allocation; it is labelled as one.
     */
    public record TestRow(
            String code,
            String name,
            TestType type,
            String department,
            String category,
            long timesOrdered,
            long invoices,
            BigDecimal gross,
            BigDecimal discount,
            BigDecimal netBilled,
            BigDecimal collected,
            BigDecimal outstanding
    ) {
    }

    /** A roll-up of {@link TestRow}s (by category, department or into packages). */
    public record GroupRow(
            String label,
            long tests,
            long timesOrdered,
            BigDecimal gross,
            BigDecimal discount,
            BigDecimal netBilled,
            BigDecimal collected,
            BigDecimal outstanding
    ) {
    }

    public record PatientCategoryRow(
            PatientCategory category, long invoices, BigDecimal billed, BigDecimal discount,
            BigDecimal collected, BigDecimal outstanding
    ) {
    }

    public record PayerRow(
            PayerType payerType, String payerName, long invoices, BigDecimal billed,
            BigDecimal collected, BigDecimal outstanding
    ) {
    }

    public record ReferrerRow(Long doctorId, String doctorName, long invoices, BigDecimal billed,
                              BigDecimal collected, BigDecimal outstanding) {
    }

    public record PatientOutstandingRow(Long patientId, String mrn, String patientName, long invoices,
                                        BigDecimal outstanding) {
    }

    public record Breakdown(
            Period period,
            List<TestRow> byTest,
            List<GroupRow> byCategory,
            List<GroupRow> byDepartment,
            List<GroupRow> byPackage,
            List<PatientCategoryRow> byPatientCategory,
            List<PayerRow> byPayer,
            List<ReferrerRow> byReferrer,
            List<PatientOutstandingRow> topOutstandingPatients
    ) {
    }

    public enum Granularity { DAY, WEEK, MONTH }

    /** One bucket of the trend; {@code bucket} is the first local day of the bucket (ISO date). */
    public record TrendPoint(LocalDate bucket, BigDecimal billed, BigDecimal collected, BigDecimal refunded, BigDecimal net) {
    }

    public record Trend(Period period, Granularity granularity, List<TrendPoint> points) {
    }

    public record PaymentRow(
            Long id,
            Instant receivedAt,
            Long invoiceId,
            String invoiceNumber,
            InvoiceStatus invoiceStatus,
            Long patientId,
            String patientMrn,
            String patientName,
            PaymentMethod method,
            BigDecimal amount,
            String reference,
            String note,
            String receivedBy,
            boolean reversed,
            BigDecimal refundedAmount
    ) {
    }

    public record RefundRow(
            Long id,
            Instant decidedAt,
            Instant requestedAt,
            Long invoiceId,
            String invoiceNumber,
            Long patientId,
            String patientMrn,
            String patientName,
            BigDecimal amount,
            String reason,
            String requestedBy,
            String decidedBy,
            PaymentMethod paymentMethod
    ) {
    }

    public enum OutstandingScope { PERIOD, ALL }

    public record OutstandingRow(
            Long invoiceId,
            String invoiceNumber,
            Instant issuedAt,
            Long patientId,
            String patientMrn,
            String patientName,
            PayerType payerType,
            String payerName,
            BigDecimal totalAmount,
            BigDecimal netPaid,
            BigDecimal balance,
            PaymentStatus paymentStatus,
            long daysOutstanding
    ) {
    }

    /** A register for the printout: every row (up to the cap), and whether the cap was hit. */
    public record Register<T>(List<T> rows, long total, boolean truncated) {
    }

    /** The whole printable report in one response, built from the very same queries as the dashboard. */
    public record Report(
            Summary summary,
            Breakdown breakdown,
            Trend trend,
            Register<PaymentRow> payments,
            Register<RefundRow> refunds,
            Register<OutstandingRow> outstanding
    ) {
    }
}
