"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/discover");
  }, [router]);

  return <Loader />;
}
