"""
MTRX-TriAxis | Attendance Page
Calendar-grid style attendance system — inspired by enterprise HR status report.
Teachers can navigate months, set per-day status (P/A/L/H/W), and see a color-coded
overview at a glance.
"""

import streamlit as st
import calendar
from datetime import date, timedelta

from backend.student_model import (
    list_students, record_attendance_bulk,
    get_attendance_for_date,
)
from backend.ui_components import page_header

page_header(
    "📋", "Attendance Register",
    "Monthly calendar-grid attendance — mark, review, and track at a glance.",
    accent="#22B07D",
)

# ── Status codes & colors ─────────────────────────────────────────
STATUS_CODES = {
    "P":  ("Present",       "#22C55E", "#F0FDF4"),  # green
    "A":  ("Absent",        "#EF4444", "#FEF2F2"),  # red
    "L":  ("Leave",         "#F59E0B", "#FFFBEB"),  # amber
    "H":  ("Holiday",       "#60A5FA", "#EFF6FF"),  # blue
    "W":  ("Weekend",       "#9CA3AF", "#F3F4F6"),  # grey
}


# ── Load students ─────────────────────────────────────────────────
students = list_students()
if not students:
    st.info("No students registered yet. Add students in the Student Manager first.")
    st.stop()


# ── Month navigation ──────────────────────────────────────────────
if "att_year" not in st.session_state:
    st.session_state.att_year = date.today().year
if "att_month" not in st.session_state:
    st.session_state.att_month = date.today().month

nav_cols = st.columns([1, 3, 1])

with nav_cols[0]:
    if st.button("◀  Prev", use_container_width=True, key="att_prev"):
        m = st.session_state.att_month - 1
        if m < 1:
            st.session_state.att_month = 12
            st.session_state.att_year -= 1
        else:
            st.session_state.att_month = m
        st.rerun()

with nav_cols[1]:
    month_name = calendar.month_name[st.session_state.att_month]
    st.markdown(
        f"<h3 style='text-align:center; margin:0; color:#1A1D2E;'>"
        f"📅 {month_name} {st.session_state.att_year}</h3>",
        unsafe_allow_html=True,
    )

with nav_cols[2]:
    if st.button("Next  ▶", use_container_width=True, key="att_next"):
        m = st.session_state.att_month + 1
        if m > 12:
            st.session_state.att_month = 1
            st.session_state.att_year += 1
        else:
            st.session_state.att_month = m
        st.rerun()

st.markdown("<div style='height:0.3rem'></div>", unsafe_allow_html=True)


# ── Build the day columns for this month ──────────────────────────
year  = st.session_state.att_year
month = st.session_state.att_month
_, num_days = calendar.monthrange(year, month)

# Determine which days to show (limit to 16 per "page" to fit screen)
DAYS_PER_PAGE = 16
if "att_day_page" not in st.session_state:
    st.session_state.att_day_page = 0

total_pages = (num_days + DAYS_PER_PAGE - 1) // DAYS_PER_PAGE
page = st.session_state.att_day_page
start_day = page * DAYS_PER_PAGE + 1
end_day   = min(start_day + DAYS_PER_PAGE - 1, num_days)
visible_days = list(range(start_day, end_day + 1))

# Day page navigation
if total_pages > 1:
    dp_cols = st.columns([1, 4, 1])
    with dp_cols[0]:
        if page > 0 and st.button("◀ Days", key="dp_prev", use_container_width=True):
            st.session_state.att_day_page -= 1
            st.rerun()
    with dp_cols[1]:
        st.markdown(
            f"<p style='text-align:center; color:#6B7280; margin:0; font-size:0.8rem; padding-top:6px;'>"
            f"Showing {month_name[:3]} {start_day} – {month_name[:3]} {end_day}  "
            f"(Page {page+1}/{total_pages})</p>",
            unsafe_allow_html=True,
        )
    with dp_cols[2]:
        if page < total_pages - 1 and st.button("Days ▶", key="dp_next", use_container_width=True):
            st.session_state.att_day_page += 1
            st.rerun()


# ── Pre-load existing attendance for all visible days ─────────────
existing_map = {}  # date_str → {student_id → present}
day_info = {}      # day_num → (date_str, day_abbr, is_weekend)
for d in visible_days:
    dt = date(year, month, d)
    ds = dt.isoformat()
    existing_map[ds] = get_attendance_for_date(ds)
    day_info[d] = (ds, calendar.day_abbr[dt.weekday()], dt.weekday() in (5, 6))


