# Apex Academy - Seed Data Documentation
**Updated: 2026-04-20**

## Overview
This document provides comprehensive information about the coaching institute seed data, authentication credentials, and the system's demo capabilities.

---

## 🏫 Institute Information

### Institute Details
- **Name**: Apex Academy - Excellence in Education
- **Address**: Plot No. 123, Tech Park, Bengaluru - 560001
- **Phone**: +91-80-4567-8900
- **Academic Year**: 2025-2026

### Structure
- **Classes**: 10 classes (Class 8-12, each with 2 sections: A & B)
- **Students**: 150 students distributed across all classes
- **Faculty**: 12 experienced teachers with specializations
- **Administration**: 8 administrative staff members
- **Parents**: 150 parent accounts (one per student, with varied relationships)

---

## 🔐 Authentication Credentials

### Master Admin (Director)
```
Email: director@example.in
Password: admin123
Role: Director + Administration
Name: Rajesh Kumar
Phone: +91 98765 43210
```

### Principal/Administrator
```
Email: admin@example.in
Password: admin123
Role: Principal (Admin + Administration)
Name: Priya Sharma
Phone: +91 98765 43211
```

### Administration Staff (8 members)
```
Email Pattern: staff.<first_name>@example.in
Password: admin123 (all staff)
Roles: Administration
Departments:
  - Operations
  - Finance & Accounts
  - Admissions
  - HR & Compliance
  - Support Services
  - Academics
  - Student Services
  - Technology
```

### Faculty/Teachers (12 members)
```
Email Pattern: faculty.<first_name>@example.in
Password: faculty123 (all faculty)
Role: Faculty
Specializations:
  - Mathematics (2 teachers)
  - Physics (2 teachers)
  - Chemistry (2 teachers)
  - Biology (2 teachers)
  - English (2 teachers)
  - Computer Science (2 teachers)
```

### Students (150 members)
```
Email Pattern: student.<first_name>@example.in
Password: student123 (all students)
Role: Student
Example: student.aarav@example.in
Roll Number Format: APX2026-XXXX
Class Distribution: Evenly distributed across 10 classes
```

### Parents (150 members)
```
Email Pattern: parent.<first_name>@example.in
Password: parent123 (all parents)
Role: Parent
Relationships: Mother, Father, Guardian (varied)
Linked to students 1:1
```

---

## 📊 Database Tables & Seed Data

### User Management
| Table | Records | Purpose |
|-------|---------|---------|
| `users` | 330 | All users (1 director, 1 admin, 8 staff, 12 faculty, 150 students, 150 parents) |
| `roles` | 8 | Role definitions (director, superadmin, administration, admin, faculty, teacher, student, parent) |
| `user_roles` | 330 | User-role associations |
| `user_contact_profiles` | 330 | Phone contacts for all users |

### Staff Management
| Table | Records | Purpose |
|-------|---------|---------|
| `administration_staff` | 8 | Admin staff details (dept, designation, employee code) |
| `faculties` | 12 | Faculty details (qualification, specialization, hire date) |

### Student & Academic
| Table | Records | Purpose |
|-------|---------|---------|
| `students` | 150 | Student profiles (admission date, roll number) |
| `parents` | 150 | Parent profiles (relation, primary parent flag) |
| `institute_classes` | 10 | Class structures (Class 8-12, sections A & B) |
| `class_enrollments` | 150 | Student-class enrollments for current academic year |
| `subjects` | 30 | Subjects across all grades (6 core subjects × 5 grades) |
| `faculty_subject_assignments` | 30 | Faculty-subject-class assignments |

### Academic Tracking
| Table | Records | Purpose |
|-------|---------|---------|
| `attendance` | 600 | 4 days of attendance records per student |
| `marks` | 300 | 2 exam records (Unit Test, Mid Term) per student |
| `schedules` | 30 | Class schedules (1 per subject per class) |

### Courses & Enrollment
| Table | Records | Purpose |
|-------|---------|---------|
| `subjects` (programs) | 10 | Revision programs per class section |
| `course_enrollments` | 12 | Course enrollments (12 students) |
| `course_payments` | 12 | Course payment records |

### Learning Materials
| Table | Records | Purpose |
|-------|---------|---------|
| `materials` | 60 | Study materials (2 per subject) |
| `assessments` | 10 | Class assessments with questions |
| `assignments` | 20 | Subject assignments |
| `assessment_submissions` | Variable | Student assessment submissions |
| `assignment_submissions` | Variable | Student assignment submissions |

