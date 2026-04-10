import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import { TutorDashboard } from './TutorDashboard';
import { AdminDashboard } from './AdminDashboard';

/**
 * Router komponent — dashboard wg roli (admin / korepetytor / uczeń).
 */
export const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'tutor') return <TutorDashboard />;
  return <StudentDashboard />;
};

export default Dashboard;
