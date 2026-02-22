import { useCallback } from 'react';
import { useBoardStore } from '../stores/boardStore';
import { useBoardData } from '../hooks/useCards';

export function StatusBar() {
  const viewport = useBoardStore((s) => s.viewport);
  const setZoom = useBoardStore((s) => s.setZoom);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const { data: boardData } = useBoardData(currentBoardId);

  const cardCount = boardData?.cards.length ?? 0;
  const zoomPercent = Math.round(viewport.zoom * 100);

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoom(parseFloat(e.target.value));
    },
    [setZoom]
  );

  const handleZoomIn = useCallback(() => {
    setZoom(viewport.zoom + 0.1);
  }, [viewport.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(viewport.zoom - 0.1);
  }, [viewport.zoom, setZoom]);

  return (
    <div className="h-8 bg-amber-100 border-t border-amber-200 flex items-center px-4 gap-3 shrink-0 text-xs text-amber-800">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <span className="text-amber-700">Zoom:</span>
        <button
          onClick={handleZoomOut}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-amber-200"
          title="Zoom out (-)"
        >
          -
        </button>
        <input
          type="range"
          min={0.25}
          max={2.0}
          step={0.05}
          value={viewport.zoom}
          onChange={handleZoomChange}
          className="w-24 h-1 accent-amber-600"
        />
        <button
          onClick={handleZoomIn}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-amber-200"
          title="Zoom in (+)"
        >
          +
        </button>
        <span className="w-10 text-right font-mono">{zoomPercent}%</span>
      </div>

      <div className="flex-1" />

      {/* Card count */}
      <span>Cards: {cardCount}</span>
    </div>
  );
}
