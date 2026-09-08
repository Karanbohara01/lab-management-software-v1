package np.com.lims.auth.web;

import jakarta.validation.Valid;
import np.com.lims.auth.AuthService;
import np.com.lims.auth.dto.CurrentUserResponse;
import np.com.lims.auth.dto.LoginRequest;
import np.com.lims.auth.dto.RefreshRequest;
import np.com.lims.auth.dto.TokenResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import np.com.lims.security.AppUserDetails;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @GetMapping("/me")
    public CurrentUserResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        return authService.currentUser(principal.getUsername());
    }

    /** Stateless logout: the client discards its tokens. Endpoint exists for a consistent client contract. */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {
        // no server-side session/token store yet; Phase 7 may add refresh-token revocation.
    }
}
