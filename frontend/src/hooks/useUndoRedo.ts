import { create } from 'zustand';
import type { Card, Connection } from '../types';

const MAX_STACK_SIZE = 50;

export type ActionType =
  | 'card_move'
  | 'card_resize'
  | 'card_content'
  | 'card_color'
  | 'card_create'
  | 'card_delete'
  | 'connection_create'
  | 'connection_delete';

export interface UndoAction {
  type: ActionType;
  boardId: string;
  /** State to restore on undo */
  before: Record<string, unknown>;
  /** State to restore on redo */
  after: Record<string, unknown>;
}

interface UndoRedoState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  pushAction: (action: UndoAction) => void;
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushAction: (action) =>
    set((state) => ({
      undoStack: [...state.undoStack.slice(-MAX_STACK_SIZE + 1), action],
      redoStack: [], // New action clears redo stack
    })),

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;

    const action = undoStack[undoStack.length - 1];
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, action],
    }));
    return action;
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;

    const action = redoStack[redoStack.length - 1];
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, action],
    }));
    return action;
  },

  clear: () => set({ undoStack: [], redoStack: [] }),

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,
}));

// Helper functions to create undo actions

export function cardMoveAction(
  boardId: string,
  cardId: string,
  before: { x: number; y: number },
  after: { x: number; y: number }
): UndoAction {
  return {
    type: 'card_move',
    boardId,
    before: { cardId, ...before },
    after: { cardId, ...after },
  };
}

export function cardResizeAction(
  boardId: string,
  cardId: string,
  before: { width: number; height: number },
  after: { width: number; height: number }
): UndoAction {
  return {
    type: 'card_resize',
    boardId,
    before: { cardId, ...before },
    after: { cardId, ...after },
  };
}

export function cardContentAction(
  boardId: string,
  cardId: string,
  before: string,
  after: string
): UndoAction {
  return {
    type: 'card_content',
    boardId,
    before: { cardId, content: before },
    after: { cardId, content: after },
  };
}

export function cardColorAction(
  boardId: string,
  cardId: string,
  before: string,
  after: string
): UndoAction {
  return {
    type: 'card_color',
    boardId,
    before: { cardId, color: before },
    after: { cardId, color: after },
  };
}

export function cardCreateAction(
  boardId: string,
  card: Card
): UndoAction {
  return {
    type: 'card_create',
    boardId,
    before: {},
    after: { card },
  };
}

export function cardDeleteAction(
  boardId: string,
  card: Card,
  connections: Connection[]
): UndoAction {
  return {
    type: 'card_delete',
    boardId,
    before: { card, connections },
    after: {},
  };
}

export function connectionCreateAction(
  boardId: string,
  connection: Connection
): UndoAction {
  return {
    type: 'connection_create',
    boardId,
    before: {},
    after: { connection },
  };
}

export function connectionDeleteAction(
  boardId: string,
  connection: Connection
): UndoAction {
  return {
    type: 'connection_delete',
    boardId,
    before: { connection },
    after: {},
  };
}
