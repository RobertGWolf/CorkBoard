import { create } from 'zustand';
import type { Viewport } from '../types';

interface BoardState {
  currentBoardId: string | null;
  viewport: Viewport;
  snapEnabled: boolean;
  gridSize: number; // 10, 20, or 40 — pixel-equivalent grid spacing
  connectMode: boolean;
  connectSourceId: string | null;
  selectedCardId: string | null;
  selectedConnectionId: string | null;

  setCurrentBoardId: (id: string | null) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;
  toggleConnectMode: () => void;
  setConnectSource: (id: string | null) => void;
  selectCard: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  clearSelection: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoardId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  snapEnabled: false,
  gridSize: 20,
  connectMode: false,
  connectSourceId: null,
  selectedCardId: null,
  selectedConnectionId: null,

  setCurrentBoardId: (id) => set({ currentBoardId: id }),

  setViewport: (partial) =>
    set((state) => ({
      viewport: { ...state.viewport, ...partial },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      viewport: { ...state.viewport, zoom: Math.max(0.25, Math.min(2.0, zoom)) },
    })),

  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

  setGridSize: (size) => set({ gridSize: size }),

  toggleConnectMode: () =>
    set((state) => ({
      connectMode: !state.connectMode,
      connectSourceId: null,
      selectedConnectionId: null,
    })),

  setConnectSource: (id) => set({ connectSourceId: id }),

  selectCard: (id) => set({ selectedCardId: id, selectedConnectionId: null }),

  selectConnection: (id) => set({ selectedConnectionId: id, selectedCardId: null }),

  clearSelection: () =>
    set({ selectedCardId: null, selectedConnectionId: null, connectSourceId: null }),
}));
