import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";

const LANG: Record<string, string> = {
  tsx: "typescript",
  ts: "typescript",
  js: "javascript",
  json: "json",
  bash: "shell",
};

/**
 * Read-only Monaco code viewer with the vs-dark JS/TS theme (same editor the
 * builder's HookEditor uses). Monaco is mounted lazily when scrolled into view
 * so a page full of snippets doesn't spin up a dozen editors at once.
 */
export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const lines = code.split("\n").length;
  const height = Math.min(Math.max(lines * 19 + 24, 60), 480);

  return (
    <div ref={ref} className="group relative my-4 overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:text-slate-100"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div style={{ height }}>
        {inView ? (
          <Editor
            height={height}
            language={LANG[lang] ?? "typescript"}
            theme="vs-dark"
            value={code}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              fontSize: 12.5,
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              folding: false,
              renderLineHighlight: "none",
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              contextmenu: false,
              guides: { indentation: false },
              padding: { top: 12, bottom: 12 },
              scrollbar: { alwaysConsumeMouseWheel: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
          />
        ) : (
          <pre className="overflow-hidden p-4 text-[12.5px] leading-[19px] text-slate-300"><code>{code}</code></pre>
        )}
      </div>
    </div>
  );
}
