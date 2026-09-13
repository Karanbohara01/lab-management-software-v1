package np.com.lims.ird.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * A safety-net default: if {@code CbmsIrdGateway} were ever conditionally disabled again (it
 * currently always registers — see that class, which now resolves "configured or not" dynamically
 * per organization/request rather than at bean-creation time), this bean would take over and
 * transmit nothing, every submission attempt recorded as a transport error with a clear, honest
 * message. Currently dormant in practice (its {@code @ConditionalOnMissingBean} never triggers),
 * kept as the fallback of last resort.
 */
@Configuration
public class UnconfiguredIrdGateway {

    @Bean
    @ConditionalOnMissingBean(IrdGateway.class)
    public IrdGateway irdGateway() {
        return new IrdGateway() {
            @Override
            public String environment() {
                return "DISABLED";
            }

            @Override
            public boolean isConfigured() {
                return false;
            }

            @Override
            public Result submit(IrdBillPayload payload) {
                return Result.transportError("IRD_NOT_CONFIGURED",
                        "IRD / CBMS e-billing is not configured. No data was transmitted. "
                                + "A verified gateway implementation, seller enrolment and credentials are "
                                + "required before electronic submission can be used.");
            }

            @Override
            public Result submitCreditNote(IrdCreditNotePayload payload) {
                return Result.transportError("IRD_NOT_CONFIGURED",
                        "IRD / CBMS e-billing is not configured. No credit note was transmitted. "
                                + "A verified gateway implementation, seller enrolment and credentials are "
                                + "required before electronic submission can be used.");
            }
        };
    }
}
