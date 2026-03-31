from flask import jsonify


def success_response(data=None, message: str | None = None, status_code: int = 200):
    if isinstance(data, list) and message is None:
        return jsonify(data), status_code

    payload = {}
    if message is not None:
        payload["message"] = message
    if data is not None:
        if isinstance(data, dict):
            payload.update(data)
        else:
            payload["data"] = data
    return jsonify(payload), status_code
