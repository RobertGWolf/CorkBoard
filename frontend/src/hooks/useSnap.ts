import { useMemo } from 'react';
import { useBoardStore } from '../stores/boardStore';
import type { Card } from '../types';

export interface GuideLines {
  horizontal: number[]; // y-values in percentage
  vertical: number[];   // x-values in percentage
}

export interface SnapResult {
  x: number;
  y: number;
  guides: GuideLines;
}

const SMART_GUIDE_THRESHOLD = 0.5; // percentage units (~15px at default zoom on 3000px board)

// Grid sizes in percentage of board (equivalent to 10, 20, 40 px on 3000px board)
export const GRID_SIZES: Record<number, number> = {
  10: (10 / 3000) * 100,
  20: (20 / 3000) * 100,
  40: (40 / 3000) * 100,
};

export const DEFAULT_GRID_SIZE = 20;

/**
 * Snap a position to the nearest grid point.
 */
export function snapToGrid(value: number, gridSize: number): number {
  const gridPct = GRID_SIZES[gridSize] ?? GRID_SIZES[DEFAULT_GRID_SIZE];
  return Math.round(value / gridPct) * gridPct;
}

/**
 * Get the edge and center positions of a card for smart guide alignment.
 */
function getCardEdges(card: Card) {
  return {
    left: card.x,
    right: card.x + card.width,
    centerX: card.x + card.width / 2,
    top: card.y,
    bottom: card.y + card.height,
    centerY: card.y + card.height / 2,
  };
}

/**
 * Calculate smart guide snapping during drag.
 * Compares the dragged card's edges/center to all other cards.
 * Returns snapped position and guide lines to display.
 */
export function calculateSmartSnap(
  draggedCard: { x: number; y: number; width: number; height: number },
  otherCards: Card[],
  threshold: number = SMART_GUIDE_THRESHOLD
): SnapResult {
  let snappedX = draggedCard.x;
  let snappedY = draggedCard.y;
  const horizontalGuides: number[] = [];
  const verticalGuides: number[] = [];

  const dragged = {
    left: draggedCard.x,
    right: draggedCard.x + draggedCard.width,
    centerX: draggedCard.x + draggedCard.width / 2,
    top: draggedCard.y,
    bottom: draggedCard.y + draggedCard.height,
    centerY: draggedCard.y + draggedCard.height / 2,
  };

  let bestDx = threshold;
  let bestDy = threshold;

  for (const other of otherCards) {
    const edges = getCardEdges(other);

    // Vertical alignment (x-axis snapping)
    const xPairs = [
      { dragVal: dragged.left, otherVal: edges.left },
      { dragVal: dragged.left, otherVal: edges.right },
      { dragVal: dragged.right, otherVal: edges.left },
      { dragVal: dragged.right, otherVal: edges.right },
      { dragVal: dragged.centerX, otherVal: edges.centerX },
      { dragVal: dragged.left, otherVal: edges.centerX },
      { dragVal: dragged.right, otherVal: edges.centerX },
      { dragVal: dragged.centerX, otherVal: edges.left },
      { dragVal: dragged.centerX, otherVal: edges.right },
    ];

    for (const { dragVal, otherVal } of xPairs) {
      const diff = Math.abs(dragVal - otherVal);
      if (diff < bestDx) {
        bestDx = diff;
        snappedX = draggedCard.x + (otherVal - dragVal);
        verticalGuides.length = 0;
        verticalGuides.push(otherVal);
      } else if (diff === bestDx && diff < threshold) {
        verticalGuides.push(otherVal);
      }
    }

    // Horizontal alignment (y-axis snapping)
    const yPairs = [
      { dragVal: dragged.top, otherVal: edges.top },
      { dragVal: dragged.top, otherVal: edges.bottom },
      { dragVal: dragged.bottom, otherVal: edges.top },
      { dragVal: dragged.bottom, otherVal: edges.bottom },
      { dragVal: dragged.centerY, otherVal: edges.centerY },
      { dragVal: dragged.top, otherVal: edges.centerY },
      { dragVal: dragged.bottom, otherVal: edges.centerY },
      { dragVal: dragged.centerY, otherVal: edges.top },
      { dragVal: dragged.centerY, otherVal: edges.bottom },
    ];

    for (const { dragVal, otherVal } of yPairs) {
      const diff = Math.abs(dragVal - otherVal);
      if (diff < bestDy) {
        bestDy = diff;
        snappedY = draggedCard.y + (otherVal - dragVal);
        horizontalGuides.length = 0;
        horizontalGuides.push(otherVal);
      } else if (diff === bestDy && diff < threshold) {
        horizontalGuides.push(otherVal);
      }
    }
  }

  // If no snap was found within threshold, use original position
  if (bestDx >= threshold) snappedX = draggedCard.x;
  if (bestDy >= threshold) snappedY = draggedCard.y;

  return {
    x: snappedX,
    y: snappedY,
    guides: {
      horizontal: bestDy < threshold ? [...new Set(horizontalGuides)] : [],
      vertical: bestDx < threshold ? [...new Set(verticalGuides)] : [],
    },
  };
}

/**
 * Hook that provides snap utilities based on the current board store state.
 */
export function useSnap(cards: Card[], draggedCardId: string | null) {
  const snapEnabled = useBoardStore((s) => s.snapEnabled);

  const otherCards = useMemo(
    () => (draggedCardId ? cards.filter((c) => c.id !== draggedCardId) : cards),
    [cards, draggedCardId]
  );

  return { snapEnabled, otherCards };
}
