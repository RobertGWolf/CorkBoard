import { useCallback, useRef } from 'react';
import { useBoardStore } from '../stores/boardStore';

const BOARD_SIZE = 3000;

export function Board() {
  const viewport = useBoardStore((s) => s.viewport);
  const setViewport = useBoardStore((s) => s.setViewport);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only pan on direct clicks on the board background (not on cards)
      if (e.target !== e.currentTarget) return;
      if (e.button !== 0) return;

      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      viewportStart.current = { x: viewport.x, y: viewport.y };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [viewport.x, viewport.y]
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

      // Cursor position relative to container
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const oldZoom = viewport.zoom;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(2.0, oldZoom + delta));

      if (newZoom === oldZoom) return;

      // Adjust viewport to keep cursor position stable
      const scale = newZoom / oldZoom;
      const newX = cursorX - scale * (cursorX - viewport.x);
      const newY = cursorY - scale * (cursorY - viewport.y);

      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport.x, viewport.y, viewport.zoom, setViewport]
  );

  return (
    <div
      className="w-full h-full overflow-hidden relative bg-amber-50"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning.current ? 'grabbing' : 'default' }}
    >
      <div
        className="absolute origin-top-left"
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* Board content (cards, connections) will be rendered here */}
      </div>
    </div>
  );
}
