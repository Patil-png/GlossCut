import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(''); // NEW: OTP State
  const [error, setError] = useState('');
  const [step, setStep] = useState('login'); // 'login' or '2fa'
  const [adminId, setAdminId] = useState(null); // To store ID for Step 2
  const { login, verify2FA } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 'login') {
      const result = await login(email, password);

      if (result.requiresTwoFactor) {
        setStep('2fa');
        setAdminId(result.adminId);
        setError('');
      } else if (result.success) {
        // Logged in successfully (No 2FA)
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } else {
      // Step 2: Verify OTP
      const result = await verify2FA(adminId, otp);
      if (result.success) {
        // Logged in
      } else {
        setError(result.error || 'Invalid Code');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-white font-bold">S</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'login' ? 'SetKarr Admin' : 'Two-Factor Authentication'}
          </h2>
          <p className="text-gray-600">
            {step === 'login' ? 'Sign in to access the admin panel' : 'Enter the code from your authenticator app'}
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white py-8 px-6 shadow-xl rounded-lg" onSubmit={handleSubmit}>

          {step === 'login' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-200"
                  placeholder="admin@setkarr.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center tracking-[0.5em] text-xl font-mono"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              {step === 'login' ? 'Sign In' : 'Verify Code'}
            </button>
          </div>

          {step === 'login' && (
            <div className="text-center text-sm text-gray-600">
              <p>Default credentials:</p>
              <p className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                superadmin@setkarr.com / superadmin123
              </p>
            </div>
          )}

          {step === '2fa' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('login'); setError(''); setEmail(''); setPassword(''); }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Back to Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
