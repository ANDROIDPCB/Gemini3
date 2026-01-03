import React, { useState, useEffect } from 'react';
import ParticleScene from './components/ParticleScene';
import HandController from './components/HandController';
import AudioController from './components/AudioController';
import { generateShapePoints } from './services/geminiService';
import { generateSphere, generateCube, generateBottle } from './utils/geometry';
import { HandData, Point3D, ShapeType } from './types';
import { HexColorPicker } from 'react-colorful';
import { Sparkles, Box, Circle, FlaskConical, Command, Menu, X, Cpu, Maximize2, Minimize2, Palette, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [targetPoints, setTargetPoints] = useState<Point3D[]>([]);
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.BOTTLE);
  const [particleColor, setParticleColor] = useState('#00eaff');
  const [handData, setHandData] = useState<HandData>({ isOpen: false, openness: 0, detected: false });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // Check if API KEY is available safely
  const hasApiKey = !!(process.env.API_KEY);

  useEffect(() => {
    handleShapeChange(ShapeType.BOTTLE);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleShapeChange = async (shape: ShapeType) => {
    setCurrentShape(shape);
    let points: Point3D[] = [];
    
    switch (shape) {
      case ShapeType.SPHERE: points = generateSphere(3500); break;
      case ShapeType.CUBE: points = generateCube(3500); break;
      case ShapeType.BOTTLE: points = generateBottle(3500); break;
      default: break;
    }
    
    if (points.length > 0) setTargetPoints(points);
  };

  const handleGeminiGenerate = async () => {
    if (!customPrompt.trim() || !hasApiKey) return;
    
    setIsGenerating(true);
    setCurrentShape(ShapeType.GEMINI_GENERATED);
    
    try {
      const points = await generateShapePoints(customPrompt, 2500);
      setTargetPoints(points);
    } catch (err) {
      console.error(err);
      alert(err === "API_KEY_MISSING" ? 'API Key is missing in Netlify settings.' : 'Failed to generate shape.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      
      <AudioController 
        enabled={isAudioEnabled} 
        handOpenness={handData.openness} 
        handDetected={handData.detected} 
      />

      <div className="absolute inset-0 z-0">
        <ParticleScene 
          targetPoints={targetPoints} 
          color={particleColor} 
          handOpenness={handData.openness} 
          handDetected={handData.detected}
        />
      </div>

      <div className="absolute top-16 right-4 z-40">
        <HandController onHandUpdate={setHandData} />
      </div>

      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2.5 bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-95 text-cyan-400"
        >
          {showSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={`p-2.5 backdrop-blur-md border border-white/10 rounded-full transition-all active:scale-95 ${isAudioEnabled ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-gray-900/40 text-gray-400 hover:bg-white/10'}`}
        >
          {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <button 
          onClick={toggleFullScreen}
          className="p-2.5 bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-95 text-white"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      <div className={`absolute top-0 left-0 h-full w-80 bg-gray-950/80 backdrop-blur-xl border-r border-white/5 z-40 transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${showSidebar ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="flex flex-col h-full p-6 overflow-y-auto custom-scrollbar">
          
          <div className="mb-8 mt-12">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-3">
              <Sparkles className="text-cyan-400 fill-cyan-400/20" size={24} />
              Kinetic Particles
            </h1>
            <p className="text-[10px] text-gray-500 mt-2 font-medium tracking-widest uppercase">
              Gesture Interactive System
            </p>
          </div>

          <div className="mb-8 p-4 rounded-xl bg-gray-900/60 border border-white/5 shadow-inner">
             <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Status</span>
                <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${handData.detected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${handData.detected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></span>
                   {handData.detected ? "CONNECTED" : "DISCONNECTED"}
                </div>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Action</span>
                 <span className="font-mono text-cyan-300">
                    {handData.detected ? (handData.isOpen ? "DIVERGE" : "CONVERGE") : "IDLE"}
                 </span>
               </div>
             </div>
          </div>

          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Core Patterns</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: ShapeType.BOTTLE, icon: <FlaskConical size={22} />, label: 'Bottle' },
                { type: ShapeType.SPHERE, icon: <Circle size={22} />, label: 'Sphere' },
                { type: ShapeType.CUBE, icon: <Box size={22} />, label: 'Cube' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => handleShapeChange(item.type)}
                  className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentShape === item.type ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-lg' : 'bg-gray-900/40 border-white/5 text-gray-400 hover:bg-white/5'}`}
                >
                  {item.icon}
                  <span className="text-[9px] font-medium mt-2">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Cpu size={14} className="text-purple-400" /> Generative AI
            </h3>
            <div className="space-y-3 bg-gray-900/40 p-1 rounded-xl border border-white/5">
              <input
                type="text"
                placeholder="Describe a shape..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full bg-transparent text-white px-4 py-3 text-sm focus:outline-none placeholder-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && handleGeminiGenerate()}
              />
              <button
                onClick={handleGeminiGenerate}
                disabled={isGenerating || !hasApiKey}
                className={`w-full py-3 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  isGenerating || !hasApiKey
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-purple-900/20'
                }`}
              >
                {isGenerating ? 'Processing...' : 'Generate with Gemini'}
              </button>
              {!hasApiKey && (
                <div className="px-3 pb-2 flex items-center gap-2 text-[9px] text-amber-400/80">
                  <AlertTriangle size={12} />
                  <span>Missing API KEY in Netlify</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} /> Style
            </h3>
            <div className="p-3 bg-gray-900/40 rounded-xl border border-white/5">
                <HexColorPicker color={particleColor} onChange={setParticleColor} style={{ width: '100%', height: '100px' }} />
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
             <p className="text-[9px] text-gray-500 leading-relaxed text-center italic">
                Hand tracking powered by MediaPipe Vision.<br/>
                3D engine powered by Three.js.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;