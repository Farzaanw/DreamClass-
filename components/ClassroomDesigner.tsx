
import React, { useState, useRef, useEffect } from 'react';
import { ClassroomDesign } from '../types';
import { WALL_COLORS, FLOOR_COLORS, STICKERS, MUSIC_OPTIONS } from '../constants';

interface ClassroomDesignerProps {
  subjectTitle: string;
  design: ClassroomDesign;
  onSave: (design: ClassroomDesign) => void;
  onCancel: () => void;
}

type EditTarget = 'wall' | 'floor' | 'stickers' | 'music' | null;

const ClassroomDesigner: React.FC<ClassroomDesignerProps> = ({ subjectTitle, design, onSave, onCancel }) => {
  const [localDesign, setLocalDesign] = useState<ClassroomDesign>({ 
    ...design, 
    posterUrls: design.posterUrls || [],
    ambientMusic: design.ambientMusic || 'none'
  });
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
    if (exists) {
      setLocalDesign({ ...localDesign, posterUrls: localDesign.posterUrls.filter(u => u !== url) });
    } else if (localDesign.posterUrls.length < 12) {
      setLocalDesign({ ...localDesign, posterUrls: [...localDesign.posterUrls, url] });
    }
  };

  return (
    <div className="h-screen w-full bg-[#F0F9FF] flex flex-col font-['Fredoka'] overflow-hidden">
      <header className="p-4 flex justify-between items-center bg-white border-b-4 border-blue-100 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onCancel();
            }} 
            className="bg-white hover:bg-red-50 text-red-500 font-bold px-6 py-3 rounded-2xl border-b-4 border-red-200 active:translate-y-1 transition-all text-xl"
          >
            ❌ Cancel
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-600">Magic Room Maker ✨</h2>
          <p className="text-blue-400 font-bold">Designing: {subjectTitle}</p>
        </div>
        <button 
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            onSave(localDesign);
          }} 
          className="bg-green-400 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-2xl border-b-4 border-green-600 active:translate-y-1 transition-all text-xl shadow-lg"
        >
          ✅ Save Room
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-6">
        <div className="relative w-full max-w-5xl aspect-video rounded-[4rem] shadow-2xl overflow-hidden border-[20px] border-white bg-white">
          
          {/* Wall Layer */}
          <div 
            onClick={() => setActiveTarget('wall')}
            className="absolute top-0 w-full h-2/3 cursor-pointer group transition-colors duration-500"
            style={{ backgroundColor: localDesign.wallColor }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 px-8 py-3 rounded-full font-bold text-blue-500 shadow-2xl border-2 border-blue-100 animate-bounce">
                Paint Walls 🖌️
              </div>
            </div>

            {/* Sticker Preview Area */}
            <div className="absolute top-8 left-0 right-0 px-12 flex flex-wrap gap-4 items-start pointer-events-none overflow-hidden">
              {localDesign.posterUrls.map((url, idx) => (
                <img 
                  key={`${url}-${idx}`} 
                  src={url} 
                  className="w-16 h-16 object-contain animate-float-preview pointer-events-auto cursor-pointer hover:scale-125" 
                  style={{ animationDelay: `${idx * 0.2}s` }}
                  onClick={(e) => { e.stopPropagation(); toggleSticker(url); }}
                />
              ))}
            </div>
          </div>

          {/* Floor Layer */}
          <div 
            onClick={() => setActiveTarget('floor')}
            className="absolute bottom-0 w-full h-1/3 cursor-pointer group transition-colors duration-500 border-t-8 border-black/5"
            style={{ backgroundColor: localDesign.floorColor }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 px-8 py-3 rounded-full font-bold text-orange-500 shadow-2xl border-2 border-orange-100 animate-bounce">
                New Carpet 🧶
              </div>
            </div>
          </div>

          {/* Tools Menu */}
          <div className="absolute top-8 left-8 flex flex-col gap-4 pointer-events-none z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTarget('stickers'); }}
              className={`pointer-events-auto p-5 rounded-[2.5rem] shadow-xl border-b-8 transition-all flex flex-col items-center gap-1 ${activeTarget === 'stickers' ? 'bg-yellow-500 border-yellow-700 scale-110 rotate-6' : 'bg-yellow-400 border-yellow-600 hover:rotate-3'}`}
            >
              <span className="text-4xl">🌈</span>
              <span className="text-[10px] font-bold text-yellow-900 uppercase">Stickers</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTarget('music'); }}
              className={`pointer-events-auto p-5 rounded-[2.5rem] shadow-xl border-b-8 transition-all flex flex-col items-center gap-1 ${activeTarget === 'music' ? 'bg-purple-500 border-purple-700 scale-110' : 'bg-purple-400 border-purple-600 hover:-rotate-3'}`}
            >
              <span className="text-4xl">🎵</span>
              <span className="text-[10px] font-bold text-purple-900 uppercase">Music</span>
            </button>
          </div>
        </div>

        {/* Toolbox Modal */}
        {activeTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setActiveTarget(null)}>
            <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-10 animate-toolbox" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800">
                  {activeTarget === 'wall' && '🖌️ Wall Paint'}
                  {activeTarget === 'floor' && '🧶 Soft Carpet'}
                  {activeTarget === 'stickers' && '🌈 Sticker Box'}
                  {activeTarget === 'music' && '🎶 Room Jams'}
                </h3>
                <button onClick={() => setActiveTarget(null)} className="text-4xl text-gray-300 hover:text-red-500">✕</button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto scrollbar-hide p-2">
                {activeTarget === 'wall' && (
                  <div className="grid grid-cols-5 gap-4">
                    {WALL_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setLocalDesign({ ...localDesign, wallColor: color })}
                        className={`aspect-square rounded-3xl border-4 transition-all hover:scale-105 ${localDesign.wallColor === color ? 'border-blue-500 shadow-lg scale-110' : 'border-gray-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                {activeTarget === 'floor' && (
                  <div className="grid grid-cols-4 gap-4">
                    {FLOOR_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setLocalDesign({ ...localDesign, floorColor: color })}
                        className={`aspect-square rounded-3xl border-4 transition-all hover:scale-105 ${localDesign.floorColor === color ? 'border-orange-500 shadow-lg scale-110' : 'border-gray-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                {activeTarget === 'stickers' && (
                  <div className="grid grid-cols-4 gap-4">
                    {STICKERS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleSticker(s.url)}
                        className={`aspect-square rounded-3xl border-4 p-4 transition-all flex flex-col items-center justify-center gap-1 ${localDesign.posterUrls.includes(s.url) ? 'bg-yellow-50 border-yellow-400 shadow-md scale-105' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                      >
                        <img src={s.url} className="w-12 h-12 object-contain" />
                        <span className="text-[9px] font-bold text-gray-500 uppercase">{s.id}</span>
                      </button>
                    ))}
                  </div>
                )}
                {activeTarget === 'music' && (
                  <div className="space-y-4">
                    {MUSIC_OPTIONS.map(opt => (
                      <div key={opt.id} className="flex gap-3">
                        <button
                          onClick={() => setLocalDesign({ ...localDesign, ambientMusic: opt.id })}
                          className={`flex-1 p-6 rounded-[2rem] border-4 flex flex-col transition-all ${localDesign.ambientMusic === opt.id ? 'bg-purple-50 border-purple-400 shadow-md' : 'bg-gray-50 border-gray-100'}`}
                        >
                          <div className="flex items-center gap-4 w-full">
                            <span className="text-3xl">{opt.icon}</span>
                            <div className="text-left">
                              <span className="text-xl font-bold text-gray-700 block">{opt.label}</span>
                              {opt.artist && <span className="text-xs font-bold text-purple-400 uppercase">{opt.artist}</span>}
                            </div>
                            {opt.lyrics && (
                              <span className="ml-auto bg-purple-500 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse">
                                WITH LYRICS
                              </span>
                            )}
                          </div>
                        </button>
                        {opt.preview && (
                          <button 
                            onClick={() => handlePreviewMusic(opt.preview)}
                            className={`w-16 rounded-[2rem] border-4 flex items-center justify-center text-xl transition-all ${previewingMusic === opt.preview ? 'bg-red-400 border-red-600 text-white' : 'bg-blue-100 border-blue-200 text-blue-500'}`}
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
                className="w-full mt-10 bg-blue-500 text-white font-bold py-5 rounded-[2rem] text-2xl shadow-xl border-b-8 border-blue-700 active:translate-y-1 transition-all"
              >
                Close Toolbox
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-preview {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes toolbox {
          from { transform: scale(0.9) translateY(40px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-float-preview { animation: float-preview 3s ease-in-out infinite; }
        .animate-toolbox { animation: toolbox 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ClassroomDesigner;
