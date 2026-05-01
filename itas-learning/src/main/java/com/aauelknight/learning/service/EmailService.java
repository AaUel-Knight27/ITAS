package com.aauelknight.learning.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.email.from:noreply@itas.gov.et}")
    private String fromEmail;

    @Value("${app.email.from-name:ITAS Portal}")
    private String fromName;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        if (!emailEnabled) {
            log.info("Email disabled; skipping send to {}", to);
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("Skipping email send because recipient is blank");
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MailException | MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    public void sendBulkEmail(List<String> recipients, String subject, String htmlContent) {
        if (recipients == null || recipients.isEmpty()) {
            log.warn("Skipping bulk email because recipients list is empty");
            return;
        }
        List<String> validRecipients = recipients.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
        for (String recipient : validRecipients) {
            sendEmail(recipient, subject, htmlContent);
        }
    }

    public String buildNotificationEmail(String recipientName, String title, String message, String actionLabel, String actionUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 24px; color: #1f2937; }
                        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 40, 90, 0.08); }
                        .header { background: #0f285a; color: #ffffff; padding: 28px 32px; }
                        .body { padding: 32px; line-height: 1.6; }
                        .message { background: #f8fafc; border-left: 4px solid #0f285a; padding: 16px; border-radius: 8px; margin: 20px 0; white-space: pre-line; }
                        .button { display: inline-block; margin-top: 12px; padding: 12px 24px; background: #0f285a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
                        .footer { padding: 20px 32px 28px; background: #f8fafc; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin:0;">%s</h2>
                        </div>
                        <div class="body">
                            <p>Dear %s,</p>
                            <div class="message">%s</div>
                            %s
                            <p style="margin-top: 24px;">Regards,<br/>ITAS Portal Team</p>
                        </div>
                        <div class="footer">
                            This message was sent automatically by the ITAS Portal.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                safeText(title),
                safeText(recipientName),
                formatMessage(message),
                actionUrl != null && !actionUrl.isBlank()
                        ? "<a class=\"button\" href=\"" + safeAttribute(actionUrl) + "\">" + safeText(actionLabel) + "</a>"
                        : "");
    }

    public String buildCertificateEmail(String recipientName, String courseTitle, String certificatesUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 24px; color: #1f2937; }
                        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 40, 90, 0.08); }
                        .header { background: linear-gradient(135deg, #0f285a, #1d4ed8); color: #ffffff; padding: 28px 32px; text-align: center; }
                        .body { padding: 32px; line-height: 1.6; }
                        .highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px; margin: 20px 0; }
                        .button { display: inline-block; margin-top: 14px; padding: 12px 24px; background: #0f285a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
                        .footer { padding: 20px 32px 28px; background: #f8fafc; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin:0;">Certificate Awarded</h2>
                            <p style="margin:8px 0 0;">Ministry of Revenue - ITAS Portal</p>
                        </div>
                        <div class="body">
                            <p>Congratulations %s,</p>
                            <div class="highlight">
                                You have successfully completed <strong>%s</strong> and your certificate is now available in the portal.
                            </div>
                            <a class="button" href="%s">View Certificates</a>
                            <p style="margin-top: 24px;">Keep up the great work.<br/>ITAS Portal Team</p>
                        </div>
                        <div class="footer">
                            This certificate email was generated automatically by the ITAS Portal.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                safeText(recipientName),
                safeText(courseTitle),
                safeAttribute(certificatesUrl));
    }

    public String buildWebinarEmail(String recipientName, String webinarTitle, String webinarDate, String webinarUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 24px; color: #1f2937; }
                        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 40, 90, 0.08); }
                        .header { background: #0f285a; color: #ffffff; padding: 28px 32px; }
                        .body { padding: 32px; line-height: 1.6; }
                        .event { background: #f8fafc; border: 1px solid #dbeafe; border-radius: 10px; padding: 18px; margin: 20px 0; }
                        .button { display: inline-block; margin-top: 14px; padding: 12px 24px; background: #0f285a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
                        .footer { padding: 20px 32px 28px; background: #f8fafc; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin:0;">Webinar Registration Confirmed</h2>
                        </div>
                        <div class="body">
                            <p>Hello %s,</p>
                            <div class="event">
                                <strong>%s</strong><br/>
                                Date: %s
                            </div>
                            %s
                            <p style="margin-top: 24px;">Thank you,<br/>ITAS Portal Team</p>
                        </div>
                        <div class="footer">
                            This webinar confirmation was generated automatically by the ITAS Portal.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                safeText(recipientName),
                safeText(webinarTitle),
                safeText(webinarDate),
                webinarUrl != null && !webinarUrl.isBlank()
                        ? "<a class=\"button\" href=\"" + safeAttribute(webinarUrl) + "\">Join Webinar</a>"
                        : "");
    }

    private String formatMessage(String message) {
        if (message == null) {
            return "";
        }
        return safeText(message).replace("\n", "<br/>");
    }

    private String safeText(String input) {
        if (input == null) {
            return "";
        }
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String safeAttribute(String input) {
        return safeText(input);
    }
}
