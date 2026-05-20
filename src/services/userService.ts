import { ref, get, set, update, onValue, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { User, UserStatus } from '../types';

function fbKey(email: string) {
  return (email || '').toLowerCase()
    .replace(/\./g, '_DOT_')
    .replace(/@/g, '_AT_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
}

export const userService = {
  async getUser(email: string): Promise<User | null> {
    try {
      const key = fbKey(email || '');
      const snapshot = await get(ref(db, `users/${key}`));
      return snapshot.exists() ? snapshot.val() as User : null;
    } catch (error) {
      console.error("RealtimeDB GetUser Error:", error);
      return null;
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      const email = (user.email || '').toLowerCase().trim();
      const key = fbKey(email);
      await set(ref(db, `users/${key}`), {
        ...user,
        email
      });
    } catch (error) {
      console.error("RealtimeDB SaveUser Error:", error);
      throw error;
    }
  },

  async updateStatus(email: string, status: UserStatus): Promise<void> {
    try {
      const key = fbKey(email);
      await update(ref(db, `users/${key}`), {
        status,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("RealtimeDB UpdateStatus Error:", error);
      throw error;
    }
  },

  async deleteUser(email: string): Promise<void> {
    try {
      const key = fbKey(email);
      await remove(ref(db, `users/${key}`));
    } catch (error) {
      console.error("RealtimeDB DeleteUser Error:", error);
      throw error;
    }
  },

  subscribeToUsers(callback: (users: User[]) => void) {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users: User[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          users.push(child.val() as User);
        });
      }
      callback(users);
    }, (error) => {
      console.error("RealtimeDB Subscription Error:", error);
    });
    
    // In RealtimeDB, onValue returns a function to unsubscribe when called, but let's make sure it's correct
    return () => {
       // Realtime Database unsubscribe is done by passing the ref to off() or calling the returned function from onValue.
       // In modern SDKs, the return of onValue is the unsubscribe function.
       unsubscribe();
    };
  }
};
