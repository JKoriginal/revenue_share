import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();

export const employeeSchema = z.object({
  epfNumber: z.string().min(2, "EPF number is required").max(50),
  name: z.string().min(2, "Name is required").max(120),
  sectionId: idSchema,
  roleId: idSchema
});

export const sectionSchema = z.object({
  name: z.string().min(2, "Section name is required").max(100),
  description: z.string().max(1000).optional().nullable()
});

export const roleSchema = z.object({
  name: z.string().min(2, "Role name is required").max(100)
});

export const productSchema = z.object({
  itemCode: z.string().min(2, "Item code is required").max(80),
  itemName: z.string().min(2, "Item name is required").max(160),
  revenue: z.coerce.number().gt(0, "Revenue must be greater than 0")
});

export const adminSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const distributionSchema = z.object({
  productId: idSchema,
  sections: z
    .array(
      z.object({
        sectionId: idSchema,
        percentage: z.coerce.number().gt(0).lte(100),
        employees: z
          .array(
            z.object({
              employeeId: idSchema,
              rolePercentage: z.coerce.number().gt(0).lte(100)
            })
          )
          .min(1)
      })
    )
    .min(1)
});
