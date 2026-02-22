import { useCallback, useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../stores/boardStore';
import { useBoards, useCreateBoard, useDeleteBoard, useUpdateBoard } from '../hooks/useBoards';
import { useCreateCard } from '../hooks/useCards';

export function Toolbar() {
  const { data: boards } = useBoards();
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const setCurrentBoardId = useBoardStore((s) => s.setCurrentBoardId);
  const connectMode = useBoardStore((s) => s.connectMode);

  const createCard = useCreateCard(currentBoardId ?? '');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const currentBoard = boards?.find((b) => b.id === currentBoardId);

  const handleSwitchBoard = useCallback(
    (id: string) => {
      setCurrentBoardId(id);
      setIsDropdownOpen(false);
    },
    [setCurrentBoardId]
  );

  const handleCreateBoard = useCallback(() => {
    const name = prompt('Board name:');
    if (name?.trim()) {
      createBoard.mutate(
        { name: name.trim() },
        { onSuccess: (board) => setCurrentBoardId(board.id) }
      );
    }
    setIsDropdownOpen(false);
  }, [createBoard, setCurrentBoardId]);

  const handleStartRename = useCallback(() => {
    if (currentBoard) {
      setRenameValue(currentBoard.name);
      setIsRenaming(true);
    }
  }, [currentBoard]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleFinishRename = useCallback(() => {
    if (currentBoardId && renameValue.trim()) {
      updateBoard.mutate({ id: currentBoardId, name: renameValue.trim() });
    }
    setIsRenaming(false);
  }, [currentBoardId, renameValue, updateBoard]);

  const handleDeleteBoard = useCallback(() => {
    if (!currentBoardId || !boards) return;
    if (!window.confirm('Delete this board and all its cards and connections?')) return;

    deleteBoard.mutate(currentBoardId, {
      onSuccess: () => {
        const remaining = boards.filter((b) => b.id !== currentBoardId);
        if (remaining.length > 0) {
          setCurrentBoardId(remaining[0].id);
        } else {
          setCurrentBoardId(null);
        }
      },
    });
  }, [currentBoardId, boards, deleteBoard, setCurrentBoardId]);

  const handleAddCard = useCallback(() => {
    if (!currentBoardId) return;
    createCard.mutate({ x: 40, y: 40 });
  }, [currentBoardId, createCard]);

  return (
    <div className="h-12 bg-amber-100 border-b border-amber-200 flex items-center px-4 gap-3 shrink-0">
      {/* Board name / switcher */}
      <div className="relative">
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleFinishRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="px-2 py-1 text-sm font-semibold text-amber-900 bg-white border border-amber-300 rounded"
          />
        ) : (
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onDoubleClick={handleStartRename}
            className="px-2 py-1 text-sm font-semibold text-amber-900 hover:bg-amber-200 rounded flex items-center gap-1"
          >
            {currentBoard?.name ?? 'Select Board'}
            <span className="text-xs">&#9660;</span>
          </button>
        )}

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-amber-200 rounded shadow-lg z-50 min-w-48">
            {boards?.map((board) => (
              <button
                key={board.id}
                onClick={() => handleSwitchBoard(board.id)}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-amber-50
                  ${board.id === currentBoardId ? 'bg-amber-100 font-medium' : ''}
                `}
              >
                {board.name}
              </button>
            ))}
            <hr className="border-amber-200" />
            <button
              onClick={handleCreateBoard}
              className="block w-full text-left px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
            >
              + New Board
            </button>
          </div>
        )}
      </div>

      <div className="h-6 w-px bg-amber-300" />

      {/* Add Card */}
      <button
        onClick={handleAddCard}
        className="px-3 py-1 text-sm text-amber-800 hover:bg-amber-200 rounded"
      >
        + Add Card
      </button>

      <div className="h-6 w-px bg-amber-300" />

      {/* Connect Mode Toggle */}
      <button
        onClick={() => useBoardStore.getState().toggleConnectMode()}
        className={`px-3 py-1 text-sm rounded ${
          connectMode
            ? 'bg-amber-600 text-white'
            : 'text-amber-800 hover:bg-amber-200'
        }`}
        title="Toggle connect mode (C)"
      >
        Connect
      </button>

      <div className="flex-1" />

      {/* Delete Board */}
      <button
        onClick={handleDeleteBoard}
        className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
        title="Delete board"
      >
        Delete Board
      </button>
    </div>
  );
}
