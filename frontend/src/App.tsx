import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      <div className="h-screen w-screen bg-amber-50 flex items-center justify-center">
        <p className="text-amber-800 text-lg">CorkBoard — loading...</p>
      </div>
    </QueryClientProvider>
  );
}

export default App;
