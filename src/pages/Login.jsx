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
    setLoading(true);

    const result = await login(credentials);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 animate-gradient" />

      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?auto=format&fit=crop&w=1600&q=80')] 
                   bg-cover bg-center opacity-25"
      ></div>

      {/* Main container */}
      <div className="relative z-10 max-w-md w-full p-8 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl 
                      animate-fade-in-up border border-white/20">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl animate-pulse"></div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-wide">
            LenzPay
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            Premium School Fee Management System
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50/90 border border-red-200 rounded-xl p-3 backdrop-blur-md">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-200">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="mt-1 block w-full px-4 py-3 border border-white/30 rounded-xl bg-white/10 
                         text-white placeholder-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500
                         transition duration-200 backdrop-blur-md"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="block w-full px-4 py-3 pr-12 border border-white/30 rounded-xl bg-white/10 
                           text-white placeholder-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500
                           transition duration-200 backdrop-blur-md"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-300" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-300" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white 
                       bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 
                       disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-300 text-sm">
          For International Schools
        </div>
      </div>
    </div>
  );
};

export default Login;
