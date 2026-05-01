package com.aauelknight.notification.service;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from:noreply@itas.gov}")
    private String fromAddress;

    @Value("${app.email.from-name:ITAS Portal}")
    private String fromName;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendEmail(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping email with empty recipient for subject '{}'", subject);
            return;
        }

        if (!emailEnabled) {
            log.info("Email disabled. Would have sent to {}: {}", to, subject);
            return;
        }

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    @Async
    public void sendBulkEmail(List<String> recipients, String subject, String htmlBody) {
        if (recipients == null || recipients.isEmpty()) {
            log.warn("Skipping bulk email with no recipients for subject '{}'", subject);
            return;
        }
        for (String recipient : recipients) {
            sendEmail(recipient, subject, htmlBody);
        }
    }

    public String buildNotificationEmail(String recipientName, String title, String message) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                    .header { background: #1e40af; color: white; padding: 24px 32px; }
                    .body { padding: 32px; color: #374151; line-height: 1.6; }
                    .message { background: #f9fafb; border-left: 4px solid #1e40af; padding: 16px; border-radius: 4px; margin: 16px 0; }
                    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>ITAS Portal</h1></div>
                    <div class="body">
                        <p>Dear %s,</p>
                        <h2 style="color:#1e40af">%s</h2>
                        <div class="message">%s</div>
                    </div>
                    <div class="footer">
                        <p>You received this email because you are registered on the ITAS Taxpayer Education Portal.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(safeText(recipientName), safeText(title), formatMessage(message));
    }

    private String formatMessage(String value) {
        return safeText(value).replace("\n", "<br/>");
    }

    private String safeText(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
