"use client";

import { useCallback, useRef } from "react";

interface UploadModalProps {
  onFileLoad: (data: ArrayBuffer) => void;
}

export default function UploadModal({ onFileLoad }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onFileLoad(reader.result);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoad]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".epub")) handleFile(file);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full mx-4 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <h1 className="text-2xl font-semibold mb-2">B-Reader</h1>
        <p className="text-zinc-400 mb-6">Upload an EPUB file to start reading</p>

        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-4 border-2 border-dashed border-zinc-600 rounded-lg text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          Click to select or drag & drop
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".epub"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
