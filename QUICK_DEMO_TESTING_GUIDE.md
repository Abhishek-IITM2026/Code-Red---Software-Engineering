# Quick Demo Testing Guide
**Apex Academy - Operations Platform**

---

## 🚀 Quick Start (2 minutes)

### 1. Start the Backend
```bash
cd backend
python run.py
```

### 2. Open Browser
```
Frontend: http://localhost:5173
API: http://localhost:3500/api
```

### 3. Select a Test Account
Choose from the credentials below

---

## 👥 Test Accounts by Role

### 🎓 **STUDENT** (Test Student Portal)
```
Email:    student.aditya@example.in
Password: student123
```
**What to do:**
- View class schedule (9:00 AM - 12:00 PM classes)
- Check marks for Unit Test & Mid Term
- View attendance history (4 days)
- Enroll in revision program
- Submit assignment

---

### 👨‍🏫 **FACULTY** (Test Teacher Operations)
```
Email:    faculty.vivaan@example.in
Password: faculty123
```
**What to do:**
- Mark attendance for Class 8-A
- Enter marks for students
- View class roster
- Create new assignment
- Request materials
- View salary slip

---

### 👪 **PARENT** (Test Parent Portal)
```
Email:    parent.rajesh@example.in
Password: parent123
```
**What to do:**
- View child's marks & attendance
- Check performance analytics
- Enroll child in revision program
- Track course payment status
- Receive notifications

---

### ⚙️ **ADMIN** (Test Admin Dashboard)
```
Email:    admin@example.in
Password: admin123
```
**What to do:**
- View all students & faculty
- Manage inventory stock
- Process material requests
- Approve vendor procurements
- View payroll records
- Manage staff accounts

---

### 📊 **DIRECTOR** (Test Director Dashboard)
```
Email:    director@example.in
Password: admin123
```
**What to do:**
- Approve major changes
- View institute analytics
- Check financial reports
- Oversee payroll
- Review all notifications

---

## 📊 Sample Data Available

### Classes & Subjects
- **Class 8 A/B** → Mathematics, Physics, Chemistry
- **Class 9 A/B** → Physics, Chemistry, Biology
- **Class 10 A/B** → Chemistry, Biology, English
- **Class 11 A/B** → Biology, English, Computer Science
- **Class 12 A/B** → English, Computer Science, Mathematics

### Student IDs (For Testing)
- student.aditya@example.in → Class 8-A
- student.vivaan@example.in → Class 8-B
- student.arjun@example.in → Class 9-A
- student.sai@example.in → Class 9-B
- student.krishna@example.in → Class 10-A

### Faculty IDs (For Testing)
- faculty.aarav → Mathematics Teacher
- faculty.vivaan → Physics Teacher
- faculty.aditya → Chemistry Teacher
- faculty.vihaan → Biology Teacher
- faculty.arjun → English Teacher

### Vendors
- Apex Stationery Supplies
- Tech Education Solutions
- Scholar's Library Services
- Science Lab Equipment Co.

---

## ✅ Key Test Scenarios

### Scenario 1: Mark Attendance (5 min)
**Role**: Faculty | **Path**: Academics → Attendance

1. ✅ Select Class: "Class 8-A"
2. ✅ Select Date: Today
3. ✅ Mark Status: Present/Absent/Late/Leave
4. ✅ Save Records
5. ✅ View: Should show 4 days history

---

### Scenario 2: Enter Marks (5 min)
**Role**: Faculty | **Path**: Academics → Marks

1. ✅ Select Class: "Class 8-A"
2. ✅ Select Subject: "Mathematics"
3. ✅ Select Exam: "Unit Test"
4. ✅ Enter Marks: 55-96 range
5. ✅ Submit: See results saved

---

### Scenario 3: View Student Progress (5 min)
**Role**: Parent | **Path**: My Child → Progress

1. ✅ Login as parent.rajesh001@apexacademy.in
2. ✅ View Child: Aditya (student.aditya001)
3. ✅ Check Attendance: 4 records
4. ✅ Check Marks: Unit Test, Mid Term scores
5. ✅ View Analytics: Performance trend

