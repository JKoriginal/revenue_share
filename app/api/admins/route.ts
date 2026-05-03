import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { hashPassword, requireApiSuperAdmin } from "@/lib/auth";
import { adminSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth.response) return auth.response;

  try {
    const data = adminSchema.parse(await request.json());
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: UserRole.ADMIN
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return ok(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
