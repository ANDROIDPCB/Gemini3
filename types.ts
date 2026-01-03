export enum ShapeType {
  SPHERE = 'Sphere',
  CUBE = 'Cube',
  BOTTLE = 'Bottle',
  GEMINI_GENERATED = 'Custom (Gemini)',
}

export interface ParticleConfig {
  color: string;
  count: number;
  size: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  isOpen: boolean;
  openness: number; // 0.0 (fist) to 1.0 (open palm)
  detected: boolean;
}