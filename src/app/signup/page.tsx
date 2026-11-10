import { signUp } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { SITE } from "@/config/site";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="app-canvas flex min-h-dvh flex-col">
      <div className="relative z-[1] mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <Link href="/" className="type-body-strong text-muted transition-colors hover:text-soft">
          ← {SITE.shortName}
        </Link>
        <h1 className="type-page mt-8">Create account</h1>
        <p className="type-body mt-2">Start logging sessions with {SITE.name}.</p>
        <div className="surface mt-8 p-6">
          <AuthForm mode="signup" action={signUp} />
        </div>
      </div>
    </div>
  );
}