# ── Render the grid ───────────────────────────────────────────────
# Build header row
header_html = "<th style='text-align:left; padding:8px 10px; min-width:160px; position:sticky; left:0; background:#F8F9FB; z-index:2;'>Student</th>"
for d in visible_days:
    ds, day_abbr, is_wknd = day_info[d]
    bg = "#F3F4F6" if is_wknd else "#F8F9FB"
    header_html += (
        f"<th style='text-align:center; padding:6px 4px; min-width:52px; font-size:0.75rem; background:{bg};'>"
        f"<div style='font-weight:700; color:#1A1D2E;'>{month_name[:3]} {d:02d}</div>"
        f"<div style='color:#9CA3AF; font-weight:400;'>{day_abbr}</div>"
        f"</th>"
    )

# Build body rows
body_html = ""
for s in students:
    sid = s["id"]
    name = s["name"]
    login_id = s.get("login_id", "")
    login_badge = f"<span style='color:#9CA3AF; font-size:0.72rem;'>{login_id}</span>" if login_id else ""

    row = (
        f"<td style='padding:10px; position:sticky; left:0; background:#FFFFFF; z-index:1; border-bottom:1px solid #F1F3F5;'>"
        f"<div style='display:flex; align-items:center; gap:8px;'>"
        f"<div style='width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#22B07D,#2AD699);"
        f"display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;flex-shrink:0;'>"
        f"{name[0].upper()}</div>"
        f"<div><div style='font-weight:600;font-size:0.82rem;color:#1A1D2E;'>{name}</div>"
        f"{login_badge}</div></div></td>"
    )

    for d in visible_days:
        ds, _, is_wknd = day_info[d]
        existing = existing_map.get(ds, {})
        present = existing.get(sid)

        if is_wknd:
            cell_bg = "#F9FAFB"
            cell_text = "W"
            cell_color = "#9CA3AF"
            cell_border = ""
        elif present is True:
            cell_bg = "#F0FDF4"
            cell_text = "P"
            cell_color = "#22C55E"
            cell_border = "border-bottom:2px solid #22C55E;"
        elif present is False:
            cell_bg = "#FEF2F2"
            cell_text = "A"
            cell_color = "#EF4444"
            cell_border = "border-bottom:2px solid #EF4444;"
        else:
            cell_bg = "#FFFFFF"
            cell_text = "–"
            cell_color = "#D1D5DB"
            cell_border = ""

        row += (
            f"<td style='text-align:center; padding:6px 4px; background:{cell_bg}; "
            f"border-bottom:1px solid #F1F3F5; {cell_border}'>"
            f"<span style='font-weight:600; color:{cell_color}; font-size:0.8rem;'>{cell_text}</span>"
            f"</td>"
        )

    body_html += f"<tr>{row}</tr>"


# Assemble full table
st.markdown(
    f"""
    <div style='overflow-x:auto; border:1px solid #E5E7EB; border-radius:12px; background:#FFFFFF; margin-bottom:1rem;'>
        <table style='border-collapse:collapse; width:100%; min-width:700px;'>
            <thead>
                <tr style='background:#F8F9FB; border-bottom:2px solid #E5E7EB;'>
                    {header_html}
                </tr>
            </thead>
            <tbody>
                {body_html}
            </tbody>
        </table>
    </div>
    """,
    unsafe_allow_html=True,
)


# ── Legend ─────────────────────────────────────────────────────────
legend_items = "".join(
    f"<span style='display:inline-flex; align-items:center; gap:4px; margin-right:16px; font-size:0.78rem;'>"
    f"<span style='display:inline-block; width:10px; height:10px; border-radius:2px; background:{clr};'></span>"
    f"<span style='color:#4B5563;'>{code} - {label}</span></span>"
    for code, (label, clr, _) in STATUS_CODES.items()
)
st.markdown(
    f"<div style='padding:0.4rem 0; margin-bottom:1rem;'>{legend_items}</div>",
    unsafe_allow_html=True,
)


# ═══════════════════════════════════════════════════════════════════
# MARK ATTENDANCE (simple, practical form)
# ═══════════════════════════════════════════════════════════════════
st.markdown("---")
st.markdown("### ✏️ Mark Attendance")

att_date = st.date_input(
    "Select date:",
    value=date.today(),
    key="att_mark_date",
    max_value=date.today(),
)
date_str = att_date.isoformat()