### Inventory Management
| Table | Records | Purpose |
|-------|---------|---------|
| `inventory_items` | 10 | Lab equipment, stationery, electronics |
| `vendors` | 4 | Supplier vendors (Stationery, Tech, Lab, Library) |
| `inventory_procurements` | 3 | Purchase orders and receipts |
| `material_requests` | 12 | Faculty material requests (1 per faculty) |
| `material_request_items` | 24 | Requested items (2 per request) |

### HR & Payroll
| Table | Records | Purpose |
|-------|---------|---------|
| `staff_financial_profiles` | 20 | Financial profiles (8 staff + 12 faculty) |
| `salary_structures` | 6 | Salary structure templates |
| `salary_slips` | 20 | Monthly salary slips (March 2026) |
| `staff_salary_accounts` | 7 | Bank account details |
| `salary_account_change_requests` | 1 | Pending account change request |
| `authority_assignments` | 22 | Role-based authorities |

### Leave Management
| Table | Records | Purpose |
|-------|---------|---------|
| `leave_requests` | 0 | Initialized but empty for demo |

### Notifications & Communication
| Table | Records | Purpose |
|-------|---------|---------|
| `notification_batches` | 5 | System notifications (schedule, assessment, etc.) |
| `otp_challenges` | 3 | OTP records for different purposes |

### File Management
| Table | Records | Purpose |
|-------|---------|---------|
| `uploaded_documents` | 0 | Initialized for file uploads |

### Financial Transactions
| Table | Records | Purpose |
|-------|---------|---------|
| `financial_transactions` | 3 | Course payment, salary, procurement transactions |

---

## 🔧 Data Generation Features

### Indian Names
The seed data uses realistic Indian names across different regions:
- **Male Names**: Aarav, Vivaan, Aditya, Vihaan, Arjun, Sai, Krishna, Rohan, Karan, Rahul, etc.
- **Female Names**: Neha, Diya, Ananya, Meera, Kavya, Ishita, Riya, Pooja, Sneha, Aditi, etc.
- **Surnames**: Sharma, Verma, Patel, Reddy, Singh, Gupta, Kapoor, Nair, Kumar, Joshi, etc.

### Contact Numbers
- Format: +91 (India) followed by 10-digit mobile numbers
- Pattern: +91 9XXXX XXXXX
- Unique for each user

### Email Format
- **Students**: `student.<first_name>@example.in`
- **Faculty**: `faculty.<first_name>@example.in`
- **Staff**: `staff.<first_name>@example.in`
- **Parents**: `parent.<first_name>@example.in`
- **Management**: `admin@example.in`, `director@example.in`

### Employee Codes
- **Admin Staff**: `ADM-XXX` (001-008)
- **Faculty**: `EMP-XXX` (010-021)
- **Students**: `APX2026-XXXX` (0001-0150)

---

## 📈 Realistic Data Patterns

### Attendance
- Mix of: Present, Absent, Late, Leave
- Pattern: 4 days of records per student
- Status distribution: ~50% Present, ~20% Late, ~20% Absent, ~10% Leave

### Marks
- Range: 55-96 out of 100
- Two exams per student: Unit Test, Mid Term
- Varied performance for different students

### Class Schedule
- Subjects: 3 per class
- Days: Monday to Saturday
- Time slots: 9:00 AM to 12:00 PM (3 hours)
- Rooms: 201-210

### Course Enrollments
- 12 students enrolled in revision programs
- Payment plans: Installments (3) or One-time
- Mix of full and partial payments

### Inventory
- 10 items across categories: Stationery, Electronics, Laboratory
- Low stock warnings applied
- Reservation tracking enabled

### Salary Data
- March 2026 payroll
- Base salary: ₹40,000-₹55,000+ (varies by role)
- Overtime: 2-8 hours
- Status: Mixed (Released/Pending)

---

## 🚀 Demo Scenarios

### Scenario 1: Quick Start (5 minutes)
1. **Login as Admin**: `admin@apexacademy.in` / `admin123`
2. **View Dashboard**: Attendance stats, student count, pending approvals
3. **Check Attendance**: View 4 days of attendance records
4. **View Marks**: Check unit test and mid-term results

### Scenario 2: Faculty Operations (10 minutes)
1. **Login as Faculty**: `faculty.aarav@apexacademy.in` / `faculty123`
2. **View Classes**: 3 assigned subjects
3. **Mark Attendance**: Update for a specific class and date
4. **Enter Marks**: Add exam results
5. **Create Assignment**: Publish new assignment for students

### Scenario 3: Student Portal (10 minutes)
1. **Login as Student**: `student.aarav001@apexacademy.in` / `student123`
2. **View Schedule**: Class timings and locations
3. **Check Marks**: View exam results
4. **Review Materials**: Access study materials
5. **Submit Assignment**: Upload assignment solution

