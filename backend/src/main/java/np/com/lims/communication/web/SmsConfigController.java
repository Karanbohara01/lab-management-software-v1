package np.com.lims.communication.web;

import jakarta.validation.Valid;
import np.com.lims.communication.SmsConfigService;
import np.com.lims.communication.dto.CommunicationDtos.BalanceResponse;
import np.com.lims.communication.dto.CommunicationDtos.GatewayStatusResponse;
import np.com.lims.communication.dto.CommunicationDtos.SamayaConfigRequest;
import np.com.lims.communication.dto.CommunicationDtos.SamayaConfigResponse;
import np.com.lims.communication.dto.CommunicationDtos.SendSmsResponse;
import np.com.lims.communication.dto.CommunicationDtos.TestSmsRequest;
import np.com.lims.communication.entity.SmsProvider;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The Communication Hub's "SMS Configuration" screen — Samaya's own settings, gateway status, test-send and balance. */
@RestController
@RequestMapping("/communication/config")
@PreAuthorize("hasAuthority('PERM_COMMUNICATION_CONFIG_MANAGE')")
public class SmsConfigController {

    private final SmsConfigService service;

    public SmsConfigController(SmsConfigService service) {
        this.service = service;
    }

    @GetMapping("/gateways")
    public List<GatewayStatusResponse> statuses() {
        return service.statuses();
    }

    @GetMapping("/samaya")
    public SamayaConfigResponse getSamaya() {
        return service.getSamaya();
    }

    @PutMapping("/samaya")
    public SamayaConfigResponse updateSamaya(@RequestBody SamayaConfigRequest request) {
        return service.updateSamaya(request);
    }

    @GetMapping("/{provider}/balance")
    public BalanceResponse balance(@PathVariable SmsProvider provider) {
        return service.balance(provider);
    }

    @GetMapping("/low-balance-threshold")
    public Integer getLowBalanceThreshold() {
        return service.getLowBalanceThreshold();
    }

    @PutMapping("/low-balance-threshold")
    public Integer updateLowBalanceThreshold(@RequestBody LowBalanceThresholdRequest request) {
        return service.updateLowBalanceThreshold(request.threshold());
    }

    public record LowBalanceThresholdRequest(Integer threshold) {
    }

    @PostMapping("/{provider}/test-sms")
    public SendSmsResponse sendTest(@PathVariable SmsProvider provider, @Valid @RequestBody TestSmsRequest request) {
        return service.sendTest(provider, request.phone());
    }
}