# Check if it's weekend
if att_date.weekday() in (5, 6):
    st.markdown(
        f"""
        <div style='background:#F3F4F6; border:1px solid #E5E7EB; border-radius:10px;
                    padding:0.8rem 1rem; text-align:center; margin-bottom:1rem;'>
            <span style='font-size:1.2rem;'>🏖️</span>
            <span style='color:#6B7280; font-weight:600;'> {att_date.strftime('%A')} — Weekend</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

existing_for_day = get_attendance_for_date(date_str)

st.markdown(
    f"""
    <div style='background: rgba(34,176,125,0.06); border: 1px solid rgba(34,176,125,0.2);
                border-radius: 10px; padding: 0.6rem 1rem; margin-bottom: 0.8rem;
                font-size: 0.85rem; color: #22B07D;'>
        ✅ Check = <strong>Present</strong> &nbsp;|&nbsp;
        Unchecked = <strong>Absent</strong> &nbsp;|&nbsp;
        Date: <strong>{att_date.strftime('%A, %d %B %Y')}</strong>
    </div>
    """,
    unsafe_allow_html=True,
)

# Render checkbox grid
att_states = {}
num_cols = 4
rows = [students[i:i + num_cols] for i in range(0, len(students), num_cols)]

for row_students in rows:
    cols = st.columns(num_cols)
    for col, s in zip(cols, row_students):
        with col:
            default_present = existing_for_day.get(s["id"], True)
            att_states[s["id"]] = st.checkbox(
                f"  {s['name']}",
                value=default_present,
                key=f"att_{s['id']}_{date_str}",
            )

# Quick action buttons
ac1, ac2, ac3 = st.columns(3)
with ac1:
    if st.button("✅ Mark All Present", use_container_width=True, key="att_all_p"):
        records = [
            {"student_id": s["id"], "date": date_str, "present": True}
            for s in students
        ]
        record_attendance_bulk(records)
        st.success(f"✅ All {len(students)} students marked present for {att_date.strftime('%d %b %Y')}")
        st.rerun()

with ac2:
    if st.button("❌ Mark All Absent", use_container_width=True, key="att_all_a"):
        records = [
            {"student_id": s["id"], "date": date_str, "present": False}
            for s in students
        ]
        record_attendance_bulk(records)
        st.warning(f"❌ All {len(students)} students marked absent for {att_date.strftime('%d %b %Y')}")
        st.rerun()

with ac3:
    if st.button("💾 Save Attendance", type="primary", use_container_width=True, key="att_save"):
        records = [
            {"student_id": sid, "date": date_str, "present": present}
            for sid, present in att_states.items()
        ]
        record_attendance_bulk(records)

        present_count = sum(1 for p in att_states.values() if p)
        absent_count = len(att_states) - present_count
        st.success(
            f"✅ Saved for {att_date.strftime('%d %b %Y')}: "
            f"**{present_count}** present, **{absent_count}** absent"
        )
        st.rerun()


# ═══════════════════════════════════════════════════════════════════
# MONTHLY SUMMARY STATS
# ═══════════════════════════════════════════════════════════════════
st.markdown("---")
st.markdown("### 📊 Monthly Summary")

total_working_days = 0
student_present_count = {s["id"]: 0 for s in students}

for d in range(1, num_days + 1):
    dt = date(year, month, d)
    if dt > date.today():
        break
    if dt.weekday() in (5, 6):
        continue
    total_working_days += 1
    day_att = get_attendance_for_date(dt.isoformat())
    for sid, present in day_att.items():
        if present and sid in student_present_count:
            student_present_count[sid] += 1

if total_working_days > 0:
    summary_html = ""
    for s in students:
        sid = s["id"]
        present = student_present_count.get(sid, 0)
        absent = total_working_days - present
        pct = round((present / total_working_days) * 100, 1) if total_working_days > 0 else 0

        if pct >= 85:
            bar_color = "#22C55E"
        elif pct >= 70:
            bar_color = "#F59E0B"
        elif pct >= 50:
            bar_color = "#F97316"
        else:
            bar_color = "#EF4444"

        summary_html += f"""
        <div style='display:flex; align-items:center; gap:10px; padding:8px 12px;
                    border-bottom:1px solid #F1F3F5;'>
            <div style='min-width:160px; font-weight:600; font-size:0.82rem; color:#1A1D2E;'>
                {s['name']}
            </div>
            <div style='flex:1; background:#F3F4F6; border-radius:4px; height:18px; overflow:hidden;'>
                <div style='width:{pct}%; height:100%; background:{bar_color}; border-radius:4px;
                            transition:width 0.3s ease;'></div>
            </div>
            <div style='min-width:94px; text-align:right; font-size:0.78rem; color:#4B5563;'>
                {present}/{total_working_days} ({pct}%)
            </div>
        </div>
        """

    st.markdown(
        f"""
        <div style='border:1px solid #E5E7EB; border-radius:12px; background:#FFFFFF;
                    overflow:hidden; margin-bottom:1rem;'>
            <div style='background:#F8F9FB; padding:10px 14px; border-bottom:1px solid #E5E7EB;
                        display:flex; justify-content:space-between; align-items:center;'>
                <span style='font-weight:700; font-size:0.85rem; color:#1A1D2E;'>
                    Student
                </span>
                <span style='font-size:0.78rem; color:#6B7280;'>
                    Working Days: {total_working_days}
                </span>
            </div>
            {summary_html}
        </div>
        """,
        unsafe_allow_html=True,
    )
else:
    st.info("No working days recorded this month yet.")