### Scenario 4: Parent Portal (10 minutes)
1. **Login as Parent**: `parent.rajesh001@apexacademy.in` / `parent123`
2. **View Child Progress**: Marks and attendance
3. **Enroll in Program**: Subscribe to revision course
4. **Track Payment**: View course payment status
5. **Receive Notifications**: See important updates

### Scenario 5: Administration (15 minutes)
1. **Login as Admin**: `admin@apexacademy.in` / `admin123`
2. **Manage Inventory**: Check stock levels
3. **Process Procurement**: Approve vendor orders
4. **View Payroll**: Check salary slip for March 2026
5. **Approve Leave**: Review pending leave requests

---

## 🛠️ Database Reset & Seeding

### Automatic Seeding
```bash
# Database seeds automatically on startup if:
# 1. AUTO_CREATE_TABLES=true
# 2. SEED_ON_STARTUP=true
# 3. Database is empty

cd backend
python run.py
```

### Manual Reset & Seed
```bash
# Delete all tables (if using SQLite)
rm instance/coaching_institute.db

# Recreate tables and seed data
python run.py
```

### Environment Variables
```bash
# In backend/.env
AUTO_CREATE_TABLES=true
SEED_ON_STARTUP=true
DATABASE_URL=sqlite:///instance/coaching_institute.db
```

---

## 📋 System Configurations

### Roles & Permissions
- **Director**: Full system access, approve major changes
- **Admin**: Manage staff, students, finances
- **Faculty**: Mark attendance, enter marks, create materials
- **Student**: View own data, submit assignments
- **Parent**: View child progress, enroll in programs

### Features Ready for Demo
✅ Role-based access control  
✅ Student management system  
✅ Attendance tracking  
✅ Marks management  
✅ Course enrollment & payment  
✅ Inventory management  
✅ Payroll system  
✅ Material requests  
✅ Notifications  
✅ File uploads  
✅ Financial transactions  

---

## 📝 Quick Reference

### Standard Passwords (All Users)
| User Type | Password |
|-----------|----------|
| Students | `student123` |
| Faculty | `faculty123` |
| Parents | `parent123` |
| Admin/Staff/Director | `admin123` |

### Sample Test Logins
```
🎓 Student: student.aditya001@apexacademy.in / student123
👨‍🏫 Faculty: faculty.vivaan@apexacademy.in / faculty123
👨‍👩‍👧 Parent: parent.rajesh001@apexacademy.in / parent123
⚙️ Admin: admin@apexacademy.in / admin123
📊 Director: director@apexacademy.in / admin123
```

### Key Statistics
- **Total Users**: 330
- **Students**: 150
- **Faculty**: 12
- **Administration**: 8
- **Classes**: 10
- **Subjects**: 30 (core + programs)
- **Attendance Records**: 600+
- **Mark Records**: 300+

---

## 🎯 Common Tasks for Testing

| Task | User | Steps |
|------|------|-------|
| Mark Attendance | Faculty | Classes → Select Class → Mark Attendance |
| Enter Marks | Faculty | Marks → Add New → Select Exam, Students |
| View Child Marks | Parent | Student Portal → Progress → View Marks |
| Enroll in Course | Parent | Courses → Revision Program → Enroll + Pay |
| Approve Material Request | Admin | Inventory → Material Requests → Review |
| Process Payroll | Admin | HR → Salary → View/Approve Slips |
| Upload Assignment | Student | Assignments → Select → Submit File |

---

## 📊 ER Diagram Reference
The complete entity-relationship diagram is available in:
`MileStone2/coaching_institute_er_diagram.dbml`

This diagram includes:
- All 40+ entities (tables)
- Complete relationships (foreign keys)
- Enums and data types
- Indexes and constraints

---

## 🔗 Related Documentation
- `CONTEXTS.md` - Project architecture and routing
- `backend/app/models/core.py` - Database model definitions
- `backend/app/seed/__init__.py` - Seed data generator
- `backend/API_ENDPOINTS.md` - API reference

---

## ✅ Data Quality Checks

The seed data has been validated for:
- ✅ Referential integrity (all foreign keys valid)
- ✅ No duplicate emails
- ✅ Consistent date formats (YYYY-MM-DD)
- ✅ Valid Indian phone numbers
- ✅ Realistic financial amounts (in INR)
- ✅ Proper role assignments
- ✅ Complete attendance records per student
- ✅ Balanced class enrollments

---

**Last Updated**: April 20, 2026  
**System**: Apex Academy Operations Platform  
**Database**: SQLite + MongoDB (NoSQL for documents)
