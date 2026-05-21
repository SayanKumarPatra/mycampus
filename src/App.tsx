/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Pending from './components/auth/Pending';
import Dashboard from './components/dashboard/Dashboard';
import AdminPanel from './components/admin/AdminPanel';
import { userService } from './services/userService';
import { AppPreloader } from './components/dashboard/Preloaders';
import PWAInstallBanner from './components/pwa/PWAInstallBanner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'pending' | 'dashboard' | 'admin'>('login');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const savedSess = localStorage.getItem('eiilm_sess');
    if (savedSess) {
      const parsed = JSON.parse(savedSess) as User;
      checkUserStatus(parsed);
    }
  }, []);

  const checkUserStatus = async (currentUser: User) => {
    const freshUser = await userService.getUser(currentUser.email);
    if (freshUser) {
      localStorage.setItem('eiilm_sess', JSON.stringify(freshUser));
      setUser(freshUser);
      if (freshUser.status === 'approved') {
        setView('dashboard');
      } else if (freshUser.status === 'pending') {
        setView('pending');
      } else {
        setView('login');
        localStorage.removeItem('eiilm_sess');
      }
    } else {
      setView('login');
      localStorage.removeItem('eiilm_sess');
    }
  };

  // Real-time synchronization of the current user's profile and status from Firebase
  useEffect(() => {
    if (!user || !user.email) return;
    
    const unsubscribe = userService.subscribeToUser(user.email, (freshUser) => {
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('eiilm_sess', JSON.stringify(freshUser));
        
        // Handle view routing based on status in real-time
        if (freshUser.status === 'approved') {
          setView('dashboard');
        } else if (freshUser.status === 'pending') {
          setView('pending');
        } else {
          setView('login');
          localStorage.removeItem('eiilm_sess');
          setUser(null);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.email]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('eiilm_sess', JSON.stringify(u));
    if (u.status === 'approved') setView('dashboard');
    else setView('pending');
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    localStorage.removeItem('eiilm_sess');
  };

  if (isInitialLoading) {
    return <AppPreloader onComplete={() => setIsInitialLoading(false)} />;
  }

  if (isAdminOpen) {
    return <AdminPanel onClose={() => setIsAdminOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      {view === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setView('register')} 
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      )}
      {view === 'register' && (
        <Register 
          onRegistered={(u) => {
            setUser(u);
            localStorage.setItem('eiilm_sess', JSON.stringify(u));
            setView('pending');
          }} 
          onSwitchToLogin={() => setView('login')} 
        />
      )}
      {view === 'pending' && user && (
        <Pending 
          user={user} 
          onApproved={(u) => {
            setUser(u);
            setView('dashboard');
          }}
          onLogout={handleLogout}
        />
      )}
      {view === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onUserUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('eiilm_sess', JSON.stringify(updatedUser));
          }}
        />
      )}
      <PWAInstallBanner />
    </div>
  );
}
