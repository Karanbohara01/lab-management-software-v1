package np.com.lims.platform;

import np.com.lims.common.exception.ApiException;
import np.com.lims.platform.entity.LeadershipProfile;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LeadershipProfileTest {

    private static final String PNG = "data:image/png;base64,iVBORw0KGgo=";

    private LeadershipProfile profile() {
        return LeadershipProfile.create("CEO & Founder", 1);
    }

    /** Update with no social links — the part these tests are not about. */
    private static void update(LeadershipProfile p, String name, String title, String description, String photo) {
        p.update(name, title, description, photo, null, null, null, null);
    }

    @Test
    void aNewProfileHasNoNameSoItIsNotPublished() {
        assertThat(profile().isPublishable()).isFalse();
    }

    @Test
    void givingItANamePublishesIt() {
        LeadershipProfile p = profile();
        update(p, "  Karan Bohara  ", "CEO & Founder", "Leads the company.", null);

        assertThat(p.getName()).isEqualTo("Karan Bohara");
        assertThat(p.isPublishable()).isTrue();
    }

    @Test
    void clearingTheNameTakesItOffThePublicSite() {
        LeadershipProfile p = profile();
        update(p, "Karan Bohara", "CEO & Founder", null, null);
        update(p, "   ", "CEO & Founder", null, null);

        assertThat(p.isPublishable()).isFalse();
        assertThat(p.getName()).isEmpty();
    }

    @Test
    void blankTextBecomesNullAndASurroundingSpaceIsTrimmed() {
        LeadershipProfile p = profile();
        update(p, "Namita", "  COO & Co-Founder ", "   ", "  ");

        assertThat(p.getTitle()).isEqualTo("COO & Co-Founder");
        assertThat(p.getDescription()).isNull();
        assertThat(p.getPhotoDataUri()).isNull();
    }

    @Test
    void aTitleIsRequired() {
        assertThatThrownBy(() -> update(profile(), "Karan", "  ", "x", null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("title");
    }

    @Test
    void acceptsPngJpegAndWebpPhotos() {
        LeadershipProfile p = profile();
        for (String uri : new String[]{PNG, "data:image/jpeg;base64,/9j/4AAQ", "data:image/webp;base64,UklGRg=="}) {
            update(p, "Karan", "CEO", null, uri);
            assertThat(p.getPhotoDataUri()).isEqualTo(uri);
        }
    }

    @Test
    void rejectsAnythingThatIsNotAPlainRasterImage() {
        LeadershipProfile p = profile();
        for (String bad : new String[]{
                "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",   // SVG can carry script
                "data:text/html;base64,PGgxPg==",
                "https://example.com/photo.png",
                "javascript:alert(1)",
                "data:image/png;base64,AAAA\" onerror=\"alert(1)"}) {
            assertThatThrownBy(() -> update(p, "Karan", "CEO", null, bad))
                    .as(bad)
                    .isInstanceOf(ApiException.class);
        }
    }

    @Test
    void aFailedUpdateLeavesTheProfileUnchanged() {
        LeadershipProfile p = profile();
        p.update("Karan", "CEO", "Original.", PNG, "linkedin.com/in/karan", null, null, null);

        assertThatThrownBy(() -> p.update("Changed", "CEO", "Changed.", PNG, "https://evil.example/x", null, null, null))
                .isInstanceOf(ApiException.class);

        assertThat(p.getName()).isEqualTo("Karan");
        assertThat(p.getDescription()).isEqualTo("Original.");
        assertThat(p.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/karan");
    }

    @Test
    void keepsTheFourSocialLinksAndClearsOnesLeftBlank() {
        LeadershipProfile p = profile();
        p.update("Karan", "CEO", null, null,
                "linkedin.com/in/karan", "https://www.facebook.com/karan.b", "instagram.com/karan", "https://www.threads.net/@karan");

        assertThat(p.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/karan");
        assertThat(p.getFacebookUrl()).isEqualTo("https://www.facebook.com/karan.b");
        assertThat(p.getInstagramUrl()).isEqualTo("https://instagram.com/karan");
        assertThat(p.getThreadsUrl()).isEqualTo("https://www.threads.net/@karan");

        p.update("Karan", "CEO", null, null, "linkedin.com/in/karan", "  ", null, "");
        assertThat(p.getLinkedinUrl()).isNotNull();
        assertThat(p.getFacebookUrl()).isNull();
        assertThat(p.getInstagramUrl()).isNull();
        assertThat(p.getThreadsUrl()).isNull();
    }
}
