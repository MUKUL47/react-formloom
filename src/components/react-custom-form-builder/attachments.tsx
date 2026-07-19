import { createContext, useContext, type ReactNode } from "react";

/**
 * Already-uploaded file living on the server, as opposed to a `File` the user
 * just picked and hasn't submitted yet. Deliberately generic — the host app
 * adapts its own media API into this shape.
 */
export interface ExistingAttachment {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export interface AttachmentsApi {
  /** Server-side files already stored against a given field name. */
  getFor: (fieldName: string) => ExistingAttachment[];
  onDelete?: (id: string) => void | Promise<void>;
  onDownload?: (id: string) => void;
}

const AttachmentsContext = createContext<AttachmentsApi | null>(null);

/**
 * Optional. Wrap a `<FormRenderer>` in this to let `file` fields render the
 * files already uploaded against them, instead of the host app listing every
 * file in one lump elsewhere. Without a provider, `file` fields behave exactly
 * as before — only the freshly picked `File`s are shown.
 *
 * Context (not a prop) because fields can be nested arbitrarily deep inside
 * `section` / `tabs` containers, which would otherwise each have to forward it.
 */
export function AttachmentsProvider({
  value,
  children,
}: {
  value: AttachmentsApi;
  children: ReactNode;
}) {
  return (
    <AttachmentsContext.Provider value={value}>
      {children}
    </AttachmentsContext.Provider>
  );
}

export function useAttachments(): AttachmentsApi | null {
  return useContext(AttachmentsContext);
}
