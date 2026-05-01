"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function EmailAuthForm() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("email-password", {
      email: form.email,
      password: form.password,
      name: form.name,
      isRegister: mode === "register" ? "true" : "false",
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (result?.error) {
      const errorMap: Record<string, string> = {
        EMAIL_TAKEN: "An account with this email already exists.",
        INVALID_CREDENTIALS: "Incorrect email or password.",
        PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
        ACCOUNT_BLOCKED: "This account has been suspended.",
      };
      const code = result.error.replace("CredentialsSignin", "INVALID_CREDENTIALS");
      setError(errorMap[code] ?? "Something went wrong. Please try again.");
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {mode === "register" && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
          minLength={8}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
      </Button>

      <button
        type="button"
        className="text-sm text-muted-foreground hover:underline"
        onClick={() => { setMode(m => m === "signin" ? "register" : "signin"); setError(null); }}
      >
        {mode === "signin" ? "Need an account? Register" : "Already have an account? Sign In"}
      </button>
    </form>
  );
}
