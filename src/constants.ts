import { AttendanceSubject } from "./types";

export const SUBJECTS: Omit<AttendanceSubject, 'status'>[] = [
  { name: 'Data Structure using C', code: 'DSC-2' },
  { name: 'Business Communication', code: 'MIN-2' },
  { name: 'Financial Institution & Services', code: 'MDC-2' },
  { name: 'Introduction to Database', code: 'SEC-2' },
  { name: 'Understanding India-II', code: 'VAC-2' },
  { name: 'English', code: 'AEC-2' },
  { name: 'Advance Excel', code: 'AE-1' },
  { name: 'Mathematics', code: 'MATH-1' },
  { name: 'Web Technology', code: 'WT-1' },
  { name: 'Mentor Session', code: 'MENT-1' }
];

export const ADMIN_PASS = '100';
