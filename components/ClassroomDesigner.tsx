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
    setHistory(prev => [...prev, localDesign].slice(-20));
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
    let newUrls: string[] = exists 
      ? localDesign.posterUrls.filter(u => u !== url)
      : (localDesign.posterUrls.length < 12 ? [...localDesign.posterUrls, url] : localDesign.posterUrls);
    pushHistory({ ...localDesign, posterUrls: newUrls });
  };

  const toggleShelfObject = (emoji: string) => {
    const shelves = localDesign.shelves || [];
    const exists = shelves.includes(emoji);
    let newShelves: string[] = exists 
      ? shelves.filter(e => e !== emoji)
      : (shelves.length < 8 ? [...shelves, emoji] : shelves);
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
          <button onClick={onCancel} className="bg-white hover:bg-gray-50 text-gray-500 font-bold px-6 py-3 rounded-2xl border-b-4 border-gray-200 active:translate-y-1 transition-all">⬅️ Exit</button>
          <button onClick={handleUndo} disabled={history.length === 0} className={`font-bold px-6 py-3 rounded-2xl border-b-4 transition-all ${history.length === 0 ? 'bg-gray-100 text-gray-300 border-gray-200' : 'bg-white text-orange-500 border-orange-200'}`}>↩️ Undo</button>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-600">Room Designer ✨</h2>
          <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">{subjectTitle}</p>
        </div>
        <button onClick={() => onSave(localDesign)} className="bg-green-400 text-white font-bold px-8 py-3 rounded-2xl border-b-4 border-green-600 active:translate-y-1 transition-all shadow-lg">✅ Save</button>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        <div className="relative w-full max-w-5xl aspect-video rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-white bg-white">
          <div onClick={() => setActiveTarget('wall')} className="absolute top-0 w-full h-2/3 cursor-pointer group" style={{ backgroundColor: localDesign.wallColor }}>
             <div className="absolute inset-0" style={{ backgroundImage: getWallPattern(), backgroundSize: localDesign.wallTheme === 'dots' ? '40px 40px' : '100px 100%' }}></div>
             <div className="absolute top-[35%] left-0 right-0 flex justify-center gap-12 -translate-y-1/2">
                <div className="w-[80%] h-4 bg-orange-800/20 rounded-full flex justify-around items-end px-8">
                   {localDesign.shelves?.map((emoji, idx) => (
                     <span key={idx} className="text-4xl mb-1 animate-wiggle">{emoji}</span>
                   ))}
                </div>
             </div>
            <div className="absolute top-4 left-0 right-0 px-12 flex flex-wrap gap-4 items-start pointer-events-none">
              {localDesign.posterUrls.map((url, idx) => (
                <img key={idx} src={url} className="w-16 h-16 object-contain animate-float-preview" />
              ))}
            </div>
          </div>
          <div onClick={() => setActiveTarget('floor')} className="absolute bottom-0 w-full h-1/3 cursor-pointer group" style={{ backgroundColor: localDesign.floorColor }}>
             <div className="absolute inset-0" style={{ backgroundImage: getFloorPattern() }}></div>
             {localDesign.mascot && localDesign.mascot !== 'none' && (
               <div className="absolute bottom-6 left-12 text-7xl animate-bounce-mascot">
                 {MASCOTS.find(m => m.id === localDesign.mascot)?.emoji}
               </div>
             )}
          </div>
        </div>

        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
           {['stickers', 'shelves', 'mascot', 'music'].map((target) => (
             <button key={target} onClick={() => setActiveTarget(target as any)} className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl hover:scale-110 active:translate-y-1 transition-all border-b-4 border-slate-200">
               {target === 'stickers' ? '🌈' : target === 'shelves' ? '📦' : target === 'mascot' ? '🐶' : '🎵'}
             </button>
           ))}
        </div>

        {activeTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setActiveTarget(null)}>
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 capitalize">{activeTarget} Settings</h3>
                <button onClick={() => setActiveTarget(null)} className="text-3xl text-gray-300">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {activeTarget === 'wall' && (
                  <div className="grid grid-cols-5 gap-3">
                    {WALL_COLORS.map(color => (
                      <button key={color} onClick={() => pushHistory({ ...localDesign, wallColor: color })} className={`aspect-square rounded-xl border-4 ${localDesign.wallColor === color ? 'border-blue-500' : 'border-gray-100'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
                {activeTarget === 'floor' && (
                  <div className="grid grid-cols-4 gap-3">
                    {FLOOR_COLORS.map(color => (
                      <button key={color} onClick={() => pushHistory({ ...localDesign, floorColor: color })} className={`aspect-square rounded-xl border-4 ${localDesign.floorColor === color ? 'border-orange-500' : 'border-gray-100'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
                {activeTarget === 'stickers' && (
                  <div className="grid grid-cols-4 gap-4">
                    {STICKERS.map(s => (
                      <button key={s.id} onClick={() => toggleSticker(s.url)} className={`aspect-square rounded-2xl border-4 p-3 ${localDesign.posterUrls.includes(s.url) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'}`}>
                        <img src={s.url} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
                {activeTarget === 'shelves' && (
                  <div className="grid grid-cols-4 gap-4">
                    {SHELF_OBJECTS.map(emoji => (
                      <button key={emoji} onClick={() => toggleShelfObject(emoji)} className={`aspect-square rounded-2xl border-4 text-4xl flex items-center justify-center ${localDesign.shelves?.includes(emoji) ? 'border-green-400 bg-green-50' : 'border-gray-100'}`}>{emoji}</button>
                    ))}
                  </div>
                )}
                {activeTarget === 'mascot' && (
                  <div className="grid grid-cols-2 gap-4">
                    {MASCOTS.map(m => (
                      <button key={m.id} onClick={() => pushHistory({ ...localDesign, mascot: m.id })} className={`p-4 rounded-3xl border-4 flex flex-col items-center gap-2 ${localDesign.mascot === m.id ? 'border-rose-400 bg-rose-50' : 'border-gray-100'}`}>
                        <span className="text-5xl">{m.emoji}</span>
                        <span className="font-bold text-gray-700">{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {activeTarget === 'music' && (
                  <div className="space-y-4">
                    {MUSIC_OPTIONS.map(opt => (
                      <div key={opt.id} className="flex gap-2">
                        <button onClick={() => pushHistory({ ...localDesign, ambientMusic: opt.id })} className={`flex-1 p-4 rounded-3xl border-4 flex items-center gap-4 ${localDesign.ambientMusic === opt.id ? 'border-purple-400 bg-purple-50' : 'border-gray-100'}`}>
                          <span className="text-3xl">{opt.icon}</span>
                          <span className="font-bold text-gray-700">{opt.label}</span>
                        </button>
                        {opt.preview && (
                          <button onClick={() => handlePreviewMusic(opt.preview)} className="w-16 bg-blue-100 rounded-3xl text-2xl">{previewingMusic === opt.preview ? '⏸️' : '▶️'}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setActiveTarget(null)} className="w-full mt-6 bg-blue-500 text-white font-bold py-4 rounded-3xl text-xl shadow-lg">Done</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-preview { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes bounce-mascot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float-preview { animation: float-preview 4s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
        .animate-bounce-mascot { animation: bounce-mascot 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ClassroomDesigner;