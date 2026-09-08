package np.com.lims.ird.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The active gateway until a verified IRD/CBMS implementation is provided. It transmits nothing
 * and every submission attempt is recorded as a transport error with a clear, honest message.
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
        };
    }
}
