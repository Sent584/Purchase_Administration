"""Role home dashboard response contracts."""

from pydantic import BaseModel, Field


class HomeKpi(BaseModel):
    key: str
    label: str
    value: str
    sub: str | None = None
    tone: str = "crimson"


class HomeSeriesPoint(BaseModel):
    label: str
    value: float


class HomeAction(BaseModel):
    title: str
    detail: str
    href: str
    urgency: str = "medium"
    badge: str = ""


class HomeInsight(BaseModel):
    title: str
    description: str
    icon: str = "chart"


class HomeQuickLink(BaseModel):
    to: str
    label: str
    hint: str


class RoleHomeDashboard(BaseModel):
    role_code: str
    role_label: str
    eyebrow: str
    title: str
    subtitle: str
    greeting_name: str
    kpis: list[HomeKpi] = Field(default_factory=list)
    series_title: str = "Analytics"
    series_unit: str = ""
    series: list[HomeSeriesPoint] = Field(default_factory=list)
    actions: list[HomeAction] = Field(default_factory=list)
    insights: list[HomeInsight] = Field(default_factory=list)
    quick_links: list[HomeQuickLink] = Field(default_factory=list)
    highlight_label: str | None = None
    highlight_value: str | None = None
    highlight_hint: str | None = None
