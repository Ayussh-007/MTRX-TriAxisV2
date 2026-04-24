# backend/ui_styles.py
"""
Global CSS injection for MTRX-TriAxis Streamlit app.
Modern light-mode dashboard design system inspired by Realty Hub.
Import and call inject_global_styles() once in app.py.
"""

import streamlit as st

GLOBAL_CSS = """
<style>
/* ── Google Fonts ─────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* ── Root Variables ──────────────────────────────────── */
:root {
    --bg:        #F5F6FA;
    --surface:   #FFFFFF;
    --surface2:  #F0F2F8;
    --surface3:  #E8EBF2;
    --border:    #E5E7EB;
    --border2:   #D1D5DB;
    --accent:    #2AD699;
    --accent2:   #22B07D;
    --accent3:   #1A9068;
    --success:   #22C55E;
    --success-bg: rgba(34,197,94,0.08);
    --warning:   #F59E0B;
    --warning-bg: rgba(245,158,11,0.08);
    --danger:    #EF4444;
    --danger-bg: rgba(239,68,68,0.08);
    --text:      #1A1D2E;
    --text2:     #4B5563;
    --muted:     #9CA3AF;
    --radius:    16px;
    --radius-sm: 12px;
    --radius-xs: 8px;
    --shadow:    0 2px 12px rgba(0,0,0,0.06);
    --shadow-lg: 0 4px 24px rgba(0,0,0,0.08);
    --shadow-accent: 0 4px 20px rgba(42,214,153,0.18);
    --glass:     rgba(255,255,255,0.85);
    --glass-border: rgba(0,0,0,0.04);
}

/* ── Global Font ─────────────────────────────────────── */
html, body, [class*="css"], .stMarkdown, .stText, p,
h1, h2, h3, h4, label, input, textarea, select, button,
[data-testid="stMarkdownContainer"], [data-testid="stText"] {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}

/* ── Preserve ALL Streamlit internal icon fonts ──────── */
/* Streamlit uses Material Symbols Rounded for sidebar toggle, expander arrows, etc. */
[data-testid="stIconMaterial"],
[data-testid="collapsedControl"],
[data-testid="collapsedControl"] *,
[data-testid="stExpanderToggleIcon"],
[data-testid="stExpanderToggleIcon"] *,
[data-testid="stHeader"] span,
[data-testid="stHeader"] button span,
[data-baseweb="icon"],
[data-baseweb="icon"] *,
span[style*="Material"],
span[style*="material"],
.material-symbols-rounded,
.material-icons {
    font-family: 'Material Symbols Rounded', 'Material Icons', sans-serif !important;
    -webkit-text-fill-color: initial !important;
}

/* ── Typography ──────────────────────────────────────── */
h1, h2, h3 {
    letter-spacing: -0.4px !important;
    color: var(--text) !important;
}
h1 {
    font-weight: 800 !important;
    font-size: 1.8rem !important;
}
h2 {
    font-weight: 700 !important;
    font-size: 1.25rem !important;
}
h3 {
    font-weight: 700 !important;
    font-size: 1.05rem !important;
    color: var(--text2) !important;
}

/* ── Main Layout ─────────────────────────────────────── */
.main .block-container {
    padding-top: 1.5rem;
    padding-bottom: 3rem;
    max-width: 1200px;
}

/* ── Sidebar ─────────────────────────────────────────── */
[data-testid="stSidebar"] {
    background: #FFFFFF !important;
    border-right: 1px solid var(--border) !important;
    box-shadow: 2px 0 12px rgba(0,0,0,0.03) !important;
}
[data-testid="stSidebar"] .stMarkdown p {
    color: var(--text);
}

/* Sidebar nav items */
[data-testid="stSidebar"] button[kind="secondary"] {
    border-radius: var(--radius-xs) !important;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1) !important;
    font-weight: 500 !important;
    color: var(--text2) !important;
}
[data-testid="stSidebar"] button[kind="secondary"]:hover {
    background: rgba(42,214,153,0.08) !important;
    transform: translateX(4px);
    color: var(--accent2) !important;
}

/* Active nav item — mint green pill like Realty Hub */
[data-testid="stSidebar"] [aria-selected="true"] {
    background: #C8F5E0 !important;
    border-left: 3px solid var(--accent) !important;
    font-weight: 600 !important;
    color: var(--accent3) !important;
    border-radius: var(--radius-xs) !important;
}

/* ── Buttons ─────────────────────────────────────────── */
.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #2AD699 0%, #22B07D 100%) !important;
    border: none !important;
    border-radius: var(--radius-sm) !important;
    font-weight: 600 !important;
    font-size: 0.88rem !important;
    letter-spacing: 0.3px !important;
    color: white !important;
    padding: 0.55rem 1.2rem !important;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
    box-shadow: 0 4px 16px rgba(42,214,153,0.25) !important;
}
.stButton > button[kind="primary"]:hover {
    transform: translateY(-2px) scale(1.01) !important;
    box-shadow: 0 8px 30px rgba(42,214,153,0.35) !important;
    filter: brightness(1.05) !important;
}
.stButton > button[kind="primary"]:active {
    transform: translateY(0px) scale(0.99) !important;
}
.stButton > button[kind="secondary"] {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-sm) !important;
    color: var(--text) !important;
    font-weight: 500 !important;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1) !important;
}
.stButton > button[kind="secondary"]:hover {
    border-color: var(--accent) !important;
    color: var(--accent2) !important;
    background: rgba(42,214,153,0.04) !important;
    transform: translateY(-1px) !important;
}

/* ── Metric Cards ────────────────────────────────────── */
[data-testid="stMetric"] {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius) !important;
    padding: 1.1rem 1.3rem !important;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow) !important;
}
[data-testid="stMetric"]::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    opacity: 0;
    transition: opacity 0.3s ease;
}
[data-testid="stMetric"]:hover {
    border-color: var(--accent) !important;
    transform: translateY(-3px);
    box-shadow: var(--shadow-accent);
}
[data-testid="stMetric"]:hover::before {
    opacity: 1;
}
[data-testid="stMetricLabel"] {
    font-size: 0.72rem !important;
    font-weight: 700 !important;
    color: var(--muted) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.6px !important;
}
[data-testid="stMetricValue"] {
    font-size: 1.7rem !important;
    font-weight: 800 !important;
    color: var(--text) !important;
}

/* ── Input Fields ────────────────────────────────────── */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stNumberInput input {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-xs) !important;
    color: var(--text) !important;
    font-size: 0.88rem !important;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1) !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(42,214,153,0.12), 0 0 20px rgba(42,214,153,0.06) !important;
}
.stSelectbox > div > div {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-xs) !important;
    color: var(--text) !important;
    transition: border-color 0.2s ease !important;
}
.stSelectbox > div > div:hover {
    border-color: var(--accent) !important;
}

/* ── Expanders ───────────────────────────────────────── */
[data-testid="stExpander"] {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius) !important;
    overflow: hidden !important;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1) !important;
    box-shadow: var(--shadow) !important;
}
[data-testid="stExpander"]:hover {
    border-color: var(--accent) !important;
    box-shadow: 0 2px 12px rgba(42,214,153,0.08) !important;
}
[data-testid="stExpander"] summary {
    font-weight: 600 !important;
    color: var(--text) !important;
    font-size: 0.9rem !important;
}

/* ── Dataframe ───────────────────────────────────────── */
[data-testid="stDataFrame"] {
    border-radius: var(--radius) !important;
    overflow: hidden !important;
    border: 1px solid var(--border) !important;
    box-shadow: var(--shadow) !important;
}

/* ── Tabs ────────────────────────────────────────────── */
.stTabs [data-baseweb="tab-list"] {
    background: var(--surface2) !important;
    border-radius: var(--radius-sm) !important;
    padding: 4px !important;
    border: 1px solid var(--border) !important;
    gap: 4px !important;
}
.stTabs [data-baseweb="tab"] {
    background: transparent !important;
    border-radius: var(--radius-xs) !important;
    color: var(--muted) !important;
    font-weight: 500 !important;
    font-size: 0.85rem !important;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1) !important;
    padding: 0.5rem 1rem !important;
}
.stTabs [data-baseweb="tab"]:hover {
    color: var(--text) !important;
    background: rgba(42,214,153,0.06) !important;
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #2AD699, #22B07D) !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 10px rgba(42,214,153,0.25) !important;
}

/* ── Alerts / Info boxes ─────────────────────────────── */
.stAlert {
    border-radius: var(--radius) !important;
    border-width: 1px !important;
}
[data-testid="stToast"] {
    border-radius: var(--radius) !important;
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
}

/* ── Progress Bar ────────────────────────────────────── */
.stProgress > div > div {
    background: linear-gradient(90deg, #2AD699, #22B07D, #1A9068) !important;
    border-radius: var(--radius-sm) !important;
    box-shadow: 0 0 12px rgba(42,214,153,0.2) !important;
}

/* ── Dividers ────────────────────────────────────────── */
hr {
    border: none !important;
    height: 1px !important;
    background: linear-gradient(90deg, transparent, var(--border), var(--border2), var(--border), transparent) !important;
    margin: 1.8rem 0 !important;
}

/* ── Select Slider ───────────────────────────────────── */
.stSlider [data-baseweb="slider"] div[role="slider"] {
    background: var(--accent) !important;
    border: 3px solid var(--accent2) !important;
    box-shadow: 0 0 12px rgba(42,214,153,0.3) !important;
}

/* ── Checkbox ────────────────────────────────────────── */
.stCheckbox label span[data-testid="stCheckbox"] {
    transition: all 0.2s ease !important;
}
[data-testid="stCheckbox"] {
    transition: all 0.2s ease !important;
}

/* ── Radio buttons ───────────────────────────────────── */
.stRadio > div {
    gap: 0.3rem !important;
}
.stRadio label {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-xs) !important;
    padding: 0.5rem 0.8rem !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
}
.stRadio label:hover {
    border-color: var(--accent) !important;
    background: rgba(42,214,153,0.04) !important;
}
.stRadio label[data-checked="true"],
.stRadio label:has(input:checked) {
    border-color: var(--accent) !important;
    background: rgba(42,214,153,0.08) !important;
}

/* ── Multiselect ─────────────────────────────────────── */
.stMultiSelect > div > div {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-xs) !important;
}

/* ── Date input ──────────────────────────────────────── */
.stDateInput > div > div {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-xs) !important;
}

/* ── Status badges (sidebar) ─────────────────────────── */
[data-testid="stSidebar"] .stSuccess {
    background: var(--success-bg) !important;
    border: 1px solid rgba(34,197,94,0.3) !important;
    border-radius: var(--radius-xs) !important;
}
[data-testid="stSidebar"] .stError {
    background: var(--danger-bg) !important;
    border: 1px solid rgba(239,68,68,0.3) !important;
    border-radius: var(--radius-xs) !important;
}
[data-testid="stSidebar"] .stInfo {
    background: rgba(42,214,153,0.08) !important;
    border: 1px solid rgba(42,214,153,0.3) !important;
    border-radius: var(--radius-xs) !important;
}

/* ── Form submit button ──────────────────────────────── */
[data-testid="stFormSubmitButton"] button {
    width: 100% !important;
    background: linear-gradient(135deg, #2AD699, #22B07D) !important;
    border: none !important;
    border-radius: var(--radius-sm) !important;
    font-weight: 600 !important;
    color: white !important;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
    box-shadow: 0 4px 15px rgba(42,214,153,0.2) !important;
}
[data-testid="stFormSubmitButton"] button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(42,214,153,0.35) !important;
}

/* ── Scrollbar ───────────────────────────────────────── */
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: var(--border2);
    border-radius: 6px;
}
::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
}

/* ── Spinner ─────────────────────────────────────────── */
.stSpinner > div {
    border-top-color: var(--accent) !important;
}

/* ── Page link ───────────────────────────────────────── */
.stPageLink a {
    color: var(--accent2) !important;
    text-decoration: none !important;
    font-weight: 500 !important;
    transition: color 0.2s ease !important;
}
.stPageLink a:hover {
    color: var(--accent3) !important;
}

/* ── Caption text ────────────────────────────────────── */
.stCaption, [data-testid="stCaptionContainer"] {
    color: var(--muted) !important;
    font-size: 0.78rem !important;
}

/* ── Plotly charts — clean container ─────────────────── */
.stPlotlyChart {
    border-radius: var(--radius) !important;
    overflow: hidden !important;
    border: 1px solid var(--border) !important;
    background: var(--surface) !important;
    box-shadow: var(--shadow) !important;
}

/* ── Animated gradient accent bar (top of page) ──────── */
.main::before {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(90deg, #2AD699, #22B07D, #38BDF8, #2AD699);
    background-size: 300% 100%;
    animation: accentBar 6s ease infinite;
    margin-bottom: 0.5rem;
    border-radius: 2px;
}
@keyframes accentBar {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* ── Selection highlight ─────────────────────────────── */
::selection {
    background: rgba(42,214,153,0.25);
    color: var(--text);
}

/* ── Smooth page transitions ─────────────────────────── */
.main .block-container {
    animation: pageIn 0.35s cubic-bezier(0.4,0,0.2,1);
}
@keyframes pageIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>
"""


def inject_global_styles() -> None:
    """Inject global CSS into the Streamlit app. Call once from app.py."""
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)
