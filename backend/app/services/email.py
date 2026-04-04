from __future__ import annotations

import imaplib
import smtplib
from datetime import datetime, timezone
from email import message_from_bytes
from email.header import decode_header
from email.message import EmailMessage as MIMEEmailMessage
from email.utils import formataddr, getaddresses, make_msgid, parsedate_to_datetime

from flask import current_app

from ..api.errors import ApiError
from ..extensions import db
from ..models import EmailMessage, NotificationBatch, User


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _decode_header_value(value: str | None) -> str:
    if not value:
        return ""

    decoded_parts = []
    for part, encoding in decode_header(value):
        if isinstance(part, bytes):
            decoded_parts.append(part.decode(encoding or "utf-8", errors="replace"))
        else:
            decoded_parts.append(part)
    return "".join(decoded_parts).strip()


def _normalize_datetime(value) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _extract_bodies(message) -> tuple[str | None, str | None]:
    text_body = None
    html_body = None

    if message.is_multipart():
        for part in message.walk():
            if part.get_content_maintype() == "multipart":
                continue
            if part.get("Content-Disposition", "").lower().startswith("attachment"):
                continue
            payload = part.get_payload(decode=True) or b""
            charset = part.get_content_charset() or "utf-8"
            body = payload.decode(charset, errors="replace")
            if part.get_content_type() == "text/plain" and text_body is None:
                text_body = body
            elif part.get_content_type() == "text/html" and html_body is None:
                html_body = body
    else:
        payload = message.get_payload(decode=True) or b""
        charset = message.get_content_charset() or "utf-8"
        body = payload.decode(charset, errors="replace")
        if message.get_content_type() == "text/html":
            html_body = body
        else:
            text_body = body

    return text_body, html_body


def _sanitize_recipients(recipients: list[str] | None) -> list[str]:
    normalized = []
    for item in recipients or []:
        candidate = (item or "").strip()
        if candidate:
            normalized.append(candidate)
    return normalized


def get_email_transport_status() -> dict:
    smtp_enabled = bool(current_app.config.get("EMAIL_ENABLED"))
    smtp_configured = bool(current_app.config.get("EMAIL_SMTP_HOST")) and bool(current_app.config.get("EMAIL_FROM_ADDRESS"))
    imap_configured = bool(current_app.config.get("EMAIL_IMAP_HOST")) and bool(current_app.config.get("EMAIL_IMAP_USERNAME"))
    return {
        "enabled": smtp_enabled,
        "smtpConfigured": smtp_configured,
        "imapConfigured": imap_configured,
        "fromAddress": current_app.config.get("EMAIL_FROM_ADDRESS"),
        "fromName": current_app.config.get("EMAIL_FROM_NAME"),
        "smtpHost": current_app.config.get("EMAIL_SMTP_HOST"),
        "smtpPort": current_app.config.get("EMAIL_SMTP_PORT"),
        "imapHost": current_app.config.get("EMAIL_IMAP_HOST"),
        "imapPort": current_app.config.get("EMAIL_IMAP_PORT"),
        "mailbox": current_app.config.get("EMAIL_IMAP_MAILBOX"),
    }


def is_email_delivery_enabled() -> bool:
    status = get_email_transport_status()
    return status["enabled"] and status["smtpConfigured"]


def _smtp_client():
    host = current_app.config.get("EMAIL_SMTP_HOST")
    port = current_app.config.get("EMAIL_SMTP_PORT")
    if not host:
        raise ApiError(503, "EMAIL_NOT_CONFIGURED", "SMTP host is not configured.")

    use_ssl = bool(current_app.config.get("EMAIL_SMTP_USE_SSL"))
    use_tls = bool(current_app.config.get("EMAIL_SMTP_USE_TLS"))

    if use_ssl:
        client = smtplib.SMTP_SSL(host, port, timeout=15)
    else:
        client = smtplib.SMTP(host, port, timeout=15)
        client.ehlo()
        if use_tls:
            client.starttls()
            client.ehlo()

    username = current_app.config.get("EMAIL_SMTP_USERNAME")
    password = current_app.config.get("EMAIL_SMTP_PASSWORD")
    if username:
        client.login(username, password or "")
    return client


