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


