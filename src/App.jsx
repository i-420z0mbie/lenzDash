// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import FeeManagement from './pages/FeeManagement'
import PaymentManagement from './pages/PaymentManagement'
import StudentsPage from './pages/StudentsPage';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ClassesPage from './pages/ClassesPage';



const Payments = () => (
  <div className="p-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Tracking</h1>
      <p className="text-gray-600">Detailed payment tracking coming soon...</p>
    </div>
  </div>
);

const Reports = () => (
  <div className="p-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
      <p className="text-gray-600">Advanced reporting coming soon...</p>
    </div>
  </div>
);

//const Settings = () => (
  <div className="p-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">School Settings</h1>
      <p className="text-gray-600">School configuration coming soon...</p>
    </div>
  </div>
//);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Main Dashboard - Comprehensive Overview */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Future expansion routes - currently placeholders */}
            <Route path="/students" element={
              <ProtectedRoute>
                <Layout>
                  <StudentsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/fees" element={
              <ProtectedRoute>
                <Layout>
                  <FeeManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/payments" element={
              <ProtectedRoute>
                <Layout>
                  <PaymentManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />


            <Route path="/classes" element={
              <ProtectedRoute>
                <Layout>
                  <ClassesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route - redirect to main dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;