def create_email_record(
    *,
    direction: str,
    category: str,
    subject: str | None,
    sender: str | None,
    recipients: list[str] | None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    text_body: str | None = None,
    html_body: str | None = None,
    status: str = "pending",
    provider_message_id: str | None = None,
    imap_uid: str | None = None,
    mailbox: str | None = None,
    created_by: int | None = None,
    related_user_id: int | None = None,
    batch_id: int | None = None,
    error_message: str | None = None,
    sent_at: datetime | None = None,
    received_at: datetime | None = None,
) -> EmailMessage:
    email_record = EmailMessage(
        direction=direction,
        category=category,
        subject=subject,
        sender=sender,
        recipients=_sanitize_recipients(recipients),
        cc=_sanitize_recipients(cc),
        bcc=_sanitize_recipients(bcc),
        text_body=text_body,
        html_body=html_body,
        status=status,
        provider_message_id=provider_message_id,
        imap_uid=imap_uid,
        mailbox=mailbox,
        created_by=created_by,
        related_user_id=related_user_id,
        batch_id=batch_id,
        error_message=error_message,
        sent_at=sent_at,
        received_at=received_at,
    )
    db.session.add(email_record)
    return email_record


def send_email_message(
    *,
    recipients: list[str],
    subject: str,
    text_body: str | None = None,
    html_body: str | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    category: str = "general",
    created_by: int | None = None,
    related_user_id: int | None = None,
    batch_id: int | None = None,
    raise_on_failure: bool = False,
) -> EmailMessage:
    recipients = _sanitize_recipients(recipients)
    cc = _sanitize_recipients(cc)
    bcc = _sanitize_recipients(bcc)
    if not recipients:
        raise ApiError(422, "EMAIL_RECIPIENT_REQUIRED", "At least one email recipient is required.")
    if not text_body and not html_body:
        raise ApiError(422, "EMAIL_BODY_REQUIRED", "Email text or HTML content is required.")

    from_address = current_app.config.get("EMAIL_FROM_ADDRESS")
    from_name = current_app.config.get("EMAIL_FROM_NAME")
    outbound = create_email_record(
        direction="outbound",
        category=category,
        subject=subject,
        sender=from_address,
        recipients=recipients,
        cc=cc,
        bcc=bcc,
        text_body=text_body,
        html_body=html_body,
        status="pending",
        created_by=created_by,
        related_user_id=related_user_id,
        batch_id=batch_id,
    )

    if not is_email_delivery_enabled():
        outbound.status = "skipped"
        outbound.error_message = "Email delivery is disabled or SMTP is not configured."
        db.session.commit()
        return outbound

    mime_message = MIMEEmailMessage()
    mime_message["Subject"] = subject
    mime_message["From"] = formataddr((from_name, from_address))
    mime_message["To"] = ", ".join(recipients)
    if cc:
        mime_message["Cc"] = ", ".join(cc)
    message_id = make_msgid(domain=from_address.split("@", 1)[-1] if from_address and "@" in from_address else None)
    mime_message["Message-ID"] = message_id

    if text_body and html_body:
        mime_message.set_content(text_body)
        mime_message.add_alternative(html_body, subtype="html")
    elif html_body:
        mime_message.add_alternative(html_body, subtype="html")
    else:
        mime_message.set_content(text_body or "")

    try:
        client = _smtp_client()
        try:
            client.send_message(mime_message, to_addrs=recipients + cc + bcc)
        finally:
            client.quit()
        outbound.status = "sent"
        outbound.provider_message_id = message_id
        outbound.sent_at = _utcnow()
        outbound.error_message = None
        db.session.commit()
        return outbound
    except Exception as exc:
        outbound.status = "failed"
        outbound.error_message = str(exc)
        db.session.commit()
        if raise_on_failure:
            raise ApiError(502, "EMAIL_DELIVERY_FAILED", "Email delivery failed.", {"reason": str(exc)}) from exc
        return outbound


