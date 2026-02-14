"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Loader2 } from "lucide-react";

export interface PendingTranscript {
  fileName: string;
  content: string;
}

interface TranscriptUploadPanelProps {
  transcripts: PendingTranscript[];
  onTranscriptsChange: (transcripts: PendingTranscript[]) => void;
  /** If true, shows the analyze button and handles analysis */
  showAnalyze?: boolean;
  analyzing?: boolean;
  onAnalyze?: () => void;
  description?: string;
}

export function TranscriptUploadPanel({
  transcripts,
  onTranscriptsChange,
  showAnalyze = false,
  analyzing = false,
  onAnalyze,
  description,
}: TranscriptUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const readFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newTranscripts: PendingTranscript[] = [];

    for (const file of fileArray) {
      // Only accept text-based files
      if (
        !file.type.startsWith("text/") &&
        !file.name.endsWith(".txt") &&
        !file.name.endsWith(".md") &&
        !file.name.endsWith(".csv") &&
        !file.name.endsWith(".vtt") &&
        !file.name.endsWith(".srt")
      ) {
        continue;
      }

      // Skip duplicates
      if (transcripts.some((t) => t.fileName === file.name)) {
        continue;
      }

      try {
        const content = await file.text();
        newTranscripts.push({ fileName: file.name, content });
      } catch {
        console.error(`Failed to read file: ${file.name}`);
      }
    }

    if (newTranscripts.length > 0) {
      onTranscriptsChange([...transcripts, ...newTranscripts]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      readFiles(e.target.files);
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      readFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeTranscript = (fileName: string) => {
    onTranscriptsChange(transcripts.filter((t) => t.fileName !== fileName));
  };

  return (
    <div className="space-y-3">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30"
        }`}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">
          Drop transcript files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports .txt, .md, .csv, .vtt, .srt files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.vtt,.srt,text/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File chips */}
      {transcripts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transcripts.map((t) => (
            <Badge
              key={t.fileName}
              variant="secondary"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="max-w-[200px] truncate">{t.fileName}</span>
              <span className="text-xs text-muted-foreground">
                ({Math.round(t.content.length / 1000)}K chars)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTranscript(t.fileName);
                }}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Analyze button */}
      {showAnalyze && transcripts.length > 0 && onAnalyze && (
        <Button
          onClick={onAnalyze}
          disabled={analyzing}
          size="sm"
          className="w-full"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing {transcripts.length} transcript{transcripts.length > 1 ? "s" : ""}...
            </>
          ) : (
            <>
              Analyze {transcripts.length} Transcript{transcripts.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
