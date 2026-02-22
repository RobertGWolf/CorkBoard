import { useCallback, useEffect, useMemo, useRef } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useBoardStore } from '../stores/boardStore';
import { useBoardData, useCreateCard, useDeleteCard, useUpdateCard } from '../hooks/useCards';
import { useCreateConnection, useDeleteConnection, useUpdateConnection } from '../hooks/useConnections';
import { useBoardDrag } from '../hooks/useDrag';
import {
  useUndoRedoStore,
  cardMoveAction,
  cardResizeAction,
  cardContentAction,
  cardColorAction,
  cardDeleteAction,
  connectionDeleteAction,
  type UndoAction,
} from '../hooks/useUndoRedo';
import { Card } from './Card';
import { ConnectionLayer } from './ConnectionLayer';
import { SmartGuides } from './SmartGuides';
import { GRID_SIZES } from '../hooks/useSnap';
import type { Card as CardType, Connection } from '../types';

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
  const snapEnabled = useBoardStore((s) => s.snapEnabled);
  const gridSize = useBoardStore((s) => s.gridSize);
  const toggleSnap = useBoardStore((s) => s.toggleSnap);
  const { data: boardData } = useBoardData(currentBoardId);
  const createCard = useCreateCard(currentBoardId ?? '');
  const updateCard = useUpdateCard(currentBoardId ?? '');
  const deleteCard = useDeleteCard(currentBoardId ?? '');
  const createConnection = useCreateConnection(currentBoardId ?? '');
  const deleteConnection = useDeleteConnection(currentBoardId ?? '');
  const updateConnection = useUpdateConnection(currentBoardId ?? '');

  const pushAction = useUndoRedoStore((s) => s.pushAction);

  const cards = useMemo(() => boardData?.cards ?? [], [boardData?.cards]);
  const connections = useMemo(() => boardData?.connections ?? [], [boardData?.connections]);

  // Refs to access latest cards/connections in callbacks without stale closures
  const cardsRef = useRef(cards);
  const connectionsRef = useRef(connections);
  useEffect(() => {
    cardsRef.current = cards;
    connectionsRef.current = connections;
  }, [cards, connections]);

  const handleUpdateCard = useCallback(
    (data: Partial<CardType> & { id: string }) => {
      updateCard.mutate(data);
    },
    [updateCard]
  );

  // Wrapped update that also records undo actions
  const handleUpdateCardWithUndo = useCallback(
    (data: Partial<CardType> & { id: string }, actionType?: 'move' | 'resize' | 'content' | 'color') => {
      const boardId = currentBoardId;
      if (!boardId) return;

      const card = cardsRef.current.find((c) => c.id === data.id);
      if (!card) return;

      if (actionType === 'move' && data.x !== undefined && data.y !== undefined) {
        pushAction(cardMoveAction(boardId, data.id, { x: card.x, y: card.y }, { x: data.x, y: data.y }));
      } else if (actionType === 'resize' && data.width !== undefined && data.height !== undefined) {
        pushAction(cardResizeAction(boardId, data.id, { width: card.width, height: card.height }, { width: data.width, height: data.height }));
      } else if (actionType === 'content' && data.content !== undefined) {
        pushAction(cardContentAction(boardId, data.id, card.content, data.content));
      } else if (actionType === 'color' && data.color !== undefined) {
        pushAction(cardColorAction(boardId, data.id, card.color, data.color));
      }

      updateCard.mutate(data);
    },
    [currentBoardId, updateCard, pushAction]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      const boardId = currentBoardId;
      if (boardId) {
        const card = cardsRef.current.find((c) => c.id === id);
        if (card) {
          const cardConnections = connectionsRef.current.filter(
            (c) => c.from_card_id === id || c.to_card_id === id
          );
          pushAction(cardDeleteAction(boardId, card, cardConnections));
        }
      }
      deleteCard.mutate(id);
      clearSelection();
    },
    [currentBoardId, deleteCard, clearSelection, pushAction]
  );

  // Connect mode: handle card click to select source/target
  const handleCardClickInConnectMode = useCallback(
    (cardId: string) => {
      if (!connectSourceId) {
        setConnectSource(cardId);
      } else if (connectSourceId === cardId) {
        setConnectSource(null);
      } else {
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
          // Note: undo for connection create is handled via onSuccess in the hook
          // We push the action there since we need the connection ID
        }
        setConnectSource(null);
      }
    },
    [connectSourceId, setConnectSource, connections, createConnection]
  );

  const handleDeleteConnection = useCallback(
    (id: string) => {
      const boardId = currentBoardId;
      if (boardId) {
        const conn = connectionsRef.current.find((c) => c.id === id);
        if (conn) {
          pushAction(connectionDeleteAction(boardId, conn));
        }
      }
      deleteConnection.mutate(id);
      useBoardStore.getState().selectConnection(null);
    },
    [currentBoardId, deleteConnection, pushAction]
  );

  const handleUpdateConnection = useCallback(
    (id: string, color: string) => {
      updateConnection.mutate({ id, color });
    },
    [updateConnection]
  );

  // Execute an undo/redo action
  const executeUndoRedoAction = useCallback(
    (action: UndoAction | null, isUndo: boolean) => {
      if (!action) return;

      const data = isUndo ? action.before : action.after;

      switch (action.type) {
        case 'card_move': {
          const { cardId, x, y } = data as { cardId: string; x: number; y: number };
          updateCard.mutate({ id: cardId, x, y });
          break;
        }
        case 'card_resize': {
          const { cardId, width, height } = data as { cardId: string; width: number; height: number };
          updateCard.mutate({ id: cardId, width, height });
          break;
        }
        case 'card_content': {
          const { cardId, content } = data as { cardId: string; content: string };
          updateCard.mutate({ id: cardId, content });
          break;
        }
        case 'card_color': {
          const { cardId, color } = data as { cardId: string; color: string };
          updateCard.mutate({ id: cardId, color });
          break;
        }
        case 'card_create': {
          if (isUndo) {
            // Undo create = delete the card
            const { card } = action.after as { card: CardType };
            deleteCard.mutate(card.id);
          } else {
            // Redo create = re-create the card
            const { card } = action.after as { card: CardType };
            createCard.mutate({
              x: card.x,
              y: card.y,
              width: card.width,
              height: card.height,
              color: card.color,
              content: card.content,
            });
          }
          break;
        }
        case 'card_delete': {
          if (isUndo) {
            // Undo delete = re-create the card and its connections
            const { card, connections: conns } = action.before as { card: CardType; connections: Connection[] };
            createCard.mutate(
              { x: card.x, y: card.y, width: card.width, height: card.height, color: card.color, content: card.content },
              {
                onSuccess: () => {
                  // Re-create connections after card is re-created
                  // Note: card will get a new ID, so connections won't match perfectly
                  // This is a known limitation of session-local undo
                  void conns; // connections can't be perfectly restored with new IDs
                },
              }
            );
          } else {
            // Redo delete = delete the card again
            const { card } = action.before as { card: CardType };
            deleteCard.mutate(card.id);
          }
          break;
        }
        case 'connection_create': {
          if (isUndo) {
            const { connection } = action.after as { connection: Connection };
            deleteConnection.mutate(connection.id);
          } else {
            const { connection } = action.after as { connection: Connection };
            createConnection.mutate({
              from_card_id: connection.from_card_id,
              to_card_id: connection.to_card_id,
            });
          }
          break;
        }
        case 'connection_delete': {
          if (isUndo) {
            const { connection } = action.before as { connection: Connection };
            createConnection.mutate({
              from_card_id: connection.from_card_id,
              to_card_id: connection.to_card_id,
              color: connection.color,
            });
          } else {
            const { connection } = action.before as { connection: Connection };
            deleteConnection.mutate(connection.id);
          }
          break;
        }
      }
    },
    [updateCard, deleteCard, createCard, deleteConnection, createConnection]
  );

  // Drag system — disabled in connect mode
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const { handleDragStart, handleDragMove, handleDragEnd, guides } = useBoardDrag({
    cards,
    onUpdateCard: handleUpdateCardWithUndo,
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl+Z / Ctrl+Shift+Z work even when typing (standard behavior)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const action = useUndoRedoStore.getState().undo();
        if (action) executeUndoRedoAction(action, true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const action = useUndoRedoStore.getState().redo();
        if (action) executeUndoRedoAction(action, false);
        return;
      }

      if (isTyping) return;

      // G key — toggle grid snap
      if (e.key === 'g' || e.key === 'G') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleSnap();
        }
      }

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

      // Delete/Backspace — delete selected card or connection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useBoardStore.getState();
        if (state.selectedConnectionId) {
          e.preventDefault();
          handleDeleteConnection(state.selectedConnectionId);
        }
      }

      // Ctrl+A — select all (prevent default, not implemented as multi-select yet)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
      }

      // +/- zoom
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        useBoardStore.getState().setZoom(useBoardStore.getState().viewport.zoom + 0.1);
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        useBoardStore.getState().setZoom(useBoardStore.getState().viewport.zoom - 0.1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectMode, toggleConnectMode, toggleSnap, clearSelection, handleDeleteConnection, executeUndoRedoAction]);

  // Space+drag panning
  const spaceHeld = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !e.repeat) {
        const target = e.target as HTMLElement;
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (!isTyping) {
          e.preventDefault();
          spaceHeld.current = true;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeld.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Pan/zoom
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportStart = useRef({ x: 0, y: 0 });
  const boardInnerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Space+drag: pan from anywhere
      if (spaceHeld.current && e.button === 0) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        viewportStart.current = { x: viewport.x, y: viewport.y };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        return;
      }

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

  // Dot grid pattern for snap mode
  const gridPct = GRID_SIZES[gridSize] ?? GRID_SIZES[20];

  return (
    <DndContext
      sensors={connectMode ? [] : sensors}
      onDragStart={connectMode ? undefined : handleDragStart}
      onDragMove={connectMode ? undefined : handleDragMove}
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
          {/* Dot grid background — visible only when snap is active */}
          {snapEnabled && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ zIndex: -1 }}
            >
              <defs>
                <pattern
                  id="dotGrid"
                  x="0"
                  y="0"
                  width={gridPct}
                  height={gridPct}
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx={gridPct / 2}
                    cy={gridPct / 2}
                    r={0.04}
                    fill="#D4A574"
                    opacity="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#dotGrid)" />
            </svg>
          )}

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
              onUpdateWithUndo={handleUpdateCardWithUndo}
              onDelete={handleDeleteCard}
              connectMode={connectMode}
              isConnectSource={connectSourceId === card.id}
              onConnectClick={handleCardClickInConnectMode}
            />
          ))}

          {/* Smart guide overlay — on top of everything */}
          <SmartGuides guides={guides} />
        </div>
      </div>
    </DndContext>
  );
}
