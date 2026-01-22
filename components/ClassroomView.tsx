import React, { useEffect, useRef, useState } from 'react';
import { Subject, Concept, ClassroomDesign } from '../types';
import { MUSIC_OPTIONS, MASCOTS } from '../constants';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-2xl" }) => {
  const letters = "Teachly".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500"
  ];
  return (
    <span className={`${size} font-bold tracking-tight flex items-center gap-0.5 filter drop-shadow-md select-none whitespace-nowrap`}>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(0);
  const [isMascotCelebrating, setIsMascotCelebrating] = useState(false);
  // Default to false (shown in bold color)
  const [isMascotPeeking, setIsMascotPeeking] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // If there are many concepts, they might cover the corner, so we start in peek mode
  useEffect(() => {
    if (subject.concepts.length > 8) {
      setIsMascotPeeking(true);
    } else {
      setIsMascotPeeking(false);
    }
  }, [subject.concepts.length]);

  const handleMascotClick = () => {
    if (isMascotPeeking) {
      setIsMascotPeeking(false);
    } else {
      setIsMascotCelebrating(true);
      setTimeout(() => setIsMascotCelebrating(false), 2000);
    }
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

  const scrollBySet = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      
      const cardWidth = scrollWidth / subject.concepts.length;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (current) {
      current.addEventListener('scroll', updateScrollState);
      updateScrollState();
      window.addEventListener('resize', updateScrollState);
      return () => {
        current.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [subject.concepts]);

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-['Fredoka']">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-3 sm:p-5 flex justify-between items-center z-[100] border-b-4 border-black/5 shadow-md">
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={onBack} className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-white border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 shadow-sm active:translate-y-1">
            <span className="text-xl sm:text-3xl">⬅️</span>
          </button>
          <div className="hidden sm:block">
            <RainbowLogo size="text-2xl lg:text-4xl" />
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">Interactive Magic Lab</p>
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-4 items-center">
            {activeMusic && activeMusic.id !== 'none' && (
                <button 
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full border transition-all ${showLyrics ? 'bg-purple-500 text-white border-purple-600 shadow-inner' : 'bg-purple-50 text-purple-500 border-purple-100 hover:bg-purple-100'}`}
                >
                    <span className="text-lg sm:text-xl">🎤</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase">{showLyrics ? 'Lyrics On' : 'Sing Along'}</span>
                </button>
            )}
            <div className={`px-4 sm:px-8 py-2 sm:py-3 ${subject.color} text-white rounded-full font-bold text-sm sm:text-lg shadow-lg border-b-4 border-black/10 uppercase truncate max-w-[120px] sm:max-w-none`}>
              {subject.title}
            </div>
        </div>
      </div>

      {/* Main Room Viewport */}
      <div className="flex-1 relative transition-colors duration-1000" style={{ backgroundColor: design.wallColor }}>
        {/* Wall Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: getWallPattern(), backgroundSize: design.wallTheme === 'dots' ? '40px 40px' : '100px 100%' }}></div>

        {/* Stickers Area */}
        <div className="absolute top-[4%] w-full flex justify-center gap-4 sm:gap-8 flex-wrap px-8 sm:px-20 pointer-events-none z-10 h-[8%] overflow-hidden">
          {design.posterUrls.map((url, i) => (
            <div key={i} className="w-10 h-10 sm:w-16 sm:h-16 animate-float-slow flex items-center justify-center pointer-events-auto" style={{ animationDelay: `${i * 0.7}s` }}>
              <img src={url} alt="Sticker" className="max-w-full max-h-full drop-shadow-lg transition-transform hover:scale-125 hover:rotate-6" />
            </div>
          ))}
        </div>

        {/* Shelves Area */}
        <div className="absolute top-[28%] left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="w-[45%] h-3 bg-black/5 rounded-full flex justify-around items-end px-10 border-b border-black/5 shadow-inner">
             {design.shelves?.map((emoji, idx) => (
               <span key={idx} className="text-2xl sm:text-4xl mb-1 animate-wiggle pointer-events-auto cursor-default hover:scale-125 transition-transform" style={{ animationDelay: `${idx * 0.1}s` }}>{emoji}</span>
             ))}
          </div>
        </div>

        {/* Concept Cards Carousel */}
        <div 
          ref={scrollRef}
          className="absolute top-[44%] bottom-[16%] left-0 right-0 z-30 overflow-x-auto overflow-y-hidden flex items-center snap-x snap-mandatory hide-scrollbar"
        >
          <div className="flex items-center justify-center min-w-full gap-4 sm:gap-8 py-4 px-12">
            {subject.concepts.map((concept, idx) => (
              <div 
                key={concept.id}
                onClick={() => onSelectConcept(concept)}
                className="group w-28 h-[130px] sm:w-32 sm:h-[160px] cursor-pointer transform transition-all duration-300 flex-shrink-0 snap-center"
              >
                <div 
                  className="w-full h-full bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-xl flex flex-col items-center justify-center p-3 sm:p-4 text-center border-b-[8px] border-slate-100 group-hover:border-blue-400 group-hover:-translate-y-3 animate-float-card transition-all" 
                  style={{ animationDelay: `${idx * 0.4}s` }}
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slate-50 rounded-full flex items-center justify-center text-2xl sm:text-4xl mb-2 sm:mb-3 group-hover:bg-blue-50 group-hover:rotate-6 transition-all shadow-inner ring-2 ring-black/5">
                    {concept.icon || '📚'}
                  </div>
                  <h3 className="text-[10px] sm:text-[13px] font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight text-center px-1">
                    {concept.title}
                  </h3>
                  <div className="mt-1 bg-blue-500 text-white text-[7px] sm:text-[9px] px-3 sm:px-4 py-1 sm:py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-1 group-hover:translate-y-0 uppercase tracking-widest">
                    Play! 🚀
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {subject.concepts.length > 1 && (
          <div className="absolute bottom-[24%] left-0 right-0 flex justify-center items-center gap-48 sm:gap-72 z-[40] pointer-events-none">
            <button 
              onClick={() => scrollBySet('left')}
              className={`pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 bg-blue-400 text-white rounded-full shadow-2xl flex items-center justify-center text-xl transition-all border-b-6 border-blue-600 hover:bg-blue-300 hover:scale-110 active:translate-y-1 active:border-b-0 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              ⬅️
            </button>
            <button 
              onClick={() => scrollBySet('right')}
              className={`pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 bg-yellow-400 text-white rounded-full shadow-2xl flex items-center justify-center text-xl transition-all border-b-6 border-yellow-600 hover:bg-yellow-300 hover:scale-110 active:translate-y-1 active:border-b-0 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              ➡️
            </button>
          </div>
        )}

        {/* Floor Area */}
        <div className="absolute bottom-0 w-full h-[35%] border-t-8 border-black/5 shadow-[inset_0_10px_10px_rgba(0,0,0,0.05)] z-0" style={{ backgroundColor: design.floorColor }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: getFloorPattern() }}></div>
          
          {/* Mascot */}
          {design.mascot && design.mascot !== 'none' && (
            <div 
              onClick={handleMascotClick}
              className={`absolute bottom-4 transition-all duration-700 z-20 cursor-pointer ${
                isMascotPeeking 
                  ? 'left-[-40px] sm:left-[-60px] opacity-10 scale-90' 
                  : 'left-8 sm:left-16 opacity-100 scale-100'
              } ${isMascotCelebrating ? 'animate-celebrate scale-125 glow' : 'animate-bounce-pet'}`}
            >
              <span className="text-6xl sm:text-[8rem] select-none">
                {MASCOTS.find(m => m.id === design.mascot)?.emoji}
              </span>
              {isMascotPeeking && (
                <div className="absolute top-1/2 left-[80%] -translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-lg text-[9px] font-bold text-blue-500 animate-pulse whitespace-nowrap">
                  Peek! ✨
                </div>
              )}
              {isMascotCelebrating && <div className="absolute -top-10 -right-10 text-4xl sm:text-5xl animate-ping">✨</div>}
              {!isMascotPeeking && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMascotPeeking(true); }}
                  className="absolute -top-3 -right-3 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center text-xs shadow hover:bg-white"
                >
                  ⬅️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scroll Indicator Dots */}
        {subject.concepts.length > 1 && (
           <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 flex gap-3 z-40 bg-white/20 backdrop-blur-sm p-3 rounded-full">
             {subject.concepts.map((_, i) => (
               <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-blue-500 scale-125' : 'bg-blue-200'}`}
               />
             ))}
           </div>
        )}

        {/* Lyrics Overlay */}
        {showLyrics && activeMusic?.lyrics && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl text-center z-[110] pointer-events-none px-6">
            <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] shadow-2xl border-4 border-white animate-bounce-slow">
              <h3 className="text-2xl sm:text-5xl font-bold text-gray-800 transition-all duration-500 italic leading-tight">
                "{activeMusic.lyrics[currentLyricIdx]}"
              </h3>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-card { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.02); } }
        @keyframes bounce-pet { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes celebrate { 0%, 100% { transform: scale(1) rotate(0); } 25% { transform: scale(1.3) rotate(-15deg); } 75% { transform: scale(1.3) rotate(15deg); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }

        .animate-float-card { animation: float-card 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 5s ease-in-out infinite; }
        .animate-bounce-pet { animation: bounce-pet 4s ease-in-out infinite; }
        .animate-celebrate { animation: celebrate 0.5s ease-in-out 3; }
        .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scroll-behavior: smooth; -ms-overflow-style: none; scrollbar-width: none; }
        .glow { filter: drop-shadow(0 0 50px rgba(255,255,255,1)); }
      `}</style>
    </div>
  );
};

export default ClassroomView;