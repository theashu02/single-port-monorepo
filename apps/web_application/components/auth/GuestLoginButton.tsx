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
    <Button
      variant="outline"
      className="h-12 w-full rounded-lg px-6"
      disabled={isPending}
      onClick={handleGuestLogin}
    >
      <span className="grid min-w-60 grid-cols-[1.5rem_auto] items-center justify-center gap-3">
        <span className="flex size-6 items-center justify-center justify-self-center">
          <Image src={GUEST_LOGO} width={20} height={20} alt="Guest logo" />
        </span>
        <span className="text-left text-sm sm:text-[13px]">
          {isPending ? "Redirecting..." : "Continue as Guest"}
        </span>
      </span>
    </Button>
  );
}
