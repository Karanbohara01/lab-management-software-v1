package np.com.lims.config;

import np.com.lims.common.tenant.TenantFilterInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final TenantFilterInterceptor tenantFilterInterceptor;

    public WebConfig(TenantFilterInterceptor tenantFilterInterceptor) {
        this.tenantFilterInterceptor = tenantFilterInterceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // Explicit low priority (large order number) so Spring Boot's own
        // OpenEntityManagerInViewInterceptor (very high priority by default) always runs first —
        // this interceptor needs the request's EntityManager already bound to enable the Hibernate
        // filter on the Session that every later repository call will actually use.
        registry.addInterceptor(tenantFilterInterceptor).order(100);
    }
}
