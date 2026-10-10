# MindGuardAI $k$-Anonymity & Institutional Privacy Implementation

## 1. Threat Model & Privacy Challenge

In university administration dashboards, macro-level mental health analytics help leadership identify high-stress academic milestones (e.g. midterm periods or department-specific burnout).

However, in small departments, specialized graduate cohorts, or narrow demographic filters, aggregate reporting risks **re-identification attacks** (e.g., if a department has only 3 students and 1 is flagged as high-risk, administrators might easily deduce the individual student's identity).

---

## 2. The $k$-Anonymity Rule ($k \ge 10$)

To guarantee individual anonymity, MindGuardAI enforces a strict threshold of **$k \ge 10$ unique students** across all analytical endpoints:

$$\text{Group Result} = \begin{cases} 
\text{Aggregated Statistics} & \text{if } \text{Count}(\text{Distinct Students}) \ge 10 \\
\text{"Data Suppressed: Protected (N < 10)"} & \text{if } \text{Count}(\text{Distinct Students}) < 10
\end{cases}$$

### Key Implementation Principles:
1. **Unique Student Counting**: Suppression counts distinct student IDs (`func.count(func.distinct(User.id))`), not log rows or submission events.
2. **Complementary Cell Suppression**: When sub-groups sum to a known total, small sub-cells are masked to prevent subtraction/differencing attacks.
3. **No Drill-Down to Individual Casefiles**: Administrative accounts have zero access to student identifiers, names, or individual journal entries.
