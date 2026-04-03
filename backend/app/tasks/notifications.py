from ..core.celery_app import celery_app
from ..extensions import db
from ..models import NotificationBatch
from ..services.email import send_batch_notification_email, sync_incoming_email


@celery_app.task(name="notifications.send_schedule_notification")
def send_schedule_notification(batch_id: int, message: str, recipient_scope: str):
    batch = db.session.get(NotificationBatch, batch_id)
    if batch is None:
        return {
            "batchId": str(batch_id),
            "message": message,
            "recipientScope": recipient_scope,
            "status": "failed",
            "reason": "notification batch not found",
        }

    try:
        email_message = send_batch_notification_email(batch, recipient_scope)
    except Exception as exc:
        return {
            "batchId": str(batch_id),
            "message": message,
            "recipientScope": recipient_scope,
            "status": "failed",
            "reason": str(exc),
        }
    return {
        "batchId": str(batch_id),
        "message": message,
        "recipientScope": recipient_scope,
        "status": email_message.status,
        "emailMessageId": str(email_message.id),
        "recipientCount": len(email_message.recipients or []),
    }


@celery_app.task(name="notifications.sync_email_inbox")
def sync_email_inbox(limit: int = 20, mailbox: str | None = None, unseen_only: bool = False):
    try:
        return sync_incoming_email(limit=limit, mailbox=mailbox, unseen_only=unseen_only)
    except Exception as exc:
        return {
            "status": "failed",
            "reason": str(exc),
            "mailbox": mailbox,
        }
