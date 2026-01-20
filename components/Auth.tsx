
import React, { useState, useEffect } from 'react';
import { User, SubjectId } from '../types';
import { WALL_COLORS, FLOOR_COLORS, SUBJECTS } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'signup';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear errors and reset password visibility when switching views
  useEffect(() => {
    setError('');
    setSuccess('');
    setShowPassword(false);
  }, [view]);

  const getAccounts = (): User[] => {
    const data = localStorage.getItem('dreamclass_accounts');
    return data ? JSON.parse(data) : [];
  };

  const saveAccount = (user: User) => {
    const accounts = getAccounts();
    accounts.push(user);
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

    // Initialize default designs
    const initialDesigns: any = {};
    SUBJECTS.forEach(s => {
      initialDesigns[s.id] = {
        wallColor: WALL_COLORS[0],
        floorColor: FLOOR_COLORS[0],
        posterUrls: [],
        ambientMusic: 'none'
      };
    });

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email: email.toLowerCase(),
      password, // In a real app, this would be hashed
      classroomDesigns: initialDesigns,
      progress: {}
    };

    saveAccount(newUser);
    setSuccess('Account created! Now you can log in. 🎉');
    setView('login');
    // Clear registration fields
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
      // Remove password from the session user object for safety
      const { password, ...sessionUser } = user;
      onLogin(sessionUser as User);
    } else {
      setError('Incorrect email or password. Please try again! ❌');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F9FF] p-6 font-['Fredoka']">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md border-b-[16px] border-blue-100 transition-all duration-500">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
            {view === 'login' ? 'Welcome Back!' : 'Start Your Journey'}
          </h1>
          <p className="text-gray-400 font-medium">
            {view === 'login' ? 'Log in to your magical classroom.' : 'Create an account to begin teaching.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 text-red-500 rounded-2xl font-bold text-sm animate-shake text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-100 text-green-600 rounded-2xl font-bold text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
          {view === 'signup' && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-500 ml-4 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Teacher Name"
                className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-500 ml-4 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="example@school.com"
              className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold text-gray-700 transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-500 ml-4 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-8 py-4 pr-16 rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold text-gray-700 transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50 rounded-full transition-colors text-2xl"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-5 rounded-3xl text-2xl shadow-xl border-b-8 border-blue-700 transition-all hover:scale-[1.02] active:translate-y-1 active:border-b-0 mt-6"
          >
            {view === 'login' ? 'Log In 🚀' : 'Create Account ✨'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setView(view === 'login' ? 'signup' : 'login')}
            className="text-blue-400 font-bold hover:text-blue-600 transition-colors text-sm"
          >
            {view === 'login' ? "New here? Make an account!" : "Already have one? Log in!"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default Auth;
