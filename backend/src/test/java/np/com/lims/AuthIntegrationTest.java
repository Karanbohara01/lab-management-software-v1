package np.com.lims;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.AutoConfigureWebClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end check of the security wiring against a real MySQL + Flyway schema + dev seed users.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebClient
@Testcontainers(disabledWithoutDocker = true)
class AuthIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lims.security.jwt.secret", () -> "integration-test-secret-integration-test-secret");
    }

    @Autowired
    TestRestTemplate rest;

    private String login(String username, String password) {
        ResponseEntity<Map> res = rest.postForEntity("/api/auth/login",
                Map.of("username", username, "password", password), Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        return (String) res.getBody().get("accessToken");
    }

    private HttpEntity<Void> bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        return new HttpEntity<>(headers);
    }

    @Test
    void loginReturnsTokenAndMeResolves() {
        String token = login("superadmin", "Passw0rd!");
        assertThat(token).isNotBlank();

        ResponseEntity<Map> me = rest.exchange("/api/auth/me", HttpMethod.GET, bearer(token), Map.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().get("username")).isEqualTo("superadmin");
        assertThat(me.getBody().get("roles").toString()).contains("SUPER_ADMIN");
    }

    @Test
    void badCredentialsAreRejected() {
        ResponseEntity<Map> res = rest.postForEntity("/api/auth/login",
                Map.of("username", "superadmin", "password", "wrong"), Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getBody().get("code")).isEqualTo("INVALID_CREDENTIALS");
    }

    @Test
    void protectedEndpointRequiresAuthentication() {
        ResponseEntity<String> res = rest.getForEntity("/api/patients", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void permissionIsEnforcedPerEndpoint() {
        String technician = login("technician", "Passw0rd!");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(technician);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> body = new HttpEntity<>(
                "{\"fullName\":\"X\",\"gender\":\"MALE\",\"approximateAgeYears\":1}", headers);

        ResponseEntity<String> res = rest.postForEntity("/api/patients", body, String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
