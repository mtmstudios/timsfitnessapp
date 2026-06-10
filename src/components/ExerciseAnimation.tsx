import { useEffect, useId, useRef, useState } from "react";
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
      // rAF timestamps can be slightly earlier than performance.now() from the
      // effect — true modulo keeps elapsed in [0, cycle) even for negative input
      const elapsed = (((now - start.current) % cycle) + cycle) % cycle;
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

  // useId statt Math.random(): identisch auf Server und Client, sonst Hydration-Mismatch
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

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
      <circle cx={p.head.x} cy={p.head.y} r="10" fill="currentColor" filter={`url(#glow-${uid})`} />
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
          <line
            x1={(p.handL.x + p.handR.x) / 2}
            y1={(p.handL.y + p.handR.y) / 2}
            x2={200}
            y2={(p.handL.y + p.handR.y) / 2}
            {...bar}
            strokeWidth={2}
            opacity={0.5}
          />
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
    case "bench": {
      // Flachbank unter der Figur + Hantelscheibe an den Händen (Seitenansicht)
      return (
        <>
          <Bench x1={30} x2={130} y={126} />
          <circle
            cx={p.handL.x}
            cy={p.handL.y}
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            opacity={0.9}
          />
          <line
            x1={p.handL.x - 14}
            y1={p.handL.y}
            x2={p.handL.x + 14}
            y2={p.handL.y}
            {...bar}
            strokeWidth={3}
          />
        </>
      );
    }
    case "hipthrust": {
      // Bank unter den Schultern + Langhantel auf der Hüfte
      return (
        <>
          <Bench x1={14} x2={66} y={112} />
          <circle
            cx={p.hip.x}
            cy={p.hip.y - 12}
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            opacity={0.9}
          />
        </>
      );
    }
    case "kneeraise": {
      // fixe Klimmzugstange oben
      return <line x1={52} y1={22} x2={148} y2={22} {...bar} />;
    }
    case "crunch": {
      // Seil vom Kabelzug oben zu den Händen
      return (
        <>
          <line
            x1={p.handL.x}
            y1={6}
            x2={p.handL.x}
            y2={p.handL.y}
            {...bar}
            strokeWidth={2}
            opacity={0.5}
          />
          <line
            x1={p.handL.x - 6}
            y1={p.handL.y}
            x2={p.handR.x + 6}
            y2={p.handR.y}
            {...bar}
            strokeWidth={3}
          />
        </>
      );
    }
    case "antirotation": {
      // Kabel kommt seitlich, Hände halten dagegen
      const hx = (p.handL.x + p.handR.x) / 2;
      const hy = (p.handL.y + p.handR.y) / 2;
      return (
        <>
          <line x1={hx} y1={hy} x2={200} y2={hy - 6} {...bar} strokeWidth={2} opacity={0.5} />
          <line x1={hx - 6} y1={hy} x2={hx + 6} y2={hy} {...bar} />
        </>
      );
    }
    case "pullapart": {
      // Band zwischen den Händen
      return (
        <line
          x1={p.handL.x}
          y1={p.handL.y}
          x2={p.handR.x}
          y2={p.handR.y}
          {...bar}
          strokeWidth={3}
          opacity={0.7}
        />
      );
    }
    case "bike": {
      // Rad: zwei Laufräder, Rahmen, Sattel, Lenker, Tretlager
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" opacity={0.55}>
          <circle cx={58} cy={162} r="17" strokeWidth={3} />
          <circle cx={142} cy={162} r="17" strokeWidth={3} />
          <circle cx={100} cy={150} r="4" strokeWidth={3} />
          <polyline points="58,162 88,118 100,150 58,162" strokeWidth={3} />
          <polyline points="88,118 122,112 100,150" strokeWidth={3} />
          <polyline points="142,162 148,104" strokeWidth={3} />
          <line x1={80} y1={116} x2={94} y2={114} strokeWidth={4} />
          <line x1={142} y1={102} x2={156} y2={106} strokeWidth={4} />
        </g>
      );
    }
    case "legpress": {
      // Sitzlehne hinter dem Rücken + Druckplatte an den Füßen
      const fx = (p.footL.x + p.footR.x) / 2;
      const fy = (p.footL.y + p.footR.y) / 2;
      return (
        <>
          <line x1={30} y1={94} x2={62} y2={156} {...bar} strokeWidth={5} opacity={0.55} />
          <line x1={62} y1={156} x2={94} y2={166} {...bar} strokeWidth={5} opacity={0.55} />
          <line
            x1={fx + 16}
            y1={fy - 18}
            x2={fx - 6}
            y2={fy + 22}
            {...bar}
            strokeWidth={5}
            opacity={0.8}
          />
        </>
      );
    }
    default:
      return null;
  }
}

