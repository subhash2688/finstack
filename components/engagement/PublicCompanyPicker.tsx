"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2, Building2 } from "lucide-react";

interface CompanyResult {
  ticker: string;
  name: string;
}

interface PublicCompanyPickerProps {
  /** Currently selected ticker */
  value: string;
  /** Called when user selects a company */
  onSelect: (ticker: string, companyName: string) => void;
}

export function PublicCompanyPicker({ value, onSelect }: PublicCompanyPickerProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/edgar/companies?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSelectedDisplay("");
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 200);
  };

  const handleSelect = (company: CompanyResult) => {
    setQuery(company.ticker);
    setSelectedDisplay(`${company.ticker} — ${company.name}`);
    setIsOpen(false);
    setResults([]);
    onSelect(company.ticker, company.name);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-2">Search Public Company</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={selectedDisplay || query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (query.length >= 1 && results.length > 0) setIsOpen(true); }}
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="Search by company name or ticker (e.g., DDOG, Datadog)"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((company) => (
            <button
              key={company.ticker}
              type="button"
              onClick={() => handleSelect(company)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors text-sm"
            >
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-primary">{company.ticker}</span>
                  <span className="text-muted-foreground truncate">{company.name}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 1 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground text-center">
            No companies found for &quot;{query}&quot;
          </p>
        </div>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        Search SEC-registered public companies to auto-fill financial data
      </p>
    </div>
  );
}
