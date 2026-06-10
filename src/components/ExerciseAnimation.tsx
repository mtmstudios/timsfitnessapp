import { useEffect, useRef, useState } from "react";
import type { AnimationType } from "@/data/exercises";

/**
 * Smooth, frame-interpolated figure animation.
 * - rAF-driven (no CSS transition jitter)
 * - Ease-in-out between multiple key poses per exercise
 * - Thicker, rounded limbs with subtle glow + ground shadow that pulses with motion
 * - Optional implements (barbell, dumbbells, pull-up bar) per pose
 */
export function ExerciseAnimation({
  type,
  size = 220,
  color = "currentColor",
}: {
  type: AnimationType;
  size?: number;
  color?: string;
}) {
  const poses = getPoses(type);
  const cycle = getCycleMs(type);
  const [t, setT] = useState(0); // 0..1 within the full loop
  const raf = useRef<number | null>(null);
  const start = useRef<number>(0);

  useEffect(() => {
    start.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start.current) % cycle;
      setT(elapsed / cycle);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [cycle, type]);

  const pose = interpolatePose(poses, t);
  // shadow shrinks at top of motion (jump / squat depth out)
  const lift = Math.max(0, 1 - pose.head.y / 60);
  const shadowScale = 1 - lift * 0.4;

  const uid = useRef(Math.random().toString(36).slice(2, 8)).current;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ color, overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`floor-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`limb-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.75" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse
        cx="100"
        cy="186"
        rx={62 * shadowScale}
        ry={7 * shadowScale}
        fill={`url(#floor-${uid})`}
      />

      <Figure pose={pose} uid={uid} />
      <Implement type={type} pose={pose} uid={uid} />
    </svg>
  );
}

function Figure({ pose: p, uid }: { pose: Pose; uid: string }) {
  const limb = {
    stroke: `url(#limb-${uid})`,
    strokeWidth: 7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
    filter: `url(#glow-${uid})`,
  };

  // neck point (top of torso, below head)
  const neck = {
    x: p.head.x + (p.shoulder.x - p.head.x) * 0.4,
    y: p.head.y + 10,
  };

  return (
    <g>
      {/* legs (back first for depth) */}
      <polyline
        points={`${p.hip.x},${p.hip.y} ${p.kneeR.x},${p.kneeR.y} ${p.footR.x},${p.footR.y}`}
        {...limb}
        opacity={0.75}
      />
      <polyline
        points={`${p.hip.x},${p.hip.y} ${p.kneeL.x},${p.kneeL.y} ${p.footL.x},${p.footL.y}`}
        {...limb}
      />

      {/* torso as a tapered shape */}
      <path
        d={`M ${p.shoulder.x - 8},${p.shoulder.y} L ${p.shoulder.x + 8},${p.shoulder.y} L ${p.hip.x + 6},${p.hip.y} L ${p.hip.x - 6},${p.hip.y} Z`}
        fill="currentColor"
        opacity="0.9"
      />
      {/* neck */}
      <line x1={neck.x} y1={neck.y} x2={p.shoulder.x} y2={p.shoulder.y} {...limb} strokeWidth={5} />

      {/* arms */}
      <polyline
        points={`${p.shoulder.x},${p.shoulder.y} ${p.elbowR.x},${p.elbowR.y} ${p.handR.x},${p.handR.y}`}
        {...limb}
        opacity={0.85}
      />
      <polyline
        points={`${p.shoulder.x},${p.shoulder.y} ${p.elbowL.x},${p.elbowL.y} ${p.handL.x},${p.handL.y}`}
        {...limb}
      />

      {/* head */}
      <circle
        cx={p.head.x}
        cy={p.head.y}
        r="10"
        fill="currentColor"
        filter={`url(#glow-${uid})`}
      />
    </g>
  );
}

