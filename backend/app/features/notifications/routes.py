from flask import Blueprint, request
from kombu.exceptions import OperationalError

from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import NotificationBatch
from ...schemas import ScheduleNotificationRequest, parse_json
from ...tasks import send_schedule_notification


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.post("/schedule")
@roles_required("administration")
def schedule_notification():
    payload = parse_json(ScheduleNotificationRequest, request.get_json())
    batch = NotificationBatch(
        batch_type="SCHEDULE_UPDATE",
        title="Schedule Notification",
        message=payload.message,
        created_by=1,
    )
    db.session.add(batch)
    db.session.commit()
    try:
        task = send_schedule_notification.delay(batch.id, payload.message, payload.recipient_scope)
    except OperationalError:
        result = send_schedule_notification.apply(args=(batch.id, payload.message, payload.recipient_scope))
        task = type("LocalTaskResult", (), {"id": result.id})()
    return success_response({"success": True, "id": str(batch.id), "taskId": task.id}, status_code=202)
