
import React, { useEffect, useRef, useState } from 'react';
import { Subject, Concept, ClassroomDesign } from '../types';
import { MUSIC_OPTIONS } from '../constants';

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

  const activeMusic = MUSIC_OPTIONS.find(m => m.id === design.ambientMusic);

  useEffect(() => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (activeMusic && activeMusic.preview && activeMusic.id !== 'none') {
      const audio = new Audio(activeMusic.preview);
      audio.loop = true;
      audio.volume = 0.25; // Adjusted volume for background
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio play deferred until user interaction.", error);
        });
      }
      
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [design.ambientMusic]);

  // Lyric rotation logic
  useEffect(() => {
    if (activeMusic?.lyrics && showLyrics) {
      const interval = setInterval(() => {
        setCurrentLyricIdx(prev => (prev + 1) % activeMusic.lyrics!.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeMusic, showLyrics]);

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-['Fredoka']">
      {/* Header bar */}
      <div className="bg-white/95 backdrop-blur-md p-5 flex justify-between items-center z-30 border-b-4 border-black/5 shadow-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-14 h-14 rounded-[1.5rem] bg-white border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:translate-y-1"
          >
            <span className="text-3xl">⬅️</span>
          </button>
          <div className="hidden sm:block">
            <h2 className="text-4xl font-bold text-gray-800 tracking-tight">{subject.title}</h2>
            <p className="text-gray-400 font-medium text-sm">Interactive Classroom Room</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
            {activeMusic && activeMusic.id !== 'none' && (
                <button 
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${
                    showLyrics 
                      ? 'bg-purple-500 text-white border-purple-600 shadow-inner' 
                      : 'bg-purple-50 text-purple-500 border-purple-100 hover:bg-purple-100'
                  }`}
                >
                    <span className="text-xl">🎤</span>
                    <span className="text-xs font-bold uppercase">{showLyrics ? 'Lyrics On' : 'Sing Along'}</span>
                </button>
            )}
            <div className={`px-8 py-3 ${subject.color} text-white rounded-full font-bold text-lg shadow-lg border-b-4 border-black/10`}>
              {subject.id.toUpperCase()} ROOM
            </div>
        </div>
      </div>

      {/* Main Classroom Environment */}
      <div 
        className="flex-1 relative transition-colors duration-1000"
        style={{ backgroundColor: design.wallColor }}
      >
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {/* Lyrics Overlay */}
        {showLyrics && activeMusic?.lyrics && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl text-center z-40 pointer-events-none px-12">
            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-bounce-slow">
              <p className="text-purple-600 text-sm font-bold uppercase tracking-widest mb-4 opacity-50">
                {activeMusic.label} by {activeMusic.artist}
              </p>
              <h3 className="text-5xl font-bold text-gray-800 leading-tight transition-all duration-500">
                "{activeMusic.lyrics[currentLyricIdx]}"
              </h3>
            </div>
          </div>
        )}

        {/* Stickers Layer */}
        <div className="absolute top-12 w-full flex justify-center gap-12 flex-wrap px-32 pointer-events-none z-10">
          {design.posterUrls.map((url, i) => (
            <div 
              key={i} 
              className="w-24 h-24 animate-float-slow flex items-center justify-center pointer-events-auto"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <img src={url} alt="Sticker" className="max-w-full max-h-full drop-shadow-2xl transition-transform hover:scale-125 hover:rotate-6" />
            </div>
          ))}
        </div>

        {/* Floor Layer */}
        <div 
          className="absolute bottom-0 w-full h-1/3 border-t-8 border-black/5 shadow-[inset_0_20px_20px_-15px_rgba(0,0,0,0.1)]"
          style={{ backgroundColor: design.floorColor }}
        ></div>

        {/* Interactive Concept Cards */}
        <div className="absolute bottom-16 left-0 right-0 flex items-end justify-center gap-8 px-16 z-20">
          {subject.concepts.map((concept, idx) => (
            <div 
              key={concept.id}
              onClick={() => onSelectConcept(concept)}
              className="group cursor-pointer transform transition-all duration-300"
            >
              <div 
                className="w-52 h-64 bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center p-6 text-center border-b-[12px] border-blue-50 group-hover:border-blue-200 animate-float transition-all"
                style={{ animationDelay: `${idx * 0.8}s`, animationDuration: '6s' }}
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:bg-blue-100 group-hover:rotate-12 transition-all shadow-inner">
                  {concept.icon || '📚'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{concept.title}</h3>
                <p className="text-[10px] text-gray-400 font-medium leading-tight line-clamp-2">{concept.description}</p>
                <div className="mt-auto bg-blue-500 text-white text-[10px] px-4 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0">
                  Let's Play! 🚀
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Room Decorations */}
        <div className="absolute bottom-4 left-6 text-6xl opacity-20 select-none pointer-events-none">🧸</div>
        <div className="absolute bottom-4 right-6 text-6xl opacity-20 select-none pointer-events-none">🪴</div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ClassroomView;
