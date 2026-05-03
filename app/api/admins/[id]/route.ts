import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { hashPassword, requireApiSuperAdmin } from "@/lib/auth";
import { idSchema } from "@/lib/validators";
import { z } from "zod";

const updateAdminSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().optional()
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiSuperAdmin();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    const data = updateAdminSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        ...(data.password && data.password.length >= 6 ? { passwordHash: await hashPassword(data.password) } : {})
      },
      select: { id: true, name: true, email: true, role: true }
    });
    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiSuperAdmin();
  if (auth.response) return auth.response;

  try {
    const id = idSchema.parse(params.id);
    if (id === auth.user?.id) {
      return Response.json({ message: "You cannot delete your own account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
