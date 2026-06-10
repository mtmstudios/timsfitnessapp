import { useEffect, useState } from "react";
import type { AnimationType } from "@/data/exercises";

/** Looping stick-figure SVG that morphs between two key-frame poses. */
export function ExerciseAnimation({
  type,
  size = 220,
  color = "currentColor",
}: {
  type: AnimationType;
  size?: number;
  color?: string;
}) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => 1 - p), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ color }}
      aria-hidden
    >
      <defs>
        <radialGradient id="floor" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="185" rx="70" ry="8" fill="url(#floor)" />
      <Figure type={type} phase={phase} />
    </svg>
  );
}

function Figure({ type, phase }: { type: AnimationType; phase: number }) {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  const dur = "0.9s";

  const poses = getPoses(type);
  const a = poses[0];
  const b = poses[1];
  const p = phase === 0 ? a : b;

  return (
    <g style={{ transition: `all ${dur} cubic-bezier(.4,.0,.2,1)` }}>
      {/* head */}
      <circle cx={p.head.x} cy={p.head.y} r="10" {...stroke} />
      {/* torso */}
      <line x1={p.head.x} y1={p.head.y + 10} x2={p.hip.x} y2={p.hip.y} {...stroke} />
      {/* arms */}
      <polyline points={`${p.handL.x},${p.handL.y} ${p.elbowL.x},${p.elbowL.y} ${p.shoulder.x},${p.shoulder.y}`} {...stroke} />
      <polyline points={`${p.handR.x},${p.handR.y} ${p.elbowR.x},${p.elbowR.y} ${p.shoulder.x},${p.shoulder.y}`} {...stroke} />
      {/* legs */}
      <polyline points={`${p.footL.x},${p.footL.y} ${p.kneeL.x},${p.kneeL.y} ${p.hip.x},${p.hip.y}`} {...stroke} />
      <polyline points={`${p.footR.x},${p.footR.y} ${p.kneeR.x},${p.kneeR.y} ${p.hip.x},${p.hip.y}`} {...stroke} />
    </g>
  );
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

function getPoses(type: AnimationType): [Pose, Pose] {
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
      return [stand, {
        ...stand, head: { x: 100, y: 75 }, shoulder: { x: 100, y: 100 }, hip: { x: 100, y: 140 },
        elbowL: { x: 78, y: 115 }, elbowR: { x: 122, y: 115 },
        handL: { x: 70, y: 100 }, handR: { x: 130, y: 100 },
        kneeL: { x: 78, y: 155 }, kneeR: { x: 122, y: 155 },
      }];
    case "jump":
      return [{ ...stand, head: { x: 100, y: 75 }, shoulder: { x: 100, y: 100 }, hip: { x: 100, y: 140 }, kneeL: { x: 80, y: 158 }, kneeR: { x: 120, y: 158 }, handL: { x: 70, y: 130 }, handR: { x: 130, y: 130 } },
        { ...stand, head: { x: 100, y: 30 }, shoulder: { x: 100, y: 55 }, hip: { x: 100, y: 100 }, kneeL: { x: 90, y: 130 }, kneeR: { x: 110, y: 130 }, footL: { x: 85, y: 155 }, footR: { x: 115, y: 155 }, handL: { x: 70, y: 40 }, handR: { x: 130, y: 40 } }];
    case "pushup":
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
    case "hinge":
      return [stand, {
        ...stand, head: { x: 70, y: 80 }, shoulder: { x: 80, y: 95 }, hip: { x: 110, y: 115 },
        elbowL: { x: 85, y: 125 }, elbowR: { x: 95, y: 125 },
        handL: { x: 85, y: 150 }, handR: { x: 95, y: 150 },
      }];
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