def sync_incoming_email(*, limit: int = 20, mailbox: str | None = None, unseen_only: bool = False) -> dict:
    host = current_app.config.get("EMAIL_IMAP_HOST")
    username = current_app.config.get("EMAIL_IMAP_USERNAME")
    password = current_app.config.get("EMAIL_IMAP_PASSWORD")
    port = current_app.config.get("EMAIL_IMAP_PORT")
    mailbox_name = mailbox or current_app.config.get("EMAIL_IMAP_MAILBOX", "INBOX")
    use_ssl = bool(current_app.config.get("EMAIL_IMAP_USE_SSL", True))

    if not current_app.config.get("EMAIL_ENABLED"):
        raise ApiError(503, "EMAIL_NOT_ENABLED", "Email transport is disabled.")
    if not host or not username:
        raise ApiError(503, "EMAIL_RECEIVE_NOT_CONFIGURED", "IMAP host or username is not configured.")

    try:
        client = imaplib.IMAP4_SSL(host, port) if use_ssl else imaplib.IMAP4(host, port)
        try:
            client.login(username, password or "")
            status, _ = client.select(mailbox_name)
            if status != "OK":
                raise ApiError(502, "EMAIL_SYNC_FAILED", "Could not open the requested mailbox.", {"mailbox": mailbox_name})
            search_query = "UNSEEN" if unseen_only else "ALL"
            status, data = client.uid("search", None, search_query)
            if status != "OK":
                raise ApiError(502, "EMAIL_SYNC_FAILED", "Could not search inbox messages.")
            uid_values = [uid.decode("utf-8") for uid in (data[0].split() if data and data[0] else [])][-limit:]

            created = []
            skipped = 0
            for uid in uid_values:
                if EmailMessage.query.filter_by(imap_uid=uid).first() is not None:
                    skipped += 1
                    continue

                status, message_data = client.uid("fetch", uid, "(RFC822)")
                if status != "OK" or not message_data:
                    continue

                raw_bytes = next(
                    (chunk[1] for chunk in message_data if isinstance(chunk, tuple) and len(chunk) > 1),
                    None,
                )
                if raw_bytes is None:
                    continue

                parsed_message = message_from_bytes(raw_bytes)
                text_body, html_body = _extract_bodies(parsed_message)
                sender = getaddresses([parsed_message.get("From", "")])
                recipients = getaddresses([parsed_message.get("To", "")])
                cc = getaddresses([parsed_message.get("Cc", "")])
                received_at = _normalize_datetime(parsedate_to_datetime(parsed_message.get("Date"))) if parsed_message.get("Date") else _utcnow()
                sender_email = sender[0][1].strip().lower() if sender and sender[0][1] else ""
                related_user = User.query.filter_by(email=sender_email).first() if sender_email else None

                record = create_email_record(
                    direction="inbound",
                    category="inbox",
                    subject=_decode_header_value(parsed_message.get("Subject")),
                    sender=sender[0][1] if sender else None,
                    recipients=[address for _name, address in recipients],
                    cc=[address for _name, address in cc],
                    text_body=text_body,
                    html_body=html_body,
                    status="received",
                    provider_message_id=parsed_message.get("Message-ID"),
                    imap_uid=uid,
                    mailbox=mailbox_name,
                    related_user_id=related_user.id if related_user is not None else None,
                    received_at=received_at,
                )
                created.append(record)

            db.session.commit()
            return {
                "mailbox": mailbox_name,
                "syncedCount": len(created),
                "skippedCount": skipped,
                "messages": [record.to_dict() for record in created],
            }
        finally:
            try:
                client.logout()
            except Exception:
                pass
    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(502, "EMAIL_SYNC_FAILED", "Inbox synchronization failed.", {"reason": str(exc)}) from exc


def list_email_messages(*, direction: str | None = None, status: str | None = None, limit: int = 50):
    query = EmailMessage.query.order_by(EmailMessage.created_at.desc())
    if direction:
        query = query.filter_by(direction=direction)
    if status:
        query = query.filter_by(status=status)
    return query.limit(max(1, min(limit, 200))).all()


def get_email_message_or_404(message_id: int) -> EmailMessage:
    message = db.session.get(EmailMessage, message_id)
    if message is None:
        raise ApiError(404, "EMAIL_NOT_FOUND", "Email message was not found.")
    return message


def recipients_for_scope(recipient_scope: str) -> list[str]:
    scope = (recipient_scope or "all").strip().lower()
    users = User.query.all()
    if scope == "all":
        return [user.email for user in users if user.email]

    recipients = []
    for user in users:
        if not user.email:
            continue
        if scope in user.role_names or scope == user.role_scope:
            recipients.append(user.email)
            continue
        if scope == "administration" and user.has_any_role("admin", "administration", "director", "superadmin"):
            recipients.append(user.email)
    return recipients


def send_batch_notification_email(batch: NotificationBatch, recipient_scope: str) -> EmailMessage:
    recipients = recipients_for_scope(recipient_scope)
    if not recipients:
        raise ApiError(404, "EMAIL_RECIPIENTS_NOT_FOUND", "No email recipients were found for the selected scope.", {"scope": recipient_scope})

    return send_email_message(
        recipients=recipients,
        subject=batch.title,
        text_body=batch.message or "Notification from CIOP platform.",
        category="notification",
        created_by=batch.created_by,
        batch_id=batch.id,
    )
