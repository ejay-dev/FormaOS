'use client';

/**
 * =========================================================
 * Advanced Search Component
 * =========================================================
 * Full-text search with filters and autocomplete
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, FileText, Users, Award, File } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'task' | 'member' | 'certificate' | 'evidence';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  relevance: number;
  created_at?: string;
}

interface AdvancedSearchProps {
  orgId: string;
  onResultClick?: (result: SearchResult) => void;
}

export default function AdvancedSearch({
  orgId,
  onResultClick,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as string[],
    status: [] as string[],
    dateFrom: '',
    dateTo: '',
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      await performSearch();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, filters]);

  // Get suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?orgId=${orgId}&query=${query}`,
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeout);
  }, [query, orgId]);

  const performSearch = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        orgId,
        query,
        ...filters,
      });

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      setResults(data.results || []);

      // Save to search history
      if (data.results?.length > 0) {
        await fetch('/api/search/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            resultsCount: data.results.length,
          }),
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
  };

  const toggleFilter = (type: 'types' | 'status', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'member':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'certificate':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'evidence':
        return <File className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, members, certificates..."
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 hover:bg-gray-100 rounded ${
              showFilters ? 'bg-gray-100' : ''
            }`}
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            {/* Type filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types
              </label>
              <div className="space-y-1">
                {['task', 'member', 'certificate', 'evidence'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.types.includes(type)}
                      onChange={() => toggleFilter('types', type)}
                      className="mr-2"
                    />
                    <span className="capitalize text-sm">{type}s</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                className="w-full mb-2 px-3 py-1 border rounded text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                className="w-full px-3 py-1 border rounded text-sm"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && query && !results.length && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 text-xs text-gray-500 font-medium">
            Suggestions
          </div>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setQuery(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
            >
              {highlightMatch(suggestion, query)}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {query && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 font-medium flex items-center justify-between">
            <span>{results.length} results</span>
            {loading && <span className="text-blue-500">Loading...</span>}
          </div>
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => onResultClick?.(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-t border-gray-100"
            >
              <div className="flex items-start gap-3">
                {getResultIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {highlightMatch(result.title, query)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">
                      {result.type}
                    </span>
                  </div>
                  {result.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {highlightMatch(result.description, query)}
                    </p>
                  )}
                  {result.metadata && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {result.metadata.status && (
                        <span className="capitalize">
                          {result.metadata.status}
                        </span>
                      )}
                      {result.created_at && (
                        <span>
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(result.relevance * 100)}%
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {query && !loading && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
