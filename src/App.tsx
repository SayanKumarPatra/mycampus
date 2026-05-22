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
    } else {
      setIsInitialLoading(false);
    }
  }, []);

  const checkUserStatus = async (currentUser: User) => {
    try {
      const freshUser = await userService.getUser(currentUser.email);
      if (freshUser) {
        localStorage.setItem('eiilm_sess', JSON.stringify(freshUser));
        setUser(freshUser);
        if (freshUser.status === 'approved') {
          setView('dashboard');
          if (!window.location.hash || window.location.hash === '#login' || window.location.hash === '#register') {
            window.location.hash = 'home';
          }
        } else if (freshUser.status === 'pending') {
          setView('pending');
          window.location.hash = 'pending';
        } else {
          setView('login');
          window.location.hash = 'login';
          localStorage.removeItem('eiilm_sess');
        }
      } else {
        setView('login');
        window.location.hash = 'login';
        localStorage.removeItem('eiilm_sess');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Synchronize state with URL hash (Routing mechanism)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash === '#admin') {
        setIsAdminOpen(true);
        return;
      } else {
        setIsAdminOpen(false);
      }

      if (hash === '#register') {
        if (!user) {
          setView('register');
        } else {
          window.location.hash = 'home';
        }
        return;
      }

      if (hash === '#pending') {
        setView('pending');
        return;
      }

      if (hash === '#login') {
        if (user) {
          if (user.status === 'approved') {
            window.location.hash = 'home';
          } else {
            window.location.hash = 'pending';
          }
        } else {
          setView('login');
        }
        return;
      }

      // If it is a valid dashboard sub-page hash (or with chatbot /support endpoint)
      const validDashboardHashes = ['#home', '#attendance', '#notes', '#results', '#faculty', '#profile', '#notices', '#routine'];
      const baseHash = hash.split('/')[0].split('?')[0];

      if (validDashboardHashes.includes(baseHash)) {
        if (user) {
          if (user.status === 'approved') {
            setView('dashboard');
          } else {
            setView('pending');
            window.location.hash = 'pending';
          }
        } else {
          setView('login');
          window.location.hash = 'login';
        }
      } else if (!hash) {
        // Redirection depending on auth status
        if (user) {
          if (user.status === 'approved') {
            window.location.hash = 'home';
          } else {
            window.location.hash = 'pending';
          }
        } else {
          window.location.hash = 'login';
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial sync
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [user]);

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
          window.location.hash = 'pending';
        } else {
          setView('login');
          window.location.hash = 'login';
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
    if (u.status === 'approved') {
      setView('dashboard');
      window.location.hash = 'home';
    } else {
      setView('pending');
      window.location.hash = 'pending';
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    localStorage.removeItem('eiilm_sess');
    window.location.hash = 'login';
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
    </div>
  );
}
