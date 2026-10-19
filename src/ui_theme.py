"""
WasteWise AI - Enterprise UI Theme & Design System
Professional FoodTech operational intelligence styling inspired by Linear, Stripe,
and modern analytics dashboards. Clean typography, restrained palette, and high information density.
"""

from typing import Optional
import plotly.graph_objects as go
import streamlit as st

from src.config import THEME_COLORS


def apply_custom_css():
    """
    Injects custom CSS to establish a calm, disciplined, enterprise SaaS interface.
    Suppresses unnecessary Streamlit chrome, constrains sidebar width, and standardizes typography.
    """
    custom_css = f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* Global Typography & Resets */
    html, body, [class*="css"], .stMarkdown, .stText {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        color: {THEME_COLORS["text_primary"]} !important;
        background-color: {THEME_COLORS["page_bg"]} !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }}

    /* Suppress unnecessary Streamlit chrome */
    .stAppDeployButton, #MainMenu, footer, header[data-testid="stHeader"] {{
        display: none !important;
    }}
    .stAppHeader {{
        display: none !important;
    }}

    /* Main Container Framing */
    .main .block-container {{
        padding-top: 1.25rem !important;
        padding-bottom: 2.5rem !important;
        padding-left: 2rem !important;
        padding-right: 2rem !important;
        max-width: 1320px !important;
    }}

    /* Sidebar - Compact, Restrained (245px width) */
    section[data-testid="stSidebar"],
    div[data-testid="stSidebarContent"] {{
        width: 245px !important;
        min-width: 245px !important;
        max-width: 245px !important;
        background-color: #FFFFFF !important;
        border-right: 1px solid #E2E8F0 !important;
    }}

    section[data-testid="stSidebar"] > div:first-child {{
        padding: 1.25rem 1rem 1rem 1rem !important;
    }}

    /* Hide the radio widget header label completely */
    section[data-testid="stSidebar"] div[data-testid="stRadio"] > label,
    section[data-testid="stSidebar"] div[data-testid="stRadio"] label[data-testid="stWidgetLabel"] {{
        display: none !important;
    }}

    /* Sidebar Radio Navigation List */
    section[data-testid="stSidebar"] div[data-testid="stRadio"] [data-testid="stRadioGroup"] {{
        gap: 0.25rem !important;
    }}

    section[data-testid="stSidebar"] label[data-testid="stRadioOption"] {{
        padding: 0.45rem 0.65rem !important;
        border-radius: 6px !important;
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        color: #64748B !important;
        cursor: pointer !important;
        transition: background-color 0.12s ease, color 0.12s ease;
        border: 1px solid transparent;
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
        margin: 0 !important;
    }}

    /* Hide circular radio input indicator using exact DOM structure */
    section[data-testid="stSidebar"] label[data-testid="stRadioOption"] > div > div:first-child {{
        display: none !important;
    }}
    section[data-testid="stSidebar"] label[data-testid="stRadioOption"] input[type="radio"] {{
        display: none !important;
    }}

    section[data-testid="stSidebar"] label[data-testid="stRadioOption"]:hover {{
        background-color: #F1F5F9 !important;
        color: #17212B !important;
    }}

    section[data-testid="stSidebar"] label[data-testid="stRadioOption"]:hover * {{
        color: #17212B !important;
    }}

    /* Active navigation item highlight */
    section[data-testid="stSidebar"] label[data-testid="stRadioOption"][data-selected="true"],
    section[data-testid="stSidebar"] div[data-selected="true"] label[data-testid="stRadioOption"] {{
        background-color: #E5F0E8 !important;
        color: #246B53 !important;
        font-weight: 600 !important;
        border-left: 3px solid #246B53 !important;
    }}

    section[data-testid="stSidebar"] label[data-testid="stRadioOption"][data-selected="true"] *,
    section[data-testid="stSidebar"] div[data-selected="true"] label[data-testid="stRadioOption"] * {{
        color: #246B53 !important;
        font-weight: 600 !important;
    }}

    /* Surfaces / Containers */
    .ww-surface {{
        background-color: #FFFFFF;
        border: 1px solid {THEME_COLORS["border"]};
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: none;
        margin-bottom: 1rem;
    }}

    /* KPI Cards - Structured, Clean, No Line-Break Clutter */
    .ww-kpi-card {{
        background: #FFFFFF;
        border: 1px solid {THEME_COLORS["border"]};
        border-radius: 8px;
        padding: 0.95rem 1.15rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }}
    .ww-kpi-label {{
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: {THEME_COLORS["text_secondary"]};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0.35rem;
    }}
    .ww-kpi-val-row {{
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
    }}
    .ww-kpi-val {{
        font-size: 1.75rem;
        font-weight: 700;
        color: {THEME_COLORS["text_primary"]};
        line-height: 1.15;
        letter-spacing: -0.02em;
    }}
    .ww-kpi-unit {{
        font-size: 0.85rem;
        font-weight: 500;
        color: {THEME_COLORS["text_secondary"]};
    }}
    .ww-kpi-meta {{
        font-size: 0.75rem;
        color: {THEME_COLORS["text_secondary"]};
        margin-top: 0.35rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }}

    /* Context Banner */
    .ww-context-banner {{
        background-color: #EEF1F5;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 0.4rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
    }}

    /* Restrained Pills / Badges */
    .ww-pill {{
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1.2;
    }}
    .ww-pill-neutral {{
        background-color: #F1F5F9;
        color: #475569;
        border: 1px solid #E2E8F0;
    }}
    .ww-pill-mint {{
        background-color: {THEME_COLORS["success_bg"]};
        color: {THEME_COLORS["success_text"]};
        border: 1px solid {THEME_COLORS["success_border"]};
    }}
    .ww-pill-amber {{
        background-color: {THEME_COLORS["warning_bg"]};
        color: {THEME_COLORS["warning_text"]};
        border: 1px solid {THEME_COLORS["warning_border"]};
    }}
    .ww-pill-red {{
        background-color: {THEME_COLORS["danger_bg"]};
        color: {THEME_COLORS["danger_text"]};
        border: 1px solid {THEME_COLORS["danger_border"]};
    }}

    /* Callout & Notice Boxes */
    .ww-callout {{
        border-radius: 6px;
        padding: 0.8rem 1rem;
        font-size: 0.82rem;
        line-height: 1.45;
        margin-bottom: 0.85rem;
        border: 1px solid transparent;
    }}
    .ww-callout-info {{
        background-color: #F4F8F5;
        border-color: #D4E5D8;
        border-left: 3px solid {THEME_COLORS["brand_primary"]};
        color: #173C2C;
    }}
    .ww-callout-warning {{
        background-color: {THEME_COLORS["warning_bg"]};
        border-color: {THEME_COLORS["warning_border"]};
        border-left: 3px solid #C48218;
        color: {THEME_COLORS["warning_text"]};
    }}
    .ww-callout-danger {{
        background-color: {THEME_COLORS["danger_bg"]};
        border-color: {THEME_COLORS["danger_border"]};
        border-left: 3px solid #C93B3D;
        color: {THEME_COLORS["danger_text"]};
    }}

    /* Buttons */
    button[kind="primary"] {{
        background-color: {THEME_COLORS["brand_primary"]} !important;
        border-color: {THEME_COLORS["brand_primary"]} !important;
        color: #FFFFFF !important;
        font-weight: 500 !important;
        font-size: 0.84rem !important;
        border-radius: 6px !important;
        padding: 0.45rem 1rem !important;
        box-shadow: none !important;
    }}
    button[kind="primary"]:hover {{
        background-color: #1A4432 !important;
        border-color: #1A4432 !important;
    }}

    button[kind="secondary"] {{
        background-color: #FFFFFF !important;
        border-color: {THEME_COLORS["border"]} !important;
        color: {THEME_COLORS["text_primary"]} !important;
        font-weight: 500 !important;
        font-size: 0.84rem !important;
        border-radius: 6px !important;
        padding: 0.45rem 1rem !important;
        box-shadow: none !important;
    }}
    button[kind="secondary"]:hover {{
        background-color: {THEME_COLORS["page_bg"]} !important;
        border-color: #CBD5CD !important;
    }}

    /* Form Controls */
    div[data-testid="stSelectbox"] > div,
    div[data-testid="stNumberInput"] > div {{
        border-radius: 6px !important;
    }}

    /* Tables */
    div[data-testid="stDataFrame"] {{
        border: 1px solid {THEME_COLORS["border"]} !important;
        border-radius: 6px !important;
    }}

    /* Section Separators */
    .ww-divider {{
        height: 1px;
        background-color: {THEME_COLORS["border_subtle"]};
        margin: 1.5rem 0;
        border: none;
    }}
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)


