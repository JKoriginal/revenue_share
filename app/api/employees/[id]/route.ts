import { prisma } from "@/lib/prisma";
import { employeeSchema, idSchema } from "@/lib/validators";
import { handleApiError, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    const data = employeeSchema.parse(await request.json());
    return ok(await prisma.employee.update({ where: { id }, data }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    await prisma.employee.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
