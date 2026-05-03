import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { idSchema, roleSchema } from "@/lib/validators";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    return ok(await prisma.role.update({ where: { id }, data: roleSchema.parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    await prisma.role.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
