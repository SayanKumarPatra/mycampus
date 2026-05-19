import { User, AttendanceData, AttendanceRecord, AttendanceConfig } from "../types";

export const attendanceService = {
  getAttendance(userId: string): AttendanceData {
    const data = localStorage.getItem(`eiilm_att_${userId}`);
    return data ? JSON.parse(data) : { records: [] };
  },

  saveAttendance(userId: string, record: AttendanceRecord): void {
    const data = this.getAttendance(userId);
    const index = data.records.findIndex(r => r.date === record.date);
    if (index !== -1) {
      data.records[index] = record;
    } else {
      data.records.push(record);
    }
    localStorage.setItem(`eiilm_att_${userId}`, JSON.stringify(data));
  },

  getGlobalConfig(): AttendanceConfig {
    const data = localStorage.getItem('eiilm_global_att_config');
    return data ? JSON.parse(data) : { subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] };
  },

  saveGlobalConfig(config: AttendanceConfig): void {
    localStorage.setItem('eiilm_global_att_config', JSON.stringify(config));
  }
};
