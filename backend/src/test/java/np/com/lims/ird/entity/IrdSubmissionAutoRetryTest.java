package np.com.lims.ird.entity;

import np.com.lims.billing.entity.Invoice;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.department.entity.Department;
import np.com.lims.order.OrderPricingCalculator;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression coverage for {@link IrdSubmission#isAutoRetryEligible}, the guard the unattended
 * sweep (IrdSubmissionService#autoRetrySweep) relies on to decide which failed submissions are
 * safe to retry without a human — see that method's javadoc for why a network failure and an
 * IRD rejection must NOT be treated the same way here.
 */
class IrdSubmissionAutoRetryTest {

    private IrdSubmission trackedSubmission() {
        Department dept = Department.create("D", "Dept");
        Patient patient = Patient.register("P000001", "Test", Gender.OTHER);
        LabOrder order = LabOrder.open("ORD1", patient, null, null);
        LabTest test = LabTest.create("T1", "Test 1", dept);
        test.updateDetails("Test 1", dept, null, null, null, null, new BigDecimal("500.00"), null);
        order.addItem(test, 1, null);
        Invoice invoice = Invoice.openFor(order, "2082/83");
        var r = new OrderPricingCalculator().calculate(order.getItems(), DiscountType.NONE, null, null);
        invoice.applyPricing(r.discountType(), r.discountValue(), r.taxRate(), r.subtotal(), r.discountAmount(),
                r.taxableAmount(), r.taxAmount(), r.totalAmount());
        invoice.issue("reception", "INV-2082/83-000001");
        return IrdSubmission.trackFor(invoice);
    }

    @Test
    void transportFailureIsEligibleOnceBackoffElapses() {
        IrdSubmission submission = trackedSubmission();
        var attempt = submission.beginAttempt(IrdSubmissionAttempt.Action.SUBMIT, "system", "{}");
        submission.recordFailure(attempt, false, "CBMS_UNREACHABLE", "Connection timed out", null);

        assertThat(submission.getStatus()).isEqualTo(IrdStatus.FAILED);
        // A negative backoff simulates "enough time has already passed".
        assertThat(submission.isAutoRetryEligible(5, Duration.ofSeconds(-1))).isTrue();
    }

    @Test
    void transportFailureIsNotEligibleBeforeBackoffElapses() {
        IrdSubmission submission = trackedSubmission();
        var attempt = submission.beginAttempt(IrdSubmissionAttempt.Action.SUBMIT, "system", "{}");
        submission.recordFailure(attempt, false, "CBMS_UNREACHABLE", "Connection timed out", null);

        assertThat(submission.isAutoRetryEligible(5, Duration.ofMinutes(5))).isFalse();
    }

    @Test
    void irdRejectionIsNeverAutoRetried() {
        IrdSubmission submission = trackedSubmission();
        var attempt = submission.beginAttempt(IrdSubmissionAttempt.Action.SUBMIT, "system", "{}");
        // transmitted=true => a real CBMS rejection (bad data/credentials), not a network failure.
        submission.recordFailure(attempt, true, "104", "CBMS rejected the request: invalid model/fields", "{}");

        assertThat(submission.getStatus()).isEqualTo(IrdStatus.FAILED);
        assertThat(submission.isAutoRetryEligible(5, Duration.ofSeconds(-1))).isFalse();
    }

    @Test
    void stopsAutoRetryingOnceAttemptCapIsReached() {
        IrdSubmission submission = trackedSubmission();
        for (int i = 0; i < 5; i++) {
            var attempt = submission.beginAttempt(IrdSubmissionAttempt.Action.RETRY, "system", "{}");
            submission.recordFailure(attempt, false, "CBMS_UNREACHABLE", "Connection timed out", null);
        }

        assertThat(submission.getAttemptCount()).isEqualTo(5);
        assertThat(submission.isAutoRetryEligible(5, Duration.ofSeconds(-1))).isFalse();
    }

    @Test
    void acceptedSubmissionIsNeverAutoRetried() {
        IrdSubmission submission = trackedSubmission();
        var attempt = submission.beginAttempt(IrdSubmissionAttempt.Action.SUBMIT, "system", "{}");
        submission.recordAccepted(attempt, "ref-123", "{}");

        assertThat(submission.isAutoRetryEligible(5, Duration.ofSeconds(-1))).isFalse();
    }
}
