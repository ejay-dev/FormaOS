"use client"

import { useState, useEffect, useRef } from "react"
import { Search, FileText, CheckSquare, Loader2, Lock, X } from "lucide-react"
import Link from "next/link"

export function TopbarSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; title: string; type: 'policy' | 'task' | 'evidence' }[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const searchData = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=3`, {
          method: 'GET',
          signal: controller.signal,
        })
        if (!res.ok) {
          setResults([])
          setLoading(false)
          setIsOpen(false)
          return
        }
        const json = await res.json()
        const combined = (json?.results ?? []) as { id: string; title: string; type: 'policy' | 'task' | 'evidence' }[]
        setResults(combined)
        setLoading(false)
        setIsOpen(true)
      } catch {
        setResults([])
        setLoading(false)
        setIsOpen(false)
      }
    }

    const timer = setTimeout(searchData, 300)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="relative w-full max-w-md hidden md:block" ref={wrapperRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted group-focus-within:text-card-foreground transition-colors" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          placeholder="Search policies, tasks..."
          className="w-full rounded-full border border-card-foreground/8 bg-card/8 py-2 pl-10 pr-10 text-sm text-card-foreground outline-none focus:border-card-foreground/20 focus:bg-card/90 focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-muted"
        />
        {loading ? (
           <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        ) : query.length > 0 ? (
           <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
             <X className="h-4 w-4 text-muted hover:text-card-foreground" />
           </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute mt-2 w-full rounded-2xl border border-card-foreground/8 bg-card p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Results
          </div>
          {results.map((result) => (
            <Link
              key={result.id}
              href={
                result.type === 'policy'
                  ? `/app/policies/${result.id}`
                  : result.type === 'task'
                    ? `/app/tasks`
                    : `/app/vault`
              }
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-card/8 transition-colors group"
            >
              {result.type === 'policy' ? (
                <div className="h-8 w-8 rounded-lg bg-card/8 text-sky-200 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                </div>
              ) : result.type === 'task' ? (
                <div className="h-8 w-8 rounded-lg bg-card/8 text-emerald-200 flex items-center justify-center">
                    <CheckSquare className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-card/8 text-purple-200 flex items-center justify-center">
                    <Lock className="h-4 w-4" />
                </div>
              )}
              <div className="flex-1 truncate">
                 <span className="font-medium text-card-foreground block truncate">{result.title}</span>
                 <span className="text-[10px] text-muted capitalize">{result.type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
