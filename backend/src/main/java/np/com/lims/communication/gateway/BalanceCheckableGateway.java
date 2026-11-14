package np.com.lims.communication.gateway;

import np.com.lims.communication.gateway.SamayaSmsGateway.BalanceResult;

/**
 * Implemented by an {@code SmsGateway} whose provider exposes a balance-check call. Kept separate
 * from the core {@code SmsGateway} port (rather than adding a method there) so a gateway that
 * doesn't support this — and the existing {@code SparrowSmsGateway}, until/unless it's confirmed
 * to have an equivalent call — isn't forced to fake one. Callers check
 * {@code gateway instanceof BalanceCheckableGateway} before using it.
 */
public interface BalanceCheckableGateway {
    BalanceResult checkBalance();
}
