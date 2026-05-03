import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validators";
import { handleApiError, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const data = employeeSchema.parse(await request.json());
    const employee = await prisma.employee.create({ data });
    return ok(employee, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
