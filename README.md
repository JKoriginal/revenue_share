# Employee Revenue Share

A full-stack Next.js App Router application for managing company sections, employees, products, and revenue-sharing calculations.

## Features

- Email/password authentication with `SUPERADMIN` and `ADMIN` roles
- Only `SUPERADMIN` can create admin users
- CRUD for employees, sections, roles, and products
- Revenue distribution by product, section percentage, and per-product employee percentage
- Calculation preview before saving
- Dashboard cards, recent products, revenue chart, and employee earnings summary
- Product -> section -> employee report

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- MySQL
- React Hook Form

## XAMPP MySQL Setup

Your database name and port are already reflected in `.env.example`:

```env
DATABASE_URL="mysql://root:@localhost:3307/employee_revenue"
AUTH_SECRET="replace-with-a-long-random-secret"
```

Create a real `.env` file with those values. If your XAMPP MySQL user has a password, update the URL:

```env
DATABASE_URL="mysql://root:your_password@localhost:3307/employee_revenue"
```

In phpMyAdmin, create a database named:

```sql
employee_revenue
```

## Installation

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Open:

```txt
http://127.0.0.1:3000
```

Seed login:

```txt
Email: superadmin@example.com
Password: admin123
```

## Calculation Rules

Section amount:

```txt
Product Revenue x Section Percentage
```

Employee amount:

```txt
Section Amount x Role Percentage
```

Validation included:

- EPF number is unique
- Product item code is unique
- Revenue must be greater than 0
- Section percentages must total 100% or less
- Employee percentages within a section must total 100% or less

## Main Files

- `prisma/schema.prisma` - database schema
- `prisma/seed.ts` - sample seed data and super admin
- `lib/auth.ts` - JWT cookie authentication
- `app/api/*` - REST API route handlers
- `components/forms/*` - reusable form flows
- `app/dashboard` - overview dashboard
- `app/distribution` - revenue distribution workflow
- `app/reports` - saved distribution reports
