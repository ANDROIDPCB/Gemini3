import { Point3D } from "../types";

export const generateSphere = (count: number): Point3D[] => {
  const points: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.2; // Radius
    points.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi)
    });
  }
  return points;
};

export const generateCube = (count: number): Point3D[] => {
  const points: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const axis = Math.floor(Math.random() * 3);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const p = {
      x: (Math.random() * 2 - 1) * 1.2,
      y: (Math.random() * 2 - 1) * 1.2,
      z: (Math.random() * 2 - 1) * 1.2
    };
    
    // Snap one axis to surface
    if (axis === 0) p.x = sign * 1.2;
    else if (axis === 1) p.y = sign * 1.2;
    else p.z = sign * 1.2;

    points.push(p);
  }
  return points;
};

// The mandatory "Bottle" shape
export const generateBottle = (count: number): Point3D[] => {
  const points: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const h = Math.random() * 3 - 1.0; // Height from -1 to 2 approx
    const theta = Math.random() * 2 * Math.PI;
    
    let r = 0.5; // Base radius

    // Parametric definition of a bottle profile
    // h ranges from roughly -1.5 (bottom) to 1.5 (top)
    
    // Normalize h for calculations
    const y = (h + 1) / 2.5; // 0 to 1 roughly

    if (y < 0.05) {
       // Bottom Base
       r = Math.sqrt(Math.random()) * 0.8;
    } else if (y < 0.6) {
       // Main Body
       r = 0.8;
    } else if (y < 0.7) {
       // Shoulder
       const t = (y - 0.6) / 0.1; // 0 to 1
       r = 0.8 * (1 - t) + 0.3 * t;
    } else if (y < 0.95) {
       // Neck
       r = 0.3;
    } else {
       // Lip
       r = 0.35;
    }

    points.push({
      x: r * Math.cos(theta),
      y: (y * 3.5) - 1.5, // Scale y back up and center
      z: r * Math.sin(theta)
    });
  }
  return points;
};