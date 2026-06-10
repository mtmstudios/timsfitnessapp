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

const STAND: Pose = {
  head: { x: 100, y: 50 },
  shoulder: { x: 100, y: 75 },
  hip: { x: 100, y: 120 },
  elbowL: { x: 80, y: 100 }, elbowR: { x: 120, y: 100 },
  handL: { x: 75, y: 125 }, handR: { x: 125, y: 125 },
  kneeL: { x: 88, y: 150 }, kneeR: { x: 112, y: 150 },
  footL: { x: 85, y: 180 }, footR: { x: 115, y: 180 },
};

function getPoses(type: AnimationType): Pose[] {
  const s = STAND;
  switch (type) {
    case "squat":
      return [s, {
        ...s, head: { x: 100, y: 75 }, shoulder: { x: 100, y: 100 }, hip: { x: 100, y: 140 },
        elbowL: { x: 78, y: 115 }, elbowR: { x: 122, y: 115 },
        handL: { x: 70, y: 100 }, handR: { x: 130, y: 100 },
        kneeL: { x: 78, y: 158 }, kneeR: { x: 122, y: 158 },
      }];
    case "jump":
      return [
        { ...s, head: { x: 100, y: 78 }, shoulder: { x: 100, y: 103 }, hip: { x: 100, y: 143 },
          elbowL: { x: 78, y: 118 }, elbowR: { x: 122, y: 118 },
          handL: { x: 70, y: 138 }, handR: { x: 130, y: 138 },
          kneeL: { x: 80, y: 160 }, kneeR: { x: 120, y: 160 } },
        { ...s, head: { x: 100, y: 22 }, shoulder: { x: 100, y: 47 }, hip: { x: 100, y: 92 },
          elbowL: { x: 78, y: 50 }, elbowR: { x: 122, y: 50 },
          handL: { x: 70, y: 22 }, handR: { x: 130, y: 22 },
          kneeL: { x: 90, y: 122 }, kneeR: { x: 110, y: 122 },
          footL: { x: 85, y: 148 }, footR: { x: 115, y: 148 } },
        { ...s, head: { x: 100, y: 60 }, shoulder: { x: 100, y: 85 }, hip: { x: 100, y: 128 },
          elbowL: { x: 78, y: 108 }, elbowR: { x: 122, y: 108 },
          handL: { x: 70, y: 120 }, handR: { x: 130, y: 120 } },
      ];
    case "pushup":
      return [{
        head: { x: 45, y: 100 }, shoulder: { x: 62, y: 108 }, hip: { x: 125, y: 115 },
        elbowL: { x: 70, y: 132 }, elbowR: { x: 70, y: 132 },
        handL: { x: 80, y: 152 }, handR: { x: 80, y: 152 },
        kneeL: { x: 155, y: 128 }, kneeR: { x: 155, y: 128 },
        footL: { x: 182, y: 142 }, footR: { x: 182, y: 142 },
      }, {
        head: { x: 45, y: 135 }, shoulder: { x: 62, y: 138 }, hip: { x: 125, y: 132 },
        elbowL: { x: 80, y: 148 }, elbowR: { x: 80, y: 148 },
        handL: { x: 80, y: 152 }, handR: { x: 80, y: 152 },
        kneeL: { x: 155, y: 140 }, kneeR: { x: 155, y: 140 },
        footL: { x: 182, y: 150 }, footR: { x: 182, y: 150 },
      }];
    case "hinge":
      return [s, {
        ...s, head: { x: 78, y: 80 }, shoulder: { x: 85, y: 95 }, hip: { x: 110, y: 118 },
        elbowL: { x: 82, y: 125 }, elbowR: { x: 92, y: 125 },
        handL: { x: 80, y: 152 }, handR: { x: 95, y: 152 },
      }];
    case "row":
      return [{
        ...s, head: { x: 85, y: 70 }, shoulder: { x: 92, y: 92 }, hip: { x: 112, y: 118 },
        elbowL: { x: 82, y: 110 }, elbowR: { x: 102, y: 110 },
        handL: { x: 72, y: 130 }, handR: { x: 92, y: 130 },
      }, {
        ...s, head: { x: 85, y: 70 }, shoulder: { x: 92, y: 92 }, hip: { x: 112, y: 118 },
        elbowL: { x: 115, y: 88 }, elbowR: { x: 135, y: 88 },
        handL: { x: 70, y: 100 }, handR: { x: 90, y: 100 },
      }];
    case "press":
      return [{
        ...s,
        elbowL: { x: 78, y: 92 }, elbowR: { x: 122, y: 92 },
        handL: { x: 78, y: 72 }, handR: { x: 122, y: 72 },
      }, {
        ...s,
        elbowL: { x: 82, y: 55 }, elbowR: { x: 118, y: 55 },
        handL: { x: 82, y: 22 }, handR: { x: 118, y: 22 },
      }];
    case "pull":
      return [{
        ...s, head: { x: 100, y: 65 },
        elbowL: { x: 72, y: 55 }, elbowR: { x: 128, y: 55 },
        handL: { x: 68, y: 22 }, handR: { x: 132, y: 22 },
      }, {
        ...s, head: { x: 100, y: 38 }, shoulder: { x: 100, y: 60 },
        elbowL: { x: 72, y: 50 }, elbowR: { x: 128, y: 50 },
        handL: { x: 68, y: 22 }, handR: { x: 132, y: 22 },
      }];
    case "lunge":
      return [s, {
        ...s, head: { x: 100, y: 72 }, shoulder: { x: 100, y: 97 }, hip: { x: 100, y: 135 },
        elbowL: { x: 78, y: 115 }, elbowR: { x: 122, y: 115 },
        handL: { x: 75, y: 135 }, handR: { x: 125, y: 135 },
        kneeL: { x: 72, y: 168 }, kneeR: { x: 135, y: 155 },
        footL: { x: 68, y: 182 }, footR: { x: 152, y: 182 },
      }];
    case "plank":
      return [{
        head: { x: 45, y: 108 }, shoulder: { x: 62, y: 113 }, hip: { x: 128, y: 118 },
        elbowL: { x: 65, y: 140 }, elbowR: { x: 65, y: 140 },
        handL: { x: 80, y: 152 }, handR: { x: 80, y: 152 },
        kneeL: { x: 158, y: 128 }, kneeR: { x: 158, y: 128 },
        footL: { x: 185, y: 150 }, footR: { x: 185, y: 150 },
      }, {
        head: { x: 45, y: 105 }, shoulder: { x: 62, y: 110 }, hip: { x: 128, y: 115 },
        elbowL: { x: 65, y: 138 }, elbowR: { x: 65, y: 138 },
        handL: { x: 80, y: 150 }, handR: { x: 80, y: 150 },
        kneeL: { x: 158, y: 125 }, kneeR: { x: 158, y: 125 },
        footL: { x: 185, y: 148 }, footR: { x: 185, y: 148 },
      }];
    case "run":
      return [
        { ...s, head: { x: 100, y: 46 }, shoulder: { x: 100, y: 70 }, hip: { x: 100, y: 118 },
          elbowL: { x: 75, y: 92 }, elbowR: { x: 125, y: 108 },
          handL: { x: 68, y: 68 }, handR: { x: 132, y: 135 },
          kneeL: { x: 88, y: 145 }, kneeR: { x: 120, y: 152 },
          footL: { x: 78, y: 178 }, footR: { x: 138, y: 168 } },
        { ...s, head: { x: 100, y: 40 }, shoulder: { x: 100, y: 64 }, hip: { x: 100, y: 112 },
          elbowL: { x: 78, y: 98 }, elbowR: { x: 122, y: 98 },
          handL: { x: 78, y: 108 }, handR: { x: 122, y: 108 },
          kneeL: { x: 92, y: 142 }, kneeR: { x: 108, y: 142 },
          footL: { x: 88, y: 168 }, footR: { x: 112, y: 168 } },
        { ...s, head: { x: 100, y: 46 }, shoulder: { x: 100, y: 70 }, hip: { x: 100, y: 118 },
          elbowL: { x: 75, y: 108 }, elbowR: { x: 125, y: 92 },
          handL: { x: 68, y: 135 }, handR: { x: 132, y: 68 },
          kneeL: { x: 80, y: 152 }, kneeR: { x: 112, y: 145 },
          footL: { x: 62, y: 168 }, footR: { x: 122, y: 178 } },
        { ...s, head: { x: 100, y: 40 }, shoulder: { x: 100, y: 64 }, hip: { x: 100, y: 112 },
          elbowL: { x: 78, y: 98 }, elbowR: { x: 122, y: 98 },
          handL: { x: 78, y: 108 }, handR: { x: 122, y: 108 },
          kneeL: { x: 92, y: 142 }, kneeR: { x: 108, y: 142 },
          footL: { x: 88, y: 168 }, footR: { x: 112, y: 168 } },
      ];
    case "stretch":
      return [s, {
        ...s, head: { x: 108, y: 55 }, shoulder: { x: 105, y: 80 },
        elbowL: { x: 82, y: 60 }, elbowR: { x: 132, y: 105 },
        handL: { x: 78, y: 28 }, handR: { x: 152, y: 128 },
        kneeL: { x: 72, y: 155 }, kneeR: { x: 128, y: 150 },
        footL: { x: 58, y: 182 }, footR: { x: 138, y: 182 },
      }, s];
    case "rotation":
      return [
        { ...s, handL: { x: 55, y: 115 }, handR: { x: 145, y: 110 }, elbowL: { x: 72, y: 108 }, elbowR: { x: 128, y: 105 } },
        { ...s, handL: { x: 100, y: 85 }, handR: { x: 100, y: 130 }, elbowL: { x: 95, y: 95 }, elbowR: { x: 105, y: 120 } },
        { ...s, handL: { x: 145, y: 115 }, handR: { x: 55, y: 110 }, elbowL: { x: 128, y: 108 }, elbowR: { x: 72, y: 105 } },
        { ...s, handL: { x: 100, y: 85 }, handR: { x: 100, y: 130 }, elbowL: { x: 95, y: 95 }, elbowR: { x: 105, y: 120 } },
      ];
    case "carry":
      return [
        { ...s, handL: { x: 75, y: 142 }, handR: { x: 125, y: 142 } },
        { ...s, head: { x: 100, y: 48 }, shoulder: { x: 100, y: 73 }, hip: { x: 100, y: 118 },
          handL: { x: 75, y: 140 }, handR: { x: 125, y: 144 },
          footL: { x: 90, y: 178 }, footR: { x: 118, y: 182 } },
        { ...s, handL: { x: 75, y: 144 }, handR: { x: 125, y: 140 },
          footL: { x: 80, y: 182 }, footR: { x: 120, y: 178 } },
      ];
    default:
      return [s, s];
  }
}
