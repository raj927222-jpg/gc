import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Lock,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  authenticateUser,
  registerUser,
  findRegisteredUser,
  resetUserPassword,
  toUserAccount,
  registerOrLoginGoogleUser,
} from '../utils/authStorage';
import {
  sendBackendOtp,
  verifyBackendOtp,
  resendBackendOtp,
} from '../utils/otpApi';
import { getSupabase } from '../utils/supabaseClient';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      fill="#4285F4"
    />
    <path
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      fill="#34A853"
    />
    <path
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
      fill="#FBBC05"
    />
    <path
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      fill="#EA4335"
    />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  currentUser?: UserAccount;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');

  // Login form state
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Login OTP state
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpDigits, setLoginOtpDigits] = useState(['', '', '', '', '', '']);
  const [loginTimerSeconds, setLoginTimerSeconds] = useState(0);
  const [loginDevOtp, setLoginDevOtp] = useState<string | undefined>();
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Signup / Register form state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Google Login state & modal
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [forgotDevOtp, setForgotDevOtp] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNotRegisteredError, setIsNotRegisteredError] = useState(false);
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);

  // Reset errors when switching tabs
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsNotRegisteredError(false);
    setIsAlreadyRegisteredError(false);
  }, [tab, loginMethod]);

  // Timer countdown for forgot password
  useEffect(() => {
    let interval: any;
    if (forgotStep === 3 && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((t) => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [forgotStep, timerSeconds]);

  // Timer countdown for login OTP
  useEffect(() => {
    let interval: any;
    if (loginOtpSent && loginTimerSeconds > 0) {
      interval = setInterval(() => setLoginTimerSeconds((t) => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [loginOtpSent, loginTimerSeconds]);

  if (!isOpen) return null;

  // Google Login Execution
  const handleExecuteGoogleLogin = (selectedEmail?: string, selectedName?: string) => {
    setIsGoogleLoading(true);
    setErrorMessage('');

    const targetEmail = selectedEmail || customGoogleEmail.trim() || 'raj927222@gmail.com';
    const targetName = selectedName || customGoogleName.trim() || 'Raj Patel';

    setTimeout(() => {
      try {
        const result = registerOrLoginGoogleUser({
          email: targetEmail,
          name: targetName,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
        });

        setIsGoogleLoading(false);
        setShowGooglePicker(false);

        if (result.success && result.user) {
          onLoginSuccess(toUserAccount(result.user));
          onClose();
        } else {
          setErrorMessage('Google authentication could not be completed.');
        }
      } catch (err: any) {
        setIsGoogleLoading(false);
        setShowGooglePicker(false);
        setErrorMessage(err?.message || 'Failed to authenticate via Google.');
      }
    }, 650);
  };

  // 1. Standard Password Login Handler
  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsNotRegisteredError(false);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your registered email or mobile number.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = authenticateUser(loginIdentifier, loginPassword);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed.');
        if (result.error?.includes('REGISTER first') || result.error?.includes('No account found')) {
          setIsNotRegisteredError(true);
        }
        return;
      }

      if (result.user) {
        onLoginSuccess(toUserAccount(result.user));
        setLoginIdentifier('');
        setLoginPassword('');
        onClose();
      }
    }, 600);
  };

  // 1.2 Send Login OTP via Backend
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsNotRegisteredError(false);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your registered email or mobile number.');
      return;
    }

    setIsLoading(true);
    const res = await sendBackendOtp(loginIdentifier, 'LOGIN');
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to dispatch OTP passcode.');
      return;
    }

    setLoginOtpSent(true);
    setLoginDevOtp(res.devOtp);
    setLoginTimerSeconds(45);
    setSuccessMessage(res.message);

    // Pre-populate if dev OTP returned
    if (res.devOtp && res.devOtp.length === 6) {
      setLoginOtpDigits(res.devOtp.split(''));
    }
  };

  // 1.3 Verify Login OTP via Backend
  const handleVerifyLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const fullOtp = loginOtpDigits.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification passcode.');
      return;
    }

    setIsLoading(true);
    const res = await verifyBackendOtp(loginIdentifier, fullOtp, 'LOGIN');
    setIsLoading(false);

    if (!res.verified) {
      setErrorMessage(res.message || 'Invalid verification passcode.');
      return;
    }

    // Check if user already exists
    let patron = findRegisteredUser(loginIdentifier);
    if (!patron) {
      // Auto-create patron profile for VIP guest login
      const isEmail = loginIdentifier.includes('@');
      const regRes = registerUser({
        firstName: isEmail ? loginIdentifier.split('@')[0] : 'Patron',
        lastName: 'Member',
        email: isEmail ? loginIdentifier : `${loginIdentifier.replace(/[^0-9]/g, '')}@privilege.atelier`,
        phone: !isEmail ? loginIdentifier : '+91 9725917116',
        password: `gyutaro_${Math.random().toString(36).slice(-8)}`,
      });
      if (regRes.user) {
        patron = regRes.user;
      }
    }

    if (patron) {
      setSuccessMessage('Privilege authenticated successfully!');
      setTimeout(() => {
        onLoginSuccess(toUserAccount(patron!));
        setLoginOtpSent(false);
        setLoginOtpDigits(['', '', '', '', '', '']);
        setLoginIdentifier('');
        onClose();
      }, 500);
    } else {
      onLoginSuccess({
        firstName: 'Valued',
        lastName: 'Patron',
        email: loginIdentifier.includes('@') ? loginIdentifier : 'client@gyutaro.luxury',
        phone: !loginIdentifier.includes('@') ? loginIdentifier : '+91 9725917116',
        isLoggedIn: true,
      });
      onClose();
    }
  };

  // 2. Signup / Register Handler
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAlreadyRegisteredError(false);

    if (!signupForm.email.trim()) {
      setErrorMessage('Please provide an email address.');
      return;
    }
    if (!signupForm.phone.trim()) {
      setErrorMessage('Please provide a mobile number.');
      return;
    }
    if (!signupForm.password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (signupForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = registerUser({
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed.');
        if (result.error?.includes('already registered')) {
          setIsAlreadyRegisteredError(true);
        }
        return;
      }

      if (result.user) {
        setSuccessMessage('Privilege account registered successfully!');
        setTimeout(() => {
          onLoginSuccess(toUserAccount(result.user!));
          setSignupForm({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
          });
          onClose();
        }, 500);
      }
    }, 700);
  };

  // 3. Forgot Password Flow Handlers
  const handleForgotStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your registered email or mobile number.');
      return;
    }

    const existing = findRegisteredUser(forgotIdentifier);
    if (!existing) {
      setErrorMessage('No registered account found with these details. Please register first.');
      setIsNotRegisteredError(true);
      return;
    }

    setIsLoading(true);
    const res = await sendBackendOtp(forgotIdentifier, 'FORGOT_PASSWORD');
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to dispatch recovery OTP.');
      return;
    }

    setForgotDevOtp(res.devOtp);
    if (res.devOtp && res.devOtp.length === 6) {
      setOtpDigits(res.devOtp.split(''));
    }
    setForgotStep(3); // Go to OTP verification
    setTimerSeconds(45);
    setSuccessMessage(res.message);
  };

  const handleOtpVerify = async () => {
    setErrorMessage('');
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP passcode.');
      return;
    }

    setIsLoading(true);
    const res = await verifyBackendOtp(forgotIdentifier, fullOtp, 'FORGOT_PASSWORD');
    setIsLoading(false);

    if (!res.verified) {
      setErrorMessage(res.message || 'Invalid or expired OTP passcode.');
      return;
    }

    setForgotStep(4); // Go to reset password
  };

  const handleResendForgotOtp = async () => {
    if (timerSeconds > 0) return;
    setErrorMessage('');
    setIsLoading(true);
    const res = await resendBackendOtp(forgotIdentifier, 'FORGOT_PASSWORD');
    setIsLoading(false);

    if (res.success) {
      setTimerSeconds(45);
      setForgotDevOtp(res.devOtp);
      if (res.devOtp && res.devOtp.length === 6) {
        setOtpDigits(res.devOtp.split(''));
      }
      setSuccessMessage('Fresh verification code dispatched.');
    } else {
      setErrorMessage(res.message || 'Failed to resend OTP.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (!newPassword !== !confirmNewPassword && newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = resetUserPassword(forgotIdentifier, newPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password.');
        return;
      }
      setForgotStep(5); // Success confirmation
    }, 700);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0A0A0C]/90 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md bg-[#14131A] rounded-2xl border border-[#D4AF37]/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0E0D14]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-cinzel text-sm sm:text-base font-bold tracking-widest text-[#D4AF37] block">
                  GYUTARO PRIVILEGE
                </span>
                <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-wider block">
                  Haute Couture Atelier
                </span>
              </div>
            </div>
            <button
              id="btn-close-auth-modal"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#ECE7DA]/60 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* IF USER IS ALREADY LOGGED IN: SHOW PATRON PROFILE CARD */}
          {currentUser?.isLoggedIn ? (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-5 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ECE7DA] tracking-wider">
                    {currentUser.firstName} {currentUser.lastName}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase">
                      VIP PATRON
                    </span>
                    {currentUser.authProvider === 'google' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#4285F4]/20 border border-[#4285F4]/40 text-[#60A5FA] text-[10px] font-semibold flex items-center gap-1">
                        <GoogleIcon className="w-3 h-3" />
                        Google Connected
                      </span>
                    )}
                    <span className="text-xs text-[#10B981] flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/15 text-left space-y-2 text-xs text-[#ECE7DA]/80">
                  {currentUser.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                  )}
                  {currentUser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{currentUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  id="btn-auth-logout"
                  onClick={() => {
                    if (onLogout) onLogout();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-[#1A1924] border border-[#EF4444]/40 hover:bg-[#EF4444]/15 hover:border-[#EF4444] text-[#EF4444] text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT FROM PRIVILEGE</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-[#ECE7DA]/60 hover:text-[#ECE7DA] font-cinzel tracking-wider cursor-pointer"
                >
                  RETURN TO BOUTIQUE
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              {/* Tab Navigation Buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0E0D14] rounded-xl border border-[#D4AF37]/20 mb-5">
                <button
                  type="button"
                  id="tab-btn-login"
                  onClick={() => setTab('LOGIN')}
                  className={`py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                    tab === 'LOGIN'
                      ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold shadow-md'
                      : 'text-[#ECE7DA]/60 hover:text-[#ECE7DA]'
                  }`}
                >
                  PATRON LOGIN
                </button>
                <button
                  type="button"
                  id="tab-btn-signup"
                  onClick={() => setTab('SIGNUP')}
                  className={`py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                    tab === 'SIGNUP'
                      ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold shadow-md'
                      : 'text-[#ECE7DA]/60 hover:text-[#ECE7DA]'
                  }`}
                >
                  JOIN PRIVILEGE
                </button>
              </div>

              {/* 1. LOGIN TAB */}
              {tab === 'LOGIN' && (
                <div className="space-y-4">
                  {/* Login Method Toggle: Password vs Mobile OTP */}
                  <div className="flex items-center justify-between p-1 rounded-lg bg-[#1A1924] border border-[#D4AF37]/20 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('PASSWORD');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer ${
                        loginMethod === 'PASSWORD'
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-semibold border border-[#D4AF37]/30'
                          : 'text-[#ECE7DA]/60 hover:text-[#ECE7DA]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Password Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('OTP');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer ${
                        loginMethod === 'OTP'
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-semibold border border-[#D4AF37]/30'
                          : 'text-[#ECE7DA]/60 hover:text-[#ECE7DA]'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Mobile OTP Backend</span>
                    </button>
                  </div>

                  {/* 1.1 PASSWORD LOGIN */}
                  {loginMethod === 'PASSWORD' && (
                    <form onSubmit={handleStandardLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium tracking-wider text-[#ECE7DA]/80 uppercase mb-1 font-cinzel">
                          Email Address or Mobile Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            id="input-login-identifier"
                            value={loginIdentifier}
                            onChange={(e) => {
                              setLoginIdentifier(e.target.value);
                              setErrorMessage('');
                              setIsNotRegisteredError(false);
                            }}
                            placeholder="e.g. arjun.patel@luxurycouture.com"
                            className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 pl-10 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <User className="w-4 h-4 text-[#D4AF37] absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium tracking-wider text-[#ECE7DA]/80 uppercase font-cinzel">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTab('FORGOT');
                              setForgotStep(1);
                              setForgotIdentifier(loginIdentifier);
                            }}
                            className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            required
                            id="input-login-password"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              setErrorMessage('');
                            }}
                            placeholder="Enter your password"
                            className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 pl-10 pr-10 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <Lock className="w-4 h-4 text-[#D4AF37] absolute left-3 top-3" />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-3 text-[#ECE7DA]/50 hover:text-[#D4AF37] cursor-pointer"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Error Alerts */}
                      {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex flex-col gap-2 text-xs text-[#EF4444]"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                            <span className="leading-snug">{errorMessage}</span>
                          </div>

                          {isNotRegisteredError && (
                            <button
                              type="button"
                              onClick={() => {
                                const isEmail = loginIdentifier.includes('@');
                                setSignupForm({
                                  ...signupForm,
                                  email: isEmail ? loginIdentifier : '',
                                  phone: !isEmail ? loginIdentifier : '',
                                });
                                setTab('SIGNUP');
                              }}
                              className="mt-1 w-full py-2 rounded-lg bg-[#D4AF37] text-[#0A0A0C] font-bold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>REGISTER NEW ACCOUNT NOW</span>
                            </button>
                          )}
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        id="btn-auth-submit-login"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all cursor-pointer mt-2 disabled:opacity-50"
                      >
                        {isLoading ? 'VERIFYING CREDENTIALS...' : 'LOGIN WITH PASSWORD'}
                      </button>
                    </form>
                  )}

                  {/* 1.2 MOBILE / EMAIL OTP LOGIN (BACKEND INTEGRATED) */}
                  {loginMethod === 'OTP' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium tracking-wider text-[#ECE7DA]/80 uppercase mb-1 font-cinzel">
                          Mobile Number or Email
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            id="input-login-otp-identifier"
                            value={loginIdentifier}
                            onChange={(e) => {
                              setLoginIdentifier(e.target.value);
                              setErrorMessage('');
                              setSuccessMessage('');
                              setLoginOtpSent(false);
                            }}
                            placeholder="e.g. +91 97259 17116"
                            className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 pl-10 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <Phone className="w-4 h-4 text-[#D4AF37] absolute left-3 top-3" />
                        </div>
                      </div>

                      {/* If OTP Sent, show 6-digit boxes */}
                      {loginOtpSent && (
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium uppercase font-cinzel text-[#ECE7DA]/80">
                              Enter 6-Digit Passcode
                            </label>
                            {loginDevOtp && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono">
                                OTP: <strong>{loginDevOtp}</strong>
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-6 gap-2">
                            {loginOtpDigits.map((digit, i) => (
                              <input
                                key={i}
                                id={`login-otp-digit-${i}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  const newDigits = [...loginOtpDigits];
                                  newDigits[i] = val;
                                  setLoginOtpDigits(newDigits);
                                  // Auto focus next input
                                  if (val && i < 5) {
                                    const next = document.getElementById(`login-otp-digit-${i + 1}`);
                                    if (next) next.focus();
                                  }
                                }}
                                className="aspect-square bg-[#0E0D14] border border-[#D4AF37]/40 rounded-lg text-center text-lg font-bold font-mono text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#ECE7DA]/60 pt-1">
                            <span>
                              {loginTimerSeconds > 0 ? (
                                <>Resend in: <strong className="text-[#D4AF37]">{loginTimerSeconds}s</strong></>
                              ) : (
                                'OTP Expired'
                              )}
                            </span>
                            <button
                              type="button"
                              disabled={loginTimerSeconds > 0 || isLoading}
                              onClick={() => handleSendLoginOtp()}
                              className="text-[#D4AF37] hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Resend OTP</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error & Success Alerts */}
                      {errorMessage && (
                        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-start gap-2 text-xs text-[#EF4444]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                          <span>{errorMessage}</span>
                        </div>
                      )}
                      {successMessage && (
                        <div className="p-3 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center gap-2 text-xs text-[#10B981]">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{successMessage}</span>
                        </div>
                      )}

                      {!loginOtpSent ? (
                        <button
                          type="button"
                          id="btn-auth-send-login-otp"
                          onClick={() => handleSendLoginOtp()}
                          disabled={isLoading || isGoogleLoading}
                          className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:bg-[#F4E5C3] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'DISPATCHING SECURE OTP...' : 'SEND OTP PASSCODE'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-auth-verify-login-otp"
                          onClick={() => handleVerifyLoginOtp()}
                          disabled={isLoading || isGoogleLoading}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'VERIFYING WITH ATELIER BACKEND...' : 'VERIFY OTP & LOGIN'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-2 text-center border-t border-[#D4AF37]/15">
                    <p className="text-[11px] text-[#ECE7DA]/50">
                      Don't have a registered account yet?{' '}
                      <button
                        type="button"
                        onClick={() => setTab('SIGNUP')}
                        className="text-[#D4AF37] font-semibold hover:underline cursor-pointer"
                      >
                        Join Privilege
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* 2. REGISTER TAB */}
              {tab === 'SIGNUP' && (
                <form onSubmit={handleSignup} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#ECE7DA]/70 uppercase mb-1 font-cinzel">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        id="input-signup-first-name"
                        value={signupForm.firstName}
                        onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                        placeholder="Arjun"
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#ECE7DA]/70 uppercase mb-1 font-cinzel">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        id="input-signup-last-name"
                        value={signupForm.lastName}
                        onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                        placeholder="Patel"
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#ECE7DA]/70 uppercase mb-1 font-cinzel">
                      Mobile Number (For Atelier OTP)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        id="input-signup-phone"
                        value={signupForm.phone}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, phone: e.target.value });
                          setErrorMessage('');
                          setIsAlreadyRegisteredError(false);
                        }}
                        placeholder="+91 97259 17116"
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-3 py-2 pl-9 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#ECE7DA]/70 uppercase mb-1 font-cinzel">
                      Email Address (Account ID)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        id="input-signup-email"
                        value={signupForm.email}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, email: e.target.value });
                          setErrorMessage('');
                          setIsAlreadyRegisteredError(false);
                        }}
                        placeholder="arjun.patel@example.com"
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-3 py-2 pl-9 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#ECE7DA]/70 uppercase mb-1 font-cinzel">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          id="input-signup-password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          placeholder="Min 6 chars"
                          className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-3 py-2 pr-8 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-2 top-2.5 text-[#ECE7DA]/40 hover:text-[#D4AF37]"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#ECE7DA]/70 uppercase mb-1 font-cinzel">
                        Confirm Password
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        id="input-signup-confirm-password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        placeholder="Repeat password"
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Error Alerts */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex flex-col gap-2 text-xs text-[#EF4444]"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                        <span className="leading-snug">{errorMessage}</span>
                      </div>

                      {isAlreadyRegisteredError && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginIdentifier(signupForm.email || signupForm.phone);
                            setTab('LOGIN');
                          }}
                          className="mt-1 w-full py-2 rounded-lg bg-[#D4AF37] text-[#0A0A0C] font-bold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>LOGIN WITH EXISTING ACCOUNT</span>
                        </button>
                      )}
                    </motion.div>
                  )}

                  {successMessage && (
                    <div className="p-3 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center gap-2 text-xs text-[#10B981]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-auth-submit-register"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isLoading ? 'CREATING CLIENT ACCOUNT...' : 'JOIN GYUTARO PRIVILEGE'}
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-[#ECE7DA]/50">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setTab('LOGIN')}
                        className="text-[#D4AF37] font-semibold hover:underline cursor-pointer"
                      >
                        Login here
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* 3. FORGOT PASSWORD MULTI-STEP FLOW WITH REAL BACKEND OTP */}
              {tab === 'FORGOT' && (
                <div className="space-y-6">
                  {/* Step indicator */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
                    <span className="text-[10px] font-cinzel tracking-widest text-[#D4AF37] uppercase">
                      STEP 0{forgotStep} OF 05 • RECOVERY
                    </span>
                    <button
                      onClick={() => setTab('LOGIN')}
                      className="text-[11px] text-[#ECE7DA]/60 hover:text-[#D4AF37] cursor-pointer"
                    >
                      BACK TO LOGIN
                    </button>
                  </div>

                  {/* STEP 1: Enter Mobile / Email */}
                  {forgotStep === 1 && (
                    <form onSubmit={handleForgotStep1Submit} className="space-y-4">
                      <p className="text-xs text-[#ECE7DA]/80 leading-relaxed font-light">
                        Enter your registered mobile number or email address to receive an atelier verification code from the backend OTP gateway.
                      </p>
                      <div>
                        <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1 font-cinzel">
                          Registered Mobile / Email
                        </label>
                        <input
                          type="text"
                          required
                          value={forgotIdentifier}
                          onChange={(e) => {
                            setForgotIdentifier(e.target.value);
                            setErrorMessage('');
                            setIsNotRegisteredError(false);
                          }}
                          placeholder="e.g. +91 97259 17116"
                          className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {errorMessage && (
                        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex flex-col gap-2 text-xs text-[#EF4444]">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                            <span>{errorMessage}</span>
                          </div>
                          {isNotRegisteredError && (
                            <button
                              type="button"
                              onClick={() => setTab('SIGNUP')}
                              className="mt-1 w-full py-2 rounded-lg bg-[#D4AF37] text-[#0A0A0C] font-bold text-[11px] tracking-wider uppercase"
                            >
                              REGISTER NEW ACCOUNT
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                      >
                        {isLoading ? 'DISPATCHING BACKEND OTP...' : 'SEND OTP (STEP 2)'}
                      </button>
                    </form>
                  )}

                  {/* STEP 3: Enter OTP */}
                  {forgotStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#ECE7DA]/80">
                          Passcode sent to <strong className="text-[#D4AF37]">{forgotIdentifier}</strong>:
                        </p>
                        {forgotDevOtp && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono">
                            OTP: <strong>{forgotDevOtp}</strong>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-2">
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            id={`forgot-otp-digit-${i}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              const newDigits = [...otpDigits];
                              newDigits[i] = val;
                              setOtpDigits(newDigits);
                              if (val && i < 5) {
                                const next = document.getElementById(`forgot-otp-digit-${i + 1}`);
                                if (next) next.focus();
                              }
                            }}
                            className="aspect-square bg-[#0E0D14] border border-[#D4AF37]/40 rounded-lg text-center text-base font-bold font-mono text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#ECE7DA]/60 pt-2">
                        <span>
                          {timerSeconds > 0 ? (
                            <>Resend OTP in: <strong className="text-[#D4AF37]">{timerSeconds}s</strong></>
                          ) : (
                            'Code expired'
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={timerSeconds > 0 || isLoading}
                          onClick={handleResendForgotOtp}
                          className="text-[#D4AF37] hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resend Code</span>
                        </button>
                      </div>

                      {errorMessage && (
                        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-start gap-2 text-xs text-[#EF4444]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleOtpVerify}
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                      >
                        {isLoading ? 'VERIFYING WITH BACKEND...' : 'VERIFY & PROCEED (STEP 4)'}
                      </button>
                    </div>
                  )}

                  {/* STEP 4: Create new password */}
                  {forgotStep === 4 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1 font-cinzel">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 6 chars)"
                          className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1 font-cinzel">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {errorMessage && (
                        <p className="text-[11px] text-[#EF4444] bg-[#EF4444]/10 p-2.5 rounded-lg border border-[#EF4444]/30">
                          {errorMessage}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                      >
                        {isLoading ? 'UPDATING SECURE CREDENTIALS...' : 'SAVE NEW PASSWORD'}
                      </button>
                    </form>
                  )}

                  {/* STEP 5: Success Animation */}
                  {forgotStep === 5 && (
                    <div className="text-center py-4 space-y-4">
                      <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto animate-bounce">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="font-cinzel text-lg font-bold text-[#ECE7DA]">
                        PASSWORD RESET SUCCESSFUL
                      </h4>
                      <p className="text-xs text-[#ECE7DA]/70">
                        Your new password has been securely updated. You can now login with your new credentials.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier(forgotIdentifier);
                          setTab('LOGIN');
                        }}
                        className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase cursor-pointer"
                      >
                        LOGIN NOW
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* GOOGLE ACCOUNT CHOOSER / FAST SIGN-IN MODAL */}
        <AnimatePresence>
          {showGooglePicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-[#181722] border border-[#D4AF37]/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 text-[#ECE7DA]"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <GoogleIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">Sign in with Google</h4>
                      <p className="text-[10px] text-white/50">Gyutaro Haute Couture Atelier</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGooglePicker(false)}
                    className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs text-[#ECE7DA]/70 font-light">
                    Choose an account to instantly access your VIP privilege status:
                  </p>

                  {/* Primary Google Account Option */}
                  <button
                    type="button"
                    id="btn-google-account-primary"
                    disabled={isGoogleLoading}
                    onClick={() => handleExecuteGoogleLogin('raj927222@gmail.com', 'Raj Patel')}
                    className="w-full p-3 rounded-xl bg-[#0E0D14] hover:bg-[#252433] border border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all flex items-center justify-between text-left cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA4335] via-[#FBBC05] to-[#4285F4] p-0.5">
                        <div className="w-full h-full rounded-full bg-[#181722] flex items-center justify-center text-xs font-bold text-white">
                          RP
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block group-hover:text-[#D4AF37] transition-colors">
                          Raj Patel
                        </span>
                        <span className="text-[11px] text-white/50 block">raj927222@gmail.com</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold tracking-wider">
                      PRIMARY
                    </span>
                  </button>

                  {/* Atelier Demo Google Account */}
                  <button
                    type="button"
                    id="btn-google-account-atelier"
                    disabled={isGoogleLoading}
                    onClick={() => handleExecuteGoogleLogin('client@gyutaro.luxury', 'Atelier Patron')}
                    className="w-full p-3 rounded-xl bg-[#0E0D14] hover:bg-[#252433] border border-white/10 hover:border-[#D4AF37]/60 transition-all flex items-center justify-between text-left cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                        GC
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block group-hover:text-[#D4AF37] transition-colors">
                          Atelier VIP Member
                        </span>
                        <span className="text-[11px] text-white/50 block">client@gyutaro.luxury</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Custom Google Email Option */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 block font-cinzel">
                    Or Enter Another Google Email
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="flex-1 bg-[#0E0D14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      disabled={isGoogleLoading || !customGoogleEmail.includes('@')}
                      onClick={() => handleExecuteGoogleLogin()}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs hover:bg-[#F4E5C3] transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Login
                    </button>
                  </div>
                </div>

                {isGoogleLoading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[#D4AF37] pt-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing Google token & activating VIP profile...</span>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

