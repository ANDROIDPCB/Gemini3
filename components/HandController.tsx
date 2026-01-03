import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { HandData } from '../types';
import { Camera, VideoOff } from 'lucide-react';

interface HandControllerProps {
  onHandUpdate: (data: HandData) => void;
}

const HandController: React.FC<HandControllerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>(0);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setLoading(false);
        startCamera();
      } catch (err) {
        setError("Failed to load AI Vision models.");
        console.error(err);
        setLoading(false);
      }
    };
    initLandmarker();
    return () => {
      if (landmarkerRef.current) landmarkerRef.current.close();
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", predictWebcam);
        setPermissionGranted(true);
      }
    } catch (err) {
      setError("Camera permission denied.");
    }
  };

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    
    const nowInMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const result = landmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];
        
        // Calculate "Openness" based on distance of finger tips to wrist
        // Wrist is index 0
        // Tips are 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
        
        const wrist = landmarks[0];
        const tips = [4, 8, 12, 16, 20];
        
        let avgDist = 0;
        tips.forEach(idx => {
          const dx = landmarks[idx].x - wrist.x;
          const dy = landmarks[idx].y - wrist.y;
          // Z is typically normalized but less reliable for depth in single cam without calibration, 
          // but we include it for relative openness
          const dz = landmarks[idx].z - wrist.z; 
          avgDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
        });
        avgDist /= 5;

        // Tune these thresholds based on typical hand sizes in normalized coords
        // Closed fist ~ 0.15 - 0.2
        // Open palm ~ 0.4 - 0.5
        const minVal = 0.15;
        const maxVal = 0.45;
        let openness = (avgDist - minVal) / (maxVal - minVal);
        openness = Math.max(0, Math.min(1, openness));

        onHandUpdate({
          detected: true,
          isOpen: openness > 0.5,
          openness: openness
        });
      } else {
        onHandUpdate({ detected: false, isOpen: false, openness: 0 });
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900 w-40 h-32">
        {loading && (
           <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
             Loading AI...
           </div>
        )}
        {!permissionGranted && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-red-400 p-2 text-center">
            <VideoOff size={24} className="mb-2" />
            <span>Camera Access Needed</span>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${(!permissionGranted || loading) ? 'opacity-0' : 'opacity-100'}`}
        />
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <span className="text-[10px] font-mono text-white opacity-70">LIVE INPUT</span>
        </div>
      </div>
    </div>
  );
};

export default HandController;