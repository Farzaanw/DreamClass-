
import React, { useState, useEffect } from 'react';
import { User, SubjectId } from '../types';
import { WALL_COLORS, FLOOR_COLORS, SUBJECTS } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

type AuthView = 'login' | 'signup' | 'reset-request' | 'reset-password';

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login', onBack }) => {
  const [view, setView] = useState<AuthView>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setView(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setError('');
    setSuccess('');
    setShowPassword(false);
  }, [view]);

  const getAccounts = (): User[] => {
    const data = localStorage.getItem('dreamclass_accounts');
    return data ? JSON.parse(data) : [];
  };

  const saveAccounts = (accounts: User[]) => {
    localStorage.setItem('dreamclass_accounts', JSON.stringify(accounts));
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all fields! 📝');
      return;
    }

    const accounts = getAccounts();
    if (accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email already exists! 📧');
      return;
    }

    const initialDesigns: any = {};
    SUBJECTS.forEach(s => {
      initialDesigns[s.id] = {
        wallColor: WALL_COLORS[0],
        floorColor: FLOOR_COLORS[0],
        posterUrls: [],
        ambientMusic: 'none',
        whiteboards: [],
        conceptBoards: {}
      };
    });

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email: email.toLowerCase(),
      password,
      customSubjects: [],
      hiddenSubjectIds: [],
      classroomDesigns: initialDesigns,
      progress: {}
    };

    const newAccounts = [...accounts, newUser];
    saveAccounts(newAccounts);
    setSuccess('Account created! Now you can log in. 🎉');
    setView('login');
    setUsername('');
    setPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password! 🔑');
      return;
    }

    const accounts = getAccounts();
    const user = accounts.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (user) {
      const { password: _, ...sessionUser } = user;
      onLogin(sessionUser as User);
    } else {
      setError('Incorrect email or password. Please try again! ❌');
    }
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Enter your email to reset! 📧');
      return;
    }

    const accounts = getAccounts();
    const userExists = accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      setSuccess('Reset code sent! (Demo Code: 123456) 📩');
      setView('reset-password');
    } else {
      setError('We couldn\'t find an account with that email. 🔍');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (resetCode !== '123456') {
      setError('Invalid reset code! Please check your email. 🔢');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters. 🛡️');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match! 👯');
      return;
    }

    const accounts = getAccounts();
    const updatedAccounts = accounts.map(acc => {
      if (acc.email.toLowerCase() === email.toLowerCase()) {
        return { ...acc, password };
      }
      return acc;
    });

    saveAccounts(updatedAccounts);
    setSuccess('Password updated! You can now log in. 🎊');
    setView('login');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F9FF] p-4 sm:p-6 font-['Fredoka'] relative">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 text-gray-400 hover:text-blue-500 font-bold transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          <span className="text-lg sm:text-xl">←</span> Back Home
        </button>
      )}

      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl w-full max-w-md border-b-[12px] sm:border-b-[16px] border-blue-100 transition-all duration-500 animate-zoom-in">
        
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 tracking-tight">
            {view === 'login' && 'Welcome Back!'}
            {view === 'signup' && 'Start Your Journey'}
            {view === 'reset-request' && 'Oops! Forgotten?'}
            {view === 'reset-password' && 'New Secret Key'}
          </h1>
          <p className="text-gray-400 font-medium text-xs sm:text-sm">
            {view === 'login' && 'Log in to your magical classroom.'}
            {view === 'signup' && 'Create an account to begin teaching.'}
            {view === 'reset-request' && 'We\'ll help you get back into your room.'}
            {view === 'reset-password' && 'Make it strong and easy to remember!'}
          </p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-100 text-red-500 rounded-2xl font-bold text-xs sm:text-sm animate-shake text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-100 text-green-600 rounded-2xl font-bold text-xs sm:text-sm text-center">
            {success}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="example@school.com"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <button 
                  type="button" 
                  onClick={() => setView('reset-request')}
                  className="text-[10px] sm:text-xs font-bold text-blue-400 hover:text-blue-600 uppercase tracking-wider"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-6 sm:px-8 py-3 sm:py-4 pr-12 sm:pr-16 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50 rounded-full transition-colors text-xl sm:text-2xl"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl shadow-xl border-b-8 border-blue-700 transition-all hover:scale-[1.02] active:translate-y-1 active:border-b-0 mt-4 sm:mt-6"
            >
              Log In 🚀
            </button>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Teacher Name"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="example@school.com"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-6 sm:px-8 py-3 sm:py-4 pr-12 sm:pr-16 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50 rounded-full transition-colors text-xl sm:text-2xl"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl shadow-xl border-b-8 border-blue-700 transition-all hover:scale-[1.02] active:translate-y-1 active:border-b-0 mt-4 sm:mt-6"
            >
              Create Account ✨
            </button>
          </form>
        )}

        {view === 'reset-request' && (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">Your Email</label>
              <input
                type="email"
                placeholder="example@school.com"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl shadow-xl border-b-8 border-orange-700 transition-all hover:scale-[1.02] active:translate-y-1 active:border-b-0 mt-4 sm:mt-6"
            >
              Send Reset Code 📧
            </button>
            <button 
              type="button" 
              onClick={() => setView('login')}
              className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 text-sm"
            >
              Wait, I remember it! 🔙
            </button>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-center text-xl sm:text-2xl font-black text-gray-700 transition-all shadow-inner tracking-widest"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-base sm:text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl shadow-xl border-b-8 border-green-700 transition-all hover:scale-[1.02] active:translate-y-1 active:border-b-0 mt-4 sm:mt-6"
            >
              Reset Password 🔐
            </button>
          </form>
        )}

        <div className="mt-6 sm:mt-8 text-center">
          {(view === 'login' || view === 'signup') && (
            <button 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              className="text-blue-400 font-bold hover:text-blue-600 transition-colors text-xs sm:text-sm"
            >
              {view === 'login' ? "New here? Make an account!" : "Already have one? Log in!"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-zoom-in { animation: zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Auth;
