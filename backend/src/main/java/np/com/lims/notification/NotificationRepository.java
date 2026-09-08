package np.com.lims.notification;

import np.com.lims.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByTypeAndReferenceAndCreatedAtAfter(Notification.Type type, String reference, Instant after);

    @Query("SELECT n FROM Notification n WHERE n.createdAt >= :since ORDER BY n.createdAt DESC")
    List<Notification> recent(@Param("since") Instant since);
}