---

### Scenario 4: Enroll in Course (5 min)
**Role**: Parent | **Path**: Courses → Revision Programs

1. ✅ Select Program: "Class 8 Comprehensive Review"
2. ✅ Choose Payment: Installments (3) or Full
3. ✅ Confirm Enrollment
4. ✅ Make Payment
5. ✅ See Status: Partial/Paid

---

### Scenario 5: Manage Inventory (5 min)
**Role**: Admin | **Path**: Inventory → Items

1. ✅ View Stock: 10 items listed
2. ✅ Check Low Stock: Items with min threshold
3. ✅ Process Request: Material request from faculty
4. ✅ Approve: Review and authorize
5. ✅ Create Procurement: Place vendor order

---

### Scenario 6: Payroll Processing (5 min)
**Role**: Admin | **Path**: HR → Payroll

1. ✅ View Salary Slips: March 2026
2. ✅ Check Status: Released/Pending
3. ✅ Review Details: Salary breakdown
4. ✅ Approve Payment: If pending
5. ✅ Export: Download slip

---

## 🔍 Data Verification Checks

### Students
- [ ] 150 students total
- [ ] Roll numbers: APX2026-0001 to APX2026-0150
- [ ] Emails: student.<name>###@apexacademy.in
- [ ] Classes: Evenly distributed (15 per class)

### Faculty
- [ ] 12 teachers total
- [ ] Specializations: Math, Physics, Chemistry, Biology, English, CS (2 each)
- [ ] Class assignments: 3 subjects per class
- [ ] Emails: faculty.<name>@apexacademy.in

### Attendance
- [ ] 4 days of records per student
- [ ] Mix of statuses: Present, Absent, Late, Leave
- [ ] Records saved for each student

### Marks
- [ ] 2 exams per student: Unit Test, Mid Term
- [ ] Marks range: 55-96
- [ ] All students have both exam records

### Courses
- [ ] 10 revision programs (1 per class section)
- [ ] 12 enrollments visible
- [ ] Payment status tracking works

---

## 🐛 Troubleshooting

### Issue: Can't login
- ❓ Check email spelling (should be lowercase)
- ❓ Verify password exactly: `student123`, `faculty123`, `parent123`, `admin123`
- ❓ Clear browser cache and cookies

### Issue: No attendance records showing
- ❓ Select a class that has students enrolled
- ❓ Check if date range is correct
- ❓ Ensure faculty is assigned to that class

### Issue: Marks not saving
- ❓ Verify all fields are filled
- ❓ Check marks are in valid range (0-100)
- ❓ Ensure exam type is selected

### Issue: Course enrollment failing
- ❓ Login as parent (not student)
- ❓ Check course is in "active" or "upcoming" status
- ❓ Verify student is enrolled in required class

---

## 💡 Pro Tips

1. **Quick Navigation**: Use breadcrumbs to go back
2. **Filters**: Use date/class filters for faster search
3. **Reports**: Export attendance/marks as CSV
4. **Notifications**: Check notification history (5 system messages available)
5. **Mobile View**: Test responsive design on mobile browser

---

## 📞 More Information

For detailed documentation, see:
- 📖 `SEED_DATA_DOCUMENTATION.md` - Complete seed data guide
- 📊 `SEED_DATA_UPDATE_SUMMARY.md` - Update summary
- 🏗️ `CONTEXTS.md` - Project architecture
- 🔌 `backend/API_ENDPOINTS.md` - API reference

---

## ✨ Features Fully Functional

✅ User authentication & roles  
✅ Class management & enrollment  
✅ Attendance tracking  
✅ Marks management  
✅ Course enrollment & payment  
✅ Inventory management  
✅ Payroll system  
✅ Material requests  
✅ Notifications  
✅ File uploads  
✅ Financial transactions  
✅ Leave management  

---

**Happy Testing! 🎉**

**Note**: This is a demo environment with seeded data. All data will reset on database deletion.
