import { memo, useCallback, useMemo, useState } from 'react';
import type { Card, Connection } from '../types';

interface ConnectionLineProps {
  connection: Connection;
  fromCard: Card;
  toCard: Card;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, connectionId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Calculate the midpoints of all four edges of a card rect (in percentage coordinates).
 */
function getEdgeMidpoints(card: Card): { top: Point; bottom: Point; left: Point; right: Point } {
  return {
    top: { x: card.x + card.width / 2, y: card.y },
    bottom: { x: card.x + card.width / 2, y: card.y + card.height },
    left: { x: card.x, y: card.y + card.height / 2 },
    right: { x: card.x + card.width, y: card.y + card.height / 2 },
  };
}

/**
 * Find the nearest pair of edge midpoints between two cards.
 */
function getNearestEndpoints(fromCard: Card, toCard: Card): { start: Point; end: Point } {
  const fromMids = getEdgeMidpoints(fromCard);
  const toMids = getEdgeMidpoints(toCard);

  const fromPoints = Object.values(fromMids);
  const toPoints = Object.values(toMids);

  let bestDist = Infinity;
  let bestFrom = fromPoints[0];
  let bestTo = toPoints[0];

  for (const fp of fromPoints) {
    for (const tp of toPoints) {
      const dx = fp.x - tp.x;
      const dy = fp.y - tp.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestFrom = fp;
        bestTo = tp;
      }
    }
  }

  return { start: bestFrom, end: bestTo };
}

/**
 * Build a quadratic bezier path between two points.
 * The control point is offset perpendicular to the midpoint for a natural curve.
 */
function buildBezierPath(start: Point, end: Point): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Offset the control point perpendicular to the line for a gentle curve
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Curve intensity scales with distance, capped
  const offset = Math.min(dist * 0.2, 5);

  // Perpendicular direction
  const nx = dist > 0 ? -dy / dist : 0;
  const ny = dist > 0 ? dx / dist : 0;

  const cx = midX + nx * offset;
  const cy = midY + ny * offset;

  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
}

export const ConnectionLine = memo(function ConnectionLine({
  connection,
  fromCard,
  toCard,
  isSelected,
  onSelect,
  onContextMenu,
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { start, end } = useMemo(
    () => getNearestEndpoints(fromCard, toCard),
    [fromCard, toCard]
  );

  const path = useMemo(() => buildBezierPath(start, end), [start, end]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(connection.id);
    },
    [connection.id, onSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, connection.id);
    },
    [connection.id, onContextMenu]
  );

  const strokeColor = isSelected ? '#D97706' : connection.color;
  const strokeWidth = isHovered || isSelected ? 0.4 : 0.2;

  return (
    <g
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider hit area for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={1.2}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
      {/* Visible line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{ cursor: 'pointer', pointerEvents: 'none', transition: 'stroke-width 0.1s' }}
      />
      {isSelected && (
        <>
          <circle cx={start.x} cy={start.y} r={0.4} fill="#D97706" />
          <circle cx={end.x} cy={end.y} r={0.4} fill="#D97706" />
        </>
      )}
    </g>
  );
});
