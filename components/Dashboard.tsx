
import React, { useState } from 'react';
import { User, SubjectId, AppMode, Subject, Concept, MaterialFile } from '../types';

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
  onUpdateMaterials: (materials: MaterialFile[]) => void;
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
  onDeleteSubject,
  onUpdateMaterials
}) => {
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [view, setView] = useState<'overview' | 'materials'>('overview');

  // Subject Edit State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [concepts, setConcepts] = useState<{ title: string; icon: string; description: string }[]>([
    { title: '', icon: '✨', description: '' }
  ]);

  // Material Upload State
  const [matName, setMatName] = useState('');
  const [matType, setMatType] = useState<'pdf' | 'slides' | 'video'>('pdf');
  const [matSubjectId, setMatSubjectId] = useState(allSubjects[0]?.id || '');

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
    setShowSubjectModal(true);
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

    handleCloseSubjectModal();
  };

  const handleCloseSubjectModal = () => {
    setNewName('');
    setNewDesc('');
    setNewIcon('⭐');
    setConcepts([{ title: '', icon: '✨', description: '' }]);
    setEditingSubjectId(null);
    setShowSubjectModal(false);
  };

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    const newMaterial: MaterialFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: matName,
      type: matType,
      subjectId: matSubjectId,
      timestamp: Date.now()
    };

    const currentMaterials = user.materials || [];
    onUpdateMaterials([...currentMaterials, newMaterial]);
    setShowMaterialModal(false);
    setMatName('');
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm("Delete this material?")) {
      const updated = (user.materials || []).filter(m => m.id !== id);
      onUpdateMaterials(updated);
    }
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

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'slides': return '📊';
      case 'video': return '🎬';
      default: return '📁';
    }
  };

  if (view === 'materials') {
    return (
      <div className="p-8 max-w-6xl mx-auto font-['Fredoka']">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('overview')} className="w-12 h-12 bg-white rounded-2xl shadow border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50">⬅️</button>
            <h1 className="text-3xl font-black text-slate-800">Classroom Material 📚</h1>
          </div>
          <button 
            onClick={() => setShowMaterialModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black border-b-4 border-blue-700 shadow-lg hover:scale-105 active:translate-y-1 active:border-b-0 transition-all"
          >
            ➕ Add Material
          </button>
        </header>

        <div className="mb-8 p-1 bg-slate-100 rounded-2xl inline-flex">
          <button className="px-6 py-2 bg-white rounded-xl shadow-sm font-black text-blue-500">My Material</button>
          <button className="px-6 py-2 rounded-xl font-black text-slate-400 cursor-not-allowed opacity-50" title="Coming Soon">Public Library</button>
        </div>

        <div className="space-y-12">
          {allSubjects.map(subject => {
            const subjectMaterials = (user.materials || []).filter(m => m.subjectId === subject.id);
            return (
              <div key={subject.id}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{subject.icon || '⭐'}</span>
                  <h3 className="text-2xl font-black text-slate-700 tracking-tight">{subject.title}</h3>
                  <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">{subjectMaterials.length} Items</span>
                </div>
                
                {subjectMaterials.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 p-8 rounded-[2rem] text-center text-slate-400 font-bold italic">
                    No resources added for this subject yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {subjectMaterials.map(mat => (
                      <div key={mat.id} className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-50 relative group hover:shadow-xl transition-all">
                        <button 
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center"
                        >
                          ✕
                        </button>
                        <div className="text-5xl mb-4 text-center">{getFileIcon(mat.type)}</div>
                        <h4 className="font-black text-slate-800 text-center truncate mb-1" title={mat.name}>{mat.name}</h4>
                        <div className="text-[10px] text-slate-400 font-black uppercase text-center tracking-widest">{mat.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showMaterialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowMaterialModal(false)}>
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative animate-zoom-in" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMaterialModal(false)} className="absolute top-8 right-8 text-3xl text-gray-300 hover:text-red-500">✕</button>
              <h3 className="text-3xl font-black text-slate-800 text-center mb-8">Add Resource</h3>
              <form onSubmit={handleUploadMaterial} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-4">File Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Animal Cells PDF" 
                    className="w-full px-8 py-4 rounded-3xl border-4 border-slate-100 bg-slate-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold text-slate-800" 
                    value={matName} 
                    onChange={e => setMatName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-4">Resource Type</label>
                  <select 
                    className="w-full px-8 py-4 rounded-3xl border-4 border-slate-100 bg-slate-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold text-slate-800 appearance-none"
                    value={matType}
                    onChange={e => setMatType(e.target.value as any)}
                  >
                    <option value="pdf">📄 PDF Document</option>
                    <option value="slides">📊 Presentation Slides</option>
                    <option value="video">🎬 Educational Video</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-4">Assign Subject</label>
                  <select 
                    className="w-full px-8 py-4 rounded-3xl border-4 border-slate-100 bg-slate-50/30 focus:border-blue-300 focus:bg-white focus:outline-none text-lg font-bold text-slate-800 appearance-none"
                    value={matSubjectId}
                    onChange={e => setMatSubjectId(e.target.value)}
                  >
                    {allSubjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.title}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white font-black py-5 rounded-[2.5rem] text-2xl shadow-xl border-b-8 border-blue-700 active:translate-y-1 active:border-b-0 transition-all mt-4">Upload Resource</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          className={`col-span-full md:col-span-2 p-10 rounded-[3rem] text-white shadow-xl transition-all relative overflow-hidden border-b-[12px] ${
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

        {appMode === 'teacher' && (
          <div 
            onClick={() => setView('materials')}
            className="bg-white p-10 rounded-[3rem] shadow-xl border-b-[12px] border-slate-100 hover:border-blue-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform shadow-inner">📚</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Classroom Material</h3>
            <p className="text-slate-400 text-sm font-bold">Manage your slides, PDFs, and videos.</p>
          </div>
        )}

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
              handleCloseSubjectModal();
              setShowSubjectModal(true);
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

      {showSubjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={handleCloseSubjectModal}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto relative animate-zoom-in" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseSubjectModal} className="absolute top-8 right-8 text-3xl text-gray-300 hover:text-red-500">✕</button>
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
              <input type="text" placeholder="Subject Name" className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-white focus:border-blue-300 focus:outline-none text-lg font-bold text-black" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <textarea placeholder="Description" className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-white focus:border-blue-300 focus:outline-none text-lg font-bold min-h-[100px] text-black" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-sm font-bold text-gray-500">CONCEPTS</label>
                  <button type="button" onClick={addConceptField} className="text-blue-500 font-bold text-sm">+ Add</button>
                </div>
                {concepts.map((concept, idx) => (
                  <div key={idx} className="flex gap-3">
                    <input type="text" className="w-16 px-2 py-4 rounded-2xl border-4 border-blue-50 bg-white text-center text-xl text-black" value={concept.icon} onChange={(e) => updateConcept(idx, 'icon', e.target.value)} />
                    <input type="text" placeholder="Concept Title" className="flex-1 px-6 py-4 rounded-2xl border-4 border-blue-50 bg-white focus:border-blue-300 focus:outline-none text-lg font-bold text-black" value={concept.title} onChange={(e) => updateConcept(idx, 'title', e.target.value)} required />
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
