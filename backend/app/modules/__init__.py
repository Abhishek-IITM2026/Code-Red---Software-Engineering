from ..features.administration.routes import administration_bp
from ..features.academics.routes import academics_bp
from ..features.authority.routes import authority_bp
from ..features.assessments.routes import assessments_bp
from ..features.attendance.routes import attendance_bp
from ..features.auth.routes import auth_bp
from ..features.faculty.routes import faculty_bp
from ..features.inventory.routes import inventory_bp
from ..features.jobs.routes import jobs_bp
from ..features.leave.routes import leave_bp
from ..features.marks.routes import marks_bp
from ..features.notifications.routes import notifications_bp
from ..features.parent.routes import parent_bp
from ..features.payroll.routes import payroll_bp
from ..features.schedule.routes import schedule_bp
from ..features.students.routes import students_bp
from ..features.uploads.routes import uploads_bp


MODULE_BLUEPRINTS = (
    ("auth", auth_bp, "auth"),
    ("students", students_bp, "students"),
    ("academics", academics_bp, ""),
    ("attendance", attendance_bp, "attendance"),
    ("marks", marks_bp, "marks"),
    ("schedule", schedule_bp, "schedule"),
    ("faculty", faculty_bp, "faculty"),
    ("inventory", inventory_bp, "inventory"),
    ("authority", authority_bp, "authority"),
    ("administration", administration_bp, "administration"),
    ("payroll", payroll_bp, "payroll"),
("jobs", jobs_bp, "jobs"),
    ("leave", leave_bp, ""),
    ("parent", parent_bp, "parent"),
    ("assessments", assessments_bp, ""),
    ("notifications", notifications_bp, "notifications"),
    ("uploads", uploads_bp, "uploads"),
)
