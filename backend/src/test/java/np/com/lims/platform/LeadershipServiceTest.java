package np.com.lims.platform;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.platform.dto.LeadershipDtos.Profile;
import np.com.lims.platform.dto.LeadershipDtos.PublicProfile;
import np.com.lims.platform.dto.LeadershipDtos.UpdateRequest;
import np.com.lims.platform.entity.LeadershipProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LeadershipServiceTest {

    private LeadershipProfileRepository repository;
    private AuditService audit;
    private LeadershipService service;

    @BeforeEach
    void setUp() {
        repository = mock(LeadershipProfileRepository.class);
        audit = mock(AuditService.class);
        service = new LeadershipService(repository, audit);
        // a saved profile gets its id from the database
        when(repository.save(any(LeadershipProfile.class))).thenAnswer(call -> {
            LeadershipProfile saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 99L);
            return saved;
        });
    }

    private static LeadershipProfile existing(long id, int order, String name) {
        LeadershipProfile p = LeadershipProfile.create("CEO & Founder", order);
        p.update(name, "CEO & Founder", null, null, null, null, null, null);
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    private static UpdateRequest request(String name, String title) {
        return new UpdateRequest(name, title, "Leads the company.", null, null, null, null, null);
    }

    @Test
    void aNewLeaderGoesAfterTheLastOneOnThePage() {
        when(repository.count()).thenReturn(2L);
        when(repository.findFirstByOrderByDisplayOrderDescIdDesc()).thenReturn(Optional.of(existing(2, 2, "Namita")));

        Profile created = service.create(request("  Sita Rai  ", "Head of Sales"));

        assertThat(created.id()).isEqualTo(99L);
        assertThat(created.name()).isEqualTo("Sita Rai");
        assertThat(created.title()).isEqualTo("Head of Sales");
        assertThat(created.displayOrder()).isEqualTo(3);
        assertThat(created.published()).isTrue();
        verify(audit).record(eq("PLATFORM"), eq("LEADERSHIP_CREATE"), eq("LeadershipProfile"), eq(99L), any(), eq(null), any());
    }

    @Test
    void theFirstLeaderEverAddedStartsTheOrderAtOne() {
        when(repository.count()).thenReturn(0L);
        when(repository.findFirstByOrderByDisplayOrderDescIdDesc()).thenReturn(Optional.empty());

        assertThat(service.create(request("Karan", "CEO")).displayOrder()).isEqualTo(1);
    }

    @Test
    void aNewLeaderNeedsANameBecauseWithoutOneItWouldNeverBeShown() {
        for (String name : new String[]{null, "", "   "}) {
            assertThatThrownBy(() -> service.create(request(name, "CEO")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("name");
        }
        verify(repository, never()).save(any());
    }

    @Test
    void refusesToGoPastTheLimit() {
        when(repository.count()).thenReturn((long) LeadershipService.MAX_PROFILES);

        assertThatThrownBy(() -> service.create(request("One too many", "Advisor")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("12");
        verify(repository, never()).save(any());
    }

    @Test
    void savesNothingWhenTheDetailsAreInvalid() {
        when(repository.count()).thenReturn(1L);
        when(repository.findFirstByOrderByDisplayOrderDescIdDesc()).thenReturn(Optional.empty());

        // no title, then a link that is not on the network it claims to be
        assertThatThrownBy(() -> service.create(request("Sita", "  "))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.create(new UpdateRequest("Sita", "Advisor", null, null,
                "https://evil.example/linkedin.com/in/sita", null, null, null))).isInstanceOf(ApiException.class);

        verify(repository, never()).save(any());
        verify(audit, never()).record(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void updatesAProfileByIdAndRecordsWhatChanged() {
        LeadershipProfile karan = existing(7, 1, "Karan");
        when(repository.findById(7L)).thenReturn(Optional.of(karan));

        Profile updated = service.update(7L, request("Karan Bohara", "CEO & Founder"));

        assertThat(updated.id()).isEqualTo(7L);
        assertThat(updated.name()).isEqualTo("Karan Bohara");
        verify(audit).record(eq("PLATFORM"), eq("LEADERSHIP_UPDATE"), eq("LeadershipProfile"), eq(7L), any(), any(), any());
    }

    @Test
    void updatingOrRemovingAProfileThatIsGoneIsNotFound() {
        when(repository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(5L, request("X", "Y"))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.delete(5L)).isInstanceOf(ApiException.class);
        verify(repository, never()).delete(any());
    }

    @Test
    void removesAProfileAndRecordsIt() {
        LeadershipProfile sita = existing(4, 3, "Sita Rai");
        when(repository.findById(4L)).thenReturn(Optional.of(sita));

        service.delete(4L);

        verify(repository).delete(sita);
        verify(audit).record(eq("PLATFORM"), eq("LEADERSHIP_DELETE"), eq("LeadershipProfile"), eq(4L), any(), any(), eq(null));
    }

    @Test
    void thePublicSiteGetsOnlyNamedProfilesInPageOrder() {
        LeadershipProfile hidden = LeadershipProfile.create("Advisor", 2); // never given a name
        ReflectionTestUtils.setField(hidden, "id", 2L);
        when(repository.findAllByOrderByDisplayOrderAscIdAsc())
                .thenReturn(List.of(existing(1, 1, "Karan"), hidden, existing(3, 3, "Namita")));

        List<PublicProfile> shown = service.publicProfiles();

        assertThat(shown).extracting(PublicProfile::id).containsExactly(1L, 3L);
        assertThat(service.all()).hasSize(3); // the administrator still sees the hidden one
    }
}
