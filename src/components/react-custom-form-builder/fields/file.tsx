import { Upload, X, FileIcon, AlertCircle, Download } from "lucide-react";
import { registerField } from "../registry";
import { useAttachments } from "../attachments";
import type {
  FieldDefinition,
  CanvasFieldProps,
  RuntimeFieldProps,
} from "../types";
import { useRef, useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CanvasComponent = ({ field }: CanvasFieldProps) => {
  const multiple = field.props?.multiple as boolean;
  const accept = field.props?.accept as string;
  const maxSizeMB = field.props?.maxSizeMB as number;
  const maxCount = field.props?.maxCount as number;
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{field.label}</span>
      <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-input bg-muted/20 px-3 py-3">
        <Upload className="h-5 w-5 text-muted-foreground/50" />
        <span className="text-[11px] text-muted-foreground">
          Click to upload{multiple ? " files" : ""}
        </span>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground/60">
          {accept && <span>{accept}</span>}
          {maxSizeMB != null && maxSizeMB > 0 && <span>Max {maxSizeMB}MB</span>}
          {maxCount != null && maxCount > 0 && (
            <span>
              Max {maxCount} file{maxCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const RuntimeComponent = ({
  field,
  value,
  onChange,
  error,
  disabled,
}: RuntimeFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = (value as File[]) ?? [];
  // Files already stored server-side against THIS field. Null provider (the
  // default) → empty, and the field behaves exactly as it always has.
  const attachments = useAttachments();
  const uploaded = attachments?.getFor(field.name ?? "") ?? [];
  const multiple = (field.props?.multiple as boolean) ?? false;
  const accept = (field.props?.accept as string) ?? "";
  const maxSizeMB = (field.props?.maxSizeMB as number) || 0;
  const maxCount = (field.props?.maxCount as number) || 0;
  const maxBytes = maxSizeMB > 0 ? maxSizeMB * 1024 * 1024 : 0;

  const [rejection, setRejection] = useState<string | null>(null);

  // Already-uploaded files occupy slots too, so they count toward maxCount.
  const totalCount = uploaded.length + files.length;
  const isAtLimit = maxCount > 0 && totalCount >= maxCount;

  const handleFiles = (incoming: File[]) => {
    setRejection(null);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const f of incoming) {
      if (maxBytes > 0 && f.size > maxBytes) {
        rejected.push(`"${f.name}" exceeds ${maxSizeMB}MB`);
        continue;
      }
      accepted.push(f);
    }

    let merged = multiple ? [...files, ...accepted] : accepted;

    // Budget is maxCount minus what's already on the server for this field.
    const budget = maxCount > 0 ? Math.max(0, maxCount - uploaded.length) : 0;
    if (maxCount > 0 && merged.length > budget) {
      const dropped = merged.length - budget;
      merged = merged.slice(0, budget);
      rejected.push(
        `${dropped} file${dropped > 1 ? "s" : ""} dropped (max ${maxCount})`,
      );
    }

    if (rejected.length > 0) {
      setRejection(rejected.join("; "));
    }

    onChange(merged);
  };

  const hints: string[] = [];
  if (accept) hints.push(accept);
  if (maxSizeMB > 0) hints.push(`Max ${maxSizeMB}MB per file`);
  if (maxCount > 0)
    hints.push(`${totalCount}/${maxCount} file${maxCount !== 1 ? "s" : ""}`);

  const hasFiles = uploaded.length > 0 || files.length > 0;

  return (
    <div className="space-y-1.5">
      {/* Single container: the upload trigger sits on top, and every selected /
          uploaded file is listed as a row INSIDE the same bordered section. */}
      <div
        className={`overflow-hidden rounded-md border border-dashed transition-[border-color] duration-150 ${
          error ? "border-destructive/50" : "border-input"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        {/* Upload trigger row */}
        <button
          type="button"
          disabled={disabled || isAtLimit}
          onClick={() => !isAtLimit && inputRef.current?.click()}
          className={`flex w-full items-center gap-2.5 px-3 min-h-[44px] text-left transition-[background-color] duration-150 ${
            isAtLimit
              ? "cursor-not-allowed bg-muted/30"
              : "cursor-pointer hover:bg-accent/20"
          } ${hasFiles ? "border-b border-border" : ""}`}
        >
          <Upload
            className={`h-4 w-4 shrink-0 ${
              isAtLimit ? "text-muted-foreground/30" : "text-muted-foreground/60"
            }`}
          />
          <span
            className={`truncate text-xs ${
              isAtLimit ? "text-muted-foreground/50" : "text-muted-foreground"
            }`}
          >
            {isAtLimit
              ? `Maximum ${maxCount} file${maxCount !== 1 ? "s" : ""} reached`
              : `Click to upload${multiple ? " files" : " a file"}`}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          disabled={disabled || isAtLimit}
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        {/* File rows — same section, divided */}
        {hasFiles && (
          <ul className="divide-y divide-border">
            {/* Already on the server — download/delete hit the host's API. */}
            {uploaded.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {m.size != null ? `${formatSize(m.size)} · ` : ""}Uploaded
                  </p>
                </div>
                {attachments?.onDownload && (
                  <button
                    type="button"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground transition-[color] duration-150"
                    aria-label={`Download ${m.name}`}
                    onClick={() => attachments.onDownload?.(m.id)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                )}
                {!disabled && attachments?.onDelete && (
                  <button
                    type="button"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive transition-[color] duration-150"
                    aria-label={`Delete ${m.name}`}
                    onClick={() => {
                      setRejection(null);
                      void attachments.onDelete?.(m.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}

            {/* Picked but not submitted yet — removing just drops it from value. */}
            {files.map((f, i) => (
              <li key={`staged-${i}`} className="flex items-center gap-2 px-2.5 py-1.5">
                <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(f.size)} · Pending save
                  </p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive transition-[color] duration-150"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => {
                      setRejection(null);
                      onChange(files.filter((_, idx) => idx !== i));
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {hints.length > 0 && (
        <p className="px-0.5 text-[10px] text-muted-foreground/60">
          {hints.join(" · ")}
        </p>
      )}

      {rejection && (
        <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            {rejection}
          </p>
        </div>
      )}
    </div>
  );
};

const def: FieldDefinition = {
  type: "file",
  label: "File Upload",
  icon: Upload,
  category: "input",
  defaultSchema: {
    props: { multiple: false, accept: "", maxSizeMB: 10, maxCount: 0 },
  },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.multiple", label: "Allow multiple files", type: "boolean" },
    {
      key: "props.accept",
      label: "Accepted types (e.g. .pdf,.jpg)",
      type: "text",
    },
    { key: "props.maxSizeMB", label: "Max file size (MB)", type: "number" },
    {
      key: "props.maxCount",
      label: "Max number of files (0 = unlimited)",
      type: "number",
    },
  ],
};

registerField(def);
