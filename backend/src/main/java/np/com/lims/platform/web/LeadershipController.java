package np.com.lims.platform.web;

import jakarta.validation.Valid;
import np.com.lims.platform.LeadershipService;
import np.com.lims.platform.dto.LeadershipDtos.Profile;
import np.com.lims.platform.dto.LeadershipDtos.UpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Adding, editing and removing the leadership profiles — platform administrators only, like everything under /platform. */
@RestController
@RequestMapping("/platform/leadership")
@PreAuthorize("hasAuthority('PERM_PLATFORM_MANAGE')")
public class LeadershipController {

    private final LeadershipService service;

    public LeadershipController(LeadershipService service) {
        this.service = service;
    }

    @GetMapping
    public List<Profile> all() {
        return service.all();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Profile create(@Valid @RequestBody UpdateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public Profile update(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
