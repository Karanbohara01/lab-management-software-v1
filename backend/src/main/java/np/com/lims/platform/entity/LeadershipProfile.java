package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;

import java.util.regex.Pattern;

/**
 * One of the leadership profiles on the public "About us" section. Platform-level (one set for the
 * whole product, never per clinic). A platform administrator can add and remove them; the page
 * shows them in {@code displayOrder}. A profile with no name is not shown publicly.
 */
@Entity
@Table(name = "leadership_profile")
public class LeadershipProfile extends BaseEntity {

    /** Only these image types are accepted — never an SVG, which can carry script. */
    private static final Pattern IMAGE_DATA_URI = Pattern.compile("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$");

    @Column(nullable = false, length = 160)
    private String name = "";

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 600)
    private String description;

    @Column(name = "photo_data_uri", columnDefinition = "MEDIUMTEXT")
    private String photoDataUri;

    @Column(name = "linkedin_url", length = 300)
    private String linkedinUrl;

    @Column(name = "facebook_url", length = 300)
    private String facebookUrl;

    @Column(name = "instagram_url", length = 300)
    private String instagramUrl;

    @Column(name = "threads_url", length = 300)
    private String threadsUrl;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected LeadershipProfile() {
    }

    public static LeadershipProfile create(String title, int displayOrder) {
        LeadershipProfile p = new LeadershipProfile();
        p.title = title;
        p.displayOrder = displayOrder;
        return p;
    }

    /**
     * Replaces everything an administrator can edit. A null/blank photo removes the photo, and a
     * null/blank social link removes that link. Everything is checked before anything changes, so
     * a rejected update leaves the profile exactly as it was.
     */
    public void update(String name, String title, String description, String photoDataUri,
                       String linkedinUrl, String facebookUrl, String instagramUrl, String threadsUrl) {
        String cleanTitle = trimToNull(title);
        if (cleanTitle == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A title is required.");
        }
        String cleanPhoto = trimToNull(photoDataUri);
        if (cleanPhoto != null && !IMAGE_DATA_URI.matcher(cleanPhoto).matches()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "The photo must be a PNG, JPEG or WebP image.");
        }
        String linkedin = SocialNetwork.LINKEDIN.normalise(linkedinUrl);
        String facebook = SocialNetwork.FACEBOOK.normalise(facebookUrl);
        String instagram = SocialNetwork.INSTAGRAM.normalise(instagramUrl);
        String threads = SocialNetwork.THREADS.normalise(threadsUrl);

        this.name = name == null ? "" : name.trim();
        this.title = cleanTitle;
        this.description = trimToNull(description);
        this.photoDataUri = cleanPhoto;
        this.linkedinUrl = linkedin;
        this.facebookUrl = facebook;
        this.instagramUrl = instagram;
        this.threadsUrl = threads;
    }

    /** Shown on the public site only once it has been given a name. */
    public boolean isPublishable() {
        return !name.isBlank();
    }

    public String getName() {
        return name;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getPhotoDataUri() {
        return photoDataUri;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public String getFacebookUrl() {
        return facebookUrl;
    }

    public String getInstagramUrl() {
        return instagramUrl;
    }

    public String getThreadsUrl() {
        return threadsUrl;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
