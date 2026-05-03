import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ message: error.errors[0]?.message || "Invalid input" }, { status: 422 });
  }

  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return NextResponse.json({ message: "A unique field already exists." }, { status: 409 });
  }

  console.error(error);
  return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
}
