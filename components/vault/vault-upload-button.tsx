"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { UploadArtifactModal } from "@/components/vault/upload-artifact-modal";

export function VaultUploadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.35)]"
      >
        <FileUp className="h-4 w-4" />
        Upload Artifact
      </button>
      <UploadArtifactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
