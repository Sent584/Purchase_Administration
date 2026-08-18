export interface HomeKpi {
  key: string;
  label: string;
  value: string;
  sub?: string | null;
  tone: string;
}

export interface HomeSeriesPoint {
  label: string;
  value: number;
}

export interface HomeAction {
  title: string;
  detail: string;
  href: string;
  urgency: string;
  badge: string;
}

export interface HomeInsight {
  title: string;
  description: string;
  icon: string;
}

export interface HomeQuickLink {
  to: string;
  label: string;
  hint: string;
}

export interface RoleHomeDashboard {
  role_code: string;
  role_label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  greeting_name: string;
  kpis: HomeKpi[];
  series_title: string;
  series_unit: string;
  series: HomeSeriesPoint[];
  actions: HomeAction[];
  insights: HomeInsight[];
  quick_links: HomeQuickLink[];
  highlight_label?: string | null;
  highlight_value?: string | null;
  highlight_hint?: string | null;
}
