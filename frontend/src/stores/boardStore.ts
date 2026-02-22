import { create } from 'zustand';
import type { Viewport } from '../types';

interface BoardState {
  currentBoardId: string | null;
  viewport: Viewport;
  snapEnabled: boolean;
  connectMode: boolean;
  selectedCardId: string | null;

  setCurrentBoardId: (id: string | null) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
  toggleConnectMode: () => void;
  selectCard: (id: string | null) => void;
  clearSelection: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoardId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  snapEnabled: false,
  connectMode: false,
  selectedCardId: null,

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

  toggleConnectMode: () =>
    set((state) => ({ connectMode: !state.connectMode })),

  selectCard: (id) => set({ selectedCardId: id }),

  clearSelection: () => set({ selectedCardId: null }),
}));
