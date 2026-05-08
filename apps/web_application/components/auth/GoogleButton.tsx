"use client";

import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() => start(() => { void signIn("google", { callbackUrl: "/app" }); })}
    >
      {pending ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
