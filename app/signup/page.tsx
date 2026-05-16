import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<p className="text-center text-slate-500">Loading…</p>}>
        <AuthForm mode="signup" />
      </Suspense>
      <p className="auth-page-back">
        <Link href="/">← Back to WikiMe</Link>
      </p>
    </main>
  );
}
