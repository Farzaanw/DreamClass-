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
  const mascotAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(0);
  const [isMascotCelebrating, setIsMascotCelebrating] = useState(false);
  // Default to false (shown in bold color)
  const [isMascotPeeking, setIsMascotPeeking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const isEmojiSticker = (asset: string) => asset.startsWith('emoji:');
  const getEmojiSticker = (asset: string) => asset.replace('emoji:', '');
  const velocityRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const originalCount = subject.concepts.length;

  const safeDesign = design || {
    ambientMusic: 'none',
    wallColor: '#fbbf24',
    floorColor: '#92400e',
    posterUrls: [],
    wallTheme: 'plain',
    floorTheme: 'plain',
    mascot: 'none',
    shelves: []
  };

  const activeMusic = MUSIC_OPTIONS.find(m => m.id === safeDesign.ambientMusic);
  const previewBoard = subject.concepts.map(c => design.conceptBoards?.[c.id]).find(Boolean);
  const previewItems = (previewBoard?.items || []).slice(0, 8);
  const isImageContent = (content: string) => content.startsWith('http') || content.startsWith('data:image');

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
      if (mascotAudioRef.current) mascotAudioRef.current.pause();
      cancelAnimationFrame(animationFrameRef.current);
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
    const mascotSoundMap: Record<string, string> = {
      cat: '/sounds/cat.wav',
      dog: '/sounds/dog.wav',
      monkey: '/sounds/monkey.wav',
      robot: '/sounds/robot.wav',
    };
    const soundPath = mascotSoundMap[design.mascot || ''];
    if (soundPath) {
      if (mascotAudioRef.current) {
        mascotAudioRef.current.pause();
        mascotAudioRef.current.currentTime = 0;
      }
      const audio = new Audio(soundPath);
      audio.volume = 0.7;
      mascotAudioRef.current = audio;
      void audio.play().catch(() => undefined);
    }

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

  const applyMomentum = () => {
    if (!scrollRef.current || isDragging) return;
    
    const container = scrollRef.current;
    const newScrollLeft = container.scrollLeft - velocityRef.current * 16;
    
    // Check boundaries
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (newScrollLeft <= 0 || newScrollLeft >= maxScroll) {
      container.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
      velocityRef.current = 0;
      return;
    }

    container.scrollLeft = newScrollLeft;
    velocityRef.current *= 0.95; // Friction
    
    if (Math.abs(velocityRef.current) > 0.1) {
      animationFrameRef.current = requestAnimationFrame(applyMomentum);
    } else {
      velocityRef.current = 0;
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [originalCount]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!scrollRef.current) return;
    if (e.cancelable) e.preventDefault();
    
    cancelAnimationFrame(animationFrameRef.current);
    setIsDragging(true);
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    lastXRef.current = pageX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    setDragDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    const dx = pageX - lastXRef.current;
    
    if (dt > 0) {
      // Clamp velocity to prevent explosion
      const instantVelocity = dx / dt;
      velocityRef.current = Math.max(Math.min(instantVelocity, 50), -50);
    }
    
    scrollRef.current.scrollLeft -= dx;
    setDragDistance(prev => prev + Math.abs(dx));
    
    lastXRef.current = pageX;
    lastTimeRef.current = now;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(applyMomentum);
  };

  const handleCardClick = (e: React.MouseEvent, concept: Concept) => {
    // If we dragged more than a tiny bit, don't trigger the click
    if (dragDistance > 10) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onSelectConcept(concept);
  };

  useEffect(() => {
    // No infinite scroll listener needed
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [originalCount]);

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
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-none mt-1">Interactive Magic Lab</p>
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-4 items-center">
            {activeMusic && activeMusic.id !== 'none' && (
                <button 
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full border transition-all ${showLyrics ? 'bg-purple-500 text-white border-purple-600 shadow-inner' : 'bg-purple-50 text-purple-500 border-purple-100 hover:bg-purple-100'}`}
                >
                    <span className="text-lg sm:text-xl">🎤</span>
                    <span className="text-xs font-bold uppercase">{showLyrics ? 'Lyrics On' : 'Sing Along'}</span>
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
          {design.posterUrls.map((asset, i) => (
            <div key={i} className="w-10 h-10 sm:w-16 sm:h-16 animate-float-slow flex items-center justify-center pointer-events-auto" style={{ animationDelay: `${i * 0.7}s` }}>
              {isEmojiSticker(asset) ? (
                <span className="text-3xl sm:text-5xl drop-shadow-lg transition-transform hover:scale-125 hover:rotate-6">{getEmojiSticker(asset)}</span>
              ) : (
                <img src={asset} alt="Sticker" className="max-w-full max-h-full drop-shadow-lg transition-transform hover:scale-125 hover:rotate-6" />
              )}
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

        {/* Saved Board Preview Items */}
        {previewItems.length > 0 && (
          <div className="absolute top-[34%] left-0 right-0 z-20 flex justify-center pointer-events-none">
            <div className="max-w-[90%] flex flex-wrap items-center justify-center gap-2 bg-white/70 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg border border-white/80">
              {previewItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg sm:text-xl">
                  {isImageContent(item.content) ? (
                    <img src={item.content} alt="Saved board item" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <span className="font-black text-slate-700">{item.content}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concept Cards Carousel */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className={`absolute top-[44%] bottom-[16%] left-0 right-0 z-30 overflow-x-auto overflow-y-hidden flex items-center hide-scrollbar select-none overscroll-x-contain ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <div className="flex items-center min-w-max py-4 pointer-events-none select-none px-20 m-auto">
            {subject.concepts.map((concept, idx) => (
              <div 
                key={`${concept.id}-${idx}`}
                onClick={(e) => handleCardClick(e, concept)}
                className="group w-40 h-[180px] sm:w-48 sm:h-[220px] cursor-pointer transform transition-all duration-300 flex-shrink-0 pointer-events-auto mx-2 sm:mx-4 select-none"
              >
                <div 
                  className="w-full h-full bg-white rounded-[3rem] sm:rounded-[4rem] shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 text-center border-b-[10px] border-slate-100 group-hover:border-blue-400 group-hover:-translate-y-4 animate-float-card transition-all select-none" 
                  style={{ animationDelay: `${idx * 0.4}s` }}
                >
                  <div className="w-14 h-14 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-4 group-hover:bg-blue-50 group-hover:rotate-6 transition-all shadow-inner ring-4 ring-black/5 select-none">
                    {concept.icon || '📚'}
                  </div>
                  <h3 className="text-xs sm:text-base font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight text-center px-1 select-none">
                    {concept.title}
                  </h3>
                  <div className="mt-2 bg-blue-500 text-white text-xs sm:text-[12px] px-4 sm:px-6 py-1 sm:py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0 uppercase tracking-widest select-none">
                    Play! 🚀
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
              <span className="absolute top-2 right-2 bg-white/90 text-blue-500 rounded-full text-xs sm:text-sm px-2 py-1 font-bold shadow-md">
                🔊
              </span>
              {isMascotPeeking && (
                <div className="absolute top-1/2 left-[80%] -translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-lg text-xs font-bold text-blue-500 animate-pulse whitespace-nowrap">
                  Peek! ✨
                </div>
              )}
              {isMascotCelebrating && <div className="absolute -top-10 -right-10 text-4xl sm:text-5xl animate-ping">✨</div>}
              </div>
          )}
        </div>

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
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glow { filter: drop-shadow(0 0 50px rgba(255,255,255,1)); }
      `}</style>
    </div>
  );
};

export default ClassroomView;

