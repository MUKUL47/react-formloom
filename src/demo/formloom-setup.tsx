/**
 * Demo setup — registers example WIDGETS: each widget is a field registered
 * with `category: "widget"`, so it shows up in the palette's
 * "Widgets" group (bottom-left) and is dragged onto the canvas like any field.
 * Its behavior is driven by DYNAMIC PROPS edited in the normal property panel
 * (via `propertyFields`) and read off `field.props` at runtime.
 *
 *   1. domain  — props.suffix
 *   2. rating  — props.max, props.icon
 *   3. country — async + complex; props.multiple (single/multi) + props.showFlags
 * plus a plain custom input field type: color.
 *
 * (Uses the `@/` alias here; in a consuming app the import is `formloom`.)
 */
import { useEffect, useRef, useState } from "react";
import {
  registerField,
  type FieldDefinition,
  type CanvasFieldProps,
  type RuntimeFieldProps,
} from "@/components/react-custom-form-builder";
import { Palette, Star, Heart, Search, X, Check, Globe, MapPin } from "lucide-react";

// ── 1. Domain widget — reads field.props.suffix ──────────────────────────────
function DomainRuntime({ field, value, onChange, disabled }: RuntimeFieldProps) {
  const suffix = (field.props?.suffix as string) ?? ".forms.app";
  const raw = String((value as string) ?? "");
  const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return (
    <div className="space-y-1.5">
      <div className="flex items-stretch overflow-hidden rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
        <input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" value={raw} disabled={disabled}
          placeholder="your-company" onChange={(e) => onChange(e.target.value)} />
        <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">{suffix}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {clean ? <>https://<span className="font-medium text-foreground">{clean}{suffix}</span></> : "Live preview appears here"}
      </p>
    </div>
  );
}
registerField({
  type: "domain" as any,
  label: "Custom Domain",
  icon: Globe,
  category: "widget",
  defaultSchema: { props: { suffix: ".forms.app" } },
  CanvasComponent: ({ field }: CanvasFieldProps) => (
    <div className="flex items-stretch overflow-hidden rounded-md border border-input">
      <span className="flex-1 px-3 py-2 text-sm text-muted-foreground">your-company</span>
      <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">{(field.props?.suffix as string) ?? ".forms.app"}</span>
    </div>
  ),
  RuntimeComponent: DomainRuntime,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.suffix", label: "Domain suffix", type: "text" },
  ],
} satisfies FieldDefinition);

// ── 2. Rating widget — reads field.props.max + field.props.icon ──────────────
function RatingRuntime({ field, value, onChange, disabled }: RuntimeFieldProps) {
  const max = (field.props?.max as number) ?? 5;
  const isHeart = (field.props?.icon as string) === "heart";
  const Icon = isHeart ? Heart : Star;
  const current = (value as number) ?? 0;
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)}
          className={`transition-transform hover:scale-110 ${n <= current ? (isHeart ? "text-rose-500" : "text-amber-500") : "text-muted-foreground/30"}`}
          aria-label={`${n}`}>
          <Icon className="h-6 w-6" fill={n <= current ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
registerField({
  type: "rating" as any,
  label: "Rating",
  icon: Star,
  category: "widget",
  defaultSchema: { defaultValue: 0, props: { max: 5, icon: "star" } },
  CanvasComponent: ({ field }: CanvasFieldProps) => {
    const isHeart = (field.props?.icon as string) === "heart";
    const Icon = isHeart ? Heart : Star;
    return (
      <div className="flex gap-1 text-muted-foreground/40">
        {Array.from({ length: (field.props?.max as number) ?? 5 }).map((_, i) => <Icon key={i} className="h-5 w-5" />)}
      </div>
    );
  },
  RuntimeComponent: RatingRuntime,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.max", label: "Max icons", type: "number" },
    { key: "props.icon", label: "Icon", type: "select", selectOptions: [{ label: "Star", value: "star" }, { label: "Heart", value: "heart" }] },
  ],
} satisfies FieldDefinition);

// ── 3. Country picker — async + complex + dynamic props ──────────────────────
// props.multiple  → single vs multi select   (like a calendar's single/multi)
// props.showFlags → show flag emoji or not    (like a calendar's show-holidays)
const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" }, { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" }, { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" }, { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" }, { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "FR", name: "France", flag: "🇫🇷" },
];
function fetchCountries(q: string): Promise<typeof COUNTRIES> {
  const s = q.trim().toLowerCase();
  return new Promise((res) => setTimeout(() => res(s ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(s)) : COUNTRIES), 250));
}
function CountryRuntime({ field, value, onChange, disabled }: RuntimeFieldProps) {
  const multiple = field.props?.multiple === true;
  const showFlags = field.props?.showFlags !== false;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof COUNTRIES>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected: string[] = multiple
    ? (Array.isArray(value) ? (value as string[]) : value != null && value !== "" ? [String(value)] : [])
    : (value ? [value as string] : []);
  const label = (code: string) => COUNTRIES.find((c) => c.code === code);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => { setResults(await fetchCountries(query)); setLoading(false); }, 250);
    return () => clearTimeout(debounce.current);
  }, [query, open]);
  // Close the dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const pick = (code: string) => {
    if (multiple) onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
    else { onChange(code); setOpen(false); }
  };
  return (
    <div ref={rootRef} className="relative">
      {multiple && selected.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {selected.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {showFlags && label(c)?.flag} {label(c)?.name}
              <button type="button" onClick={() => pick(c)} aria-label="remove"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input className="flex-1 bg-transparent text-sm outline-none" disabled={disabled}
          placeholder={!multiple && value ? `${showFlags ? label(value as string)?.flag + " " : ""}${label(value as string)?.name}` : "Search countries…"}
          value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {loading ? <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
            : results.length === 0 ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
            : results.map((c) => {
              const on = selected.includes(c.code);
              return (
                <button key={c.code} type="button" onClick={() => pick(c.code)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent ${on ? "text-primary" : ""}`}>
                  {showFlags && <span>{c.flag}</span>}<span className="flex-1">{c.name}</span>{on && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
registerField({
  type: "country" as any,
  label: "Country Picker",
  icon: MapPin,
  category: "widget",
  defaultSchema: { props: { multiple: false, showFlags: true } },
  CanvasComponent: () => (
    <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-muted-foreground">
      <Search className="h-3.5 w-3.5" /> Search countries…
    </div>
  ),
  RuntimeComponent: CountryRuntime,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.multiple", label: "Allow multiple", type: "boolean" },
    { key: "props.showFlags", label: "Show flags", type: "boolean" },
  ],
} satisfies FieldDefinition);

// ── A plain custom input field type: color ───────────────────────────────────
function ColorRuntime({ field, value, onChange, disabled, error }: RuntimeFieldProps) {
  const v = (value as string) ?? (field.defaultValue as string) ?? "#4f46e5";
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={v} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-14 rounded-md border ${error ? "border-destructive" : "border-input"} bg-transparent`} />
      <code className="text-xs text-muted-foreground">{v}</code>
    </div>
  );
}
registerField({
  type: "color" as any,
  label: "Color",
  icon: Palette,
  category: "input",
  defaultSchema: { defaultValue: "#4f46e5" },
  CanvasComponent: ({ field }: CanvasFieldProps) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-4 w-4 rounded border border-border" style={{ background: (field.defaultValue as string) ?? "#4f46e5" }} />
      {field.label}
    </div>
  ),
  RuntimeComponent: ColorRuntime,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "defaultValue", label: "Default color", type: "text" },
  ],
} satisfies FieldDefinition);
