import { z } from "zod";
import { schemaToZod } from "../../src/validator/schema-to-zod";
const formSchema = {
  version: 1 as const,
  fields: [
    {
      id: "1",
      name: "fullName",
      type: "input",
      label: "Full Name",
      required: true,
      validation: [{ type: "minLength", value: 2, message: "Too short" }],
    },
    {
      id: "2",
      name: "email",
      type: "email",
      label: "Email",
      validation: [{ type: "email", message: "Invalid email" }],
    },
    // Bounds live in `validation` rules (honored by BOTH renderer and server).
    // `props.min`/`props.max` only drive the input's spinner — they are NOT
    // validation, so the translator ignores them (add them via `inject` if you
    // want server-side spinner bounds enforced).
    {
      id: "3",
      name: "age",
      type: "number",
      label: "Age",
      props: { min: 18, max: 120 },
      validation: [
        { type: "min", value: 18, message: "Must be 18+" },
        { type: "max", value: 120, message: "Too large" },
      ],
    },
    {
      id: "4",
      name: "rating",
      type: "input",
      label: "Rating",
      meta: { widget: "rating" },
    }, // widget
    {
      id: "5",
      name: "address",
      type: "section",
      label: "Address",
      children: [
        { id: "5a", name: "city", type: "input", label: "City" },
        {
          id: "5b",
          name: "zip",
          type: "input",
          label: "ZIP",
          validation: [
            { type: "pattern", value: "^\\d{5}$", message: "5 digits" },
          ],
        },
      ],
    },
  ],
};

// Build the Zod schema once. Widgets/custom types are injected here.
const validator = schemaToZod(formSchema, {
  inject: {
    rating: () => z.number().int().min(0).max(5), // the widget's custom rule
  },
});

function show(title: string, payload: Record<string, unknown>) {
  const result = validator.safeParse(payload);
  console.log(`\n── ${title} ──`);
  if (result.success) {
    console.log("✅ valid. cleaned data:", result.data);
  } else {
    console.log(
      "❌ invalid. field errors:",
      result.error.flatten().fieldErrors,
    );
  }
}

show("Valid submission", {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  age: 36,
  rating: 4,
  city: "London",
  zip: "12345", // section children arrive flat
  legacyKey: "dropped-silently", // stray key → stripped, not rejected
});

show("Invalid submission", {
  fullName: "A", // minLength 2
  email: "not-an-email", // email
  age: 5, // min 18
  rating: 9, // injected widget rule: max 5
  zip: "ABC", // pattern
});
