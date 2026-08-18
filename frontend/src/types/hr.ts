export type EmployeeCategory = 'teaching' | 'non_teaching';
export type EmploymentType =
  | 'permanent'
  | 'probation'
  | 'contract'
  | 'temporary'
  | 'visiting'
  | 'adjunct'
  | 'consultant'
  | 'outsourced'
  | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'relieved' | 'retired' | 'terminated';
export type FacultyRank =
  | 'professor'
  | 'associate_professor'
  | 'assistant_professor'
  | 'lecturer'
  | 'guest_faculty';
export type DoctoralStatus = 'phd_awarded' | 'phd_pursuing' | 'not_applicable';

export interface EmployeeOut {
  id: string;
  employee_code: string;
  institution_id: string;
  campus_id: string;
  campus_name: string;
  division_id: string | null;
  division_name: string;
  department_id: string;
  department_name: string;
  title: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  gender: string;
  date_of_birth: string | null;
  official_email: string;
  personal_email: string | null;
  mobile: string;
  employee_category: EmployeeCategory;
  employment_type: EmploymentType;
  designation: string;
  designation_code: string;
  grade: string;
  pay_level: string;
  date_of_joining: string | null;
  confirmation_date: string | null;
  retirement_date: string | null;
  reporting_manager_name: string;
  reporting_manager_id: string | null;
  pan: string;
  uan: string;
  epf_number: string;
  esi_number: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_name: string;
  faculty_rank: FacultyRank | null;
  doctoral_status: DoctoralStatus | null;
  specialisation: string;
  subjects: string[];
  workload_hours: number | null;
  status: EmployeeStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreateInput {
  institution_id: string;
  campus_id: string;
  division_id?: string | null;
  department_id: string;
  department_name: string;
  title: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  official_email: string;
  mobile: string;
  employee_category: EmployeeCategory;
  employment_type: EmploymentType;
  designation: string;
  designation_code: string;
  grade: string;
  pay_level: string;
  date_of_joining: string | null;
  pan: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_name: string;
  faculty_rank: FacultyRank | null;
  doctoral_status: DoctoralStatus | null;
  specialisation: string;
  subjects: string[];
  workload_hours: number | null;
}


export interface DesignationOut {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  category: EmployeeCategory;
  grade: string;
  pay_level: string;
  retirement_age: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignationCreateInput {
  institution_id: string;
  name: string;
  code: string;
  category: EmployeeCategory;
  grade: string;
  pay_level: string;
  retirement_age: number;
}

export interface HrDashboard {
  total_employees: number;
  active_count: number;
  teaching_count: number;
  non_teaching_count: number;
  on_probation: number;
  on_leave: number;
  new_joiners_90d: number;
  probation_ending_30d: number;
  by_category: { category: string; count: number }[];
  by_department: { department_name: string; count: number }[];
}
