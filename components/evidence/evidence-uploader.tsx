'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type ControlSuggestion = {
  controlId: string;
  code: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
};

type UploadFile = {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'mapping' | 'done' | 'error';
  progress: number;
  suggestions: ControlSuggestion[];
  selectedControls: string[];
  duplicate?: { id: string; title: string };
  error?: string;
};

export function EvidenceUploader({ orgId }: { orgId: string }) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      suggestions: [],
      selectedControls: [],
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Start processing each file
    for (const f of newFiles) {
      processFile(f.id);
    }
  };

  const processFile = async (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading', progress: 30 } : f,
      ),
    );

    const file = files.find((f) => f.id === fileId)?.file;
    if (!file) return;

    try {
      // Check for duplicates
      const hashBuffer = await file.arrayBuffer();
      const hashArray = new Uint8Array(
        await crypto.subtle.digest('SHA-256', hashBuffer),
      );
      const fileHash = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 60, status: 'mapping' } : f,
        ),
      );

      // Get control mapping suggestions
      const suggestRes = await fetch('/api/v1/evidence/suggest-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileHash }),
      });

      let suggestions: ControlSuggestion[] = [];
      if (suggestRes.ok) {
        const data = await suggestRes.json();
        suggestions = data.suggestions ?? [];
      }

      const highConfidence = suggestions
        .filter((s) => s.confidence === 'high')
        .map((s) => s.controlId);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'done',
                progress: 100,
                suggestions,
                selectedControls: highConfidence,
              }
            : f,
        ),
      );
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'error', error: 'Processing failed' }
            : f,
        ),
      );
    }
  };

  const toggleControl = (fileId: string, controlId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const selected = f.selectedControls.includes(controlId)
          ? f.selectedControls.filter((id) => id !== controlId)
          : [...f.selectedControls, controlId];
        return { ...f, selectedControls: selected };
      }),
    );
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const confidenceColor = {
    high: 'border-green-500/30 bg-green-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-gray-500/30 bg-gray-500/5',
  };

  return (
    <div className="space-y-4" data-testid="evidence-uploader">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, images, spreadsheets
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.gif"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.map((f) => (
        <div key={f.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{f.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(f.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => removeFile(f.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          {(f.status === 'uploading' || f.status === 'mapping') && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${f.progress}%` }}
                />
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {f.status === 'uploading'
                  ? 'Processing…'
                  : 'Analyzing control mappings…'}
              </p>
            </div>
          )}

          {/* Duplicate warning */}
          {f.duplicate && (
            <div className="mt-3 flex items-center gap-2 rounded bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Duplicate detected: {f.duplicate.title}
            </div>
          )}

          {/* Control mapping suggestions */}
          {f.status === 'done' && f.suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Suggested Control Mappings
              </p>
              {f.suggestions.map((s) => (
                <button
                  key={s.controlId}
                  onClick={() => toggleControl(f.id, s.controlId)}
                  className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-xs transition-colors ${
                    f.selectedControls.includes(s.controlId)
                      ? 'border-primary bg-primary/10'
                      : confidenceColor[s.confidence]
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded border ${
                      f.selectedControls.includes(s.controlId)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    } flex items-center justify-center`}
                  >
                    {f.selectedControls.includes(s.controlId) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="font-mono">{s.code}</span>
                  <span className="flex-1">{s.title}</span>
                  <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">
                    {s.confidence}
                  </span>
                </button>
              ))}
            </div>
          )}

          {f.status === 'done' && f.suggestions.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              No control mapping suggestions. You can map manually after upload.
            </p>
          )}

          {f.error && <p className="mt-3 text-xs text-red-400">{f.error}</p>}
        </div>
      ))}
    </div>
  );
}
