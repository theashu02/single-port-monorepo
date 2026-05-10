"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { GUEST_LOGO } from "@/core/constants/config";
import Image from "next/image";

export function GuestLoginButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleGuestLogin = () => {
    startTransition(() => {
      router.push("/auth/guest");
    });
  };

  return (
    <Button variant="outline" className="w-full gap-2" disabled={isPending} onClick={handleGuestLogin}>
      <Image src={GUEST_LOGO} width={20} height={20} alt="Guest logo"/>
      {isPending ? "Redirecting..." : "Continue as Guest"}
    </Button>
  );
}
