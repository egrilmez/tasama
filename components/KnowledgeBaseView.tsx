"use client";

import { FileText, Plus, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/lib/store";

export default function KnowledgeBaseView() {
  const { files, uploadFiles, attachedFileIds, workspaces, activeWorkspaceId } =
    useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const ws = workspaces.find((w) => w.id === activeWorkspaceId);

  const visible = files.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-panel">
      <div className="max-w-[960px] mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[26px]">
              Knowledge Base
            </h1>
            <p className="text-muted mt-1">
              Documents available to chats in the {ws?.name ?? ""} workspace.
              {ws?.hasAriva &&
                " This workspace is connected to its own ARIVA assistant."}
            </p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-4 h-10 text-sm font-semibold hover:bg-primary-deep shrink-0"
          >
            <Plus size={15} /> Add files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xlsm,.txt,.md"
            onChange={(e) => {
              if (e.target.files?.length)
                uploadFiles(Array.from(e.target.files));
            }}
          />
        </div>

        <label className="flex items-center gap-2 bg-white border border-line rounded-xl px-4 h-11 text-sm text-muted mt-6 max-w-[420px]">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent outline-none w-full text-ink"
          />
        </label>

        {visible.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              uploadFiles(Array.from(e.dataTransfer.files));
            }}
            className="border-2 border-dashed border-primary/30 rounded-2xl mt-6 py-16 grid place-items-center text-center bg-white"
          >
            <Upload size={26} className="text-muted mb-2" />
            <div className="font-semibold">
              {query ? "No files match your search" : "No documents yet"}
            </div>
            <p className="text-sm text-muted mt-1">
              Drop files here or use “Add files”. PDF, Word, PowerPoint, Excel,
              TXT, MD.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {visible.map((f, i) => (
              <div
                key={f.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all anim-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="h-10 w-10 rounded-xl bg-lavender grid place-items-center">
                    <FileText size={17} className="text-primary" />
                  </span>
                  {attachedFileIds.includes(f.id) && (
                    <span className="text-[10px] font-bold bg-lavender text-primary rounded-full px-2 py-0.5">
                      In current chat
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold mt-3 truncate" title={f.name}>
                  {f.name}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {f.ext.toUpperCase()} · {f.size}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
