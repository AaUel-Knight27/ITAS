"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useProtectedMediaUrl } from "@/hooks/useProtectedMediaUrl";

interface TocItem {
  title: string;
  pageNumber: number;
  level: number;
}

interface Highlight {
  id: string;
  pageNumber: number;
  text: string;
  color: string;
  createdAt: string;
}

interface StoredProgress {
  currentPage: number;
  completed: boolean;
}

interface Props {
  url: string;
  title: string;
  lectureId?: number;
  onComplete?: () => void;
}

type PdfDocument = Awaited<ReturnType<PdfJsModule["getDocument"]>["promise"]>;
type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;
type PdfOutlineItem = Awaited<ReturnType<PdfDocument["getOutline"]>> extends infer T
  ? T extends Array<infer U>
    ? U
    : never
  : never;
type PdfJsModule = typeof import("pdfjs-dist");
type PdfTextLayer = InstanceType<PdfJsModule["TextLayer"]>;

const COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
];

const DEFAULT_SCALE = 1.2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const PdfViewer = memo(function PdfViewer({ url, title, lectureId, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef(new Map<number, HTMLCanvasElement>());
  const textLayerRefs = useRef(new Map<number, HTMLDivElement>());
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const renderTasksRef = useRef(new Map<number, { cancel?: () => void }>());
  const textLayersRef = useRef(new Map<number, PdfTextLayer>());
  const renderingPagesRef = useRef(new Set<number>());
  const completionTriggeredRef = useRef(false);

  const [pdfModule, setPdfModule] = useState<PdfJsModule | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState(false);
  const [showPages, setShowPages] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [hasMarked, setHasMarked] = useState(false);
  const {
    resolvedUrl,
    isLoading: isAssetLoading,
    error: assetError,
  } = useProtectedMediaUrl(url);
  const [pageInput, setPageInput] = useState("1");

  const highlightStorageKey = useMemo(
    () => (lectureId ? `pdf_highlights_${lectureId}` : `pdf_highlights_${url}`),
    [lectureId, url]
  );
  const progressStorageKey = useMemo(
    () => (lectureId ? `pdf_progress_${lectureId}` : `pdf_progress_${url}`),
    [lectureId, url]
  );

  const persistProgress = useCallback(
    (nextPage: number, completed: boolean) => {
      try {
        const payload: StoredProgress = { currentPage: nextPage, completed };
        window.localStorage.setItem(progressStorageKey, JSON.stringify(payload));
      } catch {
        // Ignore local persistence failures.
      }
    },
    [progressStorageKey]
  );

  const triggerCompletion = useCallback(() => {
    if (completionTriggeredRef.current) {
      return;
    }
    completionTriggeredRef.current = true;
    setHasMarked(true);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    try {
      const savedHighlights = window.localStorage.getItem(highlightStorageKey);
      setHighlights(savedHighlights ? (JSON.parse(savedHighlights) as Highlight[]) : []);
    } catch {
      setHighlights([]);
    }
  }, [highlightStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(highlightStorageKey, JSON.stringify(highlights));
    } catch {
      // Ignore local persistence failures.
    }
  }, [highlightStorageKey, highlights]);

  useEffect(() => {
    try {
      const savedProgress = window.localStorage.getItem(progressStorageKey);
      if (!savedProgress) {
        completionTriggeredRef.current = false;
        setCurrentPage(1);
        setHasMarked(false);
        return;
      }

      const parsed = JSON.parse(savedProgress) as StoredProgress;
      const nextPage = Number(parsed.currentPage) || 1;
      setCurrentPage(nextPage);
      setHasMarked(Boolean(parsed.completed));
      completionTriggeredRef.current = Boolean(parsed.completed);
    } catch {
      completionTriggeredRef.current = false;
      setCurrentPage(1);
      setHasMarked(false);
    }
  }, [progressStorageKey]);

  const buildToc = useCallback(
    async (doc: PdfDocument, outline: PdfOutlineItem[], level = 0): Promise<TocItem[]> => {
      const items: TocItem[] = [];

      for (const item of outline) {
        let pageNumber = 1;

        try {
          if (item.dest) {
            const destination = typeof item.dest === "string" ? await doc.getDestination(item.dest) : item.dest;

            if (destination?.[0]) {
              pageNumber = (await doc.getPageIndex(destination[0])) + 1;
            }
          }
        } catch {
          pageNumber = 1;
        }

        items.push({
          title: item.title || "Section",
          pageNumber,
          level,
        });

        if (item.items?.length) {
          items.push(...(await buildToc(doc, item.items as PdfOutlineItem[], level + 1)));
        }
      }

      return items;
    },
    []
  );

  useEffect(() => {
    if (!resolvedUrl) {
      if (assetError) {
        setLoading(false);
        setPdfDoc(null);
        setNumPages(0);
        setToc([]);
        setError("Could not load PDF. Authentication may be missing or the file is unavailable.");
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    let loadingTask: ReturnType<PdfJsModule["getDocument"]> | null = null;
    let activeDoc: PdfDocument | null = null;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPdfDoc(null);
      setNumPages(0);
      setToc([]);

      try {
        const pdfjs = await import("pdfjs-dist");

        if (cancelled) {
          return;
        }

        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
        setPdfModule(pdfjs);

        loadingTask = pdfjs.getDocument({
          url: resolvedUrl,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        });

        const doc = await loadingTask.promise;

        if (cancelled) {
          await doc.destroy();
          return;
        }

        activeDoc = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);

        try {
          const outline = await doc.getOutline();
          if (!cancelled && outline?.length) {
            setToc(await buildToc(doc, outline as PdfOutlineItem[]));
          }
        } catch {
          setToc([]);
        }
      } catch (caughtError) {
        if (!cancelled) {
          const message = caughtError instanceof Error ? caughtError.message : "Unknown error";
          setError(`Could not load PDF. ${message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
      void activeDoc?.destroy();
    };
  }, [assetError, buildToc, resolvedUrl]);

  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !pdfModule || renderingPagesRef.current.has(pageNumber)) {
        return;
      }

      const canvas = canvasRefs.current.get(pageNumber);
      const textLayerContainer = textLayerRefs.current.get(pageNumber);

      if (!canvas || !textLayerContainer) {
        return;
      }

      renderingPagesRef.current.add(pageNumber);
      renderTasksRef.current.get(pageNumber)?.cancel?.();
      textLayersRef.current.get(pageNumber)?.cancel?.();

      try {
        const page: PdfPage = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const canvasContext = canvas.getContext("2d");

        if (!canvasContext) {
          return;
        }

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const pageContainer = pageRefs.current.get(pageNumber);
        if (pageContainer) {
          pageContainer.style.width = `${viewport.width}px`;
          pageContainer.style.minHeight = `${viewport.height}px`;
        }

        textLayerContainer.replaceChildren();
        textLayerContainer.style.width = `${viewport.width}px`;
        textLayerContainer.style.height = `${viewport.height}px`;

        const renderTask = page.render({
          canvas,
          canvasContext,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });

        renderTasksRef.current.set(pageNumber, renderTask);
        await renderTask.promise;

        const textContent = await page.getTextContent();
        const textLayer = new pdfModule.TextLayer({
          container: textLayerContainer,
          textContentSource: textContent,
          viewport,
        });

        textLayersRef.current.set(pageNumber, textLayer);
        await textLayer.render();
      } catch (caughtError) {
        const maybeMessage = caughtError instanceof Error ? caughtError.message : "";
        if (!maybeMessage.toLowerCase().includes("cancel")) {
          setError((previous) => previous ?? "Could not render part of this PDF.");
        }
      } finally {
        renderingPagesRef.current.delete(pageNumber);
      }
    },
    [pdfDoc, pdfModule, scale]
  );

  const renderVisiblePages = useCallback(
    (focusedPage = currentPage) => {
      if (!numPages) {
        return;
      }

      const pagesToRender = [focusedPage - 1, focusedPage, focusedPage + 1].filter(
        (pageNumber) => pageNumber >= 1 && pageNumber <= numPages
      );

      pagesToRender.forEach((pageNumber) => {
        void renderPage(pageNumber);
      });
    },
    [currentPage, numPages, renderPage]
  );

  const scrollToPage = useCallback((pageNumber: number) => {
    const targetPage = clamp(pageNumber, 1, Math.max(numPages, 1));
    pageRefs.current.get(targetPage)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setCurrentPage(targetPage);
    renderVisiblePages(targetPage);
  }, [numPages, renderVisiblePages]);

  useEffect(() => {
    if (!pdfDoc || !numPages) {
      return;
    }

    renderVisiblePages(currentPage);
  }, [currentPage, numPages, pdfDoc, renderVisiblePages, scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !numPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let nextVisiblePage: number | null = null;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber || "0");
          if (!pageNumber) {
            return;
          }

          renderVisiblePages(pageNumber);
          nextVisiblePage = nextVisiblePage === null ? pageNumber : Math.min(nextVisiblePage, pageNumber);
        });

        if (nextVisiblePage !== null) {
          setCurrentPage(nextVisiblePage);
        }
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    pageRefs.current.forEach((pageElement) => observer.observe(pageElement));

    return () => observer.disconnect();
  }, [numPages, renderVisiblePages]);

  useEffect(() => {
    if (!numPages) {
      return;
    }

    const safePage = clamp(currentPage, 1, numPages);
    const completionRatio = safePage / numPages;
    const completed = hasMarked || completionRatio >= 0.9;

    persistProgress(safePage, completed);

    if (completionRatio >= 0.9) {
      triggerCompletion();
    }
  }, [currentPage, hasMarked, numPages, persistProgress, triggerCompletion]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const selectedText = selection.toString().trim().replace(/\s+/g, " ");
    if (selectedText.length < 2) {
      return;
    }

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer.parentElement;
    const pageElement = startNode?.closest("[data-page-number]") as HTMLElement | null;
    const pageNumber = Number(pageElement?.dataset.pageNumber || currentPage);

    setHighlights((previous) => [
      ...previous,
      {
        id: `${pageNumber}-${Date.now()}`,
        pageNumber,
        text: selectedText,
        color: selectedColor,
        createdAt: new Date().toISOString(),
      },
    ]);

    selection.removeAllRanges();
  }, [currentPage, selectedColor]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((previous) => previous.filter((highlight) => highlight.id !== id));
  }, []);

  const handleMarkRead = useCallback(() => {
    setHasMarked(true);
    persistProgress(currentPage, true);
    triggerCompletion();
  }, [currentPage, persistProgress, triggerCompletion]);

  const zoomIn = useCallback(() => {
    setScale((previous) => clamp(Number((previous + 0.2).toFixed(2)), 0.5, 2.5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((previous) => clamp(Number((previous - 0.2).toFixed(2)), 0.5, 2.5));
  }, []);

  const zoomReset = useCallback(() => {
    setScale(DEFAULT_SCALE);
  }, []);

  if (!url) {
    return (
      <div className="flex h-64 items-center justify-center bg-gray-900">
        <p className="text-sm text-gray-500">No PDF uploaded for this lesson.</p>
      </div>
    );
  }

  if (isAssetLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Preparing PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-gray-900">
        <p className="text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Reload Reader
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-800 bg-gray-900/95 px-4 py-2 backdrop-blur">
        <div className="mr-2 flex min-w-0 items-center gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-gray-500">PDF</span>
          <span className="max-w-xs truncate text-sm font-medium text-white">{title}</span>
        </div>

        {numPages > 0 ? (
          <button
            type="button"
            onClick={() => setShowPages((previous) => !previous)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              showPages
                ? "border-amber-500 bg-amber-900/30 text-amber-300"
                : "border-gray-700 text-gray-400 hover:bg-gray-800"
            }`}
          >
            Pages
          </button>
        ) : null}

        {toc.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowToc((previous) => !previous)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              showToc
                ? "border-blue-500 bg-blue-900/30 text-blue-300"
                : "border-gray-700 text-gray-400 hover:bg-gray-800"
            }`}
          >
            Contents
          </button>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-40"
          >
            Prev
          </button>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const targetPage = Number(pageInput);
              if (Number.isFinite(targetPage)) {
                scrollToPage(targetPage);
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value.replace(/[^\d]/g, ""))}
              className="w-14 rounded-lg border border-gray-700 bg-gray-950 px-2 py-1 text-center text-xs text-white outline-none focus:border-blue-500"
              inputMode="numeric"
              aria-label="Page number"
            />
            <span className="min-w-[40px] text-center text-xs text-gray-400">/ {numPages || "-"}</span>
          </form>
          <button
            type="button"
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800"
          >
            -
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="min-w-[56px] rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Highlight:</span>
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.name}
              aria-label={`Use ${color.name} highlight`}
              onClick={() => setSelectedColor(color.value)}
              style={{ backgroundColor: color.value }}
              className={`h-5 w-5 rounded-full border-2 transition-transform ${
                selectedColor === color.value ? "scale-110 border-white" : "border-transparent"
              }`}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-500">
            Read on page
          </span>
          {!hasMarked ? (
            <button
              type="button"
              onClick={handleMarkRead}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
            >
              Mark as Read
            </button>
          ) : (
            <span className="rounded-lg border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs text-green-400">
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showPages && numPages > 0 ? (
          <aside className="w-24 shrink-0 overflow-y-auto border-r border-gray-800 bg-[#0f1319] px-2 py-3">
            <div className="mb-3 px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Pages</p>
            </div>
            <div className="space-y-2">
              {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => scrollToPage(pageNumber)}
                  className={`flex w-full flex-col items-center rounded-xl border px-2 py-3 text-center transition-colors ${
                    currentPage === pageNumber
                      ? "border-blue-500 bg-blue-900/30 text-blue-300"
                      : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:bg-gray-800"
                  }`}
                >
                  <span className="mb-2 block h-12 w-full rounded-md border border-gray-800 bg-gradient-to-b from-white to-slate-200" />
                  <span className="text-[11px] font-medium">Page {pageNumber}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        {showToc && toc.length > 0 ? (
          <aside className="w-64 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white">Outline</p>
            </div>
            <div className="py-2">
              {toc.map((item, index) => (
                <button
                  key={`${item.title}-${item.pageNumber}-${index}`}
                  type="button"
                  onClick={() => scrollToPage(item.pageNumber)}
                  className={`block w-full px-4 py-2 text-left text-xs transition-colors hover:bg-gray-800 ${
                    currentPage === item.pageNumber ? "bg-blue-900/20 text-blue-300" : "text-gray-300"
                  }`}
                  style={{ paddingLeft: `${16 + item.level * 12}px` }}
                >
                  <span className="block truncate">{item.title}</span>
                  <span className="text-[10px] text-gray-500">Page {item.pageNumber}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        <div ref={containerRef} onMouseUp={handleMouseUp} className="flex-1 overflow-y-auto bg-gray-950 px-4 py-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading PDF...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
                <div
                  key={pageNumber}
                  id={`pdf-page-${pageNumber}`}
                  data-page-number={pageNumber}
                  onContextMenu={(event) => event.preventDefault()}
                  ref={(element) => {
                    if (element) {
                      pageRefs.current.set(pageNumber, element);
                    } else {
                      pageRefs.current.delete(pageNumber);
                    }
                  }}
                  className="relative overflow-hidden rounded-lg bg-white shadow-2xl"
                >
                  <canvas
                    ref={(element) => {
                      if (element) {
                        canvasRefs.current.set(pageNumber, element);
                        void renderPage(pageNumber);
                      } else {
                        canvasRefs.current.delete(pageNumber);
                      }
                    }}
                    className="block max-w-full"
                  />
                  <div
                    ref={(element) => {
                      if (element) {
                        textLayerRefs.current.set(pageNumber, element);
                      } else {
                        textLayerRefs.current.delete(pageNumber);
                      }
                    }}
                    className="pdf-text-layer absolute inset-0 overflow-hidden"
                  />

                  <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                    {pageNumber}
                  </div>

                  {highlights
                    .filter((highlight) => highlight.pageNumber === pageNumber)
                    .map((highlight) => (
                      <button
                        key={highlight.id}
                        type="button"
                        onClick={() => removeHighlight(highlight.id)}
                        style={{ backgroundColor: highlight.color }}
                        className="group absolute left-2 right-2 top-2 rounded px-3 py-2 text-left text-xs text-gray-800 opacity-90 shadow"
                        title="Remove highlight"
                      >
                        <span className="line-clamp-2 block pr-5">{highlight.text}</span>
                        <span className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">x</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {highlights.length > 0 ? (
          <aside className="w-56 shrink-0 overflow-y-auto border-l border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white">Highlights</p>
              <span className="text-xs text-gray-500">{highlights.length}</span>
            </div>
            <div className="space-y-2 px-3 py-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  onClick={() => scrollToPage(highlight.pageNumber)}
                  className="group cursor-pointer rounded-lg p-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                >
                  <div className="mb-2 h-1 w-full rounded" style={{ backgroundColor: highlight.color }} />
                  <p className="line-clamp-3">{highlight.text}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Page {highlight.pageNumber}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeHighlight(highlight.id);
                      }}
                      className="text-xs text-gray-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <style jsx global>{`
        .pdf-text-layer {
          line-height: 1;
          opacity: 1;
        }

        .pdf-text-layer span,
        .pdf-text-layer br {
          color: transparent;
          position: absolute;
          transform-origin: 0 0;
          white-space: pre;
          cursor: text;
          user-select: text;
        }

        .pdf-text-layer ::selection {
          background: rgba(59, 130, 246, 0.35);
        }
      `}</style>
    </div>
  );
});

export default PdfViewer;
