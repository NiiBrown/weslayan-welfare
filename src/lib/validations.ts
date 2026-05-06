import { z } from "zod";

// ─── Member Schemas ───
export const createMemberSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^\+?[0-9\s\-]+$/, "Phone number can only contain digits, spaces, dashes, and an optional leading +"),
  yearGroup: z
    .string()
    .max(10, "Year group must be under 10 characters")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(100, "Location must be under 100 characters")
    .optional()
    .or(z.literal("")),
});

export const updateMemberSchema = z.object({
  fullName: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\+?[0-9\s\-]+$/)
    .optional(),
  yearGroup: z.string().max(10).optional(),
  location: z.string().max(100).optional(),
  status: z.enum(["active", "inactive", "removed"]).optional(),
});

// ─── Payment Schemas ───
export const createPaymentSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(1000000, "Amount seems too large — please double-check"),
  paymentDate: z
    .string()
    .refine(
      (d) => !isNaN(Date.parse(d)),
      "Please enter a valid date"
    )
    .optional()
    .transform((d) => d || new Date().toISOString()),
  method: z
    .enum(["mobile_money", "bank_transfer", "cash"], {
      errorMap: () => ({ message: "Payment method must be mobile_money, bank_transfer, or cash" }),
    })
    .default("cash"),
  reference: z.string().max(100, "Reference is too long").optional().or(z.literal("")),
  recordedBy: z.string().max(100).optional().default("Admin"),
  notes: z.string().max(500, "Notes must be under 500 characters").optional().or(z.literal("")),
});

// ─── Expense Schemas ───
export const createExpenseSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters")
    .trim(),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(10000000, "Amount seems too large — please double-check"),
  date: z
    .string()
    .refine(
      (d) => !isNaN(Date.parse(d)),
      "Please enter a valid date"
    )
    .optional()
    .transform((d) => d || new Date().toISOString()),
  category: z
    .enum(["medical", "bereavement", "marriage", "naming_ceremony", "other"], {
      errorMap: () => ({ message: "Please select a valid category" }),
    })
    .default("other"),
  description: z.string().max(1000, "Description must be under 1000 characters").optional().or(z.literal("")),
  approvedBy: z.string().max(100, "Name must be under 100 characters").optional().default("Admin"),
});

// ─── Dues Schemas ───
export const assignDuesSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format (e.g. 2024-06)"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(100000, "Amount seems too large"),
  memberIds: z.array(z.string()).optional(),
});

// ─── Announcement Schemas ───
export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters")
    .trim(),
  content: z
    .string()
    .min(5, "Content must be at least 5 characters")
    .max(5000, "Content must be under 5000 characters")
    .trim(),
  priority: z
    .enum(["high", "medium", "low"], {
      errorMap: () => ({ message: "Priority must be high, medium, or low" }),
    })
    .default("low"),
});

// ─── SMS Schemas ───
export const sendSmsSchema = z.object({
  preview: z.boolean().default(false),
});

// ─── Helper: Parse and return errors ───
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Flatten Zod errors into a clean object
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "_root";
    if (!errors[field]) errors[field] = [];
    errors[field].push(issue.message);
  }

  return { success: false, errors };
}
