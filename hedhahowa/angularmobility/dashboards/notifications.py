import logging
import requests
import os
import json
from datetime import datetime
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger("dashboards")


class NotificationService:
    """
    Centralized service for handling alerts and notifications.
    Supports Slack (via Webhooks) and Email (SMTP via Gmail).
    All notifications are logged for traceability.
    """

    NOTIFICATION_LOG = os.path.join(
        getattr(settings, 'BASE_DIR', os.getcwd()),
        "dashboards", "logs", "notifications.log"
    )

    @classmethod
    def _log_notification(cls, channel: str, subject: str, status: str, detail: str = ""):
        """Append notification event to the traceable log file."""
        try:
            os.makedirs(os.path.dirname(cls.NOTIFICATION_LOG), exist_ok=True)
            entry = {
                "timestamp": datetime.now().isoformat(),
                "channel": channel,
                "subject": subject,
                "status": status,
                "detail": detail[:500],
            }
            with open(cls.NOTIFICATION_LOG, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception:
            pass

    @staticmethod
    def send_slack_notification(message: str, level: str = "info"):
        """Send a message to Slack if a webhook is configured."""
        webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
        if not webhook_url:
            logger.warning("Slack notification skipped: SLACK_WEBHOOK_URL not set.")
            NotificationService._log_notification("slack", "alert", "skipped", "No SLACK_WEBHOOK_URL")
            return

        icon = "🚀" if level == "info" else "⚠️" if level == "warning" else "🚨"
        payload = {
            "text": f"{icon} *Mobility Analytics Alert* [{level.upper()}]\n{message}"
        }

        try:
            response = requests.post(webhook_url, json=payload, timeout=5)
            response.raise_for_status()
            logger.info(f"Slack notification sent: {message[:50]}...")
            NotificationService._log_notification("slack", message[:80], "sent")
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {str(e)}")
            NotificationService._log_notification("slack", message[:80], "failed", str(e))

    @staticmethod
    def send_email_alert(subject: str, message: str, level: str = "critical",
                         recipient_override: str = None):
        """
        Send an email alert to site administrators or a specific recipient.
        Uses Gmail SMTP configured in Django settings.
        Includes HTML formatting for professional appearance.
        """
        if recipient_override:
            recipient_list = [recipient_override]
        elif settings.ADMINS:
            recipient_list = [admin[1] for admin in settings.ADMINS]
        else:
            logger.warning("Email alert skipped: No ADMINS configured and no override.")
            NotificationService._log_notification("email", subject, "skipped", "No recipients")
            return

        full_subject = f"[{level.upper()}] Mobility Analytics: {subject}"

        # Build HTML body
        level_colors = {
            "info": "#2196F3",
            "warning": "#FF9800",
            "critical": "#F44336",
            "success": "#4CAF50",
        }
        color = level_colors.get(level, "#607D8B")

        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {color}, #1a1a2e); padding: 20px; border-radius: 12px 12px 0 0;">
                <h2 style="color: white; margin: 0;">🏛️ Mobility Analytics Platform</h2>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Automated Alert — {level.upper()}</p>
            </div>
            <div style="background: #f8f9fa; padding: 25px; border: 1px solid #dee2e6;">
                <h3 style="color: #333; margin-top: 0;">{subject}</h3>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid {color};">
                    <pre style="white-space: pre-wrap; font-size: 14px; color: #444; margin: 0;">{message}</pre>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">
                    Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | 
                    Platform: Urbain Mobility Analytics | 
                    Level: {level.upper()}
                </p>
            </div>
            <div style="background: #1a1a2e; padding: 12px; border-radius: 0 0 12px 12px; text-align: center;">
                <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 0;">
                    This is an automated notification from the ML Pipeline. Do not reply.
                </p>
            </div>
        </div>
        """

        try:
            email = EmailMultiAlternatives(
                full_subject,
                message,  # Plain text fallback
                settings.DEFAULT_FROM_EMAIL,
                recipient_list,
            )
            email.attach_alternative(html_body, "text/html")
            
            # --- Robust SSL/TLS Sending Logic ---
            try:
                # Attempt standard send (works on Port 465 with EMAIL_USE_SSL)
                email.send(fail_silently=False)
            except Exception as ssl_err:
                # Fallback for environments with strict/non-compliant CA certs
                if "CERTIFICATE_VERIFY_FAILED" in str(ssl_err) or "Basic Constraints" in str(ssl_err):
                    logger.warning("[WARNING] SSL Verification failed. Retrying with permissive context...")
                    # Direct smtplib fallback (matches working test_smtp_radical.py)
                    import smtplib
                    server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT)
                    server.login('emna.awini.work@gmail.com', 'pssmaxzxgfeyfqlf')
                    server.send_message(email.message())
                    server.quit()
                else:
                    raise ssl_err
            # ------------------------------------

            logger.info(f"[SUCCESS] Email alert sent to {recipient_list}: {subject}")
            NotificationService._log_notification("email", subject, "sent", f"To: {recipient_list}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Failed to send email alert: {str(e)}")
            NotificationService._log_notification("email", subject, "failed", str(e))
            raise e

    @classmethod
    def send_pipeline_report(cls, report: dict, recipient: str = "emna.awini.work@gmail.com"):
        """
        Send a detailed pipeline execution report via email.
        Called after retraining or inference pipeline completes.
        """
        ministries = report.get("ministries", {})
        success = sum(1 for m in ministries.values() if m.get("status") == "success")
        errors = len(ministries) - success
        duration = report.get("duration_seconds", 0)

        status_emoji = "✅" if errors == 0 else "⚠️"
        level = "success" if errors == 0 else "critical"

        subject = f"{status_emoji} ML Pipeline Report — {success}/{len(ministries)} Ministries OK"

        details = [f"Pipeline Duration: {duration:.1f}s", f"Timestamp: {report.get('timestamp', 'N/A')}", ""]
        for name, data in ministries.items():
            status = data.get("status", "unknown")
            icon = "✅" if status == "success" else "❌"
            details.append(f"  {icon} {name}: {status}")
            if status == "error":
                details.append(f"      Error: {data.get('error_message', 'Unknown')}")

        message = "\n".join(details)
        cls.send_email_alert(subject, message, level=level, recipient_override=recipient)

    @classmethod
    def send_inference_report(cls, results: dict, recipient: str = "emna.awini.work@gmail.com"):
        """Send inference pipeline results via email."""
        subject = "🔮 Automated Inference Complete"
        predictions_count = results.get("total_predictions", 0)
        message = (
            f"Automated inference pipeline completed.\n"
            f"Total predictions generated: {predictions_count}\n"
            f"Ministries processed: {', '.join(results.get('ministries', []))}\n"
            f"Timestamp: {results.get('timestamp', datetime.now().isoformat())}\n"
            f"Results stored in: {results.get('storage', 'automation_log.json')}"
        )
        cls.send_email_alert(subject, message, level="info", recipient_override=recipient)

    @classmethod
    def alert_all(cls, subject: str, message: str, level: str = "info"):
        """Trigger all active notification channels."""
        cls.send_slack_notification(f"*{subject}*\n{message}", level)
        if level in ["warning", "critical", "success"]:
            cls.send_email_alert(subject, message, level)
        cls._log_notification("all", subject, "dispatched", f"level={level}")


notification_service = NotificationService()
