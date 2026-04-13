import os
from celery import Celery


# Configure Celery directly from environment variables
# This ensures it uses Redis even when run as a standalone worker
celery_app = Celery("code_red")

# Set broker and result backend from env or use Redis defaults
broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

celery_app.conf.update(
    broker_url=broker_url,
    result_backend=result_backend,
    task_always_eager=os.getenv("CELERY_TASK_ALWAYS_EAGER", "false").lower() == "true",
    task_ignore_result=False,
)


def init_celery(app) -> Celery:
    """Initialize Celery with Flask app context wrapper"""
    # Update with Flask app config (overrides env vars if needed)
    celery_app.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
        task_always_eager=app.config.get("CELERY_TASK_ALWAYS_EAGER", False),
        task_ignore_result=False,
    )

    class FlaskTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app.Task = FlaskTask
    app.extensions["celery"] = celery_app
    return celery_app
