import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Trash2, HelpCircle, Dices, Plus, Minus, Coins } from 'lucide-react';

interface Vertex {
  x: number;
  y: number;
  z: number;
}

interface Face {
  indices: number[];
  label: string;
}

interface Geometry {
  vertices: Vertex[];
  faces: Face[];
}

interface PhysicalDie {
  id: number;
  sides: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  pitch: number;
  yaw: number;
  roll: number;
  vPitch: number;
  vYaw: number;
  vRoll: number;
  settled: boolean;
  result: number;
  color: string;
  geom: Geometry;
}

// Generate beautiful 3D Geometry for all dice sizes (D3 to D100)
function generateGeometry(sides: number): Geometry {
  const vertices: Vertex[] = [];
  const faces: Face[] = [];

  if (sides === 2) {
    // Model Coin (D2) as a 3D cylinder disk with 12 segments
    const segments = 12;
    const r = 1.4;
    const h = 0.25;
    // Top cap vertices
    for (let i = 0; i < segments; i++) {
      const theta = (i * 2 * Math.PI) / segments;
      vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: h });
    }
    // Bottom cap vertices
    for (let i = 0; i < segments; i++) {
      const theta = (i * 2 * Math.PI) / segments;
      vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: -h });
    }
    // Top cap face
    faces.push({
      indices: Array.from({ length: segments }, (_, k) => k),
      label: '1', // Heads
    });
    // Bottom cap face
    faces.push({
      indices: Array.from({ length: segments }, (_, k) => segments * 2 - 1 - k),
      label: '2', // Tails
    });
    // Side panels (plain, no labels)
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      faces.push({
        indices: [i, next, next + segments, i + segments],
        label: '',
      });
    }
  } else if (sides === 3) {
    // Triangular prism
    const r = 1.3;
    const h = 0.9;
    // Top cap
    vertices.push({ x: r, y: 0, z: h });
    vertices.push({ x: r * Math.cos((2 * Math.PI) / 3), y: r * Math.sin((2 * Math.PI) / 3), z: h });
    vertices.push({ x: r * Math.cos((4 * Math.PI) / 3), y: r * Math.sin((4 * Math.PI) / 3), z: h });
    // Bottom cap
    vertices.push({ x: r, y: 0, z: -h });
    vertices.push({ x: r * Math.cos((2 * Math.PI) / 3), y: r * Math.sin((2 * Math.PI) / 3), z: -h });
    vertices.push({ x: r * Math.cos((4 * Math.PI) / 3), y: r * Math.sin((4 * Math.PI) / 3), z: -h });

    // Side 1 (Face 1)
    faces.push({ indices: [0, 1, 4, 3], label: '1' });
    // Side 2 (Face 2)
    faces.push({ indices: [1, 2, 5, 4], label: '2' });
    // Side 3 (Face 3)
    faces.push({ indices: [2, 0, 3, 5], label: '3' });
    // Caps (no labels for resting)
    faces.push({ indices: [0, 2, 1], label: '' });
    faces.push({ indices: [3, 4, 5], label: '' });
  } else if (sides === 4) {
    // Tetrahedron
    const s = 1.5;
    vertices.push({ x: s, y: s, z: s });
    vertices.push({ x: -s, y: -s, z: s });
    vertices.push({ x: -s, y: s, z: -s });
    vertices.push({ x: s, y: -s, z: -s });

    faces.push({ indices: [0, 1, 2], label: '1' });
    faces.push({ indices: [0, 2, 3], label: '2' });
    faces.push({ indices: [0, 3, 1], label: '3' });
    faces.push({ indices: [1, 3, 2], label: '4' });
  } else if (sides === 6) {
    // Cube
    const s = 1.1;
    vertices.push({ x: s, y: s, z: s }); // 0
    vertices.push({ x: -s, y: s, z: s }); // 1
    vertices.push({ x: -s, y: -s, z: s }); // 2
    vertices.push({ x: s, y: -s, z: s }); // 3
    vertices.push({ x: s, y: s, z: -s }); // 4
    vertices.push({ x: -s, y: s, z: -s }); // 5
    vertices.push({ x: -s, y: -s, z: -s }); // 6
    vertices.push({ x: s, y: -s, z: -s }); // 7

    faces.push({ indices: [0, 1, 2, 3], label: '6' });
    faces.push({ indices: [4, 7, 6, 5], label: '1' });
    faces.push({ indices: [0, 3, 7, 4], label: '5' });
    faces.push({ indices: [1, 5, 6, 2], label: '2' });
    faces.push({ indices: [0, 4, 5, 1], label: '3' });
    faces.push({ indices: [3, 2, 6, 7], label: '4' });
  } else if (sides === 8) {
    // Octahedron
    const s = 1.5;
    vertices.push({ x: 0, y: 0, z: s }); // 0: Top
    vertices.push({ x: 0, y: 0, z: -s }); // 1: Bottom
    vertices.push({ x: s, y: 0, z: 0 }); // 2
    vertices.push({ x: 0, y: s, z: 0 }); // 3
    vertices.push({ x: -s, y: 0, z: 0 }); // 4
    vertices.push({ x: 0, y: -s, z: 0 }); // 5

    faces.push({ indices: [0, 2, 3], label: '1' });
    faces.push({ indices: [0, 3, 4], label: '2' });
    faces.push({ indices: [0, 4, 5], label: '3' });
    faces.push({ indices: [0, 5, 2], label: '4' });
    faces.push({ indices: [1, 3, 2], label: '5' });
    faces.push({ indices: [1, 4, 3], label: '6' });
    faces.push({ indices: [1, 5, 4], label: '7' });
    faces.push({ indices: [1, 2, 5], label: '8' });
  } else if (sides === 10) {
    // Pentagonal Trapezohedron / Staggered double-5-pyramid for D10
    const h = 1.5;
    const r = 1.35;
    vertices.push({ x: 0, y: 0, z: h }); // Top apex (0)
    vertices.push({ x: 0, y: 0, z: -h }); // Bottom apex (1)
    
    // Equatorial set A (upper staggered ring)
    for (let i = 0; i < 5; i++) {
      const theta = (i * 2 * Math.PI) / 5;
      vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: 0.3 });
    }
    // Equatorial set B (lower staggered ring)
    for (let i = 0; i < 5; i++) {
      const theta = (i * 2 * Math.PI) / 5 + Math.PI / 5;
      vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: -0.3 });
    }

    // Faces structure: 10 kite-like triangles joining upper/lower vertices
    for (let i = 0; i < 5; i++) {
      const next = (i + 1) % 5;
      // Top triangular wedges
      faces.push({ indices: [0, i + 2, next + 2], label: `${(i * 2 + 1) % 10 || 10}` });
      // Bottom triangular wedges
      faces.push({ indices: [1, next + 7, i + 7], label: `${(i * 2 + 6) % 10 || 10}` });
    }
  } else if (sides === 12) {
    // Dodecahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const s = 0.8;
    // 20 vertices
    vertices.push({ x: s, y: s, z: s }); // 0
    vertices.push({ x: -s, y: s, z: s }); // 1
    vertices.push({ x: -s, y: -s, z: s }); // 2
    vertices.push({ x: s, y: -s, z: s }); // 3
    vertices.push({ x: s, y: s, z: -s }); // 4
    vertices.push({ x: -s, y: s, z: -s }); // 5
    vertices.push({ x: -s, y: -s, z: -s }); // 6
    vertices.push({ x: s, y: -s, z: -s }); // 7
    // Staggered plane vertices
    const s_phi = s * phi;
    const s_inv_phi = s / phi;
    vertices.push({ x: 0, y: s_phi, z: s_inv_phi }); // 8
    vertices.push({ x: 0, y: -s_phi, z: s_inv_phi }); // 9
    vertices.push({ x: 0, y: s_phi, z: -s_inv_phi }); // 10
    vertices.push({ x: 0, y: -s_phi, z: -s_inv_phi }); // 11

    vertices.push({ x: s_inv_phi, y: 0, z: s_phi }); // 12
    vertices.push({ x: -s_inv_phi, y: 0, z: s_phi }); // 13
    vertices.push({ x: s_inv_phi, y: 0, z: -s_phi }); // 14
    vertices.push({ x: -s_inv_phi, y: 0, z: -s_phi }); // 15

    vertices.push({ x: s_phi, y: s_inv_phi, z: 0 }); // 16
    vertices.push({ x: -s_phi, y: s_inv_phi, z: 0 }); // 17
    vertices.push({ x: -s_phi, y: -s_inv_phi, z: 0 }); // 18
    vertices.push({ x: s_phi, y: -s_inv_phi, z: 0 }); // 19

    // 12 pentagonal faces
    faces.push({ indices: [0, 16, 19, 3, 12], label: '1' });
    faces.push({ indices: [0, 12, 13, 1, 8], label: '2' });
    faces.push({ indices: [0, 8, 10, 5, 4], label: '3' });
    faces.push({ indices: [1, 17, 5, 8, 13], label: '4' });
    faces.push({ indices: [1, 13, 2, 18, 17], label: '5' });
    faces.push({ indices: [2, 9, 11, 6, 18], label: '6' });
    faces.push({ indices: [3, 19, 7, 14, 12], label: '7' });
    faces.push({ indices: [4, 16, 0, 8, 10], label: '8' });
    faces.push({ indices: [4, 5, 15, 14, 16], label: '9' });
    faces.push({ indices: [6, 11, 15, 5, 17], label: '10' });
    faces.push({ indices: [7, 19, 2, 9, 11], label: '11' });
    faces.push({ indices: [11, 15, 14, 7, 6], label: '12' });
  } else if (sides === 20) {
    // Icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const s = 1.0;
    vertices.push({ x: 0, y: s, z: s * phi }); // 0
    vertices.push({ x: 0, y: -s, z: s * phi }); // 1
    vertices.push({ x: 0, y: s, z: -s * phi }); // 2
    vertices.push({ x: 0, y: -s, z: -s * phi }); // 3

    vertices.push({ x: s, y: s * phi, z: 0 }); // 4
    vertices.push({ x: -s, y: s * phi, z: 0 }); // 5
    vertices.push({ x: s, y: -s * phi, z: 0 }); // 6
    vertices.push({ x: -s, y: -s * phi, z: 0 }); // 7

    vertices.push({ x: s * phi, y: 0, z: s }); // 8
    vertices.push({ x: -s * phi, y: 0, z: s }); // 9
    vertices.push({ x: s * phi, y: 0, z: -s }); // 10
    vertices.push({ x: -s * phi, y: 0, z: -s }); // 11

    // 20 triangular faces
    faces.push({ indices: [0, 1, 8], label: '20' });
    faces.push({ indices: [0, 8, 4], label: '2' });
    faces.push({ indices: [0, 4, 5], label: '14' });
    faces.push({ indices: [0, 5, 9], label: '8' });
    faces.push({ indices: [0, 9, 1], label: '12' });

    faces.push({ indices: [1, 8, 6], label: '10' });
    faces.push({ indices: [8, 4, 10], label: '18' });
    faces.push({ indices: [4, 5, 2], label: '6' });
    faces.push({ indices: [5, 9, 11], label: '16' });
    faces.push({ indices: [9, 1, 7], label: '4' });

    faces.push({ indices: [3, 2, 10], label: '1' });
    faces.push({ indices: [3, 10, 6], label: '19' });
    faces.push({ indices: [3, 6, 7], label: '7' });
    faces.push({ indices: [3, 7, 11], label: '13' });
    faces.push({ indices: [3, 11, 2], label: '15' });

    faces.push({ indices: [2, 10, 4], label: '9' });
    faces.push({ indices: [10, 6, 8], label: '3' });
    faces.push({ indices: [6, 7, 1], label: '11' });
    faces.push({ indices: [7, 11, 9], label: '17' });
    faces.push({ indices: [11, 2, 5], label: '5' });
  } else {
    // Universal dynamic geometry for any other size (bipyramids for even sizes, cylindrical prisms for odd sizes)
    const isEven = sides % 2 === 0;

    if (isEven) {
      // Create a regular (sides / 2)-gonal bipyramid
      const k = sides / 2;
      const h = 1.5;
      const r = 1.4;
      vertices.push({ x: 0, y: 0, z: h }); // Top apex (0)
      vertices.push({ x: 0, y: 0, z: -h }); // Bottom apex (1)

      // Ring vertices
      for (let i = 0; i < k; i++) {
        const theta = (i * 2 * Math.PI) / k;
        // Stagger equator slightly to create physical stable planes
        const zOff = i % 2 === 0 ? 0.12 : -0.12;
        vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: zOff });
      }

      // Connect top and bottom apexes
      for (let i = 0; i < k; i++) {
        const next = (i + 1) % k;
        // Top cap face
        faces.push({
          indices: [0, i + 2, next + 2],
          label: `${((i * 2) + 1) <= sides ? (i * 2) + 1 : 1}`,
        });
        // Bottom cap face
        faces.push({
          indices: [1, next + 2, i + 2],
          label: `${((i * 2) + 2) <= sides ? (i * 2) + 2 : 2}`,
        });
      }
    } else {
      // For odd sizes, make an N-gonal elongated prism (roll like a rolling cylinder log)
      const k = sides;
      const r = 1.35;
      const h = 1.2;

      // Top circle
      for (let i = 0; i < k; i++) {
        const theta = (i * 2 * Math.PI) / k;
        vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: h });
      }
      // Bottom circle
      for (let i = 0; i < k; i++) {
        const theta = (i * 2 * Math.PI) / k;
        vertices.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: -h });
      }

      // Side rectangles (faces 1 to N)
      for (let i = 0; i < k; i++) {
        const next = (i + 1) % k;
        faces.push({
          indices: [i, next, next + k, i + k],
          label: `${i + 1}`,
        });
      }
      // Top cap face (ignored result)
      faces.push({
        indices: Array.from({ length: k }, (_, idx) => k - 1 - idx),
        label: '',
      });
      // Bottom cap face (ignored result)
      faces.push({
        indices: Array.from({ length: k }, (_, idx) => k + idx),
        label: '',
      });
    }
  }

  // Double-protect label integrity
  faces.forEach((f, idx) => {
    if (f.label === '') return;
    const lVal = parseInt(f.label, 10);
    if (isNaN(lVal) || lVal < 1 || lVal > sides) {
      f.label = `${(idx % sides) + 1}`;
    }
  });

  return { vertices, faces };
}

