from flask import Blueprint, g, request
from kombu.exceptions import OperationalError

from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import NotificationBatch
from ...schemas import EmailMessageListQuery, EmailSendRequest, EmailSyncRequest, ScheduleNotificationRequest, parse_json, parse_query
from ...services.email import (
    get_email_message_or_404,
    get_email_transport_status,
    list_email_messages,
    send_email_message,
    sync_incoming_email,
)
from ...tasks import send_schedule_notification, sync_email_inbox


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.post("/schedule")
@roles_required("administration")
def schedule_notification():
    payload = parse_json(ScheduleNotificationRequest, request.get_json())
    batch = NotificationBatch(
        batch_type="SCHEDULE_UPDATE",
        title="Schedule Notification",
        message=payload.message,
        created_by=g.current_user.id,
    )
    db.session.add(batch)
    db.session.commit()
    try:
        task = send_schedule_notification.delay(batch.id, payload.message, payload.recipient_scope)
    except OperationalError:
        result = send_schedule_notification.apply(args=(batch.id, payload.message, payload.recipient_scope))
        task = type("LocalTaskResult", (), {"id": result.id})()
    return success_response({"success": True, "id": str(batch.id), "taskId": task.id}, status_code=202)


@notifications_bp.get("/email/status")
@roles_required("administration")
def email_status():
    return success_response(get_email_transport_status())


@notifications_bp.post("/email/send")
@roles_required("administration")
def send_email():
    payload = parse_json(EmailSendRequest, request.get_json())
    email_message = send_email_message(
        recipients=payload.to,
        cc=payload.cc,
        bcc=payload.bcc,
        subject=payload.subject,
        text_body=payload.text,
        html_body=payload.html,
        category=payload.category,
        created_by=g.current_user.id,
    )
    return success_response(email_message.to_dict(), status_code=201)


@notifications_bp.post("/email/sync")
@roles_required("administration")
def sync_email_messages():
    payload = parse_json(EmailSyncRequest, request.get_json())
    try:
        task = sync_email_inbox.delay(payload.limit, payload.mailbox, payload.unseen_only)
        return success_response({"success": True, "taskId": task.id}, status_code=202)
    except OperationalError:
        result = sync_incoming_email(limit=payload.limit, mailbox=payload.mailbox, unseen_only=payload.unseen_only)
        return success_response(result, status_code=200)


@notifications_bp.get("/email/messages")
@roles_required("administration")
def email_messages():
    query = parse_query(EmailMessageListQuery, request.args)
    messages = list_email_messages(direction=query.direction, status=query.status, limit=query.limit)
    return success_response([message.to_dict() for message in messages])


@notifications_bp.get("/email/messages/<int:message_id>")
@roles_required("administration")
def email_message_detail(message_id: int):
    return success_response(get_email_message_or_404(message_id).to_dict())
