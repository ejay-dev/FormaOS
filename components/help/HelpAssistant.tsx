'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bug,
  CalendarCheck,
  CheckCircle2,
  LifeBuoy,
  PlayCircle,
  Search,
  X,
  Send,
} from 'lucide-react';
import { HELP_ARTICLES, type HelpArticle } from '@/lib/help/articles';
import { useHelpAssistant } from '@/components/help/help-assistant-context';
import { useModalA11y } from '@/lib/hooks/use-modal-a11y';
import { useProductTour } from '@/lib/onboarding/product-tour';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getSuggestedArticles(pathname: string) {
  return HELP_ARTICLES.filter((article) =>
    article.routes.some((route) => pathname.startsWith(route)),
  ).slice(0, 3);
}

export function HelpAssistant() {
  const { isOpen, panel, close, toggle, setPanel } = useHelpAssistant();
  const { startTour } = useProductTour();
  const pathname = usePathname();
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, close);

  const [query, setQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);
  const [bugMessage, setBugMessage] = useState('');
  const [screenshot, setScreenshot] = useState<
    | {
        name: string;
        type: string;
        dataUrl: string;
      }
    | null
  >(null);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  const filteredArticles = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return HELP_ARTICLES;
    return HELP_ARTICLES.filter((article) => {
      const haystack = [
        article.title,
        article.summary,
        article.body,
        ...article.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  const suggestedArticles = useMemo(
    () => getSuggestedArticles(pathname),
    [pathname],
  );

  const handleScreenshotChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 700_000) {
      setSubmitStatus('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setScreenshot({ name: file.name, type: file.type, dataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const submitBugReport = async () => {
    if (!bugMessage.trim()) return;
    setSubmitStatus('submitting');

    const meta = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      time: new Date().toISOString(),
      screenshot,
      source: 'in-app-assistant',
    };

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: pathname,
          message: bugMessage.trim(),
          meta,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitStatus('success');
      setBugMessage('');
      setScreenshot(null);
    } catch (error) {
      console.error('[HelpAssistant] Bug report failed:', error);
      setSubmitStatus('error');
    }
  };

  const openSupport = () => {
    window.location.href = '/contact?intent=support';
  };

  const bookDemo = () => {
    window.location.href = '/contact?intent=demo';
  };

  const startTourFromAssistant = () => {
    startTour({ fromStep: 0, resetProgress: true });
    close();
  };

  return (
    <>
      {isOpen ? (
        <button
          className="fixed inset-0 z-[79] cursor-default bg-black/40"
          onClick={close}
          aria-label="Close help assistant"
        />
      ) : null}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-[80] md:bottom-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button
          onClick={toggle}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-foreground text-background shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open help assistant"
        >
          <LifeBuoy className="h-5 w-5" />
        </button>
      </div>

      {isOpen ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-assistant-title"
          className="fixed bottom-0 left-0 right-0 z-[var(--z-overlay)] max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:max-h-[80vh] sm:w-[380px] sm:rounded-2xl sm:border sm:border-border pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <LifeBuoy aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              <div>
                <p id="help-assistant-title" className="text-sm font-semibold text-foreground">
                  Help Assistant
                </p>
                <p className="text-xs text-muted-foreground">Find answers fast</p>
              </div>
            </div>
            <button
              onClick={close}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-5 py-4 sm:max-h-[calc(80vh-64px)]">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search help articles"
                className="h-9 bg-surface-1 text-sm"
              />
            </div>

            {panel === 'bug' ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-border bg-surface-1 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Report a bug
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Include what happened and what you expected to see.
                  </p>
                  <textarea
                    value={bugMessage}
                    onChange={(event) => setBugMessage(event.target.value)}
                    placeholder="Describe the issue..."
                    className="mt-3 h-24 w-full rounded-xl border border-border bg-transparent p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 transition-colors"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <label className="text-xs text-muted-foreground">
                      Optional screenshot
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="mt-2 block w-full text-xs text-foreground/70"
                      />
                    </label>
                    <Button
                      size="sm"
                      onClick={submitBugReport}
                      disabled={submitStatus === 'submitting'}
                      className="bg-foreground text-background hover:opacity-90"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {submitStatus === 'submitting' ? 'Sending...' : 'Submit'}
                    </Button>
                  </div>
                  {submitStatus === 'success' ? (
                    <p className="mt-3 text-xs text-success">
                      Bug report sent. We will follow up soon.
                    </p>
                  ) : null}
                  {submitStatus === 'error' ? (
                    <p className="mt-3 text-xs text-destructive">
                      Unable to send report. Try again or contact support.
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPanel('home')}
                  className="text-foreground/70"
                >
                  Back to Help Center
                </Button>
              </div>
            ) : null}

            {panel === 'home' ? (
              <>
                <div className="mt-5 grid gap-3">
                  <Button
                    variant="outline"
                    onClick={startTourFromAssistant}
                    className="justify-start gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start product tour
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openSupport}
                    className="justify-start gap-2"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Contact support
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPanel('bug')}
                    className="justify-start gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    Report a bug
                  </Button>
                  <Button
                    variant="outline"
                    onClick={bookDemo}
                    className="justify-start gap-2"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Book a demo
                  </Button>
                </div>

                {suggestedArticles.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Suggested for this page
                    </p>
                    <div className="mt-3 space-y-2">
                      {suggestedArticles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setActiveArticle(article)}
                          className="w-full rounded-xl border border-border bg-surface-1 p-3 text-left text-sm text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="font-semibold">{article.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {article.summary}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Help articles
                  </p>
                  <div className="mt-3 space-y-2">
                    {(query ? filteredArticles : HELP_ARTICLES.slice(0, 4)).map(
                      (article) => (
                        <button
                          key={article.id}
                          onClick={() => setActiveArticle(article)}
                          className="w-full rounded-xl border border-border bg-surface-1 p-3 text-left text-sm text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="font-semibold">{article.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {article.summary}
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {panel === 'home' && activeArticle ? (
              <div className="mt-5 rounded-2xl border border-border bg-surface-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeArticle.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activeArticle.summary}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="rounded-full border border-border px-2 py-1 text-xs text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-3 text-sm text-foreground/90">
                  {activeArticle.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-2 px-2 py-1 text-xs text-foreground/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Suggested for {pathname}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
