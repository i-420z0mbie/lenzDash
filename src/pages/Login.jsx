// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      const result = await login(credentials);

      if (result?.success) {
        navigate('/');
      } else {
        setError(result?.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background image with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?auto=format&fit=crop&w=1600&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-700/80 via-primary-800/80 to-primary-900/80 animate-gradient" />

      {/* Decorative floating circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Glassmorphic login card */}
      <div className="relative z-10 max-w-md w-full mx-4 p-6 sm:p-8 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-primary-900/20 border border-white/20 animate-fade-in-up">
        {/* Logo & Brand Section */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur-xl opacity-60"></div>
            <div className="relative mx-auto w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/30">
              <img 
                src="/lenz-icon.png" 
                alt="LenzPay Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h2 className="mt-5 text-3xl font-extrabold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
            LenzPay
          </h2>
          <p className="mt-2 text-sm text-primary-100 font-medium tracking-wide">
            Premium School Fee Management System
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-3 animate-shake">
              <p className="text-sm text-red-100 text-center">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-primary-100 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="mt-1 block w-full px-4 py-3 border border-white/30 rounded-xl bg-white/10 
                         text-white placeholder-primary-200/70 shadow-sm focus:ring-2 focus:ring-primary-400 
                         focus:border-transparent transition-all duration-200 backdrop-blur-md outline-none"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-primary-100 mb-1">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="block w-full px-4 py-3 pr-12 border border-white/30 rounded-xl bg-white/10 
                           text-white placeholder-primary-200/70 shadow-sm focus:ring-2 focus:ring-primary-400 
                           focus:border-transparent transition-all duration-200 backdrop-blur-md outline-none"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-primary-200 hover:text-white transition" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-primary-200 hover:text-white transition" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white 
                       bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 
                       disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary-500/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-primary-200 text-xs font-medium tracking-wider">
            © 2025 LenzPay • Secure School Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;