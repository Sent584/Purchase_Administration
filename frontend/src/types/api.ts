export interface ChallengeResponse {
  challenge_id: string;
  masked_destination: string;
  expires_in_seconds: number;
  resend_cooldown_seconds: number;
}

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  group_id: string | null;
  institution_id: string | null;
  campus_id: string | null;
  department_id: string | null;
  role_codes: string[];
  permissions: string[];
  login_method: 'password_otp' | 'otp_only';
  must_change_password: boolean;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserSummary;
}

export function isTokenResponse(res: ChallengeResponse | TokenResponse): res is TokenResponse {
  return 'access_token' in res;
}

export interface SessionOut {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

export interface GroupOut {
  id: string;
  legal_name: string;
  trade_name: string;
  org_code: string;
  org_type: string;
  registration_number: string;
  registration_date: string | null;
  pan: string;
  tan: string;
  gstins: string[];
  address: Address;
  website: string;
  established_date: string | null;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface InstitutionOut {
  id: string;
  group_id: string;
  code: string;
  name: string;
  short_name: string;
  institution_type: string;
  university_affiliation: string;
  autonomous_status: boolean;
  aicte_approved: boolean;
  ugc_recognized: boolean;
  naac_grade: string;
  naac_cycle: string;
  nba_programmes: string[];
  establishment_date: string | null;
  principal_name: string;
  address: Address;
  gstin: string;
  pan: string;
  tan: string;
  website: string;
  logo_url: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CampusContacts {
  head: string;
  admin_officer: string;
  finance_officer: string;
  hr_officer: string;
  purchase_officer: string;
  stores_officer: string;
}

export interface CampusOut {
  id: string;
  institution_id: string;
  group_id: string;
  code: string;
  name: string;
  campus_type: string;
  address: Address;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_fence_radius_m: number | null;
  contacts: CampusContacts;
  working_days: string[];
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export type OrgUnitType =
  | 'college'
  | 'school'
  | 'faculty'
  | 'directorate'
  | 'division'
  | 'department'
  | 'centre'
  | 'cell'
  | 'section'
  | 'unit'
  | 'office'
  | 'laboratory'
  | 'library'
  | 'hostel'
  | 'store'
  | 'project'
  | 'committee'
  | 'cost_centre';

export interface OrgUnitOut {
  id: string;
  campus_id: string;
  institution_id: string;
  group_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  unit_type: OrgUnitType;
  is_academic: boolean;
  head_name: string;
  head_email: string | null;
  cost_centre_code: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_digit: boolean;
  require_special: boolean;
  history_count: number;
  expiry_days: number;
}

export interface OtpPolicy {
  length: number;
  validity_minutes: number;
  resend_cooldown_seconds: number;
  max_attempts: number;
  max_resends: number;
  lockout_duration_minutes: number;
}

export interface DocumentNumberingRule {
  prefix: string;
  use_financial_year: boolean;
  padding: number;
  separator: string;
}

export interface GlobalConfigOut {
  id: string;
  app_name: string;
  org_short_name: string;
  default_language: string;
  additional_languages: string[];
  default_country: string;
  default_state: string;
  default_currency: string;
  financial_year_start_month: number;
  academic_year_start_month: number;
  date_format: string;
  time_format: string;
  timezone: string;
  number_format: string;
  decimal_precision: number;
  default_email_domain: string;
  website: string;
  helpdesk_email: string;
  helpdesk_phone: string;
  privacy_policy_url: string;
  terms_url: string;
  data_retention_years: number;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_otp_on_login: boolean;
  max_upload_size_mb: number;
  allowed_file_types: string[];
  password_policy: PasswordPolicy;
  otp_policy: OtpPolicy;
  document_numbering: Record<string, DocumentNumberingRule>;
  version: number;
  effective_from: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RoleOut {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  scope_type: 'group' | 'institution' | 'campus' | 'department';
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: string;
}
