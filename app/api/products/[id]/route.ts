import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { idSchema, productSchema } from "@/lib/validators";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    return ok(await prisma.product.update({ where: { id }, data: productSchema.parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    await prisma.product.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
