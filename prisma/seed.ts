import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@example.com",
      passwordHash,
      role: UserRole.SUPERADMIN
    }
  });

  const [cutting, stitching, packing] = await Promise.all([
    prisma.section.upsert({
      where: { name: "Cutting" },
      update: {},
      create: { name: "Cutting", description: "Material preparation and cutting team" }
    }),
    prisma.section.upsert({
      where: { name: "Stitching" },
      update: {},
      create: { name: "Stitching", description: "Production and assembly team" }
    }),
    prisma.section.upsert({
      where: { name: "Packing" },
      update: {},
      create: { name: "Packing", description: "Quality check and packing team" }
    })
  ]);

  const [leader, operator, assistant] = await Promise.all([
    prisma.role.upsert({
      where: { name: "Team Leader" },
      update: {},
      create: { name: "Team Leader" }
    }),
    prisma.role.upsert({
      where: { name: "Operator" },
      update: {},
      create: { name: "Operator" }
    }),
    prisma.role.upsert({
      where: { name: "Assistant" },
      update: {},
      create: { name: "Assistant" }
    })
  ]);

  await Promise.all([
    prisma.employee.upsert({
      where: { epfNumber: "EPF001" },
      update: {},
      create: { epfNumber: "EPF001", name: "Nimali Perera", sectionId: cutting.id, roleId: leader.id }
    }),
    prisma.employee.upsert({
      where: { epfNumber: "EPF002" },
      update: {},
      create: { epfNumber: "EPF002", name: "Kasun Silva", sectionId: stitching.id, roleId: operator.id }
    }),
    prisma.employee.upsert({
      where: { epfNumber: "EPF003" },
      update: {},
      create: { epfNumber: "EPF003", name: "Ayesha Fernando", sectionId: packing.id, roleId: assistant.id }
    })
  ]);

  await prisma.product.upsert({
    where: { itemCode: "PRD-1001" },
    update: {},
    create: { itemCode: "PRD-1001", itemName: "Premium Shirt Batch", revenue: 250000 }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
