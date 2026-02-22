import { useCallback, useRef, useState } from 'react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import type { Card } from '../types';
import { useBoardStore } from '../stores/boardStore';
import { calculateSmartSnap, snapToGrid, type GuideLines } from './useSnap';

const BOARD_SIZE = 3000;
const Z_INDEX_THRESHOLD = 10000;

interface UseBoardDragOptions {
  cards: Card[];
  onUpdateCard: (data: Partial<Card> & { id: string }, actionType?: 'move' | 'resize' | 'content' | 'color') => void;
}

export function useBoardDrag({ cards, onUpdateCard }: UseBoardDragOptions) {
  const selectCard = useBoardStore((s) => s.selectCard);
  const viewport = useBoardStore((s) => s.viewport);
  const [guides, setGuides] = useState<GuideLines>({ horizontal: [], vertical: [] });
  const draggedCardIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const cardId = event.active.id as string;
      draggedCardIdRef.current = cardId;
      selectCard(cardId);

      // Bring to front: set z_index to max + 1
      const maxZ = cards.reduce((max, c) => Math.max(max, c.z_index), 0);
      const newZ = maxZ + 1;
      onUpdateCard({ id: cardId, z_index: newZ });

      // Z-index normalization: compress when threshold exceeded
      if (newZ > Z_INDEX_THRESHOLD) {
        const sorted = [...cards].sort((a, b) => a.z_index - b.z_index);
        sorted.forEach((c, i) => {
          if (c.id !== cardId) {
            onUpdateCard({ id: c.id, z_index: i + 1 });
          }
        });
        onUpdateCard({ id: cardId, z_index: sorted.length });
      }
    },
    [cards, selectCard, onUpdateCard]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const cardId = event.active.id as string;
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      // Convert pixel delta to percentage
      const zoom = useBoardStore.getState().viewport.zoom;
      const scaledBoardSize = BOARD_SIZE * zoom;
      const dx = (event.delta.x / scaledBoardSize) * 100;
      const dy = (event.delta.y / scaledBoardSize) * 100;

      const tentativeX = Math.max(0, Math.min(100 - card.width, card.x + dx));
      const tentativeY = Math.max(0, Math.min(100 - card.height, card.y + dy));

      // Calculate smart guides during drag
      const otherCards = cards.filter((c) => c.id !== cardId);
      const result = calculateSmartSnap(
        { x: tentativeX, y: tentativeY, width: card.width, height: card.height },
        otherCards
      );

      setGuides(result.guides);
    },
    [cards]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const cardId = active.id as string;
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      draggedCardIdRef.current = null;

      // Clear guides immediately
      setGuides({ horizontal: [], vertical: [] });

      // Convert pixel delta to percentage of board
      const scaledBoardSize = BOARD_SIZE * viewport.zoom;
      const dx = (delta.x / scaledBoardSize) * 100;
      const dy = (delta.y / scaledBoardSize) * 100;

      let newX = Math.max(0, Math.min(100 - card.width, card.x + dx));
      let newY = Math.max(0, Math.min(100 - card.height, card.y + dy));

      // Apply smart guide snap
      const otherCards = cards.filter((c) => c.id !== cardId);
      const smartResult = calculateSmartSnap(
        { x: newX, y: newY, width: card.width, height: card.height },
        otherCards
      );
      newX = smartResult.x;
      newY = smartResult.y;

      // Apply grid snap if enabled
      const { snapEnabled, gridSize } = useBoardStore.getState();
      if (snapEnabled) {
        newX = snapToGrid(newX, gridSize);
        newY = snapToGrid(newY, gridSize);
      }

      // Clamp again after snapping
      newX = Math.max(0, Math.min(100 - card.width, newX));
      newY = Math.max(0, Math.min(100 - card.height, newY));

      onUpdateCard({ id: cardId, x: newX, y: newY }, 'move');
    },
    [cards, viewport.zoom, onUpdateCard]
  );

  return { handleDragStart, handleDragMove, handleDragEnd, guides };
}
