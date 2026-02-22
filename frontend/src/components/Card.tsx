import { useCallback, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useBoardStore } from '../stores/boardStore';
import { CardEditor } from './CardEditor';
import { ColorPicker } from './ColorPicker';
import { ResizeHandle } from './ResizeHandle';
import { useResize } from '../hooks/useResize';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onUpdate: (data: Partial<CardType> & { id: string }) => void;
  onDelete: (id: string) => void;
  connectMode?: boolean;
  isConnectSource?: boolean;
  onConnectClick?: (cardId: string) => void;
}

export function Card({
  card,
  onUpdate,
  onDelete,
  connectMode = false,
  isConnectSource = false,
  onConnectClick,
}: CardProps) {
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const selectCard = useBoardStore((s) => s.selectCard);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isSelected = selectedCardId === card.id;

  const { handleResizeStart, isResizing, displayWidth, displayHeight } = useResize({
    card,
    onResizeEnd: onUpdate,
  });

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
    disabled: isEditing || isResizing || connectMode,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (connectMode && onConnectClick) {
        onConnectClick(card.id);
        return;
      }

      if (!isEditing) {
        selectCard(card.id);
      }
    },
    [card.id, isEditing, selectCard, connectMode, onConnectClick]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (connectMode) return;
      setIsEditing(true);
    },
    [connectMode]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (connectMode) return;
      setShowColorPicker(true);
    },
    [connectMode]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      onUpdate({ id: card.id, color });
    },
    [card.id, onUpdate]
  );

  const handleSave = useCallback(
    (content: string) => {
      setIsEditing(false);
      if (content !== card.content) {
        onUpdate({ id: card.id, content });
      }
    },
    [card.id, card.content, onUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) return;
      if (connectMode) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (card.content.trim() === '') {
          onDelete(card.id);
        } else if (window.confirm('Delete this card and its contents?')) {
          onDelete(card.id);
        }
      }
      if (e.key === 'Escape') {
        setShowColorPicker(false);
        useBoardStore.getState().clearSelection();
      }
    },
    [card.id, card.content, isEditing, connectMode, onDelete]
  );

  const style: React.CSSProperties = {
    left: `${card.x}%`,
    top: `${card.y}%`,
    width: `${displayWidth}%`,
    height: `${displayHeight}%`,
    backgroundColor: card.color,
    zIndex: card.z_index,
    ...(transform
      ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
      : {}),
  };

  const showResizeHandle = (isSelected || isHovered) && !isEditing && !connectMode;

  // Visual ring: connect source highlight (green) > editing (blue) > selected (amber)
  let ringClass = '';
  if (isConnectSource) {
    ringClass = 'ring-2 ring-green-500 ring-offset-1';
  } else if (isEditing) {
    ringClass = 'ring-2 ring-blue-400';
  } else if (isSelected && !connectMode) {
    ringClass = 'ring-2 ring-amber-500';
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute rounded-lg shadow-md select-none ${ringClass} ${
        connectMode ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      {...(connectMode ? {} : listeners)}
      {...(connectMode ? {} : attributes)}
    >
      {/* Color indicator — visible on hover/selected, hidden in connect mode */}
      {(isSelected || isHovered) && !isEditing && !connectMode && (
        <div className="absolute top-1 right-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform"
            style={{ backgroundColor: card.color }}
            title="Change color"
          />
          {showColorPicker && (
            <ColorPicker
              currentColor={card.color}
              onColorChange={handleColorChange}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>
      )}
      {isEditing ? (
        <CardEditor
          content={card.content}
          onSave={handleSave}
        />
      ) : (
        <div className="p-2 text-sm text-gray-800 whitespace-pre-wrap overflow-auto h-full">
          {card.content || (
            <span className="text-gray-400 italic">Double-click to edit</span>
          )}
        </div>
      )}
      {showResizeHandle && <ResizeHandle onResizeStart={handleResizeStart} />}
    </div>
  );
}
