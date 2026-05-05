"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

export function GuestLoginButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleGuestLogin = () => {
    startTransition(() => {
      router.push("/auth/guest");
    });
  };

  return (
    <Button variant="outline" className="w-full" disabled={isPending} onClick={handleGuestLogin}>
      {isPending ? "Redirecting..." : "Continue as Guest"}
    </Button>
  );
}
