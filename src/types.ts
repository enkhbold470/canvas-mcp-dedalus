/**
 * Type definitions for Canvas and Gradescope MCP Server
 * Centralized type definitions following Dedalus Labs structure
 */

// ============ Canvas Types ============

export interface Course {
  id: number;
  name: string;
  course_code?: string;
  workflow_state?: string;
}

export interface Module {
  id: number;
  name: string;
  position?: number;
  unlock_at?: string;
  require_sequential_progress?: boolean;
  publish_final_grade?: boolean;
  prerequisite_module_ids?: number[];
  state?: string;
  completed_at?: string;
  items_count?: number;
  items_url?: string;
}

export interface ModuleItem {
  id: number;
  title: string;
  position?: number;
  indent?: number;
  type?: string;
  module_id?: number;
  html_url?: string;
  content_id?: number;
  page_url?: string;
  external_url?: string;
  new_tab?: boolean;
  completion_requirement?: any;
  published?: boolean;
  // Enhanced fields for file content
  file_url?: string;
  file_meta?: {
    display_name?: string;
    filename?: string;
    size?: number;
    content_type?: string;
  };
  file_content_text?: string;
  file_content_base64?: string;
  file_content_type?: string;
  file_content_size?: number;
  file_content_truncated?: boolean;
  is_public_link?: boolean;
}

export interface Assignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  has_submitted_submissions?: boolean;
  points_possible?: number;
  submission_types?: string[];
  workflow_state?: string;
}

export interface FileData {
  id: number;
  display_name?: string;
  filename?: string;
  size?: number;
  'content-type'?: string;
  content_type?: string;
  url?: string;
  download_url?: string;
}

// ============ Gradescope Types ============

export interface GradescopeCourse {
  id: string;
  name: string;
  full_name: string;
  semester: string;
  year: string;
  num_grades_published: string | null;
  num_assignments: string;
}

export interface GradescopeAssignment {
  assignment_id: string;
  name: string;
  release_date: Date | null;
  due_date: Date | null;
  late_due_date: Date | null;
  submissions_status: string | null;
  grade: number | null;
  max_grade: number | null;
}

export interface GradescopeMember {
  full_name: string;
  first_name: string;
  last_name: string;
  sid: string;
  email: string;
  role: string;
  user_id: string | null;
  num_submissions: number;
  sections: string;
  course_id: string;
}

export interface GradescopeQueryAnalysis {
  type: 'get_courses' | 'get_assignments' | 'get_submission' | null;
  course_id?: string;
  course_name?: string;
  assignment_id?: string;
  assignment_name?: string;
  student_email?: string;
  confidence: number;
}

// ============ Tool Argument Types ============

export interface GetCoursesArgs {}

export interface GetModulesArgs {
  course_id: string;
}

export interface GetModuleItemsArgs {
  course_id: string;
  module_id: string;
}

export interface GetFileUrlArgs {
  course_id: string;
  file_id: string;
}

export interface GetCourseAssignmentsArgs {
  course_id: string;
  bucket?: string;
}

export interface GetAssignmentsByNameArgs {
  course_name: string;
  bucket?: string;
}

export interface GetGradescopeCoursesArgs {}

export interface GetGradescopeCourseByNameArgs {
  course_name: string;
}

export interface GetGradescopeAssignmentsArgs {
  course_id: string;
}

export interface GetGradescopeAssignmentByNameArgs {
  course_id: string;
  assignment_name: string;
}
