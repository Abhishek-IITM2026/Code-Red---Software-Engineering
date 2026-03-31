from pydantic import BaseModel, ConfigDict, ValidationError

from ..api.errors import ApiError


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


def _validate(model_cls: type[BaseModel], payload):
    try:
        return model_cls.model_validate(payload)
    except ValidationError as exc:
        raise ApiError(422, "VALIDATION_ERROR", "Request validation failed.", {"fields": exc.errors()}) from exc


def parse_json(model_cls: type[BaseModel], payload):
    return _validate(model_cls, payload or {})


def parse_query(model_cls: type[BaseModel], payload):
    return _validate(model_cls, payload or {})
