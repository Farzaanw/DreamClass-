
import React from 'react';
import { User, SubjectId, AppMode } from '../types';
import { SUBJECTS } from '../constants';

interface DashboardProps {
  user: User;
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
  onBackToMode: () => void;
  onNavigateDesigner: () => void;
  onNavigateSubject: (id: SubjectId) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  appMode, 
  onModeChange, 
  onLogout, 
  onBackToMode, 
  onNavigateDesigner, 
  onNavigateSubject 
}) => {
  return (
    <div className="p-8 max-w-6xl mx-auto font-['Fredoka']">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={onBackToMode}
            title="Return to Mode Select"
            className="group flex items-center gap-3 hover:scale-105 transition-transform"
          >
            {/* DreamClass Brand Logo - PERMITTED HERE */}
            <div className="w-14 h-14 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-xl border-b-4 border-yellow-600 group-hover:rotate-12 transition-transform">
              <span className="text-3xl">🎒</span>
            </div>
            <span className="text-4xl font-bold text-blue-600 tracking-tight">DreamClass</span>
          </button>
          
          <div className="h-12 w-px bg-gray-200 hidden md:block"></div>
          
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold text-gray-800">Hi, {user.username}! 🍎</h1>
            <p className="text-gray-500 text-sm">Welcome to your magic dashboard.</p>
          </div>
        </div>

        {/* Mode Toggle Switch */}
        <div className="bg-gray-100 p-1.5 rounded-full flex relative shadow-inner border border-gray-200 w-64 h-14">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 shadow-sm ${
              appMode === 'classroom' 
                ? 'left-1 bg-blue-500' 
                : 'left-[calc(50%+2px)] bg-purple-500'
            }`}
          />
          <button 
            onClick={() => onModeChange('classroom')}
            className={`flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300 font-bold text-sm ${
              appMode === 'classroom' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">👨‍🏫</span>
            Classroom
          </button>
          <button 
            onClick={() => onModeChange('teacher')}
            className={`flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300 font-bold text-sm ${
              appMode === 'teacher' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">🛠️</span>
            Teacher
          </button>
        </div>
        
        <div className="flex gap-4">
          {appMode === 'teacher' && (
            <button 
              onClick={onNavigateDesigner}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-colors border-b-4 border-purple-300"
            >
              🎨 Designer
            </button>
          )}
          <button 
            onClick={onLogout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full font-medium transition-colors border-b-4 border-gray-300"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div 
          onClick={appMode === 'teacher' ? onNavigateDesigner : undefined}
          className={`col-span-full p-10 rounded-[3rem] text-white shadow-xl transition-all relative overflow-hidden border-b-[12px] ${
            appMode === 'classroom' 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-cyan-800/30' 
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 border-indigo-800/30 cursor-pointer hover:scale-[1.01]'
          }`}
        >
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-3">
              {appMode === 'classroom' ? 'Ready for Lessons?' : 'Build Your Classroom'}
            </h2>
            <p className="text-white/90 max-w-md text-lg">
              {appMode === 'classroom' 
                ? 'Select a subject below to jump into an interactive session with your students.' 
                : 'Customize colors, stickers, and music to create the perfect magic learning environment.'}
            </p>
          </div>
          <div className="absolute right-[-30px] bottom-[-30px] text-[12rem] opacity-20 transform -rotate-12 select-none pointer-events-none">
            {appMode === 'classroom' ? '🎓' : '🏫'}
          </div>
        </div>

        <h3 className="col-span-full text-2xl font-bold text-gray-700 mt-6 mb-2 ml-2 tracking-tight">
          {appMode === 'classroom' ? 'Select a Subject' : 'Manage Subject Material'}
        </h3>

        {SUBJECTS.map((subject) => (
          <div 
            key={subject.id}
            onClick={() => onNavigateSubject(subject.id)}
            className={`${subject.color} p-8 rounded-[2.5rem] shadow-lg cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center border-b-8 border-black/10 group`}
          >
            <div className="bg-white/30 w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
              {subject.id === 'phonics' ? '🔤' : subject.id === 'math' ? '➕' : '🔬'}
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">{subject.title}</h4>
            <p className="text-white/80 text-sm font-medium">
              {appMode === 'classroom' ? 'Start interactive lesson.' : 'Edit concepts and games.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