def render_page_header(title: str, subtitle: str, meta_label: Optional[str] = None):
    """
    Renders a compact, quiet, professional page header without giant decorative heroes.
    """
    meta_html = f'<div class="ww-pill ww-pill-neutral">{meta_label}</div>' if meta_label else ""
    html = f"""
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 0.85rem; border-bottom: 1px solid {THEME_COLORS['border']}; margin-bottom: 0.85rem;">
        <div>
            <h1 style="font-size: 1.6rem; font-weight: 700; color: {THEME_COLORS['text_primary']}; margin: 0 0 0.15rem 0; letter-spacing: -0.02em;">
                {title}
            </h1>
            <p style="font-size: 0.86rem; color: {THEME_COLORS['text_secondary']}; margin: 0; font-weight: 400;">
                {subtitle}
            </p>
        </div>
        {meta_html}
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def render_context_banner(text: str = "DEMONSTRATION ENVIRONMENT · Synthetic data · 180 days"):
    """
    Renders a slim, understated status bar communicating dataset provenance.
    """
    html = f"""
    <div class="ww-context-banner">
        <span>{text}</span>
        <span style="color: {THEME_COLORS['text_secondary']}; font-size: 0.68rem; font-weight: 500;">ADAPPT 5.0 PROTOTYPE</span>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def render_kpi(
    label: str,
    value: str,
    unit: str = "",
    meta: str = "",
    pill_text: Optional[str] = None,
    pill_variant: str = "neutral",
):
    """
    Renders a restrained enterprise KPI card with robust label wrapping prevention.
    Formats HTML as compact single-line string to eliminate Markdown code-block false positives.
    """
    pill_html = f'<span class="ww-pill ww-pill-{pill_variant}">{pill_text}</span>' if pill_text else ""
    unit_html = f' <span class="ww-kpi-unit">{unit}</span>' if unit else ""
    meta_html = f'<div class="ww-kpi-meta">{meta}</div>' if meta else ""

    html = (
        f'<div class="ww-kpi-card">'
        f'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">'
        f'<div class="ww-kpi-label">{label}</div>'
        f'{pill_html}'
        f'</div>'
        f'<div class="ww-kpi-val-row">'
        f'<span class="ww-kpi-val">{value}</span>'
        f'{unit_html}'
        f'</div>'
        f'{meta_html}'
        f'</div>'
    )
    st.markdown(html, unsafe_allow_html=True)


