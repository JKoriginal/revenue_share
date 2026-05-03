import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sectionCount = 18;
const roleCount = 8;
const employeeCount = 1200;
const productCount = 240;

function randomFrom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomMoney(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function productDate(index: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - (index % 12));
  date.setDate(1 + (index % 25));
  date.setHours(9, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Creating large test dataset...");

  const sections = [];
  for (let index = 1; index <= sectionCount; index++) {
    const section = await prisma.section.upsert({
      where: { name: `Load Test Section ${index}` },
      update: {
        description: `Generated section ${index} for large dataset testing`
      },
      create: {
        name: `Load Test Section ${index}`,
        description: `Generated section ${index} for large dataset testing`
      }
    });
    sections.push(section);
  }

  const roles = [];
  for (let index = 1; index <= roleCount; index++) {
    const role = await prisma.role.upsert({
      where: { name: `Load Test Role ${index}` },
      update: {},
      create: { name: `Load Test Role ${index}` }
    });
    roles.push(role);
  }

  const existingEmployees = await prisma.employee.findMany({
    where: { epfNumber: { startsWith: "LDT-" } },
    select: { id: true, epfNumber: true }
  });
  const existingEmployeeSet = new Set(existingEmployees.map((employee) => employee.epfNumber));
  const employeesToCreate = [];

  for (let index = 1; index <= employeeCount; index++) {
    const epfNumber = `LDT-${String(index).padStart(5, "0")}`;
    if (existingEmployeeSet.has(epfNumber)) continue;

    employeesToCreate.push({
      epfNumber,
      name: `Load Test Employee ${index}`,
      sectionId: sections[(index - 1) % sections.length].id,
      roleId: roles[(index - 1) % roles.length].id
    });
  }

  if (employeesToCreate.length) {
    await prisma.employee.createMany({ data: employeesToCreate });
  }

  const employees = await prisma.employee.findMany({
    where: { epfNumber: { startsWith: "LDT-" } },
    select: { id: true, sectionId: true }
  });

  for (let productIndex = 1; productIndex <= productCount; productIndex++) {
    const itemCode = `LDP-${String(productIndex).padStart(5, "0")}`;
    const revenue = randomMoney(75000, 950000);

    const product = await prisma.product.upsert({
      where: { itemCode },
      update: {
        itemName: `Load Test Product Batch ${productIndex}`,
        revenue: new Prisma.Decimal(revenue),
        createdAt: productDate(productIndex)
      },
      create: {
        itemCode,
        itemName: `Load Test Product Batch ${productIndex}`,
        revenue: new Prisma.Decimal(revenue),
        createdAt: productDate(productIndex)
      }
    });

    await prisma.productEmployeeAssignment.deleteMany({ where: { productId: product.id } });
    await prisma.productSection.deleteMany({ where: { productId: product.id } });

    const selectedSections = [...sections].sort(() => Math.random() - 0.5).slice(0, 4);
    const sectionPercentages = [35, 25, 20, 15];

    for (let sectionIndex = 0; sectionIndex < selectedSections.length; sectionIndex++) {
      const section = selectedSections[sectionIndex];
      const sectionPercentage = sectionPercentages[sectionIndex];
      const sectionAmount = revenue * (sectionPercentage / 100);

      await prisma.productSection.create({
        data: {
          productId: product.id,
          sectionId: section.id,
          percentage: new Prisma.Decimal(sectionPercentage)
        }
      });

      const sectionEmployees = employees
        .filter((employee) => employee.sectionId === section.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

      const employeePercentage = sectionEmployees.length ? Math.floor((90 / sectionEmployees.length) * 100) / 100 : 0;

      await prisma.productEmployeeAssignment.createMany({
        data: sectionEmployees.map((employee) => ({
          productId: product.id,
          employeeId: employee.id,
          rolePercentage: new Prisma.Decimal(employeePercentage),
          calculatedAmount: new Prisma.Decimal(sectionAmount * (employeePercentage / 100))
        }))
      });
    }

    if (productIndex % 25 === 0) {
      console.log(`Imported ${productIndex}/${productCount} products with distributions...`);
    }
  }

  console.log("Large dataset import complete.");
  console.log(`Sections: ${sectionCount}, roles: ${roleCount}, employees: ${employeeCount}, products: ${productCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
