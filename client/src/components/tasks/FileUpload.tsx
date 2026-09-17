import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Upload, X, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import type { Attachment } from '@/types';

export interface FileUploadHandle {
  uploadAll: () => Promise<Attachment[]>;
  hasPendingFiles: () => boolean;
}

interface FileUploadProps {
  accept?: string;
  maxFiles?: number;
}

interface FileEntry {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  attachment?: Attachment;
}

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(
  function FileUpload({ accept = '*/*', maxFiles = 5 }, ref) {
    const [entries, setEntries] = useState<FileEntry[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback(
      (newFiles: FileList | null) => {
        if (!newFiles) return;
        const remaining = maxFiles - entries.length;
        const added = Array.from(newFiles).slice(0, remaining);
        const newEntries = added.map((file) => ({ file, status: 'pending' as const }));
        setEntries((prev) => [...prev, ...newEntries]);
      },
      [entries.length, maxFiles]
    );

    const removeFile = useCallback((index: number) => {
      setEntries((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
      },
      [addFiles]
    );

    const uploadAll = useCallback(async (): Promise<Attachment[]> => {
      const pendingIndices = entries
        .map((e, i) => (e.status === 'pending' ? i : -1))
        .filter((i) => i !== -1);

      if (pendingIndices.length === 0) {
        return entries
          .filter((e) => e.status === 'done' && e.attachment)
          .map((e) => e.attachment!);
      }

      setEntries((prev) =>
        prev.map((e, i) =>
          pendingIndices.includes(i) ? { ...e, status: 'uploading' as const } : e
        )
      );

      const results = await Promise.allSettled(
        pendingIndices.map(async (idx) => {
          const formData = new FormData();
          formData.append('file', entries[idx].file);
          const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { idx, attachment: res.data.data.file as Attachment };
        })
      );

      const newAttachments: Attachment[] = [];
      setEntries((prev) =>
        prev.map((e, i) => {
          const result = results.find(
            (r) => r.status === 'fulfilled' && r.value.idx === i
          );
          if (result && result.status === 'fulfilled') {
            newAttachments.push(result.value.attachment);
            return { ...e, status: 'done' as const, attachment: result.value.attachment };
          }
          return { ...e, status: 'error' as const };
        })
      );

      const prevAttachments = entries
        .filter((e) => e.status === 'done' && e.attachment)
        .map((e) => e.attachment!);

      return [...prevAttachments, ...newAttachments];
    }, [entries]);

    const hasPending = useCallback(() => entries.some((e) => e.status === 'pending'), [entries]);

    useImperativeHandle(ref, () => ({ uploadAll, hasPendingFiles: hasPending }), [uploadAll, hasPending]);

    return (
      <div className="space-y-2">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-6 cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files (images, PDFs, docs)
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />

        {entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
              >
                {entry.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
                ) : entry.status === 'done' ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : entry.status === 'error' ? (
                  <X className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm truncate flex-1">{entry.file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(entry.file.size / 1024).toFixed(1)} KB
                </span>
                {entry.status === 'pending' && (
                  <button
                    onClick={() => removeFile(i)}
                    className="shrink-0 p-1 hover:bg-accent rounded-md"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
