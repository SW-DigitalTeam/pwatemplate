# School coordinator guide

This guide covers everything a teacher, school coordinator, or facilitator needs to use the Sport Waikato programme platform at their school.

---

## 1. Getting access

### Option A: Google sign-in (staff with school Google accounts)
1. Go to the platform URL
2. Click **Continue with Google**
3. Sign in with your school email address
4. If this is your first time, contact your school admin to be added to your school

### Option B: Email magic link
1. Go to the platform URL
2. Click **Sign in** → enter your email → **Send magic link**
3. Check your email and click the link

### Option C: Staff invitation
1. Your school admin sends you an invitation by email
2. Click the link in the invitation email
3. Create your account (Google or email)
4. Your role is automatically linked to your school

---

## 2. Applying for a programme

Your school needs to be registered before you can start. If your school is not yet on the platform:

1. Go to **Schools** → **Register your school**
2. Fill in your school's details, your contact information, and select the programmes you're interested in
3. Describe your intended participant group (e.g. "Year 9-10 students not engaged in traditional sport")
4. Submit the application

**Tracking your application:**
- After submission, you'll see a confirmation screen
- Sport Waikato reviews applications within 5 working days
- You'll receive email confirmation when approved
- Your school dashboard will show the status

---

## 3. Your school dashboard

Once your school is approved, go to **Schools** → **[your school name]** to see:
- **Programmes**: which programmes your school is participating in
- **Groups**: your classes, houses, or groups
- **Participants**: how many are enrolled
- **Staff**: other teachers and facilitators at your school
- **Quick actions**: enrol participants, schedule sessions, report issues

---

## 4. Creating cohorts (groups, classes, houses)

1. On your school dashboard, click **Manage groups**
2. Enter a group name (e.g. "Room 12", "Tui House", "Year 10 PE")
3. Select the type (Class, House, or Group)
4. Click **Create**

Groups help you:
- Organise participants for sessions
- Run session attendance per group
- View group-level reporting

---

## 5. Enrolling participants

### Enrol one at a time:
1. On your school dashboard, click **Enrol participant**
2. Enter the participant's first name or preferred name
3. Select their year level (optional)
4. Assign them to a group (optional)
5. Add any accessibility notes (optional — only if it helps facilitators support this participant)
6. Click **Enrol participant**

### Enrol in bulk (CSV import):
1. Go to **Import** from the dashboard
2. Select your school
3. Upload a CSV file (must have a header row)
4. Preview the data and map columns
5. Click **Start import**

**CSV format example:**
```
display_name,year_level
Aroha,Y9
Ben,Y10
Mia,Y9
```

**Data minimisation:** Only collect what's needed. First/preferred name and year level are sufficient for most programmes. Do NOT include dates of birth, home addresses, or national student numbers.

---

## 6. Recording caregiver consent

Consent must be recorded before a participant takes part in a programme that requires it (most school-based programmes do).

1. Go to the participant's consent page
2. Select the programme
3. The caregiver reads the consent information
4. The caregiver enters their name and relationship to the participant
5. The caregiver checks "I confirm that I am authorised to give consent"
6. Click **Give consent**

**Consent records include:**
- Who gave consent (name + relationship)
- What they agreed to (programme consent version)
- When (date and time)
- Whether consent has been withdrawn

Caregivers can withdraw consent at any time through the same page.

---

## 7. Running sessions and recording attendance

### Schedule a session:
1. Go to **Sessions** → **Schedule a session**
2. Enter a title (e.g. "Lunchtime movement")
3. Select the type (lunchtime, before school, during class, etc.)
4. Set the date, time, and duration
5. Select the programme
6. Optionally select a group (leave blank for all groups)
7. Click **Schedule session**

### Record attendance:
1. Open the session from the sessions list
2. You'll see all active participants at your school
3. For each participant, tap: **Present**, **Late**, **Left early**, or **Absent**
4. Add any delivery notes
5. Click **Save attendance**

### Offline attendance:
If your school has unreliable internet:
- The attendance page shows an **Online / Offline** indicator
- When offline, attendance records are saved to the device
- Records sync automatically when the connection returns
- A badge shows how many records are queued
- You won't lose data if the connection drops mid-session

---

## 8. Surveys and feedback

If your programme includes surveys, participants will see them on their dashboard.

### What participants see:
- Surveys assigned to their school
- A **Save progress** button to save and continue later
- A **Submit survey** button when all required questions are answered

### What you see:
- Survey completion rates on your school dashboard
- Teacher observation surveys (if your programme includes them)
- You can complete teacher observations at any time during the programme

### Survey types:
- **Baseline**: completed at the start of a programme
- **Midpoint / pulse**: short check-ins during the programme
- **Endpoint**: completed at the end of a programme
- **Teacher observations**: your observations of participant engagement and progress

---

## 9. What reporting you can see

### Your school's data:
- Number of participants
- Active vs withdrawn participants
- Session attendance rates
- Movement data (if your programme includes movement logging)

### What you CANNOT see:
- Other schools' participant data
- Identifiable data from other schools
- Aggregate reporting from other schools

This is enforced at the database level — the system does not rely on hiding buttons.

---

## 10. Participant privacy

### Identifiable information collected:
- First name or preferred name only (not full name)
- Year level (optional)
- Accessibility notes (optional)
- Attendance records

### NOT collected:
- Dates of birth
- Home addresses
- National student numbers
- Health information (beyond accessibility notes where voluntarily provided)

### Pseudonymous identifiers:
Each participant gets an auto-generated pseudonym (e.g. `P-a1b2c3d4e5`). This is used for:
- Analysis and reporting
- Pre- and post-programme survey matching
- De-identified data exports

### Data retention:
Participant data is retained for the period specified in each programme's configuration (default 24 months after completion). After this period, data is deleted or anonymised.

---

## 11. Getting help

### If something isn't working:
1. Go to **Issues** → **Report an issue**
2. Select the category:
   - **Equipment**: broken or missing equipment
   - **Technical bug**: something in the platform isn't working
   - **Data quality**: incorrect participant data
   - **Accessibility**: something is hard to use
   - **Safeguarding concern**: a participant wellbeing concern
3. Describe the issue and select the severity
4. Click **Submit issue**

### Safeguarding:
Safeguarding concerns are restricted — only Sport Waikato programme administrators can view them. If a concern is urgent, contact your programme lead directly.

### Contact:
Each programme has a support email shown on its page. For general platform support, contact the SW Digital Lead.
