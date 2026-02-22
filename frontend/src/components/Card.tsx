import { useCallback, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useBoardStore } from '../stores/boardStore';
import { CardEditor } from './CardEditor';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onUpdate: (data: Partial<CardType> & { id: string }) => void;
  onDelete: (id: string) => void;
}

export function Card({ card, onUpdate, onDelete }: CardProps) {
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const selectCard = useBoardStore((s) => s.selectCard);
  const [isEditing, setIsEditing] = useState(false);

  const isSelected = selectedCardId === card.id;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
    disabled: isEditing,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        selectCard(card.id);
      }
    },
    [card.id, isEditing, selectCard]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
    },
    []
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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (card.content.trim() === '') {
          onDelete(card.id);
        } else if (window.confirm('Delete this card and its contents?')) {
          onDelete(card.id);
        }
      }
      if (e.key === 'Escape') {
        useBoardStore.getState().clearSelection();
      }
    },
    [card.id, card.content, isEditing, onDelete]
  );

  const style: React.CSSProperties = {
    left: `${card.x}%`,
    top: `${card.y}%`,
    width: `${card.width}%`,
    height: `${card.height}%`,
    backgroundColor: card.color,
    zIndex: card.z_index,
    ...(transform
      ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
      : {}),
  };

  return (
    <div
      ref={setNodeRef}
      className={`absolute rounded-lg shadow-md overflow-hidden cursor-default select-none
        ${isSelected ? 'ring-2 ring-amber-500' : ''}
        ${isEditing ? 'ring-2 ring-blue-400' : ''}
      `}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      {...listeners}
      {...attributes}
    >
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
    </div>
  );
}
