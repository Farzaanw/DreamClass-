
import React, { useEffect, useRef, useState } from 'react';
import { Subject, Concept, ClassroomDesign } from '../types';
import { MUSIC_OPTIONS, MASCOTS } from '../constants';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-2xl" }) => {
  const letters = "DreamClass".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500", "text-pink-500", "text-teal-500", "text-cyan-500"
  ];
  return (
    <span className={`${size} font-bold tracking-tight flex items-center gap-0.5 filter drop-shadow-md select-none`}>
      {letters.map((l, i) => (
        <span key={i} className={colors[i % colors.length]}>{l}</span>
      ))}
    </span>
  );
};

interface ClassroomViewProps {
  subject: Subject;
  design: ClassroomDesign;
  onBack: () => void;
  onSelectConcept: (concept: Concept) => void;
}

const ClassroomView: React.FC<ClassroomViewProps> = ({ subject, design, onBack, onSelectConcept }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(0);
  const [isMascotCelebrating, setIsMascotCelebrating] = useState(false);

  const activeMusic = MUSIC_OPTIONS.find(m => m.id === design.ambientMusic);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (activeMusic && activeMusic.preview && activeMusic.id !== 'none') {
      const audio = new Audio(activeMusic.preview);
      audio.loop = true;
      audio.volume = 0.2;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [design.ambientMusic]);

  useEffect(() => {
    if (activeMusic?.lyrics && showLyrics) {
      const interval = setInterval(() => {
        setCurrentLyricIdx(prev => (prev + 1) % activeMusic.lyrics!.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeMusic, showLyrics]);

  const handleMascotClick = () => {
    setIsMascotCelebrating(true);
    setTimeout(() => setIsMascotCelebrating(false), 2000);
  };

  const getWallPattern = () => {
    if (design.wallTheme === 'stripes') return 'linear-gradient(90deg, rgba(0,0,0,0.03) 50%, transparent 50%)';
    if (design.wallTheme === 'dots') return 'radial-gradient(rgba(0,0,0,0.05) 2px, transparent 2px)';
    return 'none';
  };

  const getFloorPattern = () => {
    if (design.floorTheme === 'wood') return 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 100px)';
    if (design.floorTheme === 'tile') return 'repeating-conic-gradient(rgba(0,0,0,0.03) 0% 25%, transparent 0% 50%) 50% / 100px 100px';
    return 'none';
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-['Fredoka']">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-5 flex justify-between items-center z-50 border-b-4 border-black/5 shadow-md">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 rounded-[1.5rem] bg-white border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 shadow-sm active:translate-y-1">
            <span className="text-3xl">⬅️</span>
          </button>
          <div className="hidden sm:block">
            <RainbowLogo size="text-4xl" />
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">Interactive Magic Lab</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
            {activeMusic && activeMusic.id !== 'none' && (
                <button 
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${showLyrics ? 'bg-purple-500 text-white border-purple-600 shadow-inner' : 'bg-purple-50 text-purple-500 border-purple-100 hover:bg-purple-100'}`}
                >
                    <span className="text-xl">🎤</span>
                    <span className="text-xs font-bold uppercase">{showLyrics ? 'Lyrics On' : 'Sing Along'}</span>
                </button>
            )}
            <div className={`px-8 py-3 ${subject.color} text-white rounded-full font-bold text-lg shadow-lg border-b-4 border-black/10 uppercase`}>
              {subject.title}
            </div>
        </div>
      </div>

      {/* Main Room Viewport */}
      <div className="flex-1 relative transition-colors duration-1000" style={{ backgroundColor: design.wallColor }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: getWallPattern(), backgroundSize: design.wallTheme === 'dots' ? '40px 40px' : '100px 100%' }}></div>

        {/* Lyrics Overlay */}
        {showLyrics && activeMusic?.lyrics && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl text-center z-40 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-xl p-12 rounded-[5rem] shadow-2xl border-4 border-white animate-bounce-slow mx-6">
              <h3 className="text-6xl font-bold text-gray-800 transition-all duration-500 italic leading-tight">
                "{activeMusic.lyrics[currentLyricIdx]}"
              </h3>
            </div>
          </div>
        )}

        {/* Shelves - High up */}
        {design.shelves && design.shelves.length > 0 && (
          <div className="absolute top-[20%] left-0 right-0 flex justify-center z-10">
            <div className="w-[75%] h-5 bg-black/5 rounded-full relative flex justify-around items-end px-16">
               <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10 rounded-full"></div>
               {design.shelves.map((emoji, idx) => (
                 <span key={idx} className="text-6xl mb-1.5 animate-wiggle hover:scale-150 transition-transform cursor-help" style={{ animationDelay: `${idx * 0.25}s` }}>
                   {emoji}
                 </span>
               ))}
            </div>
          </div>
        )}

        {/* Stickers */}
        <div className="absolute top-10 w-full flex justify-center gap-16 flex-wrap px-40 pointer-events-none z-10">
          {design.posterUrls.map((url, i) => (
            <div key={i} className="w-28 h-28 animate-float-slow flex items-center justify-center pointer-events-auto" style={{ animationDelay: `${i * 0.7}s` }}>
              <img src={url} alt="Sticker" className="max-w-full max-h-full drop-shadow-2xl transition-transform hover:scale-125 hover:rotate-12" />
            </div>
          ))}
        </div>

        {/* Floor Area */}
        <div className="absolute bottom-0 w-full h-[30%] border-t-8 border-black/5 shadow-[inset_0_10px_10px_rgba(0,0,0,0.05)] z-0" style={{ backgroundColor: design.floorColor }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: getFloorPattern() }}></div>
          
          {/* Mascot - Placed in the bottom left corner as requested */}
          {design.mascot && design.mascot !== 'none' && (
            <div 
              onClick={handleMascotClick}
              className={`absolute bottom-10 left-16 text-9xl cursor-pointer transition-all z-30 ${isMascotCelebrating ? 'animate-celebrate scale-125 glow' : 'animate-bounce-pet'}`}
            >
              {MASCOTS.find(m => m.id === design.mascot)?.emoji}
              {isMascotCelebrating && <div className="absolute -top-16 -right-16 text-6xl animate-ping">✨</div>}
            </div>
          )}
        </div>

        {/* Concept Cards - Smaller size, vertical separation, dark grey high-contrast icons */}
        <div className="absolute top-[38%] bottom-[12%] left-0 right-0 z-20 overflow-x-auto custom-scrollbar snap-x snap-mandatory flex items-center">
          <div className="flex items-center justify-center min-w-full gap-8 px-24">
            {subject.concepts.map((concept, idx) => (
              <div 
                key={concept.id}
                onClick={() => onSelectConcept(concept)}
                className="group cursor-pointer transform transition-all duration-300 flex-shrink-0 snap-center"
              >
                <div 
                  className="w-40 h-52 bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center p-5 text-center border-b-[10px] border-gray-100 group-hover:border-blue-400 animate-float-card transition-all" 
                  style={{ animationDelay: `${idx * 0.6}s` }}
                >
                  <div className="w-14 h-14 bg-gray-700 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:bg-gray-800 group-hover:rotate-12 transition-all shadow-xl ring-2 ring-black/5">
                    {concept.icon || '📚'}
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                    {concept.title}
                  </h3>
                  <p className="text-[9px] text-gray-400 font-semibold leading-relaxed line-clamp-3">
                    {concept.description}
                  </p>
                  <div className="mt-auto bg-blue-500 text-white text-[8px] px-5 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-3 group-hover:translate-y-0 uppercase tracking-tighter">
                    Play Now! 🚀
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-card { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-15px) rotate(4deg); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
        @keyframes bounce-pet { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes celebrate { 0%, 100% { transform: scale(1) rotate(0); } 25% { transform: scale(1.4) rotate(-15deg); } 75% { transform: scale(1.4) rotate(15deg); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }

        .animate-float-card { animation: float-card 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 5s ease-in-out infinite; }
        .animate-bounce-pet { animation: bounce-pet 4s ease-in-out infinite; }
        .animate-celebrate { animation: celebrate 0.5s ease-in-out 4; }
        .animate-wiggle { animation: wiggle 3s ease-in-out infinite; }

        .custom-scrollbar::-webkit-scrollbar { height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.05); border-radius: 20px; margin: 0 100px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.4); border-radius: 20px; border: 4px solid rgba(255, 255, 255, 0.8); }
        .glow { filter: drop-shadow(0 0 30px rgba(255,255,255,0.95)); }
      `}</style>
    </div>
  );
};

export default ClassroomView;
