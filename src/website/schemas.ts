import type { FormSchema } from "@/components/react-custom-form-builder";

/** One of each common field type — used by the live "Field types" gallery. */
export const GALLERY_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "g1", name: "text", type: "input", label: "Text input", placeholder: "Type here" },
    { id: "g2", name: "email", type: "email", label: "Email", placeholder: "you@example.com" },
    { id: "g3", name: "num", type: "number", label: "Number", props: { min: 0, max: 100 } },
    { id: "g4", name: "bio", type: "textarea", label: "Textarea", placeholder: "A few words…" },
    { id: "g5", name: "role", type: "select", label: "Dropdown",
      options: [{ label: "Admin", value: "a" }, { label: "Editor", value: "e" }, { label: "Viewer", value: "v" }] },
    { id: "g6", name: "skills", type: "multiSelect", label: "Multi-select",
      options: [{ label: "React", value: "react" }, { label: "TS", value: "ts" }, { label: "Go", value: "go" }] },
    { id: "g7", name: "plan", type: "radio", label: "Radio",
      options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] },
    { id: "g8", name: "agree", type: "checkbox", label: "Checkbox — I agree" },
    { id: "g9", name: "notify", type: "switch", label: "Switch — notifications" },
    { id: "g10", name: "exp", type: "slider", label: "Slider", defaultValue: 5, props: { min: 0, max: 10, step: 1 } },
    { id: "g11", name: "when", type: "datePicker", label: "Date picker" },
    { id: "g12", name: "at", type: "timePicker", label: "Time picker" },
    { id: "g13", name: "range", type: "dateRange", label: "Date range" },
    { id: "g14", name: "doc", type: "file", label: "File upload", props: { accept: ".pdf,.png", maxSizeMB: 5, maxCount: 2, multiple: true } },
  ],
};

/** Built-in validation rules. */
export const VALIDATION_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "v1", name: "username", type: "input", label: "Username", required: true,
      validation: [{ type: "minLength", value: 3, message: "At least 3 characters" }] },
    { id: "v2", name: "email", type: "email", label: "Email", required: true,
      validation: [{ type: "email", message: "Enter a valid email" }] },
    { id: "v3", name: "age", type: "number", label: "Age",
      validation: [{ type: "min", value: 18, message: "Must be 18+" }, { type: "max", value: 120, message: "Too large" }] },
    { id: "v4", name: "pin", type: "input", label: "PIN code",
      validation: [{ type: "pattern", value: "^\\d{6}$", message: "Exactly 6 digits" }] },
  ],
};

/** Per-field hooks: transform on submit + custom validation. */
export const HOOKS_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "h1", name: "email", type: "email", label: "Email (lowercased on submit)", required: true,
      hooks: { beforeSubmit: `function beforeSubmit(value) { return String(value).trim().toLowerCase(); }` } },
    { id: "h2", name: "password", type: "password", label: "Password", required: true },
    { id: "h3", name: "confirm", type: "password", label: "Confirm password", required: true,
      hooks: { validate: `function validate(value, name, all) {
  if (value !== all.password) return "Passwords do not match";
  return true;
}` } },
  ],
};

/** Per-field beforePreload: the initial value is normalized when the form loads.
 *  Render with initialValues={{ invoice: "inv 2026 07" }} → shows "INV-2026-07". */
export const PRELOAD_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "p1", name: "invoice", type: "input", label: "Invoice # — normalized on load",
      helpText: "beforePreload upper-cases and dashes the preloaded value",
      hooks: { beforePreload: `function beforePreload(value) {
  return String(value || "").toUpperCase().replace(/\\s+/g, "-");
}` } },
  ],
};

/** Global beforePreload: derive a field from others when the form loads.
 *  Render with initialValues={{ first: "ada", last: "lovelace" }} → fullName = "Ada Lovelace". */
export const GLOBAL_PRELOAD_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "gp1", name: "first", type: "input", label: "First name" },
    { id: "gp2", name: "last", type: "input", label: "Last name" },
    { id: "gp3", name: "fullName", type: "input", label: "Full name — auto-filled on load" },
  ],
  globalHooks: {
    beforePreload: `function beforePreload(values) {
  var cap = function (s) { return s ? s[0].toUpperCase() + s.slice(1) : s; };
  return Object.assign({}, values, { fullName: cap(values.first) + " " + cap(values.last) });
}`,
  },
};

