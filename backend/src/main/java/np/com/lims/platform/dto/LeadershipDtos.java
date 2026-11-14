package np.com.lims.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.platform.entity.LeadershipProfile;

public final class LeadershipDtos {

    private LeadershipDtos() {
    }

    /**
     * What the platform administrator sends to add or edit a profile. A blank name hides the profile from the public site;
     * a blank social link removes that icon. Social links are checked (and tidied) by the entity.
     */
    public record UpdateRequest(
            @Size(max = 160) String name,
            @NotBlank @Size(max = 120) String title,
            @Size(max = 600) String description,
            // ~1.5 MB of base64 — the admin page shrinks photos to a few tens of KB before sending
            @Size(max = 1_500_000) String photoDataUri,
            @Size(max = 300) String linkedinUrl,
            @Size(max = 300) String facebookUrl,
            @Size(max = 300) String instagramUrl,
            @Size(max = 300) String threadsUrl
    ) {
    }

    /** The administrator's view of a profile. */
    public record Profile(Long id, String name, String title, String description, String photoDataUri,
                          String linkedinUrl, String facebookUrl, String instagramUrl, String threadsUrl,
                          int displayOrder, boolean published) {
        public static Profile from(LeadershipProfile p) {
            return new Profile(p.getId(), p.getName(), p.getTitle(), p.getDescription(), p.getPhotoDataUri(),
                    p.getLinkedinUrl(), p.getFacebookUrl(), p.getInstagramUrl(), p.getThreadsUrl(),
                    p.getDisplayOrder(), p.isPublishable());
        }
    }

    /** What the public "About us" section gets: only what it shows. */
    public record PublicProfile(Long id, String name, String title, String description, String photoDataUri,
                                String linkedinUrl, String facebookUrl, String instagramUrl, String threadsUrl) {
        public static PublicProfile from(LeadershipProfile p) {
            return new PublicProfile(p.getId(), p.getName(), p.getTitle(), p.getDescription(), p.getPhotoDataUri(),
                    p.getLinkedinUrl(), p.getFacebookUrl(), p.getInstagramUrl(), p.getThreadsUrl());
        }
    }

    /** What goes in the audit log: the text and links, and only whether there is a photo — never the image itself. */
    public record AuditView(String name, String title, String description, boolean hasPhoto,
                            String linkedinUrl, String facebookUrl, String instagramUrl, String threadsUrl) {
        public static AuditView from(LeadershipProfile p) {
            return new AuditView(p.getName(), p.getTitle(), p.getDescription(),
                    p.getPhotoDataUri() != null,
                    p.getLinkedinUrl(), p.getFacebookUrl(), p.getInstagramUrl(), p.getThreadsUrl());
        }
    }
}
