import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, CheckSquare, Calendar, Users, ArrowRight } from 'lucide-react';
import { searchService, type SearchTask, type SearchEvent, type SearchUser } from '../../services/search.service';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

type SearchResultItem =
  | { type: 'task'; data: SearchTask }
  | { type: 'event'; data: SearchEvent }
  | { type: 'user'; data: SearchUser };

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search query
  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Flatten results for keyboard navigation
  const flatResults: SearchResultItem[] = [];
  if (results) {
    results.tasks.forEach((task) => flatResults.push({ type: 'task', data: task }));
    results.events.forEach((event) => flatResults.push({ type: 'event', data: event }));
    results.users.forEach((user) => flatResults.push({ type: 'user', data: user }));
  }

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      onClose();
      switch (item.type) {
        case 'task':
          navigate(`/tasks?taskId=${item.data.id}`);
          break;
        case 'event':
          navigate(`/calendar?eventId=${item.data.id}`);
          break;
        case 'user':
          navigate(`/users?userId=${item.data.id}`);
          break;
      }
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleSelect(flatResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  if (!isOpen) return null;

  const hasResults = flatResults.length > 0;
  const showEmptyState = debouncedQuery.length >= 2 && !isLoading && !hasResults;

  let currentIndex = 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative mx-auto mt-[10vh] max-w-2xl px-4">
        <div className="overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tareas, eventos, usuarios..."
              className="flex-1 border-0 bg-transparent px-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-2 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {/* Loading state */}
            {isLoading && debouncedQuery.length >= 2 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                <p className="mt-2 text-sm">Buscando...</p>
              </div>
            )}

            {/* Empty state - no query */}
            {!debouncedQuery && !isLoading && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm">Escribe para buscar...</p>
              </div>
            )}

            {/* Empty state - no results */}
            {showEmptyState && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm">
                  No se encontraron resultados para "{debouncedQuery}"
                </p>
              </div>
            )}

            {/* Results */}
            {hasResults && !isLoading && (
              <div className="py-2">
                {/* Tasks */}
                {results!.tasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                      <CheckSquare className="h-4 w-4" />
                      Tareas
                    </div>
                    {results!.tasks.map((task) => {
                      const index = currentIndex++;
                      return (
                        <button
                          key={task.id}
                          data-index={index}
                          onClick={() => handleSelect({ type: 'task', data: task })}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                            selectedIndex === index
                              ? 'bg-blue-50 text-blue-900'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <div
                            className={cn('h-2 w-2 rounded-full', priorityColors[task.priority])}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {highlightMatch(task.title, debouncedQuery)}
                            </p>
                            {task.description && (
                              <p className="truncate text-sm text-gray-500">
                                {highlightMatch(task.description.slice(0, 60), debouncedQuery)}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Events */}
                {results!.events.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Eventos
                    </div>
                    {results!.events.map((event) => {
                      const index = currentIndex++;
                      const date = new Date(event.startDatetime);
                      return (
                        <button
                          key={event.id}
                          data-index={index}
                          onClick={() => handleSelect({ type: 'event', data: event })}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                            selectedIndex === index
                              ? 'bg-blue-50 text-blue-900'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {highlightMatch(event.name, debouncedQuery)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {date.toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Users */}
                {results!.users.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                      <Users className="h-4 w-4" />
                      Usuarios
                    </div>
                    {results!.users.map((user) => {
                      const index = currentIndex++;
                      return (
                        <button
                          key={user.id}
                          data-index={index}
                          onClick={() => handleSelect({ type: 'user', data: user })}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                            selectedIndex === index
                              ? 'bg-blue-50 text-blue-900'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <Avatar
                            name={user.name}
                            profileImage={user.profileImage}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {highlightMatch(user.name, debouncedQuery)}
                            </p>
                            <p className="truncate text-sm text-gray-500">
                              {highlightMatch(user.email, debouncedQuery)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono">↑</kbd>
                  <kbd className="ml-1 rounded bg-gray-200 px-1.5 py-0.5 font-mono">↓</kbd>
                  <span className="ml-1">navegar</span>
                </span>
                <span>
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono">Enter</kbd>
                  <span className="ml-1">seleccionar</span>
                </span>
                <span>
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono">Esc</kbd>
                  <span className="ml-1">cerrar</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
