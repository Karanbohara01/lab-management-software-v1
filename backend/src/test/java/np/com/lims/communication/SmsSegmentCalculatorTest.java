package np.com.lims.communication;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SmsSegmentCalculatorTest {

    @Test
    void plainAsciiIsGsm7SingleSegment() {
        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate("Your report is ready for collection.");
        assertThat(estimate.encoding()).isEqualTo(SmsSegmentCalculator.Encoding.GSM7);
        assertThat(estimate.segmentCount()).isEqualTo(1);
    }

    @Test
    void unresolvedPlaceholderTokensStayGsm7() {
        // Composer previews and campaign estimates run before per-recipient placeholder
        // substitution, so a message body still containing literal {patientName}-style tokens is
        // common and must not be misjudged as needing Unicode just because of the braces.
        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate(
                "Dear {patientName}, your report is ready. Visit {labName} to collect it.");
        assertThat(estimate.encoding()).isEqualTo(SmsSegmentCalculator.Encoding.GSM7);
    }

    @Test
    void gsmExtensionCharactersAreTreatedAsGsm7Safe() {
        for (char c : new char[] { '{', '}', '[', ']', '~', '^', '|', '€' }) {
            assertThat(SmsSegmentCalculator.isGsm7Compatible("Amount due: " + c))
                    .as("character '%s'", c).isTrue();
        }
    }

    @Test
    void devanagariTextIsUcs2() {
        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate("तपाईंको रिपोर्ट तयार छ।");
        assertThat(estimate.encoding()).isEqualTo(SmsSegmentCalculator.Encoding.UCS2);
    }

    @Test
    void longMessageSplitsIntoConcatenatedSegments() {
        String longGsm7 = "A".repeat(200);
        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate(longGsm7);
        assertThat(estimate.encoding()).isEqualTo(SmsSegmentCalculator.Encoding.GSM7);
        assertThat(estimate.segmentCount()).isEqualTo(2);
    }

    @Test
    void emptyMessageIsZeroSegments() {
        assertThat(SmsSegmentCalculator.estimate("").segmentCount()).isZero();
        assertThat(SmsSegmentCalculator.estimate(null).segmentCount()).isZero();
    }
}
