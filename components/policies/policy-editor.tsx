'use client';

import { useState, useEffect } from 'react';
import { updatePolicyContent, publishPolicy } from '@/app/app/policies/actions';
import { Loader2, ArrowLeft, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function PolicyEditor({
  policy,
}: {
  policy: {
    id: string;
    content: string | null;
    title: string;
    version: string;
    status: string;
  };
}) {
  const [content, setContent] = useState(policy.content || '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  // Auto-save logic (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content !== policy.content) {
        setSaving(true);
        await updatePolicyContent(policy.id, content);
        setSaving(false);
      }
    }, 2000); // Save 2 seconds after stopping typing

    return () => clearTimeout(timer);
  }, [content, policy.id, policy.content]);

  // Audit 2026-05-23 (Sprint 5a): publish gate is now AlertDialog. Browser
  // confirm() had no focus trap, no audit-log-recorded context, and
  // looked broken on mobile.
  const handlePublish = async () => {
    setPublishing(true);
    await publishPolicy(policy.id);
    setPublishing(false);
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-glass-strong backdrop-blur-md border-b border-glass-border pb-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-glass-strong rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {policy.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>{policy.version}</span>
              <span>•</span>
              <span className="capitalize">{policy.status}</span>
              <span>•</span>
              <span>{saving ? 'Saving...' : 'Saved'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2 hidden sm:inline-block">
            Markdown Supported
          </span>
          {policy.status !== 'published' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={publishing}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-colors"
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Publish
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish policy?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="block text-slate-300">{policy.title}</span>
                    <span className="mt-2 block">
                      Publishing makes this policy live for every employee
                      in the organisation. The current version
                      ({policy.version}) becomes the active one.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={publishing}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePublish}
                    disabled={publishing}
                  >
                    Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* The Writing Area */}
      <div className="min-h-[60vh] md:min-h-screen bg-glass-strong rounded-2xl border border-glass-border shadow-sm p-4 sm:p-6 md:p-12">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Write your policy here..."
          className="w-full h-[60vh] md:h-[80vh] resize-none outline-none text-foreground leading-relaxed font-serif text-base md:text-lg placeholder:text-muted-foreground"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