// Global hook to trigger haptics and sounds
function triggerHapticPulse(delayMsArr: number[]) {
  if ((window as any).haptic) {
    (window as any).haptic(delayMsArr);
  }
}

export default function DiceTrayCanvas() {
  const [selectedDie, setSelectedDie] = useState<number>(20);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [customSides, setCustomSides] = useState<number>(24);
  const [trayOutput, setTrayOutput] = useState<string>('tap roll to begin');
  const [trayResult, setTrayResult] = useState<string>('—');
  const [rollHistory, setRollHistory] = useState<any[]>([]);

  const [customHeads, setCustomHeads] = useState<string>(() => localStorage.getItem('custom_coin_heads') || 'Heads');
  const [customTails, setCustomTails] = useState<string>(() => localStorage.getItem('custom_coin_tails') || 'Tails');

  useEffect(() => {
    (window as any).customCoinHeads = customHeads;
    (window as any).customCoinTails = customTails;
  }, [customHeads, customTails]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const diceRef = useRef<PhysicalDie[]>([]);
  const nextId = useRef<number>(1);

  // Refs to trace settlement status cleanly without resetting when React states or deps trigger re-renders
  const framesSinceSettleReportRef = useRef<number>(0);
  const areAllSettledRef = useRef<boolean>(false);

  // Mouse/Touch interaction support for shaking and flicking dice
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // Load local history
    try {
      const hist = localStorage.getItem('roll_history');
      if (hist) {
        setRollHistory(JSON.parse(hist));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Expose triggers globally for backward compatibility with outer components
  useEffect(() => {
    (window as any).doRoll = (sides: number) => {
      triggerLaunch(sides);
    };
    (window as any).setSelectedDie = (sides: number) => {
      setSelectedDie(sides);
    };
  }, [diceCount, customSides]);

  // Main physics + render loops - isolated completely from state dependencies
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      if (!ctx || !canvas) return;

      // Draw subtle mystical glowing background circle (portal rim matching CSS theme)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rimRadius = 118; // Match the larger container boundary

      // Draw active circular arena floor shadow
      ctx.beginPath();
      ctx.arc(cx, cy, rimRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(12, 5, 28, 0.55)';
      ctx.fill();

      // Update and draw physics on each active die
      const dice = diceRef.current;

      // Dynamic elastic inter-die collisions
      for (let i = 0; i < dice.length; i++) {
        for (let j = i + 1; j < dice.length; j++) {
          const d1 = dice[i];
          const d2 = dice[j];

          const dx = d2.x - d1.x;
          const dy = d2.y - d1.y;
          const dz = d2.z - d1.z;
          const dist = Math.hypot(dx, dy, dz);
          const minColDist = 56; // scaled proportionally for the larger beautiful visual zoom

          if (dist < minColDist && dist > 0.1) {
            // Unclog overlap
            const overlap = minColDist - dist;
            const pushX = (dx / dist) * overlap * 0.5;
            const pushY = (dy / dist) * overlap * 0.5;
            const pushZ = (dz / dist) * overlap * 0.5;

            d1.x -= pushX;
            d1.y -= pushY;
            d1.z -= pushZ;
            d2.x += pushX;
            d2.y += pushY;
            d2.z += pushZ;

            // Compute relative velocities and impulse
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            const rvx = d2.vx - d1.vx;
            const rvy = d2.vy - d1.vy;
            const rvz = d2.vz - d1.vz;

            const velN = rvx * nx + rvy * ny + rvz * nz;
            if (velN < 0) {
              const impulse = -(1 + 0.52) * velN * 0.5;
              d1.vx -= impulse * nx;
              d1.vy -= impulse * ny;
              d1.vz -= impulse * nz;

              d2.vx += impulse * nx;
              d2.vy += impulse * ny;
              d2.vz += impulse * nz;

              // Give them additional rotational twist when bouncing off each other
              d1.vPitch += (Math.random() - 0.5) * 0.16;
              d1.vYaw += (Math.random() - 0.5) * 0.16;
              d1.vRoll += (Math.random() - 0.5) * 0.16;

              d2.vPitch += (Math.random() - 0.5) * 0.16;
              d2.vYaw += (Math.random() - 0.5) * 0.16;
              d2.vRoll += (Math.random() - 0.5) * 0.16;

              triggerHapticPulse([8]);
            }
          }
        }
      }

      // Single-die updates (walls, floor, gravity, rotation)
      let currentFrameAllSettled = true;

      for (let d of dice) {
        // Gravity (always pull down if above table)
        if (d.z > 0) {
          d.vz -= 0.35; // physical gravity down
          d.settled = false;
        }

        // Apply velocities
        d.x += d.vx;
        d.y += d.vy;
        d.z += d.vz;

        // Apply angular rotations
        d.pitch += d.vPitch;
        d.yaw += d.vYaw;
        d.roll += d.vRoll;

        // Floor collision / bounces
        if (d.z < 0) {
          d.z = 0;
          if (Math.abs(d.vz) > 0.45) {
            d.vz = -d.vz * 0.42; // vertical bounce restitution
            triggerHapticPulse([12]);
            // Jolt torque upon impact
            d.vPitch += (Math.random() - 0.5) * d.vx * 0.35;
            d.vYaw += (Math.random() - 0.5) * d.vy * 0.35;
            d.vRoll += (Math.random() - 0.5) * d.vz * 0.35;
          } else {
            d.vz = 0;
          }
        }

        // Ground/Air Friction Decay - THIS PREVENTS INFINITE ROLLING
        if (d.z <= 0.05) {
          // Robust continuous ground friction deceleration
          d.vx *= 0.88;
          d.vy *= 0.88;
          d.vPitch *= 0.88;
          d.vYaw *= 0.88;
          d.vRoll *= 0.88;
        } else {
          // Slow drag in the air
          d.vx *= 0.985;
          d.vy *= 0.985;
          d.vPitch *= 0.985;
          d.vYaw *= 0.985;
          d.vRoll *= 0.985;
        }

        // Circular Wall Boundary Collisions (strictly keep inside rimRadius)
        const dx = d.x - cx;
        const dy = d.y - cy;
        const distFromCenter = Math.hypot(dx, dy);
        // Decrease activeRadius substantially to guarantee the dice never touch/cross the visual circle line or clip!
        const activeRadius = rimRadius - 44;

        if (distFromCenter > activeRadius) {
          // Push back inside
          d.x = cx + (dx / distFromCenter) * activeRadius;
          d.y = cy + (dy / distFromCenter) * activeRadius;

          // Normal direction back inwards
          const nx = dx / distFromCenter;
          const ny = dy / distFromCenter;

          const dot = d.vx * nx + d.vy * ny;
          if (dot > 0) {
            // Reflect outward velocity completely back into the circular bowl
            d.vx = (d.vx - 2.0 * dot * nx) * 0.72;
            d.vy = (d.vy - 2.0 * dot * ny) * 0.72;

            // Induce dynamic centrifugal roll on walls
            d.vPitch += d.vy * 0.15;
            d.vYaw -= d.vx * 0.15;
            d.vRoll += (Math.random() - 0.5) * 0.15;

            triggerHapticPulse([6]);
          }
        }

        // Kinetic motion check for settling
        const kineticM = Math.hypot(d.vx, d.vy, d.vz) + Math.hypot(d.vPitch, d.vYaw, d.vRoll);
        if (kineticM > 0.045 || d.z > 0.05) {
          d.settled = false;
          currentFrameAllSettled = false;
        } else {
          d.settled = true;
          // Smoothly halt all kinetic values and hold position
          d.vx = 0;
          d.vy = 0;
          d.vz = 0;
          d.vPitch *= 0.8;
          d.vYaw *= 0.8;
          d.vRoll *= 0.8;

          // For beautiful rendering: smoothly ease settled orientation of a coin so it lies perfectly level
          if (d.sides === 2) {
            // Check if Heads or Tails is facing the screen (Heads local normal is +Z)
            // Rotate local vector (0, 0, 1) through Pitch, Yaw, Roll
            let x1 = 0;
            let y1 = 0;
            let z1 = 1.0;

            // Roll
            let xr1 = x1 * Math.cos(d.roll) - y1 * Math.sin(d.roll);
            let yr1 = x1 * Math.sin(d.roll) + y1 * Math.cos(d.roll);
            let zr1 = z1;

            // Pitch
            let xr2 = xr1;
            let yr2 = yr1 * Math.cos(d.pitch) - zr1 * Math.sin(d.pitch);
            let zr2 = yr1 * Math.sin(d.pitch) + zr1 * Math.cos(d.pitch);

            // Yaw
            let xr3 = xr2 * Math.cos(d.yaw) + zr2 * Math.sin(d.yaw);
            let zr3 = -xr2 * Math.sin(d.yaw) + zr2 * Math.cos(d.yaw);

            // zr3 points in camera direction. If negative, Heads is facing viewer.
            if (zr3 < 0) {
              const targetPitch = Math.round(d.pitch / (Math.PI * 2)) * (Math.PI * 2);
              d.pitch = d.pitch * 0.8 + targetPitch * 0.2;
              d.roll = d.roll * 0.8 + 0;
              d.yaw = d.yaw * 0.8 + 0;
            } else {
              const targetPitch = Math.round((d.pitch - Math.PI) / (Math.PI * 2)) * (Math.PI * 2) + Math.PI;
              d.pitch = d.pitch * 0.8 + targetPitch * 0.2;
              d.roll = d.roll * 0.8 + 0;
              d.yaw = d.yaw * 0.8 + 0;
            }
          }
        }

        // Rendering: Draw the Die in 3D Perspective!
        drawDie3D(ctx, d, cx, cy);
      }

      // Check for collective settlement completion using persistent component-level Refs
      if (currentFrameAllSettled && dice.length > 0) {
        if (!areAllSettledRef.current) {
          framesSinceSettleReportRef.current++;
          if (framesSinceSettleReportRef.current > 15) {
            areAllSettledRef.current = true;
            reportSettleResults();
          }
        }
      } else {
        areAllSettledRef.current = false;
        framesSinceSettleReportRef.current = 0;
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    // Calculate projected 3D coordinates and render solid faces of the die
    const drawDie3D = (ctx: CanvasRenderingContext2D, d: PhysicalDie, cx: number, cy: number) => {
      const zoom = 26.0; // Beautifully sized to be large, highly legible, and premium
      const camDist = 300;

      // Rotate and Project vertices
      const projVertices: { x: number; y: number; z: number }[] = [];
      for (let v of d.geom.vertices) {
        // Roll (about Z)
        let x1 = v.x * Math.cos(d.roll) - v.y * Math.sin(d.roll);
        let y1 = v.x * Math.sin(d.roll) + v.y * Math.cos(d.roll);
        let z1 = v.z;

        // Pitch (about X)
        let x2 = x1;
        let y2 = y1 * Math.cos(d.pitch) - z1 * Math.sin(d.pitch);
        let z2 = y1 * Math.sin(d.pitch) + z1 * Math.cos(d.pitch);

        // Yaw (about Y)
        let x3 = x2 * Math.cos(d.yaw) + z2 * Math.sin(d.yaw);
        let y3 = y2;
        let z3 = -x2 * Math.sin(d.yaw) + z2 * Math.cos(d.yaw);

        // Displace the die model within virtual world space
        // Add pseudo-height (d.z) to project it higher
        const worldX = x3;
        const worldY = y3 - d.z * 0.08; // perspective vertical height offset
        const worldZ = z3 + 12; // deep camera placement

        const scale = camDist / (camDist + worldZ);
        projVertices.push({
          x: d.x + worldX * scale * zoom,
          y: d.y + worldY * scale * zoom,
          z: worldZ,
        });
      }

      // Render faces with basic illumination and flat/gradient backface sorted Painter's Algorithm
      const visibleFaces: {
        face: Face;
        projPts: { x: number; y: number }[];
        avgZ: number;
        nz: number;
      }[] = [];

      for (let f of d.geom.faces) {
        if (f.indices.length < 3) continue;

        const pts = f.indices.map((idx) => projVertices[idx]);
        if (pts.some((p) => !p)) continue;

        // Obtain face coordinates to calculate flat outward normal pointing away from (0,0,0) index-independently
        const v1 = d.geom.vertices[f.indices[0]];
        const v2 = d.geom.vertices[f.indices[1]];
        const v3 = d.geom.vertices[f.indices[2]];

        const ux = v2.x - v1.x;
        const uy = v2.y - v1.y;
        const uz = v2.z - v1.z;

        const vx = v3.x - v1.x;
        const vy = v3.y - v1.y;
        const vz = v3.z - v1.z;

        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;

        // Force outward direction
        const dotOrigin = nx * v1.x + ny * v1.y + nz * v1.z;
        if (dotOrigin < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }

        const len = Math.hypot(nx, ny, nz);
        const unitNX = len > 0.001 ? nx / len : 0;
        const unitNY = len > 0.001 ? ny / len : 0;
        const unitNZ = len > 0.001 ? nz / len : 0;

        // Apply Roll, Pitch, Yaw rotations to the local normal vector
        // Roll (about Z)
        let rx1 = unitNX * Math.cos(d.roll) - unitNY * Math.sin(d.roll);
        let ry1 = unitNX * Math.sin(d.roll) + unitNY * Math.cos(d.roll);
        let rz1 = unitNZ;

        // Pitch (about X)
        let rx2 = rx1;
        let ry2 = ry1 * Math.cos(d.pitch) - rz1 * Math.sin(d.pitch);
        let rz2 = ry1 * Math.sin(d.pitch) + rz1 * Math.cos(d.pitch);

        // Yaw (about Y)
        let rx3 = rx2 * Math.cos(d.yaw) + rz2 * Math.sin(d.yaw);
        let ry3 = ry2;
        let rz3 = -rx2 * Math.sin(d.yaw) + rz2 * Math.cos(d.yaw);

        // rz3 is the Z coordinate of the outward facing normal in camera/world space.
        // A negative component (< -0.15) points directly towards the screen (and the user's eyes).
        if (rz3 < -0.15) {
          const avgZ = pts.reduce((sum, p) => sum + p.z, 0) / pts.length;
          visibleFaces.push({
            face: f,
            projPts: pts.map((p) => ({ x: p.x, y: p.y })),
            avgZ,
            nz: rz3 * 300,
          });
        }
      }

      // Identify the winning face (the one pointing closest directly outwards to the viewer, which has the most negative nz/rz3 component)
      let winningFace: Face | null = null;
      let minNZ = 999999;
      for (let vf of visibleFaces) {
        if (vf.nz < minNZ) {
          minNZ = vf.nz;
          winningFace = vf.face;
        }
      }

      // Depth - Sort (Painter's algorithm: draw deepest faces first)
      visibleFaces.sort((a, b) => b.avgZ - a.avgZ);

      // Light normal directional vector (shading)
      const lx = -0.4;
      const ly = -0.5;
      const lz = -0.8;
      const lightLen = Math.hypot(lx, ly, lz);

      // Real 3D flat rendering on Canvas
      for (let vf of visibleFaces) {
        const pts = vf.projPts;

        // Basic flat color shading normal estimation based on screen area
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        // Calculate custom gradient based on normal shading
        const shade = Math.max(0.2, Math.min(1.0, 1.0 - Math.abs(vf.nz) / 380));

        // Premium multi-colored neon glass gradients per preset
        let gradFill = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
        const isWinner = (vf.face === winningFace);

        if (isWinner && d.sides > 2) {
          // GORGEOUS golden glowing highlight for the winning face
          // This makes the active face instantly stand out from the rest as the absolute "upright" face!
          gradFill.addColorStop(0, `rgba(253, 224, 71, ${0.95 * shade})`);
          gradFill.addColorStop(0.5, `rgba(234, 179, 8, ${0.9 * shade})`);
          gradFill.addColorStop(1, `rgba(161, 98, 7, ${0.95 * shade})`);
        } else if (d.sides === 20) {
          // Cosmic Icosahedron magenta theme
          gradFill.addColorStop(0, `rgba(${Math.floor(212 * shade)}, ${Math.floor(79 * shade)}, ${Math.floor(230 * shade)}, 0.95)`);
          gradFill.addColorStop(1, `rgba(${Math.floor(80 * shade)}, ${Math.floor(24 * shade)}, ${Math.floor(100 * shade)}, 0.95)`);
        } else if (d.sides === 6) {
          // Sage D6 theme
          gradFill.addColorStop(0, `rgba(${Math.floor(63 * shade)}, ${Math.floor(217 * shade)}, ${Math.floor(199 * shade)}, 0.95)`);
          gradFill.addColorStop(1, `rgba(${Math.floor(12 * shade)}, ${Math.floor(110 * shade)}, ${Math.floor(100 * shade)}, 0.95)`);
        } else if (d.sides === 2) {
          // Highly authentic gold metallic gradient for coin
          gradFill.addColorStop(0, `rgba(${Math.floor(253 * shade)}, ${Math.floor(224 * shade)}, ${Math.floor(71 * shade)}, 0.95)`);
          gradFill.addColorStop(0.5, `rgba(${Math.floor(234 * shade)}, ${Math.floor(179 * shade)}, ${Math.floor(8 * shade)}, 0.95)`);
          gradFill.addColorStop(1, `rgba(${Math.floor(161 * shade)}, ${Math.floor(98 * shade)}, ${Math.floor(7 * shade)}, 0.95)`);
        } else {
          // Beautiful default royal indigo/violet theme
          gradFill.addColorStop(0, `rgba(${Math.floor(123 * shade)}, ${Math.floor(47 * shade)}, ${Math.floor(224 * shade)}, 0.95)`);
          gradFill.addColorStop(1, `rgba(${Math.floor(40 * shade)}, ${Math.floor(10 * shade)}, ${Math.floor(110 * shade)}, 0.95)`);
        }

        ctx.fillStyle = gradFill;
        ctx.fill();

        // Radiant thin neon wireframes
        if (isWinner && d.sides > 2) {
          // Thick glowing gold/yellow wireframe for the winning face's boundaries
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.4;
          ctx.save();
          ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.strokeStyle = d.sides === 20 ? '#f0abfc' : d.sides === 6 ? '#2dd4bf' : d.sides === 2 ? '#fef08a' : '#c084fc';
          ctx.lineWidth = d.sides === 2 ? 1.4 : 1.1;
          ctx.stroke();
        }

        // Draw character numbers/labels in the face center
        if (vf.face.label) {
          const avgX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
          const avgY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;

          ctx.save();
          ctx.translate(avgX, avgY);

          if (d.sides === 2) {
            // Render beautiful detailed outer gold ring for Coin Cap!
            ctx.beginPath();
            ctx.arc(0, 0, zoom * 1.15, 0, Math.PI * 2);
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.3;
            ctx.stroke();

            // Inner dotted gold rim
            ctx.beginPath();
            ctx.arc(0, 0, zoom * 0.9, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw majestic Coin Text (H / T)
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textSymbol = vf.face.label === '1' ? customHeads : customTails;
            let coinFontSize = 22;
            if (textSymbol.length > 5) coinFontSize = 14;
            if (textSymbol.length > 8) coinFontSize = 10;
            ctx.font = `bold ${coinFontSize}px 'Inter', sans-serif`;
            ctx.fillText(textSymbol, 0, 0);
          } else if (isWinner) {
            // GORGEOUS layout for the active winning number to guarantee extreme visibility!
            let fontSizeVal = d.sides === 20 ? 14 : d.sides <= 6 ? 18 : 15;
            let haloRadius = d.sides === 20 ? 12 : d.sides <= 6 ? 15 : 13;

            // Draw a beautiful high-tech circular gold medal badge behind the winning text
            ctx.beginPath();
            ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // deep dark circular center for maximum contrast
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2.0;
            ctx.shadowColor = 'rgba(253, 224, 71, 0.9)';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset shadow index-independently

            // Draw high-contrast golden glowing winning status text inside the circle
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${fontSizeVal}px 'JetBrains Mono', monospace`;
            ctx.fillText(vf.face.label, 0, 0.5);
          } else {
            // Standard Dice flat crisp high-contrast face text (non-active faces are slightly dimmer)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let fontSize = '16px';
            if (d.sides === 20) fontSize = '15px';
            else if (d.sides > 30) fontSize = '11px';
            else if (d.sides <= 6) fontSize = '20px';
            else fontSize = '16px';
            
            ctx.font = `bold ${fontSize} 'JetBrains Mono', monospace`;
            ctx.fillText(vf.face.label, 0, 0);
          }
          ctx.restore();
        }
      }
    };

    // Evaluate physical die results upon settling (face closest to ceiling / vertical Z apex)
    const reportSettleResults = () => {
      const settledDice = diceRef.current;
      if (settledDice.length === 0) return;

      const rollsList: { sides: number; result: number; label: string }[] = [];
      let totalSum = 0;

      settledDice.forEach((d) => {
        // Evaluate face with closest direct projection alignment towards camera
        let bestFace: Face | null = null;
        let bestNZ = 9999999;

        // Perform camera space dot projection check on each face
        d.geom.faces.forEach((f) => {
          if (!f.label) return;

          // Compute raw rotated normal direct towards view camera
          const pts = f.indices.map((idx) => d.geom.vertices[idx]);
          const p1 = pts[0];
          const p2 = pts[1];
          const p3 = pts[2];

          // Edge vectors
          const ux = p2.x - p1.x;
          const uy = p2.y - p1.y;
          const uz = p2.z - p1.z;

          const vx = p3.x - p1.x;
          const vy = p3.y - p1.y;
          const vz = p3.z - p1.z;

          // Cross-product (normal of this static original face)
          let nx = uy * vz - uz * vy;
          let ny = uz * vx - ux * vz;
          let nz = ux * vy - uy * vx;

          // Force outward direction
          const dotOrigin = nx * p1.x + ny * p1.y + nz * p1.z;
          if (dotOrigin < 0) {
            nx = -nx;
            ny = -ny;
            nz = -nz;
          }

          const len = Math.hypot(nx, ny, nz);
          if (len < 0.001) return;

          // Rotate normal of this face to match actual camera space
          const normalizedNX = nx / len;
          const normalizedNY = ny / len;
          const normalizedNZ = nz / len;

          // Apply equivalent orientation 3D rotation
          let x1 = normalizedNX * Math.cos(d.roll) - normalizedNY * Math.sin(d.roll);
          let y1 = normalizedNX * Math.sin(d.roll) + normalizedNY * Math.cos(d.roll);
          let z1 = normalizedNZ;

          let x2 = x1;
          let y2 = y1 * Math.cos(d.pitch) - z1 * Math.sin(d.pitch);
          let z2 = y1 * Math.sin(d.pitch) + z1 * Math.cos(d.pitch);

          let x3 = x2 * Math.cos(d.yaw) + z2 * Math.sin(d.yaw);
          let y3 = y2;
          let z3 = -x2 * Math.sin(d.yaw) + z2 * Math.cos(d.yaw);

          // We look for face pointing straight directly outwards from screen (smallest face-depth, highly negative camera-scale Z component)
          // Since camera looks down POSITIVE Z, face pointing straight to viewer has largest NEGATIVE Z normal
          if (z3 < bestNZ) {
            bestNZ = z3;
            bestFace = f;
          }
        });

        const rValue = bestFace ? parseInt((bestFace as Face).label, 10) || 1 : 1;
        d.result = rValue;

        rollsList.push({
          sides: d.sides,
          result: rValue,
          label: d.sides === 2 ? 'coin' : `d${d.sides}`,
        });
        totalSum += rValue;
      });

      // Update Tray UI results
      const itemsDetail = rollsList.map((r) => `${r.label}:${r.sides === 2 ? (r.result === 1 ? customHeads.substring(0,6) : customTails.substring(0,6)) : r.result}`).join(', ');
      const totalText = rollsList[0].sides === 2 
        ? `Landed: ${rollsList[0].result === 1 ? customHeads : customTails}` 
        : `Total: ${totalSum} (${itemsDetail})`;

      setTrayOutput(totalText);
      const finalValString = rollsList[0].sides === 2 
        ? (rollsList[0].result === 1 ? customHeads : customTails) 
        : String(totalSum);
      setTrayResult(finalValString);

      // Expose results to elements so outer sheet/portal sections capture correct final numbers
      const rollResEl = document.getElementById('rollResult');
      const rollSubEl = document.getElementById('rollSub');
      if (rollResEl) {
        rollResEl.textContent = finalValString;
        rollResEl.classList.remove('crit-hi', 'crit-lo');
        if (rollsList[0].sides === 20 && totalSum === 20) rollResEl.classList.add('crit-hi');
        if (rollsList[0].sides === 20 && totalSum === 1) rollResEl.classList.add('crit-lo');
      }
      if (rollSubEl) {
        rollSubEl.textContent = totalText.toLowerCase();
      }

      // Add to official persistent history logs
      try {
        const entry = {
          die: settledDice[0].sides === 2 ? 'coin' : (settledDice.length === 1 ? settledDice[0].sides : `${settledDice.length}d${settledDice[0].sides}`),
          result: settledDice[0].sides === 2 ? (rollsList[0].result === 1 ? customHeads : customTails) : String(totalSum),
          t: Date.now(),
        };

        setRollHistory((prev) => {
          const updated = [entry, ...prev.slice(0, 20)];
          try {
            localStorage.setItem('roll_history', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        // Dispatch general roll completion signal
        triggerHapticPulse([40, 50, 40]);
      } catch (err) {
        console.error(err);
      }
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []); // Run on mount once, fully decoupled from history updates!

  const triggerLaunch = (sides: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const newDice: PhysicalDie[] = [];
    const geom = generateGeometry(sides);

    // Reset settlement monitoring refs cleanly prior to throwing
    areAllSettledRef.current = false;
    framesSinceSettleReportRef.current = 0;

    // Dynamic clean sound playback (play mystical loading roll tones)
    if ((window as any).haptic) {
      triggerHapticPulse([15, 20, 15]);
    }

    if (sides === 2) {
      setTrayOutput('flipping coin...');
    } else {
      setTrayOutput('rolling...');
    }
    setTrayResult('—');

    for (let i = 0; i < diceCount; i++) {
      // Disperse coordinates slightly so they don't spawn exactly in the same point
      const angle = (i * 2 * Math.PI) / diceCount;
      const rOffset = diceCount > 1 ? 18 : 0;
      const sx = cx + rOffset * Math.cos(angle) + (Math.random() - 0.5) * 8;
      const sy = cy + rOffset * Math.sin(angle) + (Math.random() - 0.5) * 8;

      // Authentic custom physics values for a classic upward vertical Coin Flip!
      let initVX = (Math.random() - 0.5) * 7.5;
      let initVY = (Math.random() - 0.5) * 7.5;
      let initVZ = 11 + Math.random() * 6.5; 
      let initVPitch = (Math.random() - 0.5) * 0.55;
      let initVYaw = (Math.random() - 0.5) * 0.55;
      let initVRoll = (Math.random() - 0.5) * 0.55;

      if (sides === 2) {
        initVX = (Math.random() - 0.5) * 2.5; // low drift
        initVY = (Math.random() - 0.5) * 2.5;
        initVZ = 15.5 + Math.random() * 4.5;  // dramatic high-toss flip!
        initVPitch = 0.55 + Math.random() * 0.35; // clean fast flip rotation
        initVYaw = 0.55 + Math.random() * 0.35;
        initVRoll = 0.15 + Math.random() * 0.15;
      }

      newDice.push({
        id: nextId.current++,
        sides,
        x: sx,
        y: sy,
        z: 140 + Math.random() * 40, // High spawn altitude!
        vx: initVX,
        vy: initVY,
        vz: initVZ,
        pitch: Math.random() * Math.PI * 2,
        yaw: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        vPitch: initVPitch,
        vYaw: initVYaw,
        vRoll: initVRoll,
        settled: false,
        result: 1,
        color: sides === 20 ? '#d44f6e' : '#7b2fe0',
        geom,
      });
    }

    diceRef.current = newDice;
  };

  const handleManualFlick = (clientX: number, clientY: number) => {
    // Flick/Pop all dice high in the air with horizontal velocity! Highly interactive!
    triggerHapticPulse([10, 15]);
    setTrayOutput('shaking...');

    diceRef.current.forEach((d) => {
      d.vz = 8 + Math.random() * 7;
      d.vx = (Math.random() - 0.5) * 6;
      d.vy = (Math.random() - 0.5) * 6;
      d.vPitch += (Math.random() - 0.5) * 0.45;
      d.vYaw += (Math.random() - 0.5) * 0.45;
      d.vRoll += (Math.random() - 0.5) * 0.45;
      d.settled = false;
    });
  };

  const clearTrayAndHistory = () => {
    setRollHistory([]);
    try {
      localStorage.setItem('roll_history', JSON.stringify([]));
    } catch (e) {}

    const rollHistoryRow = document.getElementById('historyRow');
    if (rollHistoryRow) rollHistoryRow.innerHTML = '';

    triggerHapticPulse([10]);
  };

  const incrementQty = () => {
    if (diceCount < 10) setDiceCount(diceCount + 1);
    triggerHapticPulse([5]);
  };
  const decrementQty = () => {
    if (diceCount > 1) setDiceCount(diceCount - 1);
    triggerHapticPulse([5]);
  };

  const PRESETS = [
    { label: 'coin', val: 2 },
    { label: 'd3', val: 3 },
    { label: 'd4', val: 4 },
    { label: 'd6', val: 6 },
    { label: 'd8', val: 8 },
    { label: 'd10', val: 10 },
    { label: 'd12', val: 12 },
    { label: 'd20', val: 20 },
    { label: 'd30', val: 30 },
    { label: 'd100', val: 100 },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ONE ULTIMATE UNIFIED PORTAL BASIN CARD */}
      <section className="card p-5 bg-[#130924]/85 border border-[#3b1e60]/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl w-full flex flex-col items-center">
        {/* Header toolbar */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#cf4fe6] animate-pulse" size={14} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-[#faebd7]">Portal Basin</span>
          </div>
          <button
            onClick={clearTrayAndHistory}
            className="text-[9px] uppercase font-bold tracking-wider text-[#b4aae2]/50 hover:text-[#fa2f8a] transition-colors focus:outline-none flex items-center gap-1 bg-black/15 px-2.5 py-1 rounded-full border border-[#3d2766]/30"
          >
            <Trash2 size={10} /> Clear Logs
          </button>
        </div>

        {/* Circular 3D gravity portal arena bounds */}
        <div className="relative w-[240px] h-[240px] rounded-full border border-[#cf4fe6]/20 bg-black/35 flex items-center justify-center overflow-hidden shadow-inner shadow-[#cf4fe6]/5">
          <svg className="tray-runes absolute inset-0 w-full h-full pointer-events-none animate-spin" style={{ animationDuration: '45s' }} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(212,79,230,0.12)" strokeWidth={0.8} />
            <circle cx="120" cy="120" r="88" fill="none" stroke="rgba(79,127,230,0.08)" strokeWidth={0.8} strokeDasharray="3 7" />
          </svg>
          
          {/* Middle Live canvas layer (pointer enabled for flicks) */}
          <canvas
            ref={canvasRef}
            width={240}
            height={240}
            className="absolute inset-0 w-full h-full rounded-full cursor-pointer z-10"
            onClick={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect) {
                handleManualFlick(e.clientX - rect.left, e.clientY - rect.top);
              }
            }}
          />
        </div>

        {/* HUD result banner layout */}
        <div className="w-full flex flex-col items-center justify-center text-center mt-4 mb-2 select-none">
          <div className="text-[34px] font-black font-mono tracking-wide text-[#faebd7] drop-shadow-[0_0_12px_rgba(207,79,230,0.7)] leading-none transition-all duration-300">
            {trayResult}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-[0.14em] text-[#aec7eb]/80 mt-1.5 max-w-[220px] truncate">
            {trayOutput}
          </div>
        </div>

        {/* Unified Control Dock */}
        <div className="w-full flex flex-col gap-3.5 mt-2 pt-4 border-t border-[#3d2766]/30">
          {/* Die Selection Row */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-[#b4aae2]/60 tracking-wider">Select Active Die</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {PRESETS.map((p) => {
                const isSelected = selectedDie === p.val;
                return (
                  <button
                    key={p.val}
                    onClick={() => {
                      setSelectedDie(p.val);
                      triggerHapticPulse([8]);
                    }}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg font-sans uppercase transition-all duration-200 select-none focus:outline-none ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#cf4fe6] via-[#bf35e8] to-[#7b2fe0] border border-[#cf4fe6]/35 text-white shadow-[0_0_12px_rgba(207,79,230,0.5)] scale-[1.04]'
                        : 'bg-black/45 border border-[#3d2766]/60 text-[#b4aae2]/90 hover:bg-[#cf4fe6]/12 hover:border-[#cf4fe6]/50 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multiplier / Quantity Quick Bar */}
          <div className="flex items-center justify-between bg-black/15 p-2 rounded-xl border border-[#3d2766]/30">
            <span className="text-[10px] text-[#b4aae2] font-semibold tracking-wider uppercase select-none pl-1">
              Dice Quantity
            </span>
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-[#3d2766]/40">
              {[1, 2, 3, 4].map((qty) => {
                const isSelected = diceCount === qty;
                return (
                  <button
                    key={qty}
                    onClick={() => {
                      setDiceCount(qty);
                      triggerHapticPulse([6]);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded transition-colors select-none focus:outline-none ${
                      isSelected
                        ? 'bg-[#cf4fe6] text-white'
                        : 'text-[#b4aae2] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {qty}x
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Master action trigger launch block */}
        <button
          onClick={() => triggerLaunch(selectedDie)}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-[#cf4fe6] via-[#fa2f8a] to-[#ae4fe6] text-white hover:brightness-110 active:scale-[0.98] font-sans text-xs tracking-[0.2em] uppercase font-bold rounded-xl shadow-[0_12px_28px_-6px_rgba(250,47,138,0.5),_0_0_15px_rgba(207,79,230,0.25)] transition-all duration-200 cursor-pointer text-center select-none focus:outline-none relative overflow-hidden shiny"
        >
          {selectedDie === 2 
            ? `FLIP ${diceCount === 1 ? 'COIN' : `${diceCount} COINS`}` 
            : `THROW ${diceCount}x D${selectedDie}`}
        </button>

        {/* Dynamic minimalist history stream log as a chic subtle bottom footer row */}
        <div className="w-full mt-3.5 flex items-center justify-center gap-1.5 flex-wrap border-t border-[#3d2766]/15 pt-3">
          <span className="text-[9px] uppercase font-bold text-[#b4aae2]/40 tracking-wider">Recent:</span>
          {rollHistory.length === 0 ? (
            <span className="text-[9px] italic text-[#b4aae2]/30">No history yet</span>
          ) : (
            rollHistory.slice(0, 4).map((log, idx) => {
              const isCoin = log.die === 'coin' || log.die === 2 || log.die === '2';
              const label = isCoin ? 'coin' : `d${log.die}`;
              const resText = isCoin 
                ? (log.result === 1 || log.result === '1' || log.result === 'Heads' ? customHeads : customTails)
                : log.result;
              return (
                <span
                  key={idx}
                  className="text-[9px] font-mono bg-black/20 border border-[#3d2766]/35 text-[#c8bdf2] px-2 py-0.5 rounded-full"
                >
                  {label}:{resText}
                </span>
              );
            })
          )}
        </div>
      </section>

      {/* Feature 1: Custom Option Coin Designer */}
      <section className="card p-4 bg-[#130924]/85 border border-[#3b1e60]/80 rounded-2xl shadow-xl w-full">
        <div className="flex items-center justify-between select-none gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Coins size={12} className="text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-200">Custom Decision Coin Designer</span>
          </div>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10">Active in Coin Mode</span>
        </div>
        <p className="text-[9.5px] text-[#b4aae2]/75 mb-3 leading-snug">
          Replace Heads/Tails with your own real-life choices (e.g. Pizza vs Burgers). Both the 3D coin face and physics results will physically update!
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[8px] font-bold text-amber-300 block mb-1 uppercase tracking-wider">Side A (Heads)</label>
            <input 
              type="text"
              value={customHeads || ''}
              onChange={(e) => {
                const val = e.target.value || 'Heads';
                setCustomHeads(val);
                localStorage.setItem('custom_coin_heads', val);
              }}
              placeholder="e.g. Do Homework"
              className="w-full bg-black/40 border border-[#3d2766]/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
          <div>
            <label className="text-[8px] font-bold text-amber-300 block mb-1 uppercase tracking-wider">Side B (Tails)</label>
            <input 
              type="text"
              value={customTails || ''}
              onChange={(e) => {
                const val = e.target.value || 'Tails';
                setCustomTails(val);
                localStorage.setItem('custom_coin_tails', val);
              }}
              placeholder="e.g. Play Games"
              className="w-full bg-black/40 border border-[#3d2766]/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
