import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 4 });
    setShow(true);
  };

  return (
    <>
      <span
        className="inline-flex cursor-help"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>
      {show &&
        createPortal(
          <div
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
            className="fixed px-2.5 py-1.5 text-[11px] leading-tight bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-w-[220px] w-max z-[9999] pointer-events-none"
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hideLabel?: boolean;
  helpText?: string;
  tooltip?: string;
  children: ReactNode;
}

export function FormField({
  label,
  name,
  required,
  error,
  hideLabel,
  helpText,
  tooltip,
  children,
}: FormFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = helpText ? `${name}-help` : undefined;
  return (
    <div className="space-y-1.5" data-field-name={name}>
      {!hideLabel && (
        <div className="flex items-center gap-1.5">
          <Label htmlFor={name} className="text-[13px] font-medium tracking-tight leading-none">
            {label}
            {required && (
              <span
                className="text-destructive ml-1 select-none"
                aria-label="required"
              >
                *
              </span>
            )}
          </Label>
          {tooltip && (
            <Tooltip text={tooltip}>
              <Info
                className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-150"
                aria-label="More info"
              />
            </Tooltip>
          )}
        </div>
      )}
      {helpText && (
        <p
          id={helpId}
          className="text-[12px] text-muted-foreground leading-snug"
        >
          {helpText}
        </p>
      )}
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-start gap-1.5 text-[12px] text-destructive font-medium leading-snug mt-1"
        >
          <span
            aria-hidden
            className="mt-[3px] h-1 w-1 rounded-full bg-destructive shrink-0"
          />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