function Implement({ type, pose: p, uid }: { type: AnimationType; pose: Pose; uid: string }) {
  const bar = {
    stroke: "currentColor",
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    fill: "none",
    opacity: 0.95,
    filter: `url(#glow-${uid})`,
  };
  switch (type) {
    case "press":
    case "pull": {
      // bar between the two hands
      return (
        <line x1={p.handL.x - 10} y1={p.handL.y} x2={p.handR.x + 10} y2={p.handR.y} {...bar} />
      );
    }
    case "row": {
      // cable handle
      return (
        <>
          <line x1={p.handL.x - 6} y1={p.handL.y} x2={p.handR.x + 6} y2={p.handR.y} {...bar} />
          <line x1={(p.handL.x + p.handR.x) / 2} y1={(p.handL.y + p.handR.y) / 2} x2={200} y2={(p.handL.y + p.handR.y) / 2} {...bar} strokeWidth={2} opacity={0.5} />
        </>
      );
    }
    case "hinge": {
      // dumbbells in hands
      return (
        <>
          <Dumbbell x={p.handL.x} y={p.handL.y} />
          <Dumbbell x={p.handR.x} y={p.handR.y} />
        </>
      );
    }
    case "carry": {
      return (
        <>
          <Dumbbell x={p.handL.x} y={p.handL.y} />
          <Dumbbell x={p.handR.x} y={p.handR.y} />
        </>
      );
    }
    default:
      return null;
  }
}

function Dumbbell({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 9} y={y - 3} width="18" height="6" rx="1.5" fill="currentColor" opacity={0.9} />
      <rect x={x - 11} y={y - 6} width="3" height="12" rx="1" fill="currentColor" />
      <rect x={x + 8} y={y - 6} width="3" height="12" rx="1" fill="currentColor" />
    </g>
  );
}

/* ---------------- pose math ---------------- */

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const keys = Object.keys(a) as (keyof Pose)[];
  const out: any = {};
  for (const k of keys) {
    out[k] = { x: lerp(a[k].x, b[k].x, t), y: lerp(a[k].y, b[k].y, t) };
  }
  return out as Pose;
}

function interpolatePose(poses: Pose[], t: number): Pose {
  // play poses[0] -> poses[1] -> ... -> poses[0]
  const segs = poses.length;
  const scaled = t * segs;
  const idx = Math.floor(scaled) % segs;
  const next = (idx + 1) % segs;
  const local = easeInOut(scaled - Math.floor(scaled));
  return lerpPose(poses[idx], poses[next], local);
}

function getCycleMs(type: AnimationType): number {
  switch (type) {
    case "run": return 700;
    case "jump": return 1100;
    case "rotation": return 1600;
    case "plank": return 2400;
    case "stretch": return 2800;
    case "carry": return 1400;
    default: return 1800;
  }
}

interface Pose {
  head: { x: number; y: number };
  shoulder: { x: number; y: number };
  hip: { x: number; y: number };
  elbowL: { x: number; y: number };
  elbowR: { x: number; y: number };
  handL: { x: number; y: number };
  handR: { x: number; y: number };
  kneeL: { x: number; y: number };
  kneeR: { x: number; y: number };
  footL: { x: number; y: number };
  footR: { x: number; y: number };
}

function getPoses(type: AnimationType): Pose[] {
  const stand: Pose = {
    head: { x: 100, y: 50 },
    shoulder: { x: 100, y: 75 },
    hip: { x: 100, y: 120 },
    elbowL: { x: 80, y: 100 }, elbowR: { x: 120, y: 100 },
    handL: { x: 75, y: 125 }, handR: { x: 125, y: 125 },
    kneeL: { x: 88, y: 150 }, kneeR: { x: 112, y: 150 },
    footL: { x: 85, y: 180 }, footR: { x: 115, y: 180 },
  };
  switch (type) {
    case "squat":
      return [stand, squatBottom(stand), stand];
    case "jump":
      return [
        jumpCrouch(stand),
        jumpAir(stand),
        jumpCrouch(stand),
      ];
    case "run":
      return [runA(stand), runMid(stand), runB(stand), runMid(stand)];
    default:
      break;
  }

  switch (type) {
    case "squat":
      return [stand, squatBottom(stand)];
    case "pushup":
      return pushupPoses();
    case "hinge":
      return [stand, {
        ...stand, head: { x: 70, y: 80 }, shoulder: { x: 80, y: 95 }, hip: { x: 110, y: 115 },
        elbowL: { x: 85, y: 125 }, elbowR: { x: 95, y: 125 },
        handL: { x: 85, y: 150 }, handR: { x: 95, y: 150 },
      }];
    default:
      return [stand, stand];
  }
}

function squatBottom(stand: Pose): Pose {
  return {
        ...stand, head: { x: 100, y: 75 }, shoulder: { x: 100, y: 100 }, hip: { x: 100, y: 140 },
        elbowL: { x: 78, y: 115 }, elbowR: { x: 122, y: 115 },
        handL: { x: 70, y: 100 }, handR: { x: 130, y: 100 },
        kneeL: { x: 78, y: 155 }, kneeR: { x: 122, y: 155 },
  };
}

