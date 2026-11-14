package np.com.lims.platform;

import np.com.lims.common.exception.ApiException;
import np.com.lims.platform.entity.SocialNetwork;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SocialNetworkTest {

    @Test
    void blankMeansNoLink() {
        assertThat(SocialNetwork.LINKEDIN.normalise(null)).isNull();
        assertThat(SocialNetwork.LINKEDIN.normalise("")).isNull();
        assertThat(SocialNetwork.LINKEDIN.normalise("   ")).isNull();
    }

    @Test
    void addsHttpsToABareAddressAndUpgradesHttp() {
        assertThat(SocialNetwork.LINKEDIN.normalise("linkedin.com/in/karan")).isEqualTo("https://linkedin.com/in/karan");
        assertThat(SocialNetwork.LINKEDIN.normalise("  http://www.linkedin.com/in/karan ")).isEqualTo("https://www.linkedin.com/in/karan");
        assertThat(SocialNetwork.FACEBOOK.normalise("https://m.facebook.com/karan")).isEqualTo("https://m.facebook.com/karan");
    }

    @Test
    void acceptsEachNetworksOwnDomains() {
        assertThat(SocialNetwork.FACEBOOK.normalise("fb.com/karan")).isEqualTo("https://fb.com/karan");
        assertThat(SocialNetwork.INSTAGRAM.normalise("instagram.com/karan")).isEqualTo("https://instagram.com/karan");
        assertThat(SocialNetwork.THREADS.normalise("threads.net/@karan")).isEqualTo("https://threads.net/@karan");
        assertThat(SocialNetwork.THREADS.normalise("https://www.threads.com/@karan")).isEqualTo("https://www.threads.com/@karan");
    }

    @Test
    void refusesAnAddressOnAnotherSite() {
        assertThatThrownBy(() -> SocialNetwork.LINKEDIN.normalise("https://facebook.com/karan"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("LinkedIn");
        assertThatThrownBy(() -> SocialNetwork.INSTAGRAM.normalise("https://example.com/instagram.com"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void refusesLookAlikeAndUserInfoTricks() {
        for (String bad : new String[]{
                "https://evil-linkedin.com/in/x",            // ends with the name but is another domain
                "https://linkedin.com.evil.example/in/x",    // starts with it
                "https://linkedin.com@evil.example/",        // really evil.example
                "https://evil.example/#linkedin.com"}) {
            assertThatThrownBy(() -> SocialNetwork.LINKEDIN.normalise(bad)).as(bad).isInstanceOf(ApiException.class);
        }
    }

    @Test
    void refusesAnythingThatIsNotAWebPage() {
        for (String bad : new String[]{
                "javascript:alert(1)", "data:text/html;base64,AAAA", "mailto:a@linkedin.com", "ftp://linkedin.com/x",
                "https://", "https://linkedin.com/in/a b", "not a url"}) {
            assertThatThrownBy(() -> SocialNetwork.LINKEDIN.normalise(bad)).as(bad).isInstanceOf(ApiException.class);
        }
    }

    @Test
    void refusesAnAbsurdlyLongAddress() {
        String longPath = "https://linkedin.com/in/" + "a".repeat(300);
        assertThatThrownBy(() -> SocialNetwork.LINKEDIN.normalise(longPath)).isInstanceOf(ApiException.class);
    }
}
