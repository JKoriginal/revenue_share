import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { distributionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const data = distributionSchema.parse(await request.json());

    const sectionTotal = data.sections.reduce((sum, section) => sum + section.percentage, 0);
    if (sectionTotal > 100) {
      return Response.json({ message: "Section percentages must total 100% or less." }, { status: 422 });
    }

    for (const section of data.sections) {
      const roleTotal = section.employees.reduce((sum, employee) => sum + employee.rolePercentage, 0);
      if (roleTotal > 100) {
        return Response.json({ message: "Employee percentages per section must total 100% or less." }, { status: 422 });
      }
    }

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return Response.json({ message: "Product not found." }, { status: 404 });
    }

    const revenue = Number(product.revenue);

    await prisma.$transaction(async (tx) => {
      await tx.productEmployeeAssignment.deleteMany({ where: { productId: data.productId } });
      await tx.productSection.deleteMany({ where: { productId: data.productId } });

      for (const section of data.sections) {
        await tx.productSection.create({
          data: {
            productId: data.productId,
            sectionId: section.sectionId,
            percentage: new Prisma.Decimal(section.percentage)
          }
        });

        const sectionAmount = revenue * (section.percentage / 100);

        for (const employee of section.employees) {
          await tx.productEmployeeAssignment.create({
            data: {
              productId: data.productId,
              employeeId: employee.employeeId,
              rolePercentage: new Prisma.Decimal(employee.rolePercentage),
              calculatedAmount: new Prisma.Decimal(sectionAmount * (employee.rolePercentage / 100))
            }
          });
        }
      }
    });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const productId = Number(url.searchParams.get("productId"));

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json({ message: "A valid product is required." }, { status: 422 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.productEmployeeAssignment.deleteMany({ where: { productId } });
      await tx.productSection.deleteMany({ where: { productId } });
    });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