function jumpCrouch(stand: Pose): Pose {
  return { ...stand, head: { x: 100, y: 75 }, shoulder: { x: 100, y: 100 }, hip: { x: 100, y: 140 }, kneeL: { x: 80, y: 158 }, kneeR: { x: 120, y: 158 }, handL: { x: 70, y: 130 }, handR: { x: 130, y: 130 } };
}
function jumpAir(stand: Pose): Pose {
  return { ...stand, head: { x: 100, y: 25 }, shoulder: { x: 100, y: 50 }, hip: { x: 100, y: 95 }, kneeL: { x: 90, y: 125 }, kneeR: { x: 110, y: 125 }, footL: { x: 85, y: 150 }, footR: { x: 115, y: 150 }, handL: { x: 70, y: 30 }, handR: { x: 130, y: 30 }, elbowL: { x: 78, y: 55 }, elbowR: { x: 122, y: 55 } };
}

function runA(stand: Pose): Pose {
  return {
    ...stand,
    head: { x: 100, y: 48 }, shoulder: { x: 100, y: 73 }, hip: { x: 100, y: 118 },
    elbowL: { x: 75, y: 95 }, elbowR: { x: 125, y: 105 },
    handL: { x: 68, y: 70 }, handR: { x: 132, y: 132 },
    kneeL: { x: 88, y: 140 }, kneeR: { x: 118, y: 158 },
    footL: { x: 75, y: 162 }, footR: { x: 128, y: 182 },
  };
}
function runB(stand: Pose): Pose {
  return {
    ...stand,
    head: { x: 100, y: 48 }, shoulder: { x: 100, y: 73 }, hip: { x: 100, y: 118 },
    elbowL: { x: 75, y: 105 }, elbowR: { x: 125, y: 95 },
    handL: { x: 68, y: 132 }, handR: { x: 132, y: 70 },
    kneeL: { x: 88, y: 158 }, kneeR: { x: 118, y: 140 },
    footL: { x: 75, y: 182 }, footR: { x: 128, y: 162 },
  };
}
function runMid(stand: Pose): Pose {
  return {
    ...stand,
    head: { x: 100, y: 45 }, shoulder: { x: 100, y: 70 }, hip: { x: 100, y: 115 },
    elbowL: { x: 78, y: 100 }, elbowR: { x: 122, y: 100 },
    handL: { x: 80, y: 110 }, handR: { x: 120, y: 110 },
    kneeL: { x: 95, y: 148 }, kneeR: { x: 105, y: 148 },
    footL: { x: 92, y: 175 }, footR: { x: 108, y: 175 },
  };
}

function pushupPoses(): Pose[] {
  return [{
        head: { x: 50, y: 100 }, shoulder: { x: 65, y: 110 }, hip: { x: 120, y: 115 },
        elbowL: { x: 70, y: 130 }, elbowR: { x: 70, y: 130 },
        handL: { x: 80, y: 150 }, handR: { x: 80, y: 150 },
        kneeL: { x: 150, y: 130 }, kneeR: { x: 150, y: 130 },
        footL: { x: 175, y: 145 }, footR: { x: 175, y: 145 },
      }, {
        head: { x: 50, y: 130 }, shoulder: { x: 65, y: 135 }, hip: { x: 120, y: 130 },
        elbowL: { x: 75, y: 150 }, elbowR: { x: 75, y: 150 },
        handL: { x: 80, y: 155 }, handR: { x: 80, y: 155 },
        kneeL: { x: 150, y: 140 }, kneeR: { x: 150, y: 140 },
        footL: { x: 175, y: 150 }, footR: { x: 175, y: 150 },
      }];
}

