import { useCallback, useEffect, useMemo, useRef } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useBoardStore } from '../stores/boardStore';
import { useBoardData, useCreateCard, useDeleteCard, useUpdateCard } from '../hooks/useCards';
import { useCreateConnection, useDeleteConnection, useUpdateConnection } from '../hooks/useConnections';
import { useBoardDrag } from '../hooks/useDrag';
import { Card } from './Card';
import { ConnectionLayer } from './ConnectionLayer';
import type { Card as CardType } from '../types';

const BOARD_SIZE = 3000;

export function Board() {
  const viewport = useBoardStore((s) => s.viewport);
  const setViewport = useBoardStore((s) => s.setViewport);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const connectMode = useBoardStore((s) => s.connectMode);
  const connectSourceId = useBoardStore((s) => s.connectSourceId);
  const setConnectSource = useBoardStore((s) => s.setConnectSource);
  const toggleConnectMode = useBoardStore((s) => s.toggleConnectMode);
  const { data: boardData } = useBoardData(currentBoardId);
  const createCard = useCreateCard(currentBoardId ?? '');
  const updateCard = useUpdateCard(currentBoardId ?? '');
  const deleteCard = useDeleteCard(currentBoardId ?? '');
  const createConnection = useCreateConnection(currentBoardId ?? '');
  const deleteConnection = useDeleteConnection(currentBoardId ?? '');
  const updateConnection = useUpdateConnection(currentBoardId ?? '');

  const cards = useMemo(() => boardData?.cards ?? [], [boardData?.cards]);
  const connections = useMemo(() => boardData?.connections ?? [], [boardData?.connections]);

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

  // Connect mode: handle card click to select source/target
  const handleCardClickInConnectMode = useCallback(
    (cardId: string) => {
      if (!connectSourceId) {
        // First click — select source
        setConnectSource(cardId);
      } else if (connectSourceId === cardId) {
        // Clicked same card — deselect source
        setConnectSource(null);
      } else {
        // Second click — validate and create connection
        const isDuplicate = connections.some(
          (c) =>
            (c.from_card_id === connectSourceId && c.to_card_id === cardId) ||
            (c.from_card_id === cardId && c.to_card_id === connectSourceId)
        );
        if (!isDuplicate) {
          createConnection.mutate({
            from_card_id: connectSourceId,
            to_card_id: cardId,
          });
        }
        setConnectSource(null);
      }
    },
    [connectSourceId, setConnectSource, connections, createConnection]
  );

  const handleDeleteConnection = useCallback(
    (id: string) => {
      deleteConnection.mutate(id);
      useBoardStore.getState().selectConnection(null);
    },
    [deleteConnection]
  );

  const handleUpdateConnection = useCallback(
    (id: string, color: string) => {
      updateConnection.mutate({ id, color });
    },
    [updateConnection]
  );

  // Drag system — disabled in connect mode
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const { handleDragStart, handleDragEnd } = useBoardDrag({
    cards,
    onUpdateCard: handleUpdateCard,
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      // C key — toggle connect mode
      if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleConnectMode();
        }
      }

      // Escape — exit connect mode / clear selection
      if (e.key === 'Escape') {
        if (connectMode) {
          toggleConnectMode();
        } else {
          clearSelection();
        }
      }

      // Delete/Backspace — delete selected connection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const connId = useBoardStore.getState().selectedConnectionId;
        if (connId) {
          e.preventDefault();
          handleDeleteConnection(connId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectMode, toggleConnectMode, clearSelection, handleDeleteConnection]);

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
      if (connectMode) return;

      const rect = boardInnerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const boardX = ((e.clientX - rect.left) / rect.width) * 100;
      const boardY = ((e.clientY - rect.top) / rect.height) * 100;

      const x = Math.max(0, Math.min(85, boardX - 7.5));
      const y = Math.max(0, Math.min(90, boardY - 5));

      createCard.mutate({ x, y });
    },
    [currentBoardId, createCard, connectMode]
  );

  return (
    <DndContext
      sensors={connectMode ? [] : sensors}
      onDragStart={connectMode ? undefined : handleDragStart}
      onDragEnd={connectMode ? undefined : handleDragEnd}
    >
      <div
        className={`w-full h-full overflow-hidden relative bg-amber-50 ${
          connectMode ? 'cursor-crosshair' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Connect mode banner */}
        {connectMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-amber-600 text-white text-sm rounded-full shadow-lg">
            {connectSourceId
              ? 'Click a target card to connect — Escape to cancel'
              : 'Click a source card — Escape to cancel'}
          </div>
        )}

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
          {/* Connection layer — behind cards (z-index 0) */}
          <ConnectionLayer
            cards={cards}
            connections={connections}
            onDeleteConnection={handleDeleteConnection}
            onUpdateConnection={handleUpdateConnection}
          />

          {/* Cards — rendered above connections */}
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onUpdate={handleUpdateCard}
              onDelete={handleDeleteCard}
              connectMode={connectMode}
              isConnectSource={connectSourceId === card.id}
              onConnectClick={handleCardClickInConnectMode}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
