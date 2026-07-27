"use client";

import { X, Upload, Search, Plus, FileText, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/lib/store";

export default function AttachModal() {
  const {
    attachModalOpen,
    setAttachModalOpen,
    files,
    attachedFileIds,
    attachFile,
    uploadFiles,
  } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  if (!attachModalOpen) return null;
  const visible = files.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 grid place-items-center p-6"
      onClick={() => setAttachModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[880px] max-h-[85vh] overflow-y-auto anim-rise"
      >
        <div className="relative text-center pt-7 pb-2 px-8">
          <h2 className="font-display font-bold text-[22px]">
            Attach Files to Chat
          </h2>
          <p className="text-sm text-muted mt-1">
            Upload new files or select from existing files in this workspace.
          </p>
          <button
            onClick={() => setAttachModalOpen(false)}
            className="absolute right-5 top-5 text-muted hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-8 pb-8">
          <div className="text-sm font-bold mb-2">Upload New Files</div>
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              uploadFiles(Array.from(e.dataTransfer.files));
              setAttachModalOpen(false);
            }}
            className="w-full border-2 border-dashed border-primary/30 rounded-2xl py-12 grid place-items-center gap-1 hover:border-primary/60 transition-colors"
          >
            <Upload size={30} className="text-ink mb-1" />
            <div className="font-display font-semibold text-[17px]">
              Drop files here or click to upload
            </div>
            <div className="text-sm text-muted">
              Maximum 5 files, up to 50 MB each
            </div>
            <span className="mt-3 bg-primary text-white text-sm font-semibold rounded-lg px-4 py-2">
              Choose Files
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xlsm,.txt,.md"
            onChange={(e) => {
              if (e.target.files?.length) {
                uploadFiles(Array.from(e.target.files));
                setAttachModalOpen(false);
              }
            }}
          />
          <p className="text-xs text-muted mt-2">
            Supported formats for chat: PDF, Word, PowerPoint, Excel (.xlsx,
            .xlsm), TXT, MD
          </p>

          <div className="text-sm font-bold mt-7 mb-2">
            Select from Existing Files
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 border border-line rounded-lg px-3 h-10 text-sm text-muted flex-1">
              <Search size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files..."
                className="bg-transparent outline-none w-full text-ink"
              />
            </label>
            <button className="flex items-center gap-1.5 border border-line rounded-lg px-3 h-10 text-sm text-muted">
              All Types <ChevronDown size={13} />
            </button>
            <button className="flex items-center gap-1.5 border border-line rounded-lg px-3 h-10 text-sm text-muted">
              All <ChevronDown size={13} />
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-4 h-10 text-sm font-semibold hover:bg-primary-deep"
            >
              <Plus size={15} /> Add New Files
            </button>
          </div>

          <div className="border border-line rounded-xl mt-4 min-h-[160px]">
            {visible.length === 0 ? (
              <div className="grid place-items-center py-12 text-center">
                <span className="h-14 w-14 rounded-full bg-lavender grid place-items-center mb-2">
                  <FileText size={22} className="text-primary" />
                </span>
                <div className="font-semibold">No files found</div>
              </div>
            ) : (
              visible.map((f) => {
                const attached = attachedFileIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      attachFile(f.id);
                      setAttachModalOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-panel text-left"
                  >
                    <span className="h-9 w-9 rounded-lg bg-lavender grid place-items-center">
                      <FileText size={16} className="text-primary" />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{f.name}</div>
                      <div className="text-xs text-muted">
                        {f.ext.toUpperCase()} · {f.size}
                      </div>
                    </div>
                    {attached && (
                      <span className="text-xs font-semibold text-primary">
                        Attached
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
