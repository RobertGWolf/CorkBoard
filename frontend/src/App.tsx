import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Board } from './components/Board';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen flex flex-col">
        <Board />
      </div>
    </QueryClientProvider>
  );
}

export default App;
