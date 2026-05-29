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
        className="flex items-center gap-2 bg-foreground text-background px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg"
      >
        <FileUp className="h-4 w-4" />
        Upload Artifact
      </button>
      <UploadArtifactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
