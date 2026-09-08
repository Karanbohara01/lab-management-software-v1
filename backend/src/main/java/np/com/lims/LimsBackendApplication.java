package np.com.lims;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
@EnableScheduling
public class LimsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LimsBackendApplication.class, args);
    }
}
