import React, { useState } from 'react';
import { User, SubjectId, AppMode, Subject, Concept } from '../types';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-3xl" }) => {
  const letters = "Teachly".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500"
  ];
  return (
    <span className={`${size} font-bold tracking-tight flex items-center gap-0.5`}>
      {letters.map((l, i) => (
        <span key={i} className={colors[i % colors.length]}>{l}</span>
      ))}
    </span>
  );
};

interface DashboardProps {
  user: User;
  appMode: AppMode;
  allSubjects: Subject[];
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
  onBackToMode: () => void;
  onNavigateDesigner: () => void;
  onNavigateSubject: (id: SubjectId) => void;
  onAddSubject: (subjectData: { name: string, description: string, concepts: Concept[], icon: string }) => void;
  onEditSubject: (id: string, subjectData: { name: string, description: string, concepts: Concept[], icon: string }) => void;
  onDeleteSubject: (id: SubjectId) => void;
}

const EMOJI_OPTIONS = ['🍎', '➕', '🔬', '🚀', '🎨', '🧩', '🎸', '🦁', '🌿', '🪐', '🧠', '🔤', '🔢', '🧪', '🌍', '📐', '🎭', '🏀', '☀️', '💡'];

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  appMode, 
  allSubjects,
  onModeChange, 
  onLogout, 
  onBackToMode, 
  onNavigateDesigner, 
  onNavigateSubject,
  onAddSubject,
  onEditSubject,
  onDeleteSubject
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [concepts, setConcepts] = useState<{ title: string; icon: string; description: string }[]>([
    { title: '', icon: '✨', description: '' }
  ]);

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setNewName(subject.title);
    setNewDesc(subject.description || '');
    setNewIcon(subject.icon || '⭐');
    setConcepts(subject.concepts.map(c => ({
      title: c.title,
      icon: c.icon,
      description: c.description
    })));
    setShowModal(true);
  };

  const handleCreateOrUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const formattedConcepts: Concept[] = concepts
      .filter(c => c.title.trim() !== '')
      .map((c, i) => ({
        id: `concept-${Date.now()}-${i}`,
        title: c.title,
        icon: c.icon || '📚',
        description: c.description || `Learning about ${c.title}`,
        suggestedItems: [c.title, c.icon]
      }));

    if (editingSubjectId) {
      onEditSubject(editingSubjectId, {
        name: newName,
        description: newDesc,
        concepts: formattedConcepts,
        icon: newIcon
      });
    } else {
      onAddSubject({
        name: newName,
        description: newDesc,
        concepts: formattedConcepts,
        icon: newIcon
      });
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setNewName('');
    setNewDesc('');
    setNewIcon('⭐');
    setConcepts([{ title: '', icon: '✨', description: '' }]);
    setEditingSubjectId(null);
    setShowModal(false);
  };

  const addConceptField = () => {
    setConcepts([...concepts, { title: '', icon: '✨', description: '' }]);
  };

  const updateConcept = (index: number, field: string, value: string) => {
    const updated = [...concepts];
    updated[index] = { ...updated[index], [field]: value };
    setConcepts(updated);
  };

  const removeConcept = (index: number) => {
    if (concepts.length > 1) {
      setConcepts(concepts.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-['Fredoka']">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={onBackToMode}
            title="Return to Mode Select"
            className="group flex items-center gap-3 hover:scale-105 transition-transform"
          >
            <div className="w-14 h-14 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-xl border-b-4 border-yellow-600 group-hover:rotate-12 transition-transform">
              <span className="text-3xl">🎒</span>
            </div>
            <RainbowLogo size="text-4xl" />
          </button>
          
          <div className="h-12 w-px bg-gray-200 hidden md:block"></div>
          
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold text-gray-800">Hi, {user.username}! 🍎</h1>
            <p className="text-gray-500 text-sm">Welcome to your Teachly dashboard.</p>
          </div>
        </div>

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

        {allSubjects.map((subject) => (
          <div key={subject.id} className="relative group">
            {appMode === 'teacher' && (
              <div className="absolute -top-3 -right-3 flex gap-2 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(subject);
                  }}
                  className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 border-4 border-white transform transition-all hover:scale-110 active:scale-95"
                >
                  ✏️
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if(window.confirm(`Are you sure you want to delete ${subject.title}?`)) {
                      onDeleteSubject(subject.id);
                    }
                  }}
                  className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 border-4 border-white transform transition-all hover:scale-110 active:scale-95"
                >
                  🗑️
                </button>
              </div>
            )}
            <div 
              onClick={() => onNavigateSubject(subject.id)}
              className={`${subject.color} p-8 rounded-[2.5rem] shadow-lg cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center border-b-8 border-black/10 h-full`}
            >
              <div className="bg-white/30 w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                {subject.icon || '⭐'}
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">{subject.title}</h4>
              <p className="text-white/80 text-sm font-medium line-clamp-3">
                {subject.description || 'Start interactive lesson.'}
              </p>
            </div>
          </div>
        ))}

        {appMode === 'teacher' && (
          <div 
            onClick={() => {
              handleCloseModal();
              setShowModal(true);
            }}
            className="bg-white border-4 border-dashed border-gray-200 p-8 rounded-[2.5rem] shadow-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-center group h-full min-h-[220px]"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
              ➕
            </div>
            <h4 className="text-xl font-bold text-gray-400 group-hover:text-blue-500">Add New Subject</h4>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={handleCloseModal}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto relative animate-zoom-in" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="absolute top-8 right-8 text-3xl text-gray-300 hover:text-red-500">✕</button>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800">{editingSubjectId ? 'Edit Subject' : 'New Subject'}</h3>
            </div>
            <form onSubmit={handleCreateOrUpdateSubject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 ml-4">ICON</label>
                <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-3xl justify-center">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setNewIcon(emoji)} className={`text-2xl p-2 rounded-xl ${newIcon === emoji ? 'bg-white shadow-md border-2 border-blue-400' : 'opacity-50'}`}>{emoji}</button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Subject Name" className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <textarea placeholder="Description" className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-blue-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold min-h-[100px]" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-sm font-bold text-gray-500">CONCEPTS</label>
                  <button type="button" onClick={addConceptField} className="text-blue-500 font-bold text-sm">+ Add</button>
                </div>
                {concepts.map((concept, idx) => (
                  <div key={idx} className="flex gap-3">
                    <input type="text" className="w-16 px-2 py-4 rounded-2xl border-4 border-gray-50 text-center text-xl" value={concept.icon} onChange={(e) => updateConcept(idx, 'icon', e.target.value)} />
                    <input type="text" placeholder="Concept Title" className="flex-1 px-6 py-4 rounded-2xl border-4 border-gray-50 text-lg font-bold" value={concept.title} onChange={(e) => updateConcept(idx, 'title', e.target.value)} required />
                    {concepts.length > 1 && <button type="button" onClick={() => removeConcept(idx)} className="w-12 bg-red-50 text-red-400 rounded-2xl">✕</button>}
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white font-bold py-5 rounded-[2.5rem] text-2xl shadow-xl border-b-8 border-blue-700">{editingSubjectId ? 'Update Room' : 'Create Room'}</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;