import { useCallback, useMemo, useState } from 'react';
import { ConnectionLine } from './ConnectionLine';
import { ColorPicker } from './ColorPicker';
import { useBoardStore } from '../stores/boardStore';
import type { Card, Connection } from '../types';

interface ConnectionLayerProps {
  cards: Card[];
  connections: Connection[];
  onDeleteConnection: (id: string) => void;
  onUpdateConnection: (id: string, color: string) => void;
}

export function ConnectionLayer({
  cards,
  connections,
  onDeleteConnection,
  onUpdateConnection,
}: ConnectionLayerProps) {
  const selectedConnectionId = useBoardStore((s) => s.selectedConnectionId);
  const selectConnection = useBoardStore((s) => s.selectConnection);

  const [colorPicker, setColorPicker] = useState<{
    connectionId: string;
    x: number;
    y: number;
  } | null>(null);

  const cardMap = useMemo(() => {
    const map = new Map<string, Card>();
    for (const card of cards) {
      map.set(card.id, card);
    }
    return map;
  }, [cards]);

  const handleSelect = useCallback(
    (id: string) => {
      selectConnection(id);
    },
    [selectConnection]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, connectionId: string) => {
      selectConnection(connectionId);
      setColorPicker({ connectionId, x: e.clientX, y: e.clientY });
    },
    [selectConnection]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (colorPicker) {
        onUpdateConnection(colorPicker.connectionId, color);
      }
      setColorPicker(null);
    },
    [colorPicker, onUpdateConnection]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedConnectionId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteConnection(selectedConnectionId);
      }
    },
    [selectedConnectionId, onDeleteConnection]
  );

  return (
    <>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: 'none', zIndex: 0 }}
        onKeyDown={handleKeyDown}
      >
        <g style={{ pointerEvents: 'auto' }}>
          {connections.map((conn) => {
            const fromCard = cardMap.get(conn.from_card_id);
            const toCard = cardMap.get(conn.to_card_id);
            if (!fromCard || !toCard) return null;

            return (
              <ConnectionLine
                key={conn.id}
                connection={conn}
                fromCard={fromCard}
                toCard={toCard}
                isSelected={selectedConnectionId === conn.id}
                onSelect={handleSelect}
                onContextMenu={handleContextMenu}
              />
            );
          })}
        </g>
      </svg>

      {/* Color picker portal — rendered outside SVG */}
      {colorPicker && (
        <div
          className="fixed z-50"
          style={{ left: colorPicker.x, top: colorPicker.y }}
        >
          <ColorPicker
            currentColor={
              connections.find((c) => c.id === colorPicker.connectionId)?.color ?? '#92400E'
            }
            onColorChange={handleColorChange}
            onClose={() => setColorPicker(null)}
          />
        </div>
      )}
    </>
  );
}
