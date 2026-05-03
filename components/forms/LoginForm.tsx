"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({ defaultValues: { email: "superadmin@example.com", password: "admin123" } });

  function onSubmit(values: LoginValues) {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.message || "Login failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-soft">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-stone-600">Use your admin account to manage revenue sharing.</p>
      </div>
      <div className="space-y-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
        <Input
          label="Password"
          type="password"
          error={errors.password?.message}
          {...register("password", { required: "Password is required" })}
        />
      </div>
      {message ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
      <Button className="mt-5 w-full" disabled={isPending}>
        <LogIn className="h-4 w-4" />
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
