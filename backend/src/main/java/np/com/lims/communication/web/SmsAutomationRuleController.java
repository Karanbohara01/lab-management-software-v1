package np.com.lims.communication.web;

import np.com.lims.communication.SmsAutomationRuleService;
import np.com.lims.communication.dto.CommunicationDtos.AutomationRuleResponse;
import np.com.lims.communication.dto.CommunicationDtos.AutomationRuleUpdateRequest;
import np.com.lims.communication.entity.SmsAutomationEvent;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/communication/automation-rules")
public class SmsAutomationRuleController {

    private final SmsAutomationRuleService service;

    public SmsAutomationRuleController(SmsAutomationRuleService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public List<AutomationRuleResponse> list() {
        return service.list();
    }

    @PutMapping("/{eventType}")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_AUTOMATION_MANAGE')")
    public AutomationRuleResponse update(@PathVariable SmsAutomationEvent eventType,
                                         @RequestBody AutomationRuleUpdateRequest request) {
        return service.update(eventType, request);
    }
}
