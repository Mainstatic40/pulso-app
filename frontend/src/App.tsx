import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-white">
          <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900">
              PULSO
            </h1>
            <p className="mt-2 text-gray-500">
              Sistema de Gestión de Horas y Tareas
            </p>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
