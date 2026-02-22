import { useCallback, useRef, useState } from 'react';
import { useBoardStore } from '../stores/boardStore';
import type { Card } from '../types';

const BOARD_SIZE = 3000;

const MIN_WIDTH = 10; // percentage
const MIN_HEIGHT = 5; // percentage
const MAX_DIM = 50; // percentage, both width and height

interface ResizeDelta {
  dw: number;
  dh: number;
}

interface UseResizeOptions {
  card: Card;
  onResizeEnd: (data: Partial<Card> & { id: string }) => void;
}

export function useResize({ card, onResizeEnd }: UseResizeOptions) {
  const [resizeDelta, setResizeDelta] = useState<ResizeDelta | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);

      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { width: card.width, height: card.height };
      setResizeDelta({ dw: 0, dh: 0 });

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const zoom = useBoardStore.getState().viewport.zoom;
        const scaledBoardSize = BOARD_SIZE * zoom;

        const dx = ((moveEvent.clientX - startPos.current.x) / scaledBoardSize) * 100;
        const dy = ((moveEvent.clientY - startPos.current.y) / scaledBoardSize) * 100;

        // Clamp the resulting size
        const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_DIM, startSize.current.width + dx));
        const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_DIM, startSize.current.height + dy));

        setResizeDelta({
          dw: clampedWidth - startSize.current.width,
          dh: clampedHeight - startSize.current.height,
        });
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);

        // Get final clamped values
        setResizeDelta((current) => {
          if (current) {
            const finalWidth = startSize.current.width + current.dw;
            const finalHeight = startSize.current.height + current.dh;
            onResizeEnd({ id: card.id, width: finalWidth, height: finalHeight });
          }
          return null;
        });
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [card.id, card.width, card.height, onResizeEnd]
  );

  // Current displayed size (base + delta)
  const displayWidth = resizeDelta ? card.width + resizeDelta.dw : card.width;
  const displayHeight = resizeDelta ? card.height + resizeDelta.dh : card.height;

  return {
    handleResizeStart,
    isResizing: resizeDelta !== null,
    displayWidth,
    displayHeight,
  };
}
