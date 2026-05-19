import { ref, get, set, update, onValue, off, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { User, UserStatus } from '../types';

function fbKey(email: string) {
  return email.toLowerCase()
    .replace(/\./g, '_DOT_')
    .replace(/@/g, '_AT_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
}

export const userService = {
  async getUser(email: string): Promise<User | null> {
    const key = fbKey(email);
    const snapshot = await get(ref(db, `eiilm_users/${key}`));
    return snapshot.exists() ? snapshot.val() as User : null;
  },

  async saveUser(user: User): Promise<void> {
    const key = fbKey(user.email);
    await set(ref(db, `eiilm_users/${key}`), user);
  },

  async updateStatus(email: string, status: UserStatus): Promise<void> {
    const key = fbKey(email);
    console.log(`Updating user ${email} (${key}) to status: ${status}`);
    await update(ref(db, `eiilm_users/${key}`), {
      status,
      updatedAt: Date.now()
    });
  },

  async deleteUser(email: string): Promise<void> {
    const key = fbKey(email);
    await remove(ref(db, `eiilm_users/${key}`));
    console.log(`User ${email} deleted from database.`);
  },

  subscribeToUsers(callback: (users: User[]) => void) {
    const usersRef = ref(db, 'eiilm_users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users: User[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          users.push(child.val() as User);
        });
      }
      callback(users);
    }, (error) => {
      console.error("Firebase Database Error:", error);
    });
    return unsubscribe;
  }
};
