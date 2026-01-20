
import React, { useState } from 'react';
import { User, SubjectId } from '../types';
import { WALL_COLORS, FLOOR_COLORS, SUBJECTS } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    // Create a default design for every subject
    const initialDesigns: any = {};
    SUBJECTS.forEach(s => {
      initialDesigns[s.id] = {
        wallColor: WALL_COLORS[0],
        floorColor: FLOOR_COLORS[0],
        posterUrls: [],
        ambientMusic: 'none'
      };
    });

    // Simulate user data
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      classroomDesigns: initialDesigns as Record<SubjectId, any>,
      progress: {}
    };
    onLogin(mockUser);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F9FF] p-6 font-['Fredoka']">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md text-center border-b-[16px] border-blue-100">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center transform rotate-6 shadow-xl border-b-8 border-yellow-600">
            <span className="text-5xl">🎒</span>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-blue-600 mb-2 drop-shadow-sm tracking-tight">DreamClass</h1>
        <p className="text-gray-400 font-medium mb-10 text-lg">Your Magical School awaits!</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="What's your name?"
              className="w-full px-8 py-5 rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-xl text-center font-bold text-gray-700 transition-all shadow-inner"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-5 rounded-3xl text-2xl shadow-xl border-b-8 border-blue-700 transition-all hover:scale-105 active:translate-y-1 active:border-b-0"
          >
            {isLogin ? 'Let\'s Go! 🚀' : 'Create Account'}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-8 text-blue-400 font-bold hover:text-blue-600 transition-colors"
        >
          {isLogin ? "New here? Make an account!" : "Already have one? Log in!"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
