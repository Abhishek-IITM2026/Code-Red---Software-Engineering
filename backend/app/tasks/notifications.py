from ..core.celery_app import celery_app


@celery_app.task(name="notifications.send_schedule_notification")
def send_schedule_notification(batch_id: int, message: str, recipient_scope: str):
    return {
        "batchId": str(batch_id),
        "message": message,
        "recipientScope": recipient_scope,
        "status": "sent",
    }
