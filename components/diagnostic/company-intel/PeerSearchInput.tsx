"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface CompanySearchResult {
  ticker: string;
  name: string;
}

interface PeerSearchInputProps {
  onSelect: (result: CompanySearchResult) => void;
  excludeTickers: string[];
  disabled?: boolean;
  loading?: boolean;
  maxPeers?: number;
  currentCount?: number;
}

export function PeerSearchInput({
  onSelect,
  excludeTickers,
  disabled = false,
  loading = false,
  maxPeers = 5,
  currentCount = 0,
}: PeerSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/edgar/companies?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data: CompanySearchResult[] = await res.json();
          const excluded = new Set(excludeTickers.map((t) => t.toUpperCase()));
          const filtered = data.filter((r) => !excluded.has(r.ticker.toUpperCase()));
          setResults(filtered.slice(0, 8));
          setShowDropdown(filtered.length > 0);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    },
    [excludeTickers]
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: CompanySearchResult) => {
    setShowDropdown(false);
    setQuery("");
    setResults([]);
    onSelect(result);
  };

  if (currentCount >= maxPeers) {
    return (
      <p className="text-[10px] text-muted-foreground">
        Maximum {maxPeers} custom peers reached.
      </p>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Add peer by ticker or name..."
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            className="h-8 text-xs pr-8"
            disabled={disabled || loading}
          />
          {(isSearching || loading) && (
            <Loader2 className="h-3.5 w-3.5 absolute right-2.5 top-2 animate-spin text-muted-foreground" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {currentCount}/{maxPeers}
        </span>
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-6 right-0 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.ticker}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center gap-2 border-b last:border-b-0"
              onClick={() => handleSelect(result)}
            >
              <span className="font-semibold text-primary w-12">{result.ticker}</span>
              <span className="text-muted-foreground truncate">{result.name}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1.5">
        Add up to {maxPeers} public companies for comparison. Data from SEC EDGAR.
      </p>
    </div>
  );
}
