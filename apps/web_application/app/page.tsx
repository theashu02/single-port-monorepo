"use client";

import Loader from "@/components/ui/Loader";
import dynamic from "next/dynamic";

const LandingPageDynamic = dynamic(
  () => import("./app/components/landing-page/LandingPage"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader />
      </main>
    ),
  }
);

export default function HomePage() {
  return <LandingPageDynamic />;
}