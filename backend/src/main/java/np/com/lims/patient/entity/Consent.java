package np.com.lims.patient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.time.Instant;

/** Patient consent captured at registration (NP Privacy Act 2075). */
@Embeddable
public class Consent {

    @Column(name = "consent_store", nullable = false)
    private boolean store;

    @Column(name = "consent_share_reports", nullable = false)
    private boolean shareReports;

    @Column(name = "consent_research", nullable = false)
    private boolean research;

    @Column(name = "consent_captured_at")
    private Instant capturedAt;

    @Column(name = "consent_captured_by", length = 100)
    private String capturedBy;

    public Consent() {
    }

    public void update(boolean store, boolean shareReports, boolean research, String actor) {
        boolean changed = this.store != store || this.shareReports != shareReports || this.research != research;
        this.store = store;
        this.shareReports = shareReports;
        this.research = research;
        if (changed && (store || shareReports || research)) {
            this.capturedAt = Instant.now();
            this.capturedBy = actor;
        }
        if (!store && !shareReports && !research) {
            this.capturedAt = null;
            this.capturedBy = null;
        }
    }

    public boolean isStore() {
        return store;
    }

    public boolean isShareReports() {
        return shareReports;
    }

    public boolean isResearch() {
        return research;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }

    public String getCapturedBy() {
        return capturedBy;
    }
}
