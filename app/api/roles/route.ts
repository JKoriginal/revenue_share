import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { roleSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    return ok(await prisma.role.create({ data: roleSchema.parse(await request.json()) }), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
