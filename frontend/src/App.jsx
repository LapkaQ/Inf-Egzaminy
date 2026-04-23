import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Tutors from './pages/Tutors';
import TutorDetails from './pages/TutorDetails';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Strony publiczne – dostępne dla wszystkich */}
            <Route index element={<Home />} />
            <Route path="tutors" element={<Tutors />} />
            <Route path="tutors/:id" element={<TutorDetails />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />

            {/* Weryfikacja email i reset hasła — dostępne publicznie */}
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            {/* Tylko dla niezalogowanych */}
            <Route element={<PublicRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Tylko dla zalogowanych */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
