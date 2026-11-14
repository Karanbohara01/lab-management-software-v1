package np.com.lims.platform;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.platform.dto.LeadershipDtos.AuditView;
import np.com.lims.platform.dto.LeadershipDtos.Profile;
import np.com.lims.platform.dto.LeadershipDtos.PublicProfile;
import np.com.lims.platform.dto.LeadershipDtos.UpdateRequest;
import np.com.lims.platform.entity.LeadershipProfile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** The leadership profiles shown in the landing page's "About us" section. */
@Service
public class LeadershipService {

    private static final String MODULE = "PLATFORM";

    /** More than this would turn the About section into a team page and bloat the public response. */
    static final int MAX_PROFILES = 12;

    private final LeadershipProfileRepository repository;
    private final AuditService auditService;

    public LeadershipService(LeadershipProfileRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    /** Every profile, for the administrator — including ones not yet published. */
    @Transactional(readOnly = true)
    public List<Profile> all() {
        return repository.findAllByOrderByDisplayOrderAscIdAsc().stream().map(Profile::from).toList();
    }

    /** What the public site shows: the profiles that have been given a name, in page order. */
    @Transactional(readOnly = true)
    public List<PublicProfile> publicProfiles() {
        return repository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .filter(LeadershipProfile::isPublishable)
                .map(PublicProfile::from)
                .toList();
    }

    /** Adds a leader after the last one on the page. A new profile needs a name — it is pointless without one. */
    @Transactional
    public Profile create(UpdateRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A name is required.");
        }
        if (repository.count() >= MAX_PROFILES) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "At most " + MAX_PROFILES + " leaders can be shown. Remove one to add another.");
        }
        int next = repository.findFirstByOrderByDisplayOrderDescIdDesc().map(last -> last.getDisplayOrder() + 1).orElse(1);
        LeadershipProfile profile = LeadershipProfile.create("", next);
        apply(profile, request); // validates everything before anything is saved
        repository.save(profile);
        auditService.record(MODULE, "LEADERSHIP_CREATE", "LeadershipProfile", profile.getId(),
                "Added " + profile.getName() + " to the leadership profiles", null, AuditView.from(profile));
        return Profile.from(profile);
    }

    @Transactional
    public Profile update(Long id, UpdateRequest request) {
        LeadershipProfile profile = find(id);
        AuditView before = AuditView.from(profile);
        apply(profile, request);
        auditService.record(MODULE, "LEADERSHIP_UPDATE", "LeadershipProfile", profile.getId(),
                "Updated the leadership profile of " + displayName(profile), before, AuditView.from(profile));
        return Profile.from(profile);
    }

    @Transactional
    public void delete(Long id) {
        LeadershipProfile profile = find(id);
        AuditView before = AuditView.from(profile);
        repository.delete(profile);
        auditService.record(MODULE, "LEADERSHIP_DELETE", "LeadershipProfile", id,
                "Removed " + displayName(profile) + " from the leadership profiles", before, null);
    }

    private LeadershipProfile find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, "No leadership profile with id " + id));
    }

    private static void apply(LeadershipProfile profile, UpdateRequest request) {
        profile.update(request.name(), request.title(), request.description(), request.photoDataUri(),
                request.linkedinUrl(), request.facebookUrl(), request.instagramUrl(), request.threadsUrl());
    }

    private static String displayName(LeadershipProfile profile) {
        return profile.getName().isBlank() ? "an unnamed profile" : profile.getName();
    }
}
