/**
 * DataSourceRegistry + WidgetBridge
 *
 * Two pluggable systems for connecting form fields to external data:
 *
 * 1. DataSource — provides dynamic options for select/multiSelect/radio fields
 *    Register once at app boot, fields reference by name via meta.dataSource
 *
 * 2. Widget — replaces the entire field renderer with a custom component
 *    Register once at app boot, fields reference by name via meta.widget
 *
 * Both are completely agnostic — React Custom Form Builder doesn't know about your APIs,
 * your components, or your data. It just calls the registered handlers.
 */

import type { FC } from "react";
import type { RuntimeFieldProps } from "./types";

// ── Data Source ──────────────────────────────────────────────
// DROPPED. The DataSource registry (registerDataSource / getDataSource / …)
// and the DataSourceField renderer were removed on purpose: a Widget does the
// same job (async options, search, debounce) with more control and one concept
// instead of two. To bring async options to a select-style field, register a
// Widget that fetches and renders its own dropdown (see the async widget
// example in the docs). Kept here as a marker so the history is obvious.

// ── Widget Bridge ────────────────────────────────────────────

export interface WidgetConfig {
  /** Human-readable name shown in builder */
  label: string;
  /** The custom component. Must conform to RuntimeFieldProps. */
  component: FC<RuntimeFieldProps>;
  /** Description shown in builder */
  description?: string;
}

const widgetRegistry = new Map<string, WidgetConfig>();

export function registerWidget(name: string, config: WidgetConfig) {
  widgetRegistry.set(name, config);
}

export function getWidget(name: string): WidgetConfig | undefined {
  return widgetRegistry.get(name);
}

export function getAllWidgets(): Map<string, WidgetConfig> {
  return widgetRegistry;
}

export function getWidgetNames(): { value: string; label: string }[] {
  return Array.from(widgetRegistry.entries()).map(([k, v]) => ({
    value: k,
    label: v.label,
  }));
}