def render_callout(title: str, text: str, variant: str = "info"):
    """
    Renders a quiet operational notice.
    """
    html = f"""
    <div class="ww-callout ww-callout-{variant}">
        <div style="font-weight: 600; font-size: 0.84rem; margin-bottom: 0.15rem;">{title}</div>
        <div style="font-size: 0.8rem; line-height: 1.4;">{text}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def format_plotly_chart(fig: go.Figure, height: int = 300, show_legend: bool = True) -> go.Figure:
    """
    Applies consistent, restrained enterprise styling to Plotly charts.
    Uses subtle gridlines, clean Inter typography, and muted tones.
    """
    fig.update_layout(
        height=height,
        margin=dict(l=15, r=15, t=30, b=20),
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        font=dict(family="Inter, -apple-system, sans-serif", size=11, color=THEME_COLORS["text_secondary"]),
        title_font=dict(family="Inter, sans-serif", size=13, color=THEME_COLORS["text_primary"], weight="bold"),
        hoverlabel=dict(
            bgcolor=THEME_COLORS["text_primary"],
            font_size=11,
            font_family="Inter, sans-serif",
            font_color="#FFFFFF",
            bordercolor=THEME_COLORS["text_primary"],
        ),
        showlegend=show_legend,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=10, color=THEME_COLORS["text_secondary"]),
        ),
        xaxis=dict(
            showgrid=True,
            gridcolor="#EEF1F5",
            linecolor=THEME_COLORS["border"],
            zeroline=False,
            tickfont=dict(size=10, color=THEME_COLORS["text_secondary"]),
        ),
        yaxis=dict(
            showgrid=True,
            gridcolor="#EEF1F5",
            linecolor=THEME_COLORS["border"],
            zeroline=False,
            tickfont=dict(size=10, color=THEME_COLORS["text_secondary"]),
        ),
    )
    return fig
