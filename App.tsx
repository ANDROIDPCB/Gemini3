import React, { useState, useEffect, useCallback } from 'react';
import ParticleScene from './components/ParticleScene';
import HandController from './components/HandController';
import AudioController from './components/AudioController';
import { generateShapePoints } from './services/geminiService';
import { generateSphere, generateCube, generateBottle } from './utils/geometry';
import { HandData, Point3D, ShapeType } from './types';
import { HexColorPicker } from 'react-colorful';
import { Sparkles, Box, Circle, FlaskConical, Command, Menu, X, Cpu, Maximize2, Minimize2, Palette, Volume2, VolumeX } from 'lucide-react';

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

  // Initial load
  useEffect(() => {
    handleShapeChange(ShapeType.BOTTLE);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleShapeChange = async (shape: ShapeType) => {
    setCurrentShape(shape);
    let points: Point3D[] = [];
    
    switch (shape) {
      case ShapeType.SPHERE:
        points = generateSphere(3500);
        break;
      case ShapeType.CUBE:
        points = generateCube(3500);
        break;
      case ShapeType.BOTTLE:
        points = generateBottle(3500);
        break;
      case ShapeType.GEMINI_GENERATED:
        break;
    }
    
    if (points.length > 0) setTargetPoints(points);
  };

  const handleGeminiGenerate = async () => {
    if (!customPrompt.trim()) return;
    
    setIsGenerating(true);
    setCurrentShape(ShapeType.GEMINI_GENERATED);
    
    try {
      const points = await generateShapePoints(customPrompt, 2500);
      setTargetPoints(points);
    } catch (err) {
      console.error(err);
      alert('Failed to generate shape via Gemini. Check API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      
      {/* Audio Engine */}
      <AudioController 
        enabled={isAudioEnabled} 
        handOpenness={handData.openness} 
        handDetected={handData.detected} 
      />

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <ParticleScene 
          targetPoints={targetPoints} 
          color={particleColor} 
          handOpenness={handData.openness} 
          handDetected={handData.detected}
        />
      </div>

      {/* Hand Controller (Webcam) - Positioned Top Right */}
      <div className="absolute top-16 right-4 z-40">
        <HandController onHandUpdate={setHandData} />
      </div>

      {/* Top Bar Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2.5 bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-95 text-cyan-400"
          title="Toggle Menu"
        >
          {showSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={toggleAudio}
          className={`p-2.5 backdrop-blur-md border border-white/10 rounded-full transition-all active:scale-95 ${isAudioEnabled ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-gray-900/40 text-gray-400 hover:bg-white/10'}`}
          title={isAudioEnabled ? "Mute Sound" : "Enable Sound"}
        >
          {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <button 
          onClick={toggleFullScreen}
          className="p-2.5 bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-95 text-white"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Sidebar Controls */}
      <div className={`absolute top-0 left-0 h-full w-80 bg-gray-950/80 backdrop-blur-xl border-r border-white/5 z-40 transform transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) ${showSidebar ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="flex flex-col h-full p-6 overflow-y-auto custom-scrollbar">
          
          <div className="mb-8 mt-12">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-3">
              <Sparkles className="text-cyan-400 fill-cyan-400/20" size={24} />
              Kinetic Particles
            </h1>
            <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">
              HAND GESTURE INTERACTIVE SYSTEM
            </p>
          </div>

          {/* Status Monitor */}
          <div className="mb-8 p-4 rounded-xl bg-gray-900/60 border border-white/5 shadow-inner">
             <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">System Status</span>
                <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${handData.detected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${handData.detected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></span>
                   {handData.detected ? "CONNECTED" : "NO HAND"}
                </div>
             </div>
             
             <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Gesture</span>
                 <span className="font-mono text-cyan-300 font-medium">
                    {handData.detected 
                      ? (handData.isOpen ? "DIVERGE (OPEN)" : "CONVERGE (FIST)")
                      : "WAITING INPUT..."}
                 </span>
               </div>
               
               <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Force</span>
                    <span>{Math.round(handData.openness * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-100 ease-out" 
                      style={{ width: `${handData.openness * 100}%` }}
                    ></div>
                  </div>
               </div>
             </div>
          </div>

          {/* Shape Selection */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Core Patterns</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleShapeChange(ShapeType.BOTTLE)}
                className={`group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${currentShape === ShapeType.BOTTLE ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gray-900/40 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'}`}
              >
                <FlaskConical size={24} className="mb-2 transition-transform group-hover:-translate-y-1" />
                <span className="text-[10px] font-medium">Bottle</span>
              </button>
              <button
                onClick={() => handleShapeChange(ShapeType.SPHERE)}
                className={`group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${currentShape === ShapeType.SPHERE ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gray-900/40 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'}`}
              >
                <Circle size={24} className="mb-2 transition-transform group-hover:-translate-y-1" />
                <span className="text-[10px] font-medium">Sphere</span>
              </button>
              <button
                onClick={() => handleShapeChange(ShapeType.CUBE)}
                className={`group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${currentShape === ShapeType.CUBE ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gray-900/40 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'}`}
              >
                <Box size={24} className="mb-2 transition-transform group-hover:-translate-y-1" />
                <span className="text-[10px] font-medium">Cube</span>
              </button>
            </div>
          </div>

          {/* Gemini AI Gen */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Cpu size={14} className="text-purple-400" /> Generative Model
            </h3>
            <div className="space-y-3 bg-gray-900/40 p-1 rounded-xl border border-white/5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Describe a shape (e.g., 'Star', 'Skull')"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-transparent text-white px-4 py-3 text-sm focus:outline-none placeholder-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleGeminiGenerate()}
                />
                <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              </div>
              
              <button
                onClick={handleGeminiGenerate}
                disabled={isGenerating || !process.env.API_KEY}
                className={`w-full py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                  isGenerating 
                    ? 'bg-purple-900/20 text-purple-300/50 cursor-wait' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20 active:scale-[0.98]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Command size={14} /> Generate with Gemini
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Palette size={14} /> Visual Style
            </h3>
            <div className="p-3 bg-gray-900/40 rounded-xl border border-white/5">
                <HexColorPicker color={particleColor} onChange={setParticleColor} style={{ width: '100%', height: '120px' }} />
                <div className="flex items-center gap-3 mt-4">
                    <div className="w-8 h-8 rounded-full border border-white/10 shadow-inner" style={{ backgroundColor: particleColor }}></div>
                    <input 
                        type="text" 
                        value={particleColor.toUpperCase()} 
                        onChange={(e) => setParticleColor(e.target.value)}
                        className="flex-1 bg-gray-950 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0"></div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Toggle sound in the top right. Open palm to scatter particles and open the filter. Close fist to condense.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;