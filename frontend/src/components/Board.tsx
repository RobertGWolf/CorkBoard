import { useCallback, useMemo, useRef } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useBoardStore } from '../stores/boardStore';
import { useBoardData, useCreateCard, useDeleteCard, useUpdateCard } from '../hooks/useCards';
import { useBoardDrag } from '../hooks/useDrag';
import { Card } from './Card';
import type { Card as CardType } from '../types';

const BOARD_SIZE = 3000;

export function Board() {
  const viewport = useBoardStore((s) => s.viewport);
  const setViewport = useBoardStore((s) => s.setViewport);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const clearSelection = useBoardStore((s) => s.clearSelection);

  const { data: boardData } = useBoardData(currentBoardId);
  const createCard = useCreateCard(currentBoardId ?? '');
  const updateCard = useUpdateCard(currentBoardId ?? '');
  const deleteCard = useDeleteCard(currentBoardId ?? '');

  const cards = useMemo(() => boardData?.cards ?? [], [boardData?.cards]);

  const handleUpdateCard = useCallback(
    (data: Partial<CardType> & { id: string }) => {
      updateCard.mutate(data);
    },
    [updateCard]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      deleteCard.mutate(id);
      clearSelection();
    },
    [deleteCard, clearSelection]
  );

  // Drag system
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const { handleDragStart, handleDragEnd } = useBoardDrag({
    cards,
    onUpdateCard: handleUpdateCard,
  });

  // Pan/zoom
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportStart = useRef({ x: 0, y: 0 });
  const boardInnerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.button !== 0) return;

      clearSelection();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      viewportStart.current = { x: viewport.x, y: viewport.y };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [viewport.x, viewport.y, clearSelection]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPanning.current) return;

      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;

      setViewport({
        x: viewportStart.current.x + dx,
        y: viewportStart.current.y + dy,
      });
    },
    [setViewport]
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const oldZoom = viewport.zoom;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(2.0, oldZoom + delta));

      if (newZoom === oldZoom) return;

      const scale = newZoom / oldZoom;
      const newX = cursorX - scale * (cursorX - viewport.x);
      const newY = cursorY - scale * (cursorY - viewport.y);

      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport.x, viewport.y, viewport.zoom, setViewport]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (!currentBoardId) return;

      const rect = boardInnerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const boardX = ((e.clientX - rect.left) / rect.width) * 100;
      const boardY = ((e.clientY - rect.top) / rect.height) * 100;

      const x = Math.max(0, Math.min(85, boardX - 7.5));
      const y = Math.max(0, Math.min(90, boardY - 5));

      createCard.mutate({ x, y });
    },
    [currentBoardId, createCard]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="w-full h-full overflow-hidden relative bg-amber-50"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          ref={boardInnerRef}
          className="absolute origin-top-left"
          style={{
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          }}
          onDoubleClick={handleDoubleClick}
        >
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onUpdate={handleUpdateCard}
              onDelete={handleDeleteCard}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
