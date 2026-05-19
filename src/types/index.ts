export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  roll: string;
  email: string;
  department: string;
  semester: string;
  phone: string;
  photo: string | null;
  passwordHash: string;
  plainPassword?: string;
  status: UserStatus;
  registeredAt: number;
}

export interface AttendanceSubject {
  name: string;
  code: string;
  status: 'present' | 'absent' | 'not-marked';
}

export interface AttendanceRecord {
  date: string;
  subjects: AttendanceSubject[];
  savedAt: number;
}

export interface AttendanceData {
  records: AttendanceRecord[];
}

export interface SubjectConfig {
  code: string;
  totalClasses: number;
}

export interface StudyMaterial {
  id: string;
  subjectCode: string;
  title: string;
  driveLink: string;
  uploadedAt: number;
}

export interface ResultLink {
  id: string;
  title: string;
  link: string;
  publishedAt: number;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  tag: string;
  type: 'info' | 'critical' | 'warning';
  publishedAt: number;
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  subjects: string[];
  email: string;
  phone: string;
  image: string;
  addedAt: number;
}

export interface RoutineItem {
  id: string;
  day: string;
  time: string;
  subj: string;
  room: string;
  prof: string;
  isBreak?: boolean;
}

export interface AttendanceConfig {
  subjects: SubjectConfig[];
  materials: StudyMaterial[];
  results: ResultLink[];
  notices: Notice[];
  routine: RoutineItem[];
  faculties: FacultyMember[];
}
