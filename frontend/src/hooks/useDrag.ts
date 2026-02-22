import { useCallback } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Card } from '../types';
import { useBoardStore } from '../stores/boardStore';

const BOARD_SIZE = 3000;

interface UseBoardDragOptions {
  cards: Card[];
  onUpdateCard: (data: Partial<Card> & { id: string }) => void;
}

export function useBoardDrag({ cards, onUpdateCard }: UseBoardDragOptions) {
  const selectCard = useBoardStore((s) => s.selectCard);
  const viewport = useBoardStore((s) => s.viewport);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const cardId = event.active.id as string;
      selectCard(cardId);

      // Bring to front: set z_index to max + 1
      const maxZ = cards.reduce((max, c) => Math.max(max, c.z_index), 0);
      onUpdateCard({ id: cardId, z_index: maxZ + 1 });
    },
    [cards, selectCard, onUpdateCard]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const cardId = active.id as string;
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      // Convert pixel delta to percentage of board
      const scaledBoardSize = BOARD_SIZE * viewport.zoom;
      const dx = (delta.x / scaledBoardSize) * 100;
      const dy = (delta.y / scaledBoardSize) * 100;

      const newX = Math.max(0, Math.min(100 - card.width, card.x + dx));
      const newY = Math.max(0, Math.min(100 - card.height, card.y + dy));

      onUpdateCard({ id: cardId, x: newX, y: newY });
    },
    [cards, viewport.zoom, onUpdateCard]
  );

  return { handleDragStart, handleDragEnd };
}
