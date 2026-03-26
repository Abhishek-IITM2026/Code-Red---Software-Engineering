from http import HTTPStatus

from flask import jsonify
from flask_limiter.errors import RateLimitExceeded
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: dict | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


def error_response(status_code: int, code: str, message: str, details: dict | None = None):
    return (
        jsonify(
            {
                "error": {
                    "code": code,
                    "message": message,
                    "details": details or {},
                }
            }
        ),
        status_code,
    )


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return error_response(error.status_code, error.code, error.message, error.details)

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        return error_response(error.code or 500, error.name.upper().replace(" ", "_"), error.description)

    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit_error(error: RateLimitExceeded):
        return error_response(429, "RATE_LIMIT_EXCEEDED", "Too many requests.", {"reason": str(error.description)})

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        status = HTTPStatus.INTERNAL_SERVER_ERROR
        return error_response(status.value, status.name, "An unexpected error occurred.", {"reason": str(error)})
