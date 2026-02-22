import type { GuideLines } from '../hooks/useSnap';

interface SmartGuidesProps {
  guides: GuideLines;
}

/**
 * Renders temporary alignment guide lines during drag.
 * Horizontal guides are full-width lines at a y position.
 * Vertical guides are full-height lines at an x position.
 */
export function SmartGuides({ guides }: SmartGuidesProps) {
  if (guides.horizontal.length === 0 && guides.vertical.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 9999 }}
    >
      {guides.horizontal.map((y, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={100}
          y2={y}
          stroke="#E11D48"
          strokeWidth={0.08}
          strokeDasharray="0.3 0.2"
        />
      ))}
      {guides.vertical.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={100}
          stroke="#E11D48"
          strokeWidth={0.08}
          strokeDasharray="0.3 0.2"
        />
      ))}
    </svg>
  );
}
