from flask import Blueprint, current_app

from ...common.auth import roles_required
from ...common.responses import success_response


jobs_bp = Blueprint("jobs", __name__)


@jobs_bp.get("/<task_id>")
@roles_required("administration", "faculty")
def get_job_status(task_id: str):
    celery_app = current_app.extensions["celery"]
    result = celery_app.AsyncResult(task_id)
    payload = {
        "taskId": task_id,
        "status": result.status,
        "ready": result.ready(),
    }
    if result.ready():
        payload["result"] = result.result
    return success_response(payload)