/** Global validate + global beforeSubmit: cross-field rule, then reshape the payload. */
export const GLOBAL_SUBMIT_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "gs1", name: "start", type: "datePicker", label: "Start date", required: true },
    { id: "gs2", name: "end", type: "datePicker", label: "End date", required: true },
  ],
  globalHooks: {
    validate: `function validate(values) {
  if (values.start && values.end && values.start > values.end) return "Start must be before end date";
}`,
    beforeSubmit: `function beforeSubmit(values) {
  return Object.assign({}, values, { range: values.start + " → " + values.end });
}`,
  },
};

/** Reactive side effect: choosing "Other" reveals a text field. */
export const SIDE_EFFECT_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "se1", name: "accountType", type: "radio", label: "Account type", required: true, defaultValue: "personal",
      options: [{ label: "Personal", value: "personal" }, { label: "Business", value: "business" }],
      hooks: { sideEffect: `function sideEffect(value) {
  if (value === "business") {
    // SHOW the company fields and OVERRIDE the plan to "team"
    return { hide: [], disable: [], override: { plan: "team" } };
  }
  // personal: HIDE company fields + DISABLE invoice email, plan back to "free"
  return { hide: ["companyName", "taxId"], disable: ["invoiceEmail"], override: { plan: "free" } };
}` } },
    { id: "se2", name: "companyName", type: "input", label: "Company name", required: true, placeholder: "Acme Inc." },
    { id: "se3", name: "taxId", type: "input", label: "Tax ID" },
    { id: "se4", name: "invoiceEmail", type: "email", label: "Invoice email", placeholder: "billing@acme.com" },
    { id: "se5", name: "plan", type: "input", label: "Plan (auto-set)", readOnly: true, defaultValue: "free" },
  ],
};

/** Section + tabs — children flatten on submit. */
export const CONTAINER_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "c0", name: "_h", type: "heading", label: "Shipping", props: { level: "h4" } },
    { id: "c1", name: "address", type: "section", label: "Address", children: [
      { id: "c1a", name: "city", type: "input", label: "City", required: true },
      { id: "c1b", name: "zip", type: "input", label: "ZIP", validation: [{ type: "pattern", value: "^\\d{5}$", message: "5 digits" }] },
    ] },
    { id: "c2", name: "contact", type: "tabs", label: "Contact", tabs: [
      { key: "email", label: "Email", fields: [{ id: "c2a", name: "email", type: "email", label: "Email" }] },
      { key: "phone", label: "Phone", fields: [{ id: "c2b", name: "phone", type: "phone", label: "Phone" }] },
    ] },
  ],
};

// Widgets are registered as fields with category "widget" (see formloom-setup).
// FieldType is a fixed union, so cast the custom type strings.
const t = (s: string) => s as FormSchema["fields"][number]["type"];

// ── Layout field types (each gets its own docs section) ──────────────────────
export const SECTION_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "sc0", name: "_h", type: "heading", label: "Account", props: { level: "h4" } },
    { id: "sc1", name: "billing", type: "section", label: "Billing address", children: [
      { id: "sc1a", name: "street", type: "input", label: "Street", required: true },
      { id: "sc1b", name: "city", type: "input", label: "City" },
      { id: "sc1c", name: "zip", type: "input", label: "ZIP", validation: [{ type: "pattern", value: "^\\d{5}$", message: "5 digits" }] },
    ] },
  ],
};

export const TABS_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "tb1", name: "contact", type: "tabs", label: "Contact", tabs: [
      { key: "email", label: "Email", fields: [{ id: "tb1a", name: "email", type: "email", label: "Work email", required: true }] },
      { key: "phone", label: "Phone", fields: [{ id: "tb1b", name: "phone", type: "phone", label: "Mobile", required: true }] },
    ] },
  ],
};

