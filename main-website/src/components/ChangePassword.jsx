import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ChangePassword = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: New Password
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/password/forgot`, { email: user.email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/password/verify`, {
        email: user.email,
        otp: otpCode
      });
      setStep(3);
    } catch (err) {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const otpCode = otp.join('');
    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/password/reset`, {
        email: user.email,
        otp: otpCode,
        password: newPassword
      });
      alert('Password changed successfully');
      setStep(1);
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden font-sans text-slate-200">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 mt-10 md:mt-16">
        <div className="mb-10 text-center animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
            Change <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Password</span>
          </h1>
          <p className="text-slate-400">Secure your account with a new password</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Verify Your Identity</h3>
                <p className="text-slate-400 text-sm">We'll send a verification code to your email</p>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all border border-indigo-500/50 flex items-center justify-center gap-2 hover:border-indigo-400 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Enter Verification Code</h3>
                <p className="text-slate-400 text-sm">Check your email for the 6-digit code</p>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    className="w-12 h-12 bg-slate-800 border border-white/10 rounded-lg text-center text-white text-lg font-bold focus:border-indigo-400 focus:outline-none"
                    maxLength={1}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all border border-indigo-500/50 flex items-center justify-center gap-2 hover:border-indigo-400 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Set New Password</h3>
                <p className="text-slate-400 text-sm">Choose a strong password for your account</p>
              </div>

              <div className="space-y-4 mb-6">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
                >
                  Back
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all border border-indigo-500/50 flex items-center justify-center gap-2 hover:border-indigo-400 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
