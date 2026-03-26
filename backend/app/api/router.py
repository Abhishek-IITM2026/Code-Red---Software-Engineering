from flask import Flask

from .errors import register_error_handlers
from .health import health_bp
from ..modules import MODULE_BLUEPRINTS


def register_blueprints(app: Flask) -> None:
    register_error_handlers(app)
    app.register_blueprint(health_bp)

    base_prefix = app.config["API_PREFIX"].rstrip("/")
    version_prefix = f"{base_prefix}/{app.config['API_VERSION']}"

    mounts = (
        ("v1", version_prefix),
        ("legacy", base_prefix),
    )

    for name_suffix, prefix in mounts:
        for module_name, blueprint, route_prefix in MODULE_BLUEPRINTS:
            full_prefix = prefix if not route_prefix else f"{prefix}/{route_prefix}"
            app.register_blueprint(
                blueprint,
                name=f"{module_name}_{name_suffix}",
                url_prefix=full_prefix,
            )
