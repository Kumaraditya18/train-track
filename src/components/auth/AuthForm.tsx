"use client";

import type { AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import Link from "next/link";
import { useActionState } from "react";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" ? (
        <div>
          <Label htmlFor="display_name">Name</Label>
          <Input id="display_name" name="display_name" autoComplete="name" required />
        </div>
      ) : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {mode === "login" ? "Log in" : "Sign up"}
      </Button>
      <p className="text-center text-sm text-faint">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="link-accent font-medium">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already training?{" "}
            <Link href="/login" className="link-accent font-medium">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
