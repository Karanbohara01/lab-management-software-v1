package np.com.lims.result.comment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResultCommentTemplateRepository extends JpaRepository<ResultCommentTemplate, Long> {

    List<ResultCommentTemplate> findAllByOrderByScopeAscDisplayOrderAscIdAsc();

    @Query("""
            SELECT t FROM ResultCommentTemplate t
            WHERE t.active = TRUE
              AND (t.scope = np.com.lims.result.comment.CommentScope.GLOBAL
                   OR (t.scope = np.com.lims.result.comment.CommentScope.DEPARTMENT AND t.department.id = :departmentId)
                   OR (t.scope = np.com.lims.result.comment.CommentScope.TEST AND t.test.id = :testId))
            ORDER BY t.scope ASC, t.displayOrder ASC, t.id ASC
            """)
    List<ResultCommentTemplate> findApplicable(@Param("departmentId") Long departmentId,
                                               @Param("testId") Long testId);
}