export const COLUMNS_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "co1", name: "nameCols", type: "columns", label: "Name", props: { columns: 2 }, children: [
      { id: "co1a", name: "firstName", type: "input", label: "First name" },
      { id: "co1b", name: "lastName", type: "input", label: "Last name" },
    ] },
    { id: "co2", name: "cityCols", type: "columns", label: "Location", props: { columns: 3 }, children: [
      { id: "co2a", name: "city", type: "input", label: "City" },
      { id: "co2b", name: "state", type: "input", label: "State" },
      { id: "co2c", name: "country", type: "input", label: "Country" },
    ] },
  ],
};

export const ARRAY_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "ar1", name: "lineItems", type: "array", label: "Line items",
      props: { description: "Add one row per item", addLabel: "Add item", minRows: 1 },
      children: [
        { id: "ar1a", name: "item", type: "input", label: "Item" },
        { id: "ar1b", name: "qty", type: "number", label: "Qty", defaultValue: 1 },
      ] },
  ],
};

/** Array of arrays — departments, each with its own members repeater. */
export const NESTED_ARRAY_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "nar", name: "departments", type: "array", label: "Departments",
      props: { addLabel: "Add department", minRows: 1 },
      children: [
        { id: "nar-n", name: "deptName", type: "input", label: "Department" },
        { id: "nar-m", name: "members", type: "array", label: "Members",
          props: { addLabel: "Add member" },
          children: [
            { id: "nar-mn", name: "memberName", type: "input", label: "Name" },
            { id: "nar-mr", name: "role", type: "select", label: "Role",
              options: [{ label: "Lead", value: "lead" }, { label: "Member", value: "member" }] },
          ] },
      ] },
  ],
};

export const DIVIDER_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "dv1", name: "firstName", type: "input", label: "First name" },
    { id: "dv2", name: "_div", type: "divider", label: "" },
    { id: "dv3", name: "notes", type: "textarea", label: "Notes" },
  ],
};

/** One field per demo widget. */
export const DOMAIN_SCHEMA: FormSchema = {
  version: 1,
  fields: [{ id: "wd", name: "subdomain", type: t("domain"), label: "Custom domain", props: { suffix: ".acme.io" } }],
};
export const RATING_SCHEMA: FormSchema = {
  version: 1,
  fields: [{ id: "wr", name: "rating", type: t("rating"), label: "Satisfaction", defaultValue: 0, props: { max: 5, icon: "star" } }],
};
export const COUNTRY_SCHEMA: FormSchema = {
  version: 1,
  fields: [{ id: "wc", name: "countries", type: t("country"), label: "Countries (async, multi)", props: { multiple: true, showFlags: true } }],
};

/** The SAME widgets with different field.props → different behavior. */
export const DYNAMIC_PROPS_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "dp1", name: "stars", type: t("rating"), label: 'Rating — props: { max: 5, icon: "star" }', defaultValue: 0, props: { max: 5, icon: "star" } },
    { id: "dp2", name: "hearts", type: t("rating"), label: 'Rating — props: { max: 3, icon: "heart" }', defaultValue: 0, props: { max: 3, icon: "heart" } },
    { id: "dp3", name: "homeCountry", type: t("country"), label: 'Country — props: { multiple: false, showFlags: false }', props: { multiple: false, showFlags: false } },
  ],
};

/** Custom-registered field type (`color`, registered in demo/formloom-setup). */
export const CUSTOM_FIELD_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "cf1", name: "label", type: "input", label: "Label" },
    { id: "cf2", name: "brand", type: "color" as FormSchema["fields"][number]["type"], label: "Brand color — a custom field type" },
  ],
};

/** File upload — the payload shows the File objects your onSubmit receives. */
export const FILE_SCHEMA: FormSchema = {
  version: 1,
  fields: [
    { id: "f1", name: "resume", type: "file", label: "Resume (single, PDF, max 5 MB)",
      props: { accept: ".pdf", maxSizeMB: 5, maxCount: 1 } },
    { id: "f2", name: "photos", type: "file", label: "Photos (multiple, max 3)",
      props: { accept: ".png,.jpg,.jpeg", maxSizeMB: 2, maxCount: 3, multiple: true } },
  ],
};
