
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Concept, ClassroomDesign, Message } from '../types';
// Fixed: Imported encodeBase64 which was missing from the import list
import { decodeBase64, encodeBase64, decodeAudioData, createPcmBlob } from '../audioUtils';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  onBack: () => void;
}

const BOARD_TOOLS: FunctionDeclaration[] = [
  {
    name: 'addItemToBoard',
    description: 'Adds a specific text or emoji item to the interactive whiteboard.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING, description: 'The text or emoji to add (e.g., "A", "5", "🍎", "Hydrogen")' },
      },
      required: ['item'],
    },
  },
  {
    name: 'removeItemFromBoard',
    description: 'Removes a specific item from the whiteboard by its text value.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING, description: 'The exact text of the item to remove.' },
      },
      required: ['item'],
    },
  },
  {
    name: 'clearBoard',
    description: 'Clears all items from the interactive whiteboard.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

const SYSTEM_INSTRUCTION = `You are a world-class, multi-disciplinary elementary pedagogical expert assistant. 
You are currently helping a teacher and students (ages 5-10) with the concept: "{CONCEPT_TITLE}".

CORE PEDAGOGICAL PHILOSOPHY:
- Zone of Proximal Development: Always provide the right amount of challenge. Scaffolding is key.
- Inquiry-Based Learning: Encourage students to ask "Why?" and "What if?".
- Multimodal Interaction: Use the whiteboard (via tools) to visualize concepts.
- Positive Reinforcement: Celebrate small wins with high-energy verbal praise.

SUBJECT-SPECIFIC KNOWLEDGE BASE:
- Phonics: Master of the Science of Reading. Focus on phonemic awareness, grapheme-phoneme mapping, and blending. If teaching vowels, explain their role as 'sound makers'.
- Math: Concrete-Pictorial-Abstract (CPA) approach. Use emojis on the board as counters. Focus on number sense and logical reasoning.
- Science: Use the scientific method. Encourage observation, prediction, and experimentation.

TOOL USAGE RULES:
1. ACT IMMEDIATELY: If a user says "Set up a lesson on {CONCEPT_TITLE}" or "Add 3 apples", use 'addItemToBoard' immediately.
2. DYNAMIC UPDATES: Use 'removeItemFromBoard' to progress through a game or 'clearBoard' to start fresh.
3. VISUAL CLARITY: When adding items, use clear symbols or short words.

RESPONSE STYLE:
- Short, punchy, and energetic. 
- Use child-friendly analogies (e.g., "Letters are like puzzle pieces that make sound pictures").
- Always explain what you are doing on the board.`;

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, onBack }) => {
  const [boardItems, setBoardItems] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentTranscriptionRef = useRef({ user: '', model: '' });

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const cleanupSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (audioContextInRef.current) {
      audioContextInRef.current.close();
      audioContextInRef.current = null;
    }
    activeSourcesRef.current.forEach(s => s.stop());
    activeSourcesRef.current.clear();
    setIsLive(false);
  };

  const handleAiAction = (name: string, args: any) => {
    switch (name) {
      case 'addItemToBoard':
        setBoardItems(prev => [...prev, args.item]);
        return "Added " + args.item + " to the board.";
      case 'removeItemFromBoard':
        setBoardItems(prev => prev.filter(i => i !== args.item));
        return "Removed " + args.item + " from the board.";
      case 'clearBoard':
        setBoardItems([]);
        return "Board cleared.";
      default:
        return "Tool not found.";
    }
  };

  const getOrCreateSession = async (useMic: boolean = false) => {
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    // Always create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (useMic) {
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: SYSTEM_INSTRUCTION.replace('{CONCEPT_TITLE}', concept.title),
        tools: [{ functionDeclarations: BOARD_TOOLS }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          if (useMic) setIsLive(true);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.toolCall) {
            const toolResponses = [];
            for (const fc of message.toolCall.functionCalls) {
              const result = handleAiAction(fc.name, fc.args);
              toolResponses.push({ id: fc.id, name: fc.name, response: { result } });
            }
            sessionPromise.then(s => s.sendToolResponse({ functionResponses: toolResponses }));
          }

          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && audioContextOutRef.current) {
            const ctx = audioContextOutRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
            const sourceNode = ctx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(ctx.destination);
            sourceNode.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            activeSourcesRef.current.add(sourceNode);
            sourceNode.onended = () => activeSourcesRef.current.delete(sourceNode);
          }

          if (message.serverContent?.interrupted) {
            activeSourcesRef.current.forEach(s => s.stop());
            activeSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }

          if (message.serverContent?.inputTranscription) {
            currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
          }
          if (message.serverContent?.outputTranscription) {
            currentTranscriptionRef.current.model += message.serverContent.outputTranscription.text;
          }
          
          if (message.serverContent?.turnComplete) {
            const uTrans = currentTranscriptionRef.current.user;
            const mTrans = currentTranscriptionRef.current.model;
            if (uTrans || mTrans) {
              setChatHistory(prev => [
                ...prev, 
                ...(uTrans ? [{ role: 'user', text: uTrans } as Message] : []),
                ...(mTrans ? [{ role: 'model', text: mTrans } as Message] : [])
              ]);
            }
            currentTranscriptionRef.current = { user: '', model: '' };
            setIsAiThinking(false);
          }
        },
        onerror: (e) => {
          console.error('Session Error:', e);
          setIsAiThinking(false);
        },
        onclose: () => cleanupSession(),
      },
    });

    if (useMic && audioContextInRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextInRef.current.createMediaStreamSource(stream);
      const scriptProcessor = audioContextInRef.current.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        sessionPromise.then(s => {
          if (isLive) s.sendRealtimeInput({ media: pcmBlob });
        });
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContextInRef.current.destination);
    }

    sessionPromiseRef.current = sessionPromise;
    return sessionPromise;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    setIsAiThinking(true);
    const session = await getOrCreateSession();
    
    try {
      // Use the resolved session to send text input via realtimeInput.
      session.sendRealtimeInput({
        media: {
          data: encodeBase64(new TextEncoder().encode(inputMessage)),
          mimeType: 'text/plain'
        }
      });
      setChatHistory(prev => [...prev, { role: 'user', text: inputMessage }]);
      setInputMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
      setIsAiThinking(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden animate-zoom-in font-['Fredoka']">
      <header className="bg-white border-b p-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="text-2xl hover:bg-gray-100 p-2 rounded-full transition-colors">⬅️</button>
          <div className="hidden sm:block">
            <h2 className="text-xl font-bold text-gray-800">{concept.title}</h2>
            <p className="text-xs text-blue-500 font-medium">Interactive Multi-Modal Lab</p>
          </div>
        </div>
        
        <button 
          onClick={isLive ? cleanupSession : () => getOrCreateSession(true)}
          className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all shadow-md ${
            isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isLive ? '🛑 Stop Mic' : '🎙️ Start Voice Mode'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-col gap-6" style={{ backgroundColor: design.wallColor + '20' }}>
          <div className="bg-white rounded-[2rem] shadow-2xl flex-1 relative flex items-center justify-center overflow-hidden border-8 border-gray-100">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
            
            {boardItems.length === 0 ? (
              <div className="text-center">
                <div className="text-9xl mb-6 animate-bounce" style={{ animationDuration: '3s' }}>🎒</div>
                <p className="text-3xl font-bold text-gray-300">Ready for Learning!</p>
                <p className="text-gray-400 mt-2">Speak or type to have the Assistant act on instructions.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 justify-center p-12 max-w-3xl overflow-y-auto">
                {boardItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="w-24 h-24 bg-white border-4 border-blue-100 rounded-3xl flex items-center justify-center text-4xl font-bold text-blue-600 shadow-lg cursor-pointer hover:scale-110 hover:rotate-3 transition-transform"
                    onClick={() => setBoardItems(boardItems.filter((_, i) => i !== idx))}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Manual Asset Drawer</h4>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {concept.suggestedItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setBoardItems([...boardItems, item])}
                  className="px-8 py-5 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl font-bold text-3xl text-blue-700 transition-all flex-shrink-0"
                >
                  {item}
                </button>
              ))}
              <button 
                onClick={() => {
                  const val = prompt('Add custom item:');
                  if(val) setBoardItems([...boardItems, val]);
                }}
                className="px-8 py-5 bg-yellow-400 text-white rounded-2xl font-bold text-3xl shadow-lg hover:bg-yellow-500 transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="w-96 bg-white border-l flex flex-col shadow-2xl">
          <div className="p-6 border-b bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-all ${isLive || isAiThinking ? 'bg-blue-500 text-white scale-110 ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                {isAiThinking ? '✨' : (isLive ? '🌈' : '🤖')}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Assistant Pro</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : (isAiThinking ? 'bg-blue-400 animate-bounce' : 'bg-gray-300')}`}></span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    {isLive ? 'Listening Live' : (isAiThinking ? 'Instructing...' : 'Ready to act')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatHistory.length === 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-6 rounded-[2rem] text-sm text-blue-700 font-medium text-center border-2 border-dashed border-blue-100">
                  <p className="mb-4">I'm ready to follow your instructions!</p>
                  <div className="space-y-2">
                    <button onClick={() => setInputMessage("Add the vowels A E I O U to the board")} className="block w-full text-xs bg-white py-2 rounded-full border hover:border-blue-400 transition-colors">"Add all vowels"</button>
                    <button onClick={() => setInputMessage("Clear the board and add 3 numbers for counting")} className="block w-full text-xs bg-white py-2 rounded-full border hover:border-blue-400 transition-colors">"Clear and add counting numbers"</button>
                  </div>
                </div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-md leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-3xl animate-pulse flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 border-t bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Give me an instruction..."
                className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-inner"
              />
              <button 
                type="submit"
                className="bg-blue-500 text-white w-12 h-12 rounded-full hover:bg-blue-600 shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                disabled={!inputMessage.trim()}
              >
                🚀
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes zoom-in { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-zoom-in { animation: zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;
