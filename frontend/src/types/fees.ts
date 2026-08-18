export interface NamedAmount {
  name: string;
  amount: number;
  count: number;
}

export interface FeeLine {
  payment_status: string;
  total_amount: number;
  type_name: string;
  category: string;
  due_date: string;
  programme: string;
  year: string;
  payment_on: string;
  due_bucket: string;
  campus?: string | null;
  division?: string | null;
  department?: string | null;
  batch?: string | null;
}

export interface FeesOverview {
  as_of: string;
  line_count: number;
  total_pending: number;
  overdue_amount: number;
  due_soon_amount: number;
  upcoming_amount: number;
  programmes: number;
  fee_categories: number;
  student_count: number;
  by_category: NamedAmount[];
  by_programme: NamedAmount[];
  by_year: NamedAmount[];
  by_due_bucket: NamedAmount[];
  by_campus: NamedAmount[];
  by_division: NamedAmount[];
  by_department: NamedAmount[];
  by_batch: NamedAmount[];
  top_lines: FeeLine[];
}

export interface StudentFeeSummary {
  student_id: string;
  student_name: string;
  campus: string;
  division: string;
  department: string;
  batch: string;
  programme: string;
  year: string;
  pending_amount: number;
  line_count: number;
}

export interface StudentFeeLine {
  type_name: string;
  category: string;
  due_date: string;
  due_bucket: string;
  total_amount: number;
  payment_status: string;
}

export interface StudentFeeDetail {
  student_id: string;
  student_name: string;
  campus: string;
  division: string;
  department: string;
  batch: string;
  programme: string;
  year: string;
  pending_amount: number;
  lines: StudentFeeLine[];
}