function Bench({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g fill="currentColor" opacity={0.45}>
      <rect x={x1} y={y} width={x2 - x1} height={6} rx={2} />
      <rect x={x1 + 8} y={y + 6} width={4} height={180 - y - 6} />
      <rect x={x2 - 12} y={y + 6} width={4} height={180 - y - 6} />
    </g>
  );
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
  const out = {} as Pose;
  for (const k of keys) {
    out[k] = { x: lerp(a[k].x, b[k].x, t), y: lerp(a[k].y, b[k].y, t) };
  }
  return out;
}

function interpolatePose(poses: Pose[], t: number): Pose {
  // play poses[0] -> poses[1] -> ... -> poses[0]
  const segs = poses.length;
  if (segs === 0) return STAND;
  if (segs === 1) return poses[0];
  const scaled = t * segs;
  // true modulo so a fractionally negative t can never index poses[-1]
  const idx = ((Math.floor(scaled) % segs) + segs) % segs;
  const next = (idx + 1) % segs;
  const local = easeInOut(scaled - Math.floor(scaled));
  return lerpPose(poses[idx], poses[next], local);
}

function getCycleMs(type: AnimationType): number {
  switch (type) {
    case "run":
      return 700;
    case "climber":
      return 800;
    case "bike":
      return 900;
    case "jump":
      return 1100;
    case "carry":
      return 1400;
    case "walk":
      return 1400;
    case "shouldertap":
      return 1400;
    case "rotation":
      return 1600;
    case "hipthrust":
      return 1600;
    case "crunch":
      return 1600;
    case "pullapart":
      return 1600;
    case "antirotation":
      return 2000;
    case "deadbug":
      return 2200;
    case "trotation":
      return 2200;
    case "plank":
      return 2400;
    case "sideplank":
      return 2400;
    case "catcow":
      return 2400;
    case "stretch":
      return 2800;
    default:
      return 1800;
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
  elbowL: { x: 80, y: 100 },
  elbowR: { x: 120, y: 100 },
  handL: { x: 75, y: 125 },
  handR: { x: 125, y: 125 },
  kneeL: { x: 88, y: 150 },
  kneeR: { x: 112, y: 150 },
  footL: { x: 85, y: 180 },
  footR: { x: 115, y: 180 },
};

function getPoses(type: AnimationType): Pose[] {
  const s = STAND;
  switch (type) {
    case "squat":
      return [
        s,
        {
          ...s,
          head: { x: 100, y: 75 },
          shoulder: { x: 100, y: 100 },
          hip: { x: 100, y: 140 },
          elbowL: { x: 78, y: 115 },
          elbowR: { x: 122, y: 115 },
          handL: { x: 70, y: 100 },
          handR: { x: 130, y: 100 },
          kneeL: { x: 78, y: 158 },
          kneeR: { x: 122, y: 158 },
        },
      ];
    case "jump":
      return [
        {
          ...s,
          head: { x: 100, y: 78 },
          shoulder: { x: 100, y: 103 },
          hip: { x: 100, y: 143 },
          elbowL: { x: 78, y: 118 },
          elbowR: { x: 122, y: 118 },
          handL: { x: 70, y: 138 },
          handR: { x: 130, y: 138 },
          kneeL: { x: 80, y: 160 },
          kneeR: { x: 120, y: 160 },
        },
        {
          ...s,
          head: { x: 100, y: 22 },
          shoulder: { x: 100, y: 47 },
          hip: { x: 100, y: 92 },
          elbowL: { x: 78, y: 50 },
          elbowR: { x: 122, y: 50 },
          handL: { x: 70, y: 22 },
          handR: { x: 130, y: 22 },
          kneeL: { x: 90, y: 122 },
          kneeR: { x: 110, y: 122 },
          footL: { x: 85, y: 148 },
          footR: { x: 115, y: 148 },
        },
        {
          ...s,
          head: { x: 100, y: 60 },
          shoulder: { x: 100, y: 85 },
          hip: { x: 100, y: 128 },
          elbowL: { x: 78, y: 108 },
          elbowR: { x: 122, y: 108 },
          handL: { x: 70, y: 120 },
          handR: { x: 130, y: 120 },
        },
      ];
    case "pushup":
      return [
        {
          head: { x: 45, y: 100 },
          shoulder: { x: 62, y: 108 },
          hip: { x: 125, y: 115 },
          elbowL: { x: 70, y: 132 },
          elbowR: { x: 70, y: 132 },
          handL: { x: 80, y: 152 },
          handR: { x: 80, y: 152 },
          kneeL: { x: 155, y: 128 },
          kneeR: { x: 155, y: 128 },
          footL: { x: 182, y: 142 },
          footR: { x: 182, y: 142 },
        },
        {
          head: { x: 45, y: 135 },
          shoulder: { x: 62, y: 138 },
          hip: { x: 125, y: 132 },
          elbowL: { x: 80, y: 148 },
          elbowR: { x: 80, y: 148 },
          handL: { x: 80, y: 152 },
          handR: { x: 80, y: 152 },
          kneeL: { x: 155, y: 140 },
          kneeR: { x: 155, y: 140 },
          footL: { x: 182, y: 150 },
          footR: { x: 182, y: 150 },
        },
      ];
    case "hinge":
      return [
        s,
        {
          ...s,
          head: { x: 78, y: 80 },
          shoulder: { x: 85, y: 95 },
          hip: { x: 110, y: 118 },
          elbowL: { x: 82, y: 125 },
          elbowR: { x: 92, y: 125 },
          handL: { x: 80, y: 152 },
          handR: { x: 95, y: 152 },
        },
      ];
    case "row":
      return [
        {
          ...s,
          head: { x: 85, y: 70 },
          shoulder: { x: 92, y: 92 },
          hip: { x: 112, y: 118 },
          elbowL: { x: 82, y: 110 },
          elbowR: { x: 102, y: 110 },
          handL: { x: 72, y: 130 },
          handR: { x: 92, y: 130 },
        },
        {
          ...s,
          head: { x: 85, y: 70 },
          shoulder: { x: 92, y: 92 },
          hip: { x: 112, y: 118 },
          elbowL: { x: 115, y: 88 },
          elbowR: { x: 135, y: 88 },
          handL: { x: 70, y: 100 },
          handR: { x: 90, y: 100 },
        },
      ];
    case "press":
      return [
        {
          ...s,
          elbowL: { x: 78, y: 92 },
          elbowR: { x: 122, y: 92 },
          handL: { x: 78, y: 72 },
          handR: { x: 122, y: 72 },
        },
        {
          ...s,
          elbowL: { x: 82, y: 55 },
          elbowR: { x: 118, y: 55 },
          handL: { x: 82, y: 22 },
          handR: { x: 118, y: 22 },
        },
      ];
    case "pull":
      return [
        {
          ...s,
          head: { x: 100, y: 65 },
          elbowL: { x: 72, y: 55 },
          elbowR: { x: 128, y: 55 },
          handL: { x: 68, y: 22 },
          handR: { x: 132, y: 22 },
        },
        {
          ...s,
          head: { x: 100, y: 38 },
          shoulder: { x: 100, y: 60 },
          elbowL: { x: 72, y: 50 },
          elbowR: { x: 128, y: 50 },
          handL: { x: 68, y: 22 },
          handR: { x: 132, y: 22 },
        },
      ];
    case "lunge":
      return [
        s,
        {
          ...s,
          head: { x: 100, y: 72 },
          shoulder: { x: 100, y: 97 },
          hip: { x: 100, y: 135 },
          elbowL: { x: 78, y: 115 },
          elbowR: { x: 122, y: 115 },
          handL: { x: 75, y: 135 },
          handR: { x: 125, y: 135 },
          kneeL: { x: 72, y: 168 },
          kneeR: { x: 135, y: 155 },
          footL: { x: 68, y: 182 },
          footR: { x: 152, y: 182 },
        },
      ];
    case "plank":
      return [
        {
          head: { x: 45, y: 108 },
          shoulder: { x: 62, y: 113 },
          hip: { x: 128, y: 118 },
          elbowL: { x: 65, y: 140 },
          elbowR: { x: 65, y: 140 },
          handL: { x: 80, y: 152 },
          handR: { x: 80, y: 152 },
          kneeL: { x: 158, y: 128 },
          kneeR: { x: 158, y: 128 },
          footL: { x: 185, y: 150 },
          footR: { x: 185, y: 150 },
        },
        {
          head: { x: 45, y: 105 },
          shoulder: { x: 62, y: 110 },
          hip: { x: 128, y: 115 },
          elbowL: { x: 65, y: 138 },
          elbowR: { x: 65, y: 138 },
          handL: { x: 80, y: 150 },
          handR: { x: 80, y: 150 },
          kneeL: { x: 158, y: 125 },
          kneeR: { x: 158, y: 125 },
          footL: { x: 185, y: 148 },
          footR: { x: 185, y: 148 },
        },
      ];
    case "run":
      return [
        {
          ...s,
          head: { x: 100, y: 46 },
          shoulder: { x: 100, y: 70 },
          hip: { x: 100, y: 118 },
          elbowL: { x: 75, y: 92 },
          elbowR: { x: 125, y: 108 },
          handL: { x: 68, y: 68 },
          handR: { x: 132, y: 135 },
          kneeL: { x: 88, y: 145 },
          kneeR: { x: 120, y: 152 },
          footL: { x: 78, y: 178 },
          footR: { x: 138, y: 168 },
        },
        {
          ...s,
          head: { x: 100, y: 40 },
          shoulder: { x: 100, y: 64 },
          hip: { x: 100, y: 112 },
          elbowL: { x: 78, y: 98 },
          elbowR: { x: 122, y: 98 },
          handL: { x: 78, y: 108 },
          handR: { x: 122, y: 108 },
          kneeL: { x: 92, y: 142 },
          kneeR: { x: 108, y: 142 },
          footL: { x: 88, y: 168 },
          footR: { x: 112, y: 168 },
        },
        {
          ...s,
          head: { x: 100, y: 46 },
          shoulder: { x: 100, y: 70 },
          hip: { x: 100, y: 118 },
          elbowL: { x: 75, y: 108 },
          elbowR: { x: 125, y: 92 },
          handL: { x: 68, y: 135 },
          handR: { x: 132, y: 68 },
          kneeL: { x: 80, y: 152 },
          kneeR: { x: 112, y: 145 },
          footL: { x: 62, y: 168 },
          footR: { x: 122, y: 178 },
        },
        {
          ...s,
          head: { x: 100, y: 40 },
          shoulder: { x: 100, y: 64 },
          hip: { x: 100, y: 112 },
          elbowL: { x: 78, y: 98 },
          elbowR: { x: 122, y: 98 },
          handL: { x: 78, y: 108 },
          handR: { x: 122, y: 108 },
          kneeL: { x: 92, y: 142 },
          kneeR: { x: 108, y: 142 },
          footL: { x: 88, y: 168 },
          footR: { x: 112, y: 168 },
        },
      ];
    case "stretch":
      return [
        s,
        {
          ...s,
          head: { x: 108, y: 55 },
          shoulder: { x: 105, y: 80 },
          elbowL: { x: 82, y: 60 },
          elbowR: { x: 132, y: 105 },
          handL: { x: 78, y: 28 },
          handR: { x: 152, y: 128 },
          kneeL: { x: 72, y: 155 },
          kneeR: { x: 128, y: 150 },
          footL: { x: 58, y: 182 },
          footR: { x: 138, y: 182 },
        },
        s,
      ];
    case "rotation":
      return [
        {
          ...s,
          handL: { x: 55, y: 115 },
          handR: { x: 145, y: 110 },
          elbowL: { x: 72, y: 108 },
          elbowR: { x: 128, y: 105 },
        },
        {
          ...s,
          handL: { x: 100, y: 85 },
          handR: { x: 100, y: 130 },
          elbowL: { x: 95, y: 95 },
          elbowR: { x: 105, y: 120 },
        },
        {
          ...s,
          handL: { x: 145, y: 115 },
          handR: { x: 55, y: 110 },
          elbowL: { x: 128, y: 108 },
          elbowR: { x: 72, y: 105 },
        },
        {
          ...s,
          handL: { x: 100, y: 85 },
          handR: { x: 100, y: 130 },
          elbowL: { x: 95, y: 95 },
          elbowR: { x: 105, y: 120 },
        },
      ];
    case "carry":
      return [
        { ...s, handL: { x: 75, y: 142 }, handR: { x: 125, y: 142 } },
        {
          ...s,
          head: { x: 100, y: 48 },
          shoulder: { x: 100, y: 73 },
          hip: { x: 100, y: 118 },
          handL: { x: 75, y: 140 },
          handR: { x: 125, y: 144 },
          footL: { x: 90, y: 178 },
          footR: { x: 118, y: 182 },
        },
        {
          ...s,
          handL: { x: 75, y: 144 },
          handR: { x: 125, y: 140 },
          footL: { x: 80, y: 182 },
          footR: { x: 120, y: 178 },
        },
      ];
    // Bankdrücken: Rückenlage auf Bank, Arme drücken senkrecht nach oben
    case "bench": {
      const base = {
        head: { x: 38, y: 116 },
        shoulder: { x: 58, y: 118 },
        hip: { x: 118, y: 122 },
        kneeL: { x: 140, y: 138 },
        kneeR: { x: 144, y: 140 },
        footL: { x: 148, y: 176 },
        footR: { x: 152, y: 178 },
      };
      return [
        {
          ...base,
          elbowL: { x: 58, y: 98 },
          elbowR: { x: 62, y: 100 },
          handL: { x: 58, y: 78 },
          handR: { x: 62, y: 80 },
        },
        {
          ...base,
          elbowL: { x: 46, y: 112 },
          elbowR: { x: 50, y: 114 },
          handL: { x: 58, y: 100 },
          handR: { x: 62, y: 102 },
        },
      ];
    }
    // Hip Thrust: Schultern auf Bank, Hüfte hebt zur geraden Linie
    case "hipthrust": {
      const base = {
        head: { x: 34, y: 96 },
        shoulder: { x: 54, y: 104 },
        elbowL: { x: 60, y: 120 },
        elbowR: { x: 64, y: 122 },
        handL: { x: 70, y: 132 },
        handR: { x: 74, y: 134 },
        kneeL: { x: 132, y: 132 },
        kneeR: { x: 136, y: 134 },
        footL: { x: 138, y: 176 },
        footR: { x: 142, y: 178 },
      };
      return [
        { ...base, hip: { x: 102, y: 148 } },
        { ...base, hip: { x: 102, y: 116 } },
      ];
    }
    // Hanging Knee Raise: Hang an der Stange, Knie ziehen hoch
    case "kneeraise": {
      const hang = {
        head: { x: 100, y: 52 },
        shoulder: { x: 100, y: 74 },
        elbowL: { x: 80, y: 48 },
        elbowR: { x: 120, y: 48 },
        handL: { x: 78, y: 22 },
        handR: { x: 122, y: 22 },
      };
      return [
        {
          ...hang,
          hip: { x: 100, y: 118 },
          kneeL: { x: 94, y: 146 },
          kneeR: { x: 106, y: 146 },
          footL: { x: 92, y: 176 },
          footR: { x: 108, y: 176 },
        },
        {
          ...hang,
          hip: { x: 100, y: 112 },
          kneeL: { x: 90, y: 96 },
          kneeR: { x: 110, y: 96 },
          footL: { x: 88, y: 124 },
          footR: { x: 112, y: 124 },
        },
      ];
    }
    // Cable Crunch: kniend, Oberkörper rollt mit den Bauchmuskeln ein
    case "crunch": {
      const kneel = {
        hip: { x: 100, y: 142 },
        kneeL: { x: 100, y: 168 },
        kneeR: { x: 106, y: 170 },
        footL: { x: 130, y: 174 },
        footR: { x: 136, y: 176 },
      };
      return [
        {
          ...kneel,
          head: { x: 75, y: 85 },
          shoulder: { x: 85, y: 102 },
          elbowL: { x: 70, y: 95 },
          elbowR: { x: 74, y: 98 },
          handL: { x: 66, y: 82 },
          handR: { x: 70, y: 85 },
        },
        {
          ...kneel,
          head: { x: 80, y: 112 },
          shoulder: { x: 90, y: 124 },
          elbowL: { x: 76, y: 115 },
          elbowR: { x: 80, y: 118 },
          handL: { x: 70, y: 105 },
          handR: { x: 74, y: 108 },
        },
      ];
    }
    // Pallof Press: Stand, Hände drücken vor der Brust aus gegen seitlichen Kabelzug
    case "antirotation":
      return [
        {
          ...s,
          elbowL: { x: 88, y: 100 },
          elbowR: { x: 112, y: 100 },
          handL: { x: 97, y: 96 },
          handR: { x: 103, y: 96 },
        },
        {
          ...s,
          elbowL: { x: 94, y: 110 },
          elbowR: { x: 106, y: 110 },
          handL: { x: 98, y: 122 },
          handR: { x: 102, y: 122 },
        },
      ];
    // Dead Bug: Rückenlage, gegenüberliegender Arm/Bein strecken
    case "deadbug": {
      const back = {
        head: { x: 48, y: 152 },
        shoulder: { x: 68, y: 156 },
        hip: { x: 112, y: 158 },
      };
      return [
        {
          ...back,
          elbowL: { x: 70, y: 138 },
          handL: { x: 72, y: 120 },
          elbowR: { x: 74, y: 140 },
          handR: { x: 76, y: 122 },
          kneeL: { x: 118, y: 130 },
          footL: { x: 134, y: 132 },
          kneeR: { x: 122, y: 132 },
          footR: { x: 138, y: 134 },
        },
        {
          ...back,
          elbowL: { x: 55, y: 148 },
          handL: { x: 38, y: 144 },
          elbowR: { x: 74, y: 140 },
          handR: { x: 76, y: 122 },
          kneeL: { x: 118, y: 130 },
          footL: { x: 134, y: 132 },
          kneeR: { x: 142, y: 148 },
          footR: { x: 168, y: 152 },
        },
      ];
    }
    // Side Plank: seitlicher Stütz auf dem Unterarm, Hüfte hebt
    case "sideplank": {
      const side = {
        head: { x: 66, y: 118 },
        shoulder: { x: 78, y: 132 },
        elbowL: { x: 64, y: 168 },
        handL: { x: 84, y: 170 },
        elbowR: { x: 86, y: 116 },
        handR: { x: 92, y: 94 },
        kneeL: { x: 128, y: 158 },
        footL: { x: 152, y: 168 },
        kneeR: { x: 126, y: 154 },
        footR: { x: 150, y: 164 },
      };
      return [
        { ...side, hip: { x: 108, y: 152 } },
        { ...side, hip: { x: 103, y: 143 } },
      ];
    }
    // Cat-Cow: Vierfüßler, Rücken rund / hohl, Kopf senkt und hebt
    case "catcow": {
      const quad = {
        elbowL: { x: 58, y: 138 },
        handL: { x: 56, y: 168 },
        elbowR: { x: 62, y: 140 },
        handR: { x: 60, y: 170 },
        kneeL: { x: 128, y: 168 },
        footL: { x: 156, y: 172 },
        kneeR: { x: 132, y: 170 },
        footR: { x: 160, y: 174 },
      };
      return [
        { ...quad, head: { x: 42, y: 92 }, shoulder: { x: 60, y: 106 }, hip: { x: 126, y: 102 } },
        { ...quad, head: { x: 50, y: 118 }, shoulder: { x: 62, y: 92 }, hip: { x: 126, y: 94 } },
      ];
    }
    // Thoracic Rotation: Vierfüßler, ein Arm rotiert nach oben auf
    case "trotation": {
      const quad = {
        shoulder: { x: 62, y: 102 },
        hip: { x: 126, y: 100 },
        elbowR: { x: 64, y: 140 },
        handR: { x: 62, y: 170 },
        kneeL: { x: 128, y: 168 },
        footL: { x: 156, y: 172 },
        kneeR: { x: 132, y: 170 },
        footR: { x: 160, y: 174 },
      };
      return [
        { ...quad, head: { x: 44, y: 100 }, elbowL: { x: 58, y: 138 }, handL: { x: 56, y: 168 } },
        { ...quad, head: { x: 44, y: 90 }, elbowL: { x: 66, y: 92 }, handL: { x: 58, y: 74 } },
      ];
    }
    // Radfahren: sitzend auf dem Rad, Beine treten rund
    case "bike": {
      const rider = {
        head: { x: 134, y: 72 },
        shoulder: { x: 122, y: 86 },
        hip: { x: 88, y: 112 },
        elbowL: { x: 134, y: 98 },
        handL: { x: 147, y: 102 },
        elbowR: { x: 137, y: 100 },
        handR: { x: 150, y: 104 },
      };
      return [
        {
          ...rider,
          kneeL: { x: 102, y: 124 },
          footL: { x: 114, y: 150 },
          kneeR: { x: 90, y: 126 },
          footR: { x: 86, y: 150 },
        },
        {
          ...rider,
          kneeL: { x: 96, y: 132 },
          footL: { x: 100, y: 164 },
          kneeR: { x: 94, y: 116 },
          footR: { x: 100, y: 136 },
        },
        {
          ...rider,
          kneeL: { x: 90, y: 126 },
          footL: { x: 86, y: 150 },
          kneeR: { x: 102, y: 124 },
          footR: { x: 114, y: 150 },
        },
        {
          ...rider,
          kneeL: { x: 94, y: 116 },
          footL: { x: 100, y: 136 },
          kneeR: { x: 96, y: 132 },
          footR: { x: 100, y: 164 },
        },
      ];
    }
    // Mountain Climbers: hoher Stütz, Knie treiben abwechselnd zur Brust
    case "climber": {
      const top = {
        head: { x: 42, y: 98 },
        shoulder: { x: 60, y: 106 },
        hip: { x: 122, y: 112 },
        elbowL: { x: 60, y: 128 },
        handL: { x: 58, y: 152 },
        elbowR: { x: 64, y: 130 },
        handR: { x: 62, y: 154 },
      };
      return [
        {
          ...top,
          kneeL: { x: 98, y: 132 },
          footL: { x: 92, y: 150 },
          kneeR: { x: 155, y: 126 },
          footR: { x: 182, y: 148 },
        },
        {
          ...top,
          kneeL: { x: 155, y: 128 },
          footL: { x: 182, y: 150 },
          kneeR: { x: 98, y: 130 },
          footR: { x: 92, y: 148 },
        },
      ];
    }
    // Plank Shoulder Taps: hoher Stütz, Hand tippt zur Schulter
    case "shouldertap": {
      const top = {
        head: { x: 42, y: 98 },
        shoulder: { x: 60, y: 106 },
        hip: { x: 122, y: 112 },
        elbowR: { x: 64, y: 130 },
        handR: { x: 62, y: 154 },
        kneeL: { x: 152, y: 126 },
        footL: { x: 180, y: 148 },
        kneeR: { x: 156, y: 128 },
        footR: { x: 184, y: 150 },
      };
      return [
        { ...top, elbowL: { x: 60, y: 128 }, handL: { x: 58, y: 152 } },
        { ...top, elbowL: { x: 62, y: 120 }, handL: { x: 68, y: 108 } },
      ];
    }
    // Beinpresse: zurückgelehnt im Sitz, Beine drücken die Platte diagonal weg
    case "legpress": {
      const seat = {
        head: { x: 40, y: 92 },
        shoulder: { x: 48, y: 108 },
        hip: { x: 72, y: 138 },
        elbowL: { x: 56, y: 128 },
        handL: { x: 64, y: 142 },
        elbowR: { x: 60, y: 130 },
        handR: { x: 68, y: 144 },
      };
      return [
        {
          ...seat,
          kneeL: { x: 96, y: 112 },
          footL: { x: 116, y: 92 },
          kneeR: { x: 100, y: 116 },
          footR: { x: 120, y: 96 },
        },
        {
          ...seat,
          kneeL: { x: 104, y: 98 },
          footL: { x: 134, y: 76 },
          kneeR: { x: 108, y: 102 },
          footR: { x: 138, y: 80 },
        },
      ];
    }
    // Gehen: wie Laufen, aber ruhiger — wenig Kniehub, Fuß bleibt am Boden
    case "walk":
      return [
        {
          ...s,
          head: { x: 100, y: 48 },
          elbowL: { x: 82, y: 100 },
          handL: { x: 78, y: 122 },
          elbowR: { x: 118, y: 100 },
          handR: { x: 122, y: 118 },
          kneeL: { x: 90, y: 148 },
          footL: { x: 74, y: 176 },
          kneeR: { x: 112, y: 150 },
          footR: { x: 124, y: 178 },
        },
        {
          ...s,
          head: { x: 100, y: 46 },
          kneeL: { x: 94, y: 150 },
          footL: { x: 86, y: 178 },
          kneeR: { x: 106, y: 150 },
          footR: { x: 110, y: 178 },
        },
        {
          ...s,
          head: { x: 100, y: 48 },
          elbowL: { x: 118, y: 100 },
          handL: { x: 122, y: 118 },
          elbowR: { x: 82, y: 100 },
          handR: { x: 78, y: 122 },
          kneeL: { x: 112, y: 150 },
          footL: { x: 124, y: 178 },
          kneeR: { x: 90, y: 148 },
          footR: { x: 74, y: 176 },
        },
        {
          ...s,
          head: { x: 100, y: 46 },
          kneeL: { x: 106, y: 150 },
          footL: { x: 110, y: 178 },
          kneeR: { x: 94, y: 150 },
          footR: { x: 86, y: 178 },
        },
      ];
    // Band Pull-Apart / Face Pulls: Arme vor der Brust auseinanderziehen
    case "pullapart":
      return [
        {
          ...s,
          elbowL: { x: 88, y: 96 },
          handL: { x: 90, y: 92 },
          elbowR: { x: 112, y: 96 },
          handR: { x: 110, y: 92 },
        },
        {
          ...s,
          elbowL: { x: 70, y: 92 },
          handL: { x: 45, y: 90 },
          elbowR: { x: 130, y: 92 },
          handR: { x: 155, y: 90 },
        },
      ];
    default:
      return [s, s];
  }
}
