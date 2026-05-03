import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function resetAutoIncrement(tableName: string) {
  await prisma.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
}

async function main() {
  console.log("Cleaning database data...");

  await prisma.$transaction(async (tx) => {
    await tx.productEmployeeAssignment.deleteMany();
    await tx.productSection.deleteMany();
    await tx.product.deleteMany();
    await tx.employee.deleteMany();
    await tx.section.deleteMany();
    await tx.role.deleteMany();
    await tx.user.deleteMany({ where: { role: UserRole.ADMIN } });
  });

  for (const tableName of ["productemployeeassignment", "productsection", "product", "employee", "section", "role"]) {
    await resetAutoIncrement(tableName);
  }

  const counts = await Promise.all([
    prisma.product.count(),
    prisma.employee.count(),
    prisma.section.count(),
    prisma.role.count(),
    prisma.productSection.count(),
    prisma.productEmployeeAssignment.count(),
    prisma.user.count({ where: { role: UserRole.SUPERADMIN } })
  ]);

  console.log("Database data cleaned. Super admin users were kept.");
  console.log(
    `Counts after cleanup: products=${counts[0]}, employees=${counts[1]}, sections=${counts[2]}, roles=${counts[3]}, productSections=${counts[4]}, assignments=${counts[5]}, superAdmins=${counts[6]}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
