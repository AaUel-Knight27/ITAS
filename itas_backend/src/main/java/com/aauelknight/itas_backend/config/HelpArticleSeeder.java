package com.aauelknight.itas_backend.config;

import com.aauelknight.itas_backend.notifications.entity.HelpArticle;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.notifications.repository.HelpArticleRepository;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HelpArticleSeeder implements CommandLineRunner {

    private final HelpArticleRepository helpRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        seedHelpArticles();
    }

    private void seedHelpArticles() {
        User system = resolveSystemUser();

        if (helpRepository.count() > 0) {
            backfillMissingCreators(system);
            return;
        }

        List<HelpArticle> articles = List.of(
                HelpArticle.builder()
                        .title("How to name your course")
                        .content("Choose a clear, descriptive title that explains what learners will gain. "
                                + "Keep it under 60 characters. Example: "
                                + "'VAT Filing for Small Businesses'")
                        .pageId("course-builder")
                        .fieldId("title")
                        .category("Course Builder")
                        .tags("course,title,naming")
                        .isPublished(true)
                        .viewCount(0)
                        .createdBy(system)
                        .build(),
                HelpArticle.builder()
                        .title("Writing a good description")
                        .content("Describe what learners will know or be able to do after completing the course. "
                                + "Include key topics covered and who this course is for.")
                        .pageId("course-builder")
                        .fieldId("description")
                        .category("Course Builder")
                        .tags("course,description,writing")
                        .isPublished(true)
                        .viewCount(0)
                        .createdBy(system)
                        .build(),
                HelpArticle.builder()
                        .title("Setting the passing score")
                        .content("The passing score is the minimum percentage a learner must achieve to pass the quiz "
                                + "and earn a certificate. The default is 70%. Higher scores ensure better "
                                + "understanding of the material.")
                        .pageId("quiz-builder")
                        .fieldId("passingScore")
                        .category("Quiz")
                        .tags("quiz,passing,score,certificate")
                        .isPublished(true)
                        .viewCount(0)
                        .createdBy(system)
                        .build(),
                HelpArticle.builder()
                        .title("Scheduling a webinar")
                        .content("Select a date and time at least 24 hours in advance to give learners enough notice. "
                                + "The meeting link should be a valid URL from Zoom, Teams, or Google Meet.")
                        .pageId("webinar-form")
                        .fieldId("scheduledAt")
                        .category("Webinar")
                        .tags("webinar,schedule,date,time")
                        .isPublished(true)
                        .viewCount(0)
                        .createdBy(system)
                        .build(),
                HelpArticle.builder()
                        .title("Understanding certificates")
                        .content("Certificates are automatically generated when a learner completes all lectures in a "
                                + "course AND passes the final quiz. Each certificate has a unique verification code "
                                + "in the format MOR-YYYY-XXXXXX.")
                        .pageId("certificates")
                        .fieldId(null)
                        .category("Certificates")
                        .tags("certificate,quiz,completion,verification")
                        .isPublished(true)
                        .viewCount(0)
                        .createdBy(system)
                        .build(),
                HelpArticle.builder()
                        .title("Target audience selection")
                        .content("Select which user roles can enroll in this course. TAXPAYER: General public. "
                                + "TAX_AGENT: Licensed agents. MOR_STAFF: Internal staff. MANAGER: Management level.")
                        .pageId("course-builder")
                        .fieldId("targetAudience")
                        .category("Course Builder")
                        .tags("audience,roles,enrollment")
                        .isPublished(true)
                        .viewCount(0)
                        .createdBy(system)
                        .build());

        helpRepository.saveAll(articles);
        System.out.println("Seeded " + articles.size() + " help articles");
    }

    private User resolveSystemUser() {
        User system = userRepository
                .findAll()
                .stream()
                .filter(u -> u.getRole() != null
                        && "WEB_ADMIN".equals(u.getRole().getName()))
                .findFirst()
                .orElse(null);

        if (system == null) {
            system = userRepository
                    .findAll()
                    .stream()
                    .findFirst()
                    .orElse(null);
        }

        return system;
    }

    private void backfillMissingCreators(User system) {
        if (system == null) {
            return;
        }

        List<HelpArticle> articlesToUpdate = helpRepository.findAll()
                .stream()
                .filter(article -> article.getCreatedBy() == null)
                .peek(article -> article.setCreatedBy(system))
                .toList();

        if (!articlesToUpdate.isEmpty()) {
            helpRepository.saveAll(articlesToUpdate);
            System.out.println("Backfilled " + articlesToUpdate.size() + " help articles with a valid creator");
        }
    }
}
