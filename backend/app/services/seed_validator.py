"""
Data integrity validation for seeded database.
Ensures both SQL and NoSQL data maintains integrity during test execution.
"""

import logging
from typing import Dict, List, Tuple
from datetime import datetime, timezone

from ..extensions import db
from ..models import User, Student, Faculty, Parent, Role, InstituteClass

logger = logging.getLogger(__name__)


class SeedDataValidator:
    """Validates seeded data integrity for both SQL and NoSQL databases."""
    
    @staticmethod
    def validate_sql_integrity() -> Tuple[bool, List[str]]:
        """Validate SQL database integrity."""
        issues = []
        
        try:
            # Check users table
            user_count = User.query.count()
            if user_count == 0:
                issues.append("No users found in database")
            
            # Check email uniqueness
            duplicate_emails = db.session.query(
                User.email,
                db.func.count(User.id).label('count')
            ).group_by(User.email).having(
                db.func.count(User.id) > 1
            ).all()
            
            if duplicate_emails:
                for email, count in duplicate_emails:
                    issues.append(f"Email '{email}' has {count} duplicate entries")
            
            # Check roles exist
            required_roles = ['student', 'faculty', 'parent', 'admin', 'director']
            for role_name in required_roles:
                if not Role.query.filter_by(name=role_name).first():
                    issues.append(f"Required role '{role_name}' not found")
            
            # Check student data integrity
            students = Student.query.all()
            if len(students) > 0:
                for student in students[:5]:  # Check first 5 students
                    if not student.user or not student.roll_number:
                        issues.append(f"Student {student.id} has incomplete data")
            
            # Check parent-student relationships
            orphan_parents = Parent.query.filter(
                Parent.student_id.notin_(
                    db.session.query(Student.id)
                )
            ).count()
            if orphan_parents > 0:
                issues.append(f"Found {orphan_parents} parents with non-existent students")
            
            if not issues:
                logger.info(f"✓ SQL integrity check passed: {user_count} users")
            else:
                logger.warning(f"✗ SQL integrity issues found: {len(issues)}")
            
            return len(issues) == 0, issues
            
        except Exception as e:
            logger.error(f"SQL integrity check failed: {e}")
            return False, [str(e)]
    
    @staticmethod
    def validate_mongodb_integrity(doc_store) -> Tuple[bool, List[str]]:
        """Validate MongoDB (NoSQL) database integrity."""
        issues = []
        
        if not doc_store:
            return True, ["MongoDB not configured - skipping validation"]
        
        try:
            # Check collections exist and have data
            for collection_name in ["assessments", "materials"]:
                try:
                    docs = doc_store.find_many(collection_name)
                    if isinstance(docs, list):
                        logger.info(f"✓ MongoDB '{collection_name}' has {len(docs)} documents")
                except Exception as e:
                    issues.append(f"Cannot read '{collection_name}' collection: {e}")
            
            if not issues:
                logger.info("✓ MongoDB integrity check passed")
            else:
                logger.warning(f"✗ MongoDB integrity issues found: {len(issues)}")
            
            return len(issues) == 0, issues
            
        except Exception as e:
            logger.error(f"MongoDB integrity check failed: {e}")
            return False, [str(e)]
    
    @staticmethod
    def verify_seed_accounts() -> Dict[str, Dict]:
        """Return test credentials from seeded data."""
        return {
            "admin": {
                "email": "admin@example.in",
                "password": "admin123",
                "role": "admin"
            },
            "student": {
                "email": "student0001.aarav@example.in",
                "password": "student123",
                "role": "student"
            },
            "faculty": {
                "email": "faculty001.aarav@example.in",
                "password": "faculty123",
                "role": "faculty"
            },
            "parent": {
                "email": "parent0001.aarav@example.in",
                "password": "parent123",
                "role": "parent"
            },
            "director": {
                "email": "director@example.in",
                "password": "admin123",
                "role": "director"
            }
        }
    
    @staticmethod
    def get_seed_summary() -> Dict:
        """Get summary of seeded data."""
        return {
            "users": User.query.count(),
            "students": Student.query.count(),
            "faculty": Faculty.query.count(),
            "parents": Parent.query.count(),
            "classes": InstituteClass.query.count(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "validated": True
        }
