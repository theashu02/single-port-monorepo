"use client";

import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { GOOGLE_LOGO } from "@/core/constants/config";
import Image from "next/image";

export function GoogleButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      disabled={pending}
      onClick={() => start(() => { void signIn("google", { callbackUrl: "/app" }); })}
    >
      <Image src={GOOGLE_LOGO} width={20} height={20} alt="Google logo"/>
      {pending ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
