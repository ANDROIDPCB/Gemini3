import React, { useEffect, useRef, useState } from 'react';

interface AudioControllerProps {
  enabled: boolean;
  handOpenness: number; // 0 to 1
  handDetected: boolean;
}

const AudioController: React.FC<AudioControllerProps> = ({ enabled, handOpenness, handDetected }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isInitializedRef = useRef(false);

  // Initialize Audio Engine
  useEffect(() => {
    if (enabled && !isInitializedRef.current) {
      initAudio();
    } else if (!enabled && isInitializedRef.current) {
      stopAudio();
    }
    
    // Cleanup on unmount
    return () => {
      stopAudio();
    };
  }, [enabled]);

  // Reactive Effect: Modulate Sound based on Hand
  useEffect(() => {
    if (!audioCtxRef.current || !filterNodeRef.current || !masterGainRef.current) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    
    // Calculate Target Values
    // If hand is not detected, we default to "closed" (low interaction) state, or a gentle idle state
    const intensity = handDetected ? handOpenness : 0.1;

    // 1. Filter Frequency Mapping (The "Underwater" to "Airy" effect)
    // Closed (0): ~200Hz (Muffled)
    // Open (1): ~6000Hz (Bright)
    const minFreq = 150;
    const maxFreq = 6000;
    // Use exponential mapping for better hearing perception
    const targetFreq = minFreq + Math.pow(intensity, 2) * (maxFreq - minFreq);

    // 2. Volume Mapping
    // We want it slightly quieter when closed, louder when exploded
    const minVol = 0.3;
    const maxVol = 0.6;
    const targetVol = minVol + (intensity * (maxVol - minVol));

    // Smoothly transition parameters to avoid clicking artifacts
    // rampToValueAtTime is smoother than setTargetAtTime for these specific continuous updates
    filterNodeRef.current.frequency.setTargetAtTime(targetFreq, now, 0.1); 
    masterGainRef.current.gain.setTargetAtTime(targetVol, now, 0.1);

  }, [handOpenness, handDetected, enabled]);

  const initAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain (Volume)
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0; // Start silent, fade in
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Master Filter (Low Pass) - This controls the "Muffled" effect
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200; // Start muffled
      filter.Q.value = 1; // Resonance
      filter.connect(masterGain);
      filterNodeRef.current = filter;

      // Chord: C Minor add 9 (C, Eb, G, D) stretched across octaves for a sci-fi drone
      // Base frequencies (Hz)
      const frequencies = [
        65.41,  // C2 (Deep Bass)
        130.81, // C3
        155.56, // Eb3 (Minor 3rd)
        196.00, // G3 (5th)
        293.66, // D4 (9th - adds the sci-fi flavor)
        587.33  // D5 (High sparkle)
      ];

      const newOscillators: OscillatorNode[] = [];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        // Use Triangle for bass, Sine for mids/highs for a cleaner sound
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        
        // Detune slightly for a rich, organic "chorus" effect
        osc.detune.value = (Math.random() - 0.5) * 10; 

        // Mix levels: Bass louder, highs quieter
        const volume = 1.0 / (i + 1.5); 
        oscGain.gain.value = volume;

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        newOscillators.push(osc);
      });

      oscillatorsRef.current = newOscillators;
      isInitializedRef.current = true;

      // Fade in master
      masterGain.gain.setTargetAtTime(0.3, ctx.currentTime, 2);

    } catch (e) {
      console.error("Audio init failed", e);
    }
  };

  const stopAudio = () => {
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      // Fade out before closing
      if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      }
      
      setTimeout(() => {
        oscillatorsRef.current.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch(e){}
        });
        oscillatorsRef.current = [];
        ctx.close();
        isInitializedRef.current = false;
        audioCtxRef.current = null;
      }, 500);
    }
  };

  return null; // This component is logic-only, no visual UI
};

export default AudioController;