function _unusedKeepOriginalSwitch(stand: Pose, type: AnimationType): Pose[] {
  switch (type) {
    case "row":
      return [{
        ...stand, head: { x: 80, y: 70 }, shoulder: { x: 90, y: 90 }, hip: { x: 110, y: 115 },
        elbowL: { x: 80, y: 110 }, elbowR: { x: 100, y: 110 },
        handL: { x: 70, y: 130 }, handR: { x: 90, y: 130 },
      }, {
        ...stand, head: { x: 80, y: 70 }, shoulder: { x: 90, y: 90 }, hip: { x: 110, y: 115 },
        elbowL: { x: 110, y: 85 }, elbowR: { x: 130, y: 85 },
        handL: { x: 130, y: 95 }, handR: { x: 150, y: 95 },
      }];
    case "press":
      return [{
        ...stand,
        elbowL: { x: 75, y: 90 }, elbowR: { x: 125, y: 90 },
        handL: { x: 75, y: 70 }, handR: { x: 125, y: 70 },
      }, {
        ...stand,
        elbowL: { x: 80, y: 55 }, elbowR: { x: 120, y: 55 },
        handL: { x: 80, y: 25 }, handR: { x: 120, y: 25 },
      }];
    case "pull":
      return [{
        ...stand, head: { x: 100, y: 60 },
        elbowL: { x: 70, y: 50 }, elbowR: { x: 130, y: 50 },
        handL: { x: 65, y: 25 }, handR: { x: 135, y: 25 },
      }, {
        ...stand, head: { x: 100, y: 40 },
        elbowL: { x: 70, y: 65 }, elbowR: { x: 130, y: 65 },
        handL: { x: 65, y: 25 }, handR: { x: 135, y: 25 },
      }];
    case "lunge":
      return [stand, {
        ...stand, head: { x: 100, y: 75 }, shoulder: { x: 100, y: 100 }, hip: { x: 100, y: 135 },
        kneeL: { x: 75, y: 165 }, kneeR: { x: 130, y: 155 },
        footL: { x: 70, y: 180 }, footR: { x: 145, y: 180 },
      }];
    case "plank":
      return [{
        head: { x: 50, y: 110 }, shoulder: { x: 65, y: 115 }, hip: { x: 125, y: 120 },
        elbowL: { x: 65, y: 140 }, elbowR: { x: 65, y: 140 },
        handL: { x: 80, y: 150 }, handR: { x: 80, y: 150 },
        kneeL: { x: 155, y: 130 }, kneeR: { x: 155, y: 130 },
        footL: { x: 180, y: 150 }, footR: { x: 180, y: 150 },
      }, {
        head: { x: 50, y: 108 }, shoulder: { x: 65, y: 113 }, hip: { x: 125, y: 118 },
        elbowL: { x: 65, y: 138 }, elbowR: { x: 65, y: 138 },
        handL: { x: 80, y: 148 }, handR: { x: 80, y: 148 },
        kneeL: { x: 155, y: 128 }, kneeR: { x: 155, y: 128 },
        footL: { x: 180, y: 148 }, footR: { x: 180, y: 148 },
      }];
    case "run":
      return [{
        ...stand,
        elbowL: { x: 75, y: 95 }, elbowR: { x: 125, y: 105 },
        handL: { x: 70, y: 75 }, handR: { x: 130, y: 130 },
        kneeL: { x: 90, y: 140 }, kneeR: { x: 115, y: 155 },
        footL: { x: 80, y: 165 }, footR: { x: 125, y: 180 },
      }, {
        ...stand,
        elbowL: { x: 75, y: 105 }, elbowR: { x: 125, y: 95 },
        handL: { x: 70, y: 130 }, handR: { x: 130, y: 75 },
        kneeL: { x: 90, y: 155 }, kneeR: { x: 115, y: 140 },
        footL: { x: 80, y: 180 }, footR: { x: 125, y: 165 },
      }];
    case "stretch":
      return [stand, {
        ...stand, head: { x: 105, y: 55 }, shoulder: { x: 105, y: 80 },
        elbowL: { x: 85, y: 60 }, elbowR: { x: 130, y: 105 },
        handL: { x: 80, y: 30 }, handR: { x: 150, y: 125 },
        kneeL: { x: 75, y: 155 }, kneeR: { x: 125, y: 150 },
        footL: { x: 60, y: 180 }, footR: { x: 135, y: 180 },
      }];
    case "rotation":
      return [{ ...stand, handL: { x: 60, y: 110 }, handR: { x: 140, y: 110 }, elbowL: { x: 75, y: 105 }, elbowR: { x: 125, y: 105 } },
        { ...stand, handL: { x: 60, y: 90 }, handR: { x: 140, y: 130 }, elbowL: { x: 80, y: 90 }, elbowR: { x: 120, y: 120 } }];
    case "carry":
      return [{ ...stand, handL: { x: 75, y: 140 }, handR: { x: 125, y: 140 } },
        { ...stand, head: { x: 102, y: 50 }, handL: { x: 75, y: 142 }, handR: { x: 125, y: 138 }, footL: { x: 88, y: 180 }, footR: { x: 118, y: 178 } }];
    default:
      return [stand, stand];
  }
}