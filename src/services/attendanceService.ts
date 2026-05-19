import { ref, get, set, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { AttendanceData, AttendanceRecord, AttendanceConfig } from "../types";

export const attendanceService = {
  async getAttendance(userId: string): Promise<AttendanceData> {
    try {
      const attRef = ref(db, `attendance/${userId}`);
      const snapshot = await get(attRef);
      return snapshot.exists() ? snapshot.val() as AttendanceData : { records: [] };
    } catch (error) {
      console.error("RealtimeDB GetAttendance Error:", error);
      return { records: [] };
    }
  },

  async saveAttendance(userId: string, record: AttendanceRecord): Promise<void> {
    try {
      const current = await this.getAttendance(userId);
      const index = current.records.findIndex(r => r.date === record.date);
      if (index !== -1) {
        current.records[index] = record;
      } else {
        current.records.push(record);
      }
      const attRef = ref(db, `attendance/${userId}`);
      await set(attRef, current);
    } catch (error) {
      console.error("RealtimeDB SaveAttendance Error:", error);
      throw error;
    }
  },

  async getGlobalConfig(): Promise<AttendanceConfig> {
    try {
      const configRef = ref(db, 'configs/attendance');
      const snapshot = await get(configRef);
      return snapshot.exists() ? snapshot.val() as AttendanceConfig : { subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] };
    } catch (error) {
      console.error("RealtimeDB GetGlobalConfig Error:", error);
      return { subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] };
    }
  },

  async saveGlobalConfig(config: AttendanceConfig): Promise<void> {
    try {
      const configRef = ref(db, 'configs/attendance');
      await set(configRef, config);
    } catch (error) {
      console.error("RealtimeDB SaveGlobalConfig Error:", error);
      throw error;
    }
  },

  async getPunchData(userId: string, date: string): Promise<{in: string | null, out: string | null}> {
    try {
      const punchRef = ref(db, `users/${userId}/punches/${date}`);
      const snapshot = await get(punchRef);
      return snapshot.exists() ? snapshot.val() as {in: string | null, out: string | null} : { in: null, out: null };
    } catch (error) {
      console.error("RealtimeDB GetPunch Error:", error);
      return { in: null, out: null };
    }
  },

  async savePunchData(userId: string, date: string, times: {in: string | null, out: string | null}): Promise<void> {
    try {
      const punchRef = ref(db, `users/${userId}/punches/${date}`);
      await set(punchRef, times);
    } catch (error) {
      console.error("RealtimeDB SavePunch Error:", error);
      throw error;
    }
  },

  subscribeToGlobalConfig(callback: (config: AttendanceConfig) => void) {
    const configRef = ref(db, 'configs/attendance');
    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as AttendanceConfig);
      } else {
        callback({ subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] });
      }
    }, (error) => {
      console.error("RealtimeDB Config Subscription Error:", error);
    });
    return () => {
      unsubscribe();
    };
  }
};
