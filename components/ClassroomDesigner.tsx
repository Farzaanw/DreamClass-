
import React, { useState, useRef, useEffect } from 'react';
import { ClassroomDesign } from '../types';
import { WALL_COLORS, FLOOR_COLORS, STICKERS, MUSIC_OPTIONS, MASCOTS, SHELF_OBJECTS } from '../constants';

interface ClassroomDesignerProps {
  subjectTitle: string;
  design: ClassroomDesign;
  onSave: (design: ClassroomDesign) => void;
  onCancel: () => void;
}

type EditTarget = 'wall' | 'floor' | 'stickers' | 'music' | 'mascot' | 'shelves' | null;

const ClassroomDesigner: React.FC<ClassroomDesignerProps> = ({ subjectTitle, design, onSave, onCancel }) => {
  const [localDesign, setLocalDesign] = useState<ClassroomDesign>({ 
    ...design, 
    posterUrls: design.posterUrls || [],
    ambientMusic: design.ambientMusic || 'none',
    shelves: design.shelves || [],
    mascot: design.mascot || 'none',
    wallTheme: design.wallTheme || 'plain',
    floorTheme: design.floorTheme || 'plain'
  });
  
  // History stack for undo functionality
  const [history, setHistory] = useState<ClassroomDesign[]>([]);
  const [activeTarget, setActiveTarget] = useState<EditTarget>(null);
  const [previewingMusic, setPreviewingMusic] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const pushHistory = (newState: ClassroomDesign) => {
    setHistory(prev => [...prev, localDesign].slice(-20)); // Limit history to 20 steps
    setLocalDesign(newState);
  };

  const handlePreviewMusic = (url: string) => {
    if (previewingMusic === url) {
      audioRef.current?.pause();
      setPreviewingMusic(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.play();
      audioRef.current = audio;
      setPreviewingMusic(url);
      audio.onended = () => setPreviewingMusic(null);
    }
  };

  const toggleSticker = (url: string) => {
    const exists = localDesign.posterUrls.includes(url);
    let newUrls: string[];
    if (exists) {
      newUrls = localDesign.posterUrls.filter(u => u !== url);
    } else if (localDesign.posterUrls.length < 12) {
      newUrls = [...localDesign.posterUrls, url];
    } else {
      return;
    }
    pushHistory({ ...localDesign, posterUrls: newUrls });
  };

  const toggleShelfObject = (emoji: string) => {
    const shelves = localDesign.shelves || [];
    const exists = shelves.includes(emoji);
    let newShelves: string[];
    if (exists) {
      newShelves = shelves.filter(e => e !== emoji);
    } else if (shelves.length < 8) {
      newShelves = [...shelves, emoji];
    } else {
      return;
    }
    pushHistory({ ...localDesign, shelves: newShelves });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setLocalDesign(previousState);
    setHistory(prev => prev.slice(0, -1));
  };

  const getWallPattern = () => {
    if (localDesign.wallTheme === 'stripes') return 'linear-gradient(90deg, rgba(0,0,0,0.05) 50%, transparent 50%)';
    if (localDesign.wallTheme === 'dots') return 'radial-gradient(rgba(0,0,0,0.1) 2px, transparent 2px)';
    return 'none';
  };

  const getFloorPattern = () => {
    if (localDesign.floorTheme === 'wood') return 'repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 100px)';
    if (localDesign.floorTheme === 'tile') return 'repeating-conic-gradient(rgba(0,0,0,0.05) 0% 25%, transparent 0% 50%) 50% / 100px 100px';
    return 'none';
  };

  return (
    <div className="h-screen w-full bg-[#F0F9FF] flex flex-col font-['Fredoka'] overflow-hidden">
      <header className="p-4 flex justify-between items-center bg-white border-b-4 border-blue-100 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel} 
            className="bg-white hover:bg-gray-50 text-gray-500 font-bold px-6 py-3 rounded-2xl border-b-4 border-gray-200 active:translate-y-1 transition-all text-lg"
          >
            ⬅️ Exit
          </button>
          <button 
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`font-bold px-6 py-3 rounded-2xl border-b-4 transition-all text-lg active:translate-y-1 ${history.length === 0 ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-orange-50 text-orange-500 border-orange-200'}`}
          >
            ↩️ Undo
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-600">Magic Room Maker ✨</h2>
          <p className="text-blue-400 font-bold uppercase text-xs tracking-widest">Designing: {subjectTitle}</p>
        </div>
        
        <button 
          onClick={() => onSave(localDesign)} 
          className="bg-green-400 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-2xl border-b-4 border-green-600 active:translate-y-1 transition-all text-xl shadow-lg"
        >
          ✅ Finish
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        {/* Main Preview Container */}
        <div className="relative w-full max-w-5xl aspect-video rounded-[4rem] shadow-2xl overflow-hidden border-[16px] border-white bg-white">
          
          {/* Wall Layer - Interaction point */}
          <div 
            onClick={() => setActiveTarget('wall')}
            className="absolute top-0 w-full h-2/3 cursor-pointer group transition-all duration-500 hover:brightness-105"
            style={{ backgroundColor: localDesign.wallColor }}
          >
             <div className="absolute inset-0" style={{ backgroundImage: getWallPattern(), backgroundSize: localDesign.wallTheme === 'dots' ? '40px 40px' : '100px 100%' }}></div>
             
             {/* Interaction Prompt Overlay */}
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <span className="bg-black/60 text-white px-6 py-3 rounded-full font-bold shadow-xl border-2 border-white/20">Click to Change Wall 🎨</span>
             </div>

             {/* Shelves Visualization */}
             <div className="absolute top-[35%] left-0 right-0 flex justify-center gap-12 -translate-y-1/2">
                <div className="w-[80%] h-4 bg-orange-800/20 rounded-full flex justify-around items-end px-8 border-b border-white/10">
                   {localDesign.shelves?.map((emoji, idx) => (
                     <span key={idx} className="text-4xl mb-1 animate-wiggle" style={{ animationDelay: `${idx * 0.1}s` }}>{emoji}</span>
                   ))}
                </div>
             </div>

            {/* Stickers Visualization */}
            <div className="absolute top-4 left-0 right-0 px-12 flex flex-wrap gap-4 items-start pointer-events-none">
              {localDesign.posterUrls.map((url, idx) => (
                <img 
                  key={`${url}-${idx}`} 
                  src={url} 
                  className="w-16 h-16 object-contain animate-float-preview pointer-events-auto cursor-pointer hover:scale-125 transition-transform" 
                  style={{ animationDelay: `${idx * 0.2}s` }}
                  onClick={(e) => { e.stopPropagation(); toggleSticker(url); }}
                />
              ))}
            </div>
          </div>

          {/* Floor Layer - Interaction point */}
          <div 
            onClick={() => setActiveTarget('floor')}
            className="absolute bottom-0 w-full h-1/3 cursor-pointer group transition-all duration-500 border-t-8 border-black/5 hover:brightness-105"
            style={{ backgroundColor: localDesign.floorColor }}
          >
             <div className="absolute inset-0" style={{ backgroundImage: getFloorPattern() }}></div>
             
             {/* Interaction Prompt Overlay */}
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <span className="bg-black/60 text-white px-6 py-3 rounded-full font-bold shadow-xl border-2 border-white/20">Click to Change Carpet 🧶</span>
             </div>

             {/* Mascot - Placed in the bottom left corner */}
             {localDesign.mascot && localDesign.mascot !== 'none' && (
               <div 
                 className="absolute bottom-6 left-12 text-8xl animate-bounce-mascot cursor-pointer hover:glow transition-all" 
                 onClick={(e) => { e.stopPropagation(); setActiveTarget('mascot'); }}
               >
                 {MASCOTS.find(m => m.id === localDesign.mascot)?.emoji}
               </div>
             )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
           {[
             { id: 'stickers', icon: '🌈', color: 'bg-yellow-400', label: 'Stickers' },
             { id: 'shelves', icon: '📦', color: 'bg-green-400', label: 'Shelves' },
             { id: 'mascot', icon: '🐶', color: 'bg-rose-400', label: 'Choose Pet' },
             { id: 'music', icon: '🎵', color: 'bg-purple-400', label: 'Class Jams' },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTarget(item.id as EditTarget)}
               className={`${item.color} w-20 h-20 rounded-[2rem] shadow-xl flex items-center justify-center text-4xl border-b-4 border-black/20 hover:scale-110 active:translate-y-1 transition-all ${activeTarget === item.id ? 'ring-4 ring-white' : ''}`}
               title={item.label}
             >
               {item.icon}
             </button>
           ))}
        </div>

        {/* Toolbox Modal */}
        {activeTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setActiveTarget(null)}>
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-toolbox overflow-hidden flex flex-col max-h-[85vh] border-b-[16px] border-blue-50" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                    {activeTarget === 'wall' ? '🖌️' : activeTarget === 'floor' ? '🧶' : activeTarget === 'stickers' ? '🌈' : activeTarget === 'mascot' ? '🐶' : activeTarget === 'shelves' ? '📦' : '🎵'}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 uppercase tracking-tight">
                    {activeTarget === 'wall' && 'Wall Painter'}
                    {activeTarget === 'floor' && 'Carpet Weaver'}
                    {activeTarget === 'stickers' && 'Sticker Box'}
                    {activeTarget === 'music' && 'Class Jams'}
                    {activeTarget === 'mascot' && 'Pick a Mascot'}
                    {activeTarget === 'shelves' && 'Shelf Trinkets'}
                  </h3>
                </div>
                <button onClick={() => setActiveTarget(null)} className="text-4xl text-gray-300 hover:text-red-500 transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-10">
                {activeTarget === 'wall' && (
                  <>
                    <div className="grid grid-cols-5 gap-4">
                      {WALL_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => pushHistory({ ...localDesign, wallColor: color })}
                          className={`aspect-square rounded-2xl border-4 transition-all hover:scale-110 ${localDesign.wallColor === color ? 'border-blue-500 shadow-xl ring-4 ring-blue-100' : 'border-gray-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-400 mb-4 uppercase text-xs tracking-widest">Texture & Pattern</h4>
                      <div className="flex gap-4">
                        {['plain', 'stripes', 'dots'].map(theme => (
                          <button
                            key={theme}
                            onClick={() => pushHistory({ ...localDesign, wallTheme: theme as any })}
                            className={`flex-1 py-5 rounded-2xl border-4 font-bold capitalize transition-all text-lg ${localDesign.wallTheme === theme ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white'}`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {activeTarget === 'floor' && (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      {FLOOR_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => pushHistory({ ...localDesign, floorColor: color })}
                          className={`aspect-square rounded-2xl border-4 transition-all hover:scale-110 ${localDesign.floorColor === color ? 'border-orange-500 shadow-xl ring-4 ring-orange-100' : 'border-gray-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-400 mb-4 uppercase text-xs tracking-widest">Carpet Style</h4>
                      <div className="flex gap-4">
                        {['plain', 'wood', 'tile'].map(theme => (
                          <button
                            key={theme}
                            onClick={() => pushHistory({ ...localDesign, floorTheme: theme as any })}
                            className={`flex-1 py-5 rounded-2xl border-4 font-bold capitalize transition-all text-lg ${localDesign.floorTheme === theme ? 'bg-orange-50 border-orange-400 text-orange-600 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white'}`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {activeTarget === 'stickers' && (
                  <div className="grid grid-cols-4 gap-6">
                    {STICKERS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleSticker(s.url)}
                        className={`aspect-square rounded-[2rem] border-4 p-5 transition-all flex flex-col items-center justify-center gap-2 ${localDesign.posterUrls.includes(s.url) ? 'bg-yellow-50 border-yellow-400 shadow-lg scale-105' : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 hover:bg-white'}`}
                      >
                        <img src={s.url} className="w-14 h-14 object-contain" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{s.id}</span>
                      </button>
                    ))}
                  </div>
                )}
                {activeTarget === 'mascot' && (
                  <div className="grid grid-cols-2 gap-6 pb-4">
                    {MASCOTS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => pushHistory({ ...localDesign, mascot: m.id })}
                        className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-3 ${localDesign.mascot === m.id ? 'bg-rose-50 border-rose-400 shadow-xl scale-105' : 'bg-gray-50 border-gray-100 hover:bg-white'}`}
                      >
                        <span className="text-7xl">{m.emoji}</span>
                        <span className="font-bold text-gray-700 text-lg">{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {activeTarget === 'shelves' && (
                  <div className="grid grid-cols-4 gap-6">
                    {SHELF_OBJECTS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => toggleShelfObject(emoji)}
                        className={`aspect-square rounded-[2rem] border-4 text-5xl transition-all flex items-center justify-center ${localDesign.shelves?.includes(emoji) ? 'bg-green-50 border-green-400 scale-105 shadow-lg' : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 hover:bg-white'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {activeTarget === 'music' && (
                  <div className="space-y-6 pb-4">
                    {MUSIC_OPTIONS.map(opt => (
                      <div key={opt.id} className="flex gap-4">
                        <button
                          onClick={() => pushHistory({ ...localDesign, ambientMusic: opt.id })}
                          className={`flex-1 p-6 rounded-[2.5rem] border-4 flex flex-col transition-all ${localDesign.ambientMusic === opt.id ? 'bg-purple-50 border-purple-400 shadow-xl' : 'bg-gray-50 border-gray-100 hover:bg-white'}`}
                        >
                          <div className="flex items-center gap-6 w-full">
                            <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                              {opt.icon}
                            </div>
                            <div className="text-left">
                              <span className="text-2xl font-bold text-gray-700 block">{opt.label}</span>
                              {opt.artist && <span className="text-sm font-bold text-purple-400 uppercase tracking-widest">{opt.artist}</span>}
                            </div>
                          </div>
                        </button>
                        {opt.preview && (
                          <button 
                            onClick={() => handlePreviewMusic(opt.preview)}
                            className={`w-20 rounded-[2.5rem] border-4 flex items-center justify-center text-2xl transition-all ${previewingMusic === opt.preview ? 'bg-red-400 border-red-600 text-white animate-pulse' : 'bg-blue-100 border-blue-200 text-blue-500 hover:bg-blue-200'}`}
                          >
                            {previewingMusic === opt.preview ? '⏸️' : '▶️'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setActiveTarget(null)}
                className="w-full mt-10 bg-blue-500 text-white font-bold py-6 rounded-[2.5rem] text-2xl shadow-xl border-b-[8px] border-blue-700 active:translate-y-1 active:border-b-0 transition-all hover:bg-blue-600"
              >
                Magic Complete! ✨
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-preview {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes toolbox {
          from { transform: scale(0.9) translateY(40px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes bounce-mascot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float-preview { animation: float-preview 4s ease-in-out infinite; }
        .animate-toolbox { animation: toolbox 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
        .animate-bounce-mascot { animation: bounce-mascot 3s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .glow { filter: drop-shadow(0 0 20px rgba(255,255,255,0.9)); }
      `}</style>
    </div>
  );
};

export default ClassroomDesigner;
