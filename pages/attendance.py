"""
MTRX-TriAxis | Attendance Page
Calendar-grid style attendance system — inspired by enterprise HR status report.
Teachers click cells directly in the grid to toggle P/A status.
No checkboxes — everything is done via the interactive table.
"""

import streamlit as st
import calendar
import pandas as pd
from datetime import date

from backend.student_model import (
    list_students, record_attendance, record_attendance_bulk,
    get_attendance_for_date,
)
from backend.ui_components import page_header

page_header(
    "📋", "Attendance Register",
    "Monthly calendar-grid attendance — click any cell to toggle P / A.",
    accent="#22B07D",
)

# ── Status codes & colors ─────────────────────────────────────────
STATUS_CONFIG = {
    "P":  ("Present",  "#22C55E", "#F0FDF4"),
    "A":  ("Absent",   "#EF4444", "#FEF2F2"),
    "W":  ("Weekend",  "#9CA3AF", "#F3F4F6"),
    "–":  ("Not Set",  "#D1D5DB", "#FFFFFF"),
}


# ── Load students ─────────────────────────────────────────────────
students = list_students()
if not students:
    st.info("No students registered yet. Add students in the **Student Manager** first.")
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
        if "att_day_page" in st.session_state:
            st.session_state.att_day_page = 0
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
        if "att_day_page" in st.session_state:
            st.session_state.att_day_page = 0
        st.rerun()

st.markdown("<div style='height:0.3rem'></div>", unsafe_allow_html=True)


# ── Build day columns for this month ──────────────────────────────
year  = st.session_state.att_year
month = st.session_state.att_month
_, num_days = calendar.monthrange(year, month)

# Page through days (max 16 per view for readability)
DAYS_PER_PAGE = 16
if "att_day_page" not in st.session_state:
    st.session_state.att_day_page = 0

total_pages = (num_days + DAYS_PER_PAGE - 1) // DAYS_PER_PAGE
page = min(st.session_state.att_day_page, total_pages - 1)
start_day = page * DAYS_PER_PAGE + 1
end_day   = min(start_day + DAYS_PER_PAGE - 1, num_days)
visible_days = list(range(start_day, end_day + 1))

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


# ── Build editable dataframe ──────────────────────────────────────
# Columns: Student | Day1 | Day2 | ...
day_columns = []
column_dates = {}  # col_name → (date_str, is_weekend)
for d in visible_days:
    dt = date(year, month, d)
    day_abbr = calendar.day_abbr[dt.weekday()]
    col_name = f"{month_name[:3]} {d:02d}\n{day_abbr}"
    day_columns.append(col_name)
    column_dates[col_name] = (dt.isoformat(), dt.weekday() in (5, 6))

# Pre-load all attendance data
att_data = {}
for col in day_columns:
    ds, _ = column_dates[col]
    att_data[ds] = get_attendance_for_date(ds)

# Build grid rows
grid_rows = []
for s in students:
    row = {"Student": s["name"]}
    for col in day_columns:
        ds, is_wknd = column_dates[col]
        if is_wknd:
            row[col] = "W"
        else:
            present = att_data[ds].get(s["id"])
            if present is True:
                row[col] = "P"
            elif present is False:
                row[col] = "A"
            else:
                row[col] = "–"
    grid_rows.append(row)

df = pd.DataFrame(grid_rows)

# ── Instructions ──────────────────────────────────────────────────
st.markdown(
    """
    <div style='background: rgba(34,176,125,0.06); border: 1px solid rgba(34,176,125,0.2);
                border-radius: 10px; padding: 0.6rem 1rem; margin-bottom: 0.8rem;
                font-size: 0.85rem; color: #22B07D;'>
        ✏️ <strong>Click any cell</strong> in the grid below and type
        <strong>P</strong> (Present) or <strong>A</strong> (Absent).
        Weekend columns are pre-filled with <strong>W</strong>.
        Press <strong>💾 Save</strong> when done.
    </div>
    """,
    unsafe_allow_html=True,
)

# ── Render editable grid ─────────────────────────────────────────
# Configure column types
col_config = {
    "Student": st.column_config.TextColumn(
        "Student",
        disabled=True,
        width="medium",
    ),
}
for col in day_columns:
    _, is_wknd = column_dates[col]
    col_config[col] = st.column_config.SelectboxColumn(
        col,
        options=["P", "A", "W", "–"] if not is_wknd else ["W"],
        default="–" if not is_wknd else "W",
        width="small",
        disabled=is_wknd,
    )

edited_df = st.data_editor(
    df,
    column_config=col_config,
    use_container_width=True,
    hide_index=True,
    num_rows="fixed",
    key=f"att_grid_{year}_{month}_{page}",
)


# ── Quick Actions ─────────────────────────────────────────────────
ac1, ac2, ac3 = st.columns(3)

with ac1:
    if st.button("✅ Mark All Present (Today)", use_container_width=True, key="att_all_p"):
        today_str = date.today().isoformat()
        if date.today().weekday() not in (5, 6):
            records = [
                {"student_id": s["id"], "date": today_str, "present": True}
                for s in students
            ]
            record_attendance_bulk(records)
            st.success(f"✅ All {len(students)} marked present for today")
            st.rerun()
        else:
            st.warning("Today is a weekend!")

with ac2:
    if st.button("❌ Mark All Absent (Today)", use_container_width=True, key="att_all_a"):
        today_str = date.today().isoformat()
        if date.today().weekday() not in (5, 6):
            records = [
                {"student_id": s["id"], "date": today_str, "present": False}
                for s in students
            ]
            record_attendance_bulk(records)
            st.warning(f"❌ All {len(students)} marked absent for today")
            st.rerun()
        else:
            st.warning("Today is a weekend!")

with ac3:
    if st.button("💾 Save All Changes", type="primary", use_container_width=True, key="att_save"):
        saved = 0
        for i, s in enumerate(students):
            for col in day_columns:
                ds, is_wknd = column_dates[col]
                if is_wknd:
                    continue
                val = edited_df.iloc[i][col]
                if val == "P":
                    record_attendance(s["id"], ds, present=True)
                    saved += 1
                elif val == "A":
                    record_attendance(s["id"], ds, present=False)
                    saved += 1
                # "–" = skip (no record)
        st.success(f"✅ Saved {saved} attendance entries!")
        st.rerun()


# ── Legend ─────────────────────────────────────────────────────────
legend_items = "".join(
    f"<span style='display:inline-flex; align-items:center; gap:4px; margin-right:16px; font-size:0.78rem;'>"
    f"<span style='display:inline-block; width:10px; height:10px; border-radius:2px; background:{clr};'></span>"
    f"<span style='color:#4B5563;'>{code} - {label}</span></span>"
    for code, (label, clr, _) in STATUS_CONFIG.items()
)
st.markdown(
    f"<div style='padding:0.4rem 0; margin-bottom:1rem;'>{legend_items}</div>",
    unsafe_allow_html=True,
)


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
        pct = round((present / total_working_days) * 100, 1)

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
