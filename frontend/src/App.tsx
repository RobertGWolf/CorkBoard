import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Board } from './components/Board';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { useBoards, useCreateBoard } from './hooks/useBoards';
import { useBoardStore } from './stores/boardStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const LAST_BOARD_KEY = 'corkboard_last_board_id';

function AppContent() {
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const setCurrentBoardId = useBoardStore((s) => s.setCurrentBoardId);

  useEffect(() => {
    if (isLoading || !boards) return;

    if (currentBoardId) return;

    // Try to restore last used board
    const lastId = localStorage.getItem(LAST_BOARD_KEY);
    if (lastId && boards.some((b) => b.id === lastId)) {
      setCurrentBoardId(lastId);
      return;
    }

    // Use first board or create one
    if (boards.length > 0) {
      setCurrentBoardId(boards[0].id);
    } else {
      createBoard.mutate(
        { name: 'My Board' },
        {
          onSuccess: (board) => setCurrentBoardId(board.id),
        }
      );
    }
  }, [boards, isLoading, currentBoardId, setCurrentBoardId, createBoard]);

  // Persist last board ID
  useEffect(() => {
    if (currentBoardId) {
      localStorage.setItem(LAST_BOARD_KEY, currentBoardId);
    }
  }, [currentBoardId]);

  if (isLoading || !currentBoardId) {
    return (
      <div className="h-screen w-screen bg-amber-50 flex items-center justify-center">
        <p className="text-amber-800 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <Toolbar />
      <Board />
      <StatusBar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
