# AI Curriculum Gap Analysis: How It Works

This document explains in simple, non-technical language how our AI Curriculum Gap Analysis system operates and what information it displays. It is designed to help non-IT clients, academic administrators, and industry partners understand the practical value of the system.

---

## 1. The Big Picture: What does the system do?

Imagine a bridge connecting two sides:
1. **The University**: What we are currently teaching in our classrooms.
2. **The Job Market**: What skills students want to learn and what employers actually need.

Often, these two sides don't align. The university might be teaching subjects that are outdated, or they might be missing new tech skills that employers are desperate for.

Our **AI Curriculum Gap Analysis** system acts as a smart matching engine. It automatically reads what the university teaches, reads what students and employers say they need, compares them, and tells the university exactly how to update their syllabus to make graduates 100% ready for the workforce.

---

## 2. Step-by-Step: How it Works in Practice

Here is how the data flows through the system in 4 simple steps:

```
[University Subjects] ──┐
                         ├──► [ AI Matching Engine ] ──► [ Actionable Recommendations ]
[Student & Job Surveys] ─┘
```

### Step 1: The University Input (Current Curriculum)
The university enters their real syllabus structure into the **Course Management** portal. They list:
* The program name (e.g., *BSc in Information Technology*).
* The semesters (e.g., *Semester 1 to 6*).
* The actual subjects taught in each semester (e.g., *Programming Fundamentals*, *Database Systems*).
*This is the source of truth for what is currently taught.*

### Step 2: The Market Input (Student & Employer Surveys)
Students and employers fill out simple Google Form surveys.
* **Students** write down what subjects they want to specialize in (e.g., *Cloud Computing, DevOps*), how they prefer to learn (labs vs lectures), and if they want internships.
* **Employers** list what technologies they need graduates to know (e.g., *Docker, AWS*) and what skill gaps they see in recent hires.
*These links are synced directly into our dashboard.*

### Step 3: The Smart AI Analysis
When the admin clicks "Sync", the AI gets to work:
* It reads the names of all the subjects currently taught in the database.
* It cleans up and groups words from the surveys (e.g., it knows that "ML", "machine learning", and "AI" all mean the same domain: *Artificial Intelligence*).
* It does a **direct comparison**: it checks which requested skills are already covered in the syllabus and which ones are completely missing.
* It scans for warning keywords in the syllabus (e.g., if it spots *Visual Basic* or *COBOL*, it flags them as outdated technologies).

### Step 4: Storing the Results
All this smart math is saved into a secure "cache vault." This ensures that when you click **Analyze Program**, the page loads instantly and shows the results immediately, without keeping you waiting.

---

## 3. What the Dashboard Displays (Section-by-Section)

When you open a specific academic program in the dashboard, the information is divided into these clear, visual sections:

### 📊 Section A: High-Level Overview (KPIs)
* **Curriculum Coverage (%)**: This is a single, overall score. It tells you what percentage of the combined student and industry demands are already being taught in the current curriculum. If it shows *50%*, it means half of what the market needs is missing from our classrooms.
* **Student & Industry Alignments**: Visual percentages showing how well the program satisfies students' academic desires and employers' job requirements.

### ❌ Section B: Missing Core Subjects
* **What it shows**: Prominent red boxes listing the exact domains (e.g., *DevOps*, *Cloud Computing*) that students and employers are heavily requesting but are **completely absent** from the university's subject list.
* **Why it matters**: It tells curriculum designers exactly what new subjects they need to introduce in the next semester.

### ⚠️ Section C: Curriculum Anomalies (Warnings)
* **Legacy Technology Alerts**: Yellow warning cards flagging subjects that contain outdated technologies (such as *Flash* or *Visual Basic*) that are no longer valued in the modern job market.
* **Low-Demand Alerts**: Highlights subjects in the syllabus that show near-zero interest in student and employer surveys, suggesting they could be merged or turned into optional electives.

### 📈 Section D: Student & Employer Demand Charts
* **Student Demand**: A bar chart displaying the top subjects prospective students are interested in studying.
* **Industry Gaps**: A bar chart showing the technologies and concepts that employers are searching for most.

### 🎓 Section E: Learning & Teaching Preferences
Instead of guessing, the AI displays exactly how people prefer to teach and learn:
* **Theory vs. Practical Split**: A comparative slider showing the students' preference (e.g., *10% Theory Lectures vs. 90% Hands-on Labs*).
* **Preferred Learning Methods**: Lists the top modes of learning chosen by students (e.g., *Practical Labs, Workshops, Group Projects*).
* **Industry Expected Practices**: Lists what employers expect universities to focus on (e.g., *Internships, Project Work*).
* **Certification Importance**: Shows how much value employers place on professional credentials.

### 💡 Section F: Actionable AI Recommendations
This is the most valuable section. The AI generates detailed, prioritised recommendation cards:
* **Critical Priority**: Immediate alerts to remove or revise outdated technologies.
* **High Priority**: Direct suggestions to introduce new core subjects to cover missing domains.
* **Medium Priority**: Advice to adjust how subjects are taught (e.g., "Add more laboratory sessions because 90% of students prefer hands-on work over lectures").
* **Evidence Source**: Each recommendation explicitly lists *why* it was generated (e.g., "Based on Student survey feedback" or "Derived from Course Management records"), ensuring transparency.

---

## 4. The "No Data" Empty States

If the university has just created a brand new course and hasn't added subjects yet, or if surveys haven't been synced, the dashboard will **never** display fake metrics or crash. 

Instead, it displays a clean, friendly **Empty State message** (e.g., *"No AI Analytics Generated Yet. Please run the Google Sheet sync to generate insights."*). This guarantees that the system is professional, safe, and ready to populate with real data at any time.
