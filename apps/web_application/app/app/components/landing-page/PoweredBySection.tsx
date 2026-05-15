import Image from "next/image";

import { BUN_LOGO, ELYSIA_JS, METAMASK_LOGO, LIB_P2P } from "@/core/constants/config";

const technologies = [
  {
    image: BUN_LOGO,
    name: "Bun",
  },
  {
    image: ELYSIA_JS,
    name: "ElysiaJS",
  },
  {
    image: METAMASK_LOGO,
    name: "MetaMask",
  },
  {
    image: LIB_P2P,
    name: "libp2p",
  },
];

export default function PoweredBySection() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-muted/30 py-20 md:py-28" aria-labelledby="powered-by-heading">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Powered By These
          </span>
          <h2 id="powered-by-heading" className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Core technologies behind the landing experience
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            The platform is powered by a focused stack chosen for speed, wallet-native onboarding, and crisp real-time communication.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="group flex items-center justify-center"
            >
              <Image
                src={tech.image}
                alt={tech.name}
                width={200}
                height={88}
                className="h-16 w-auto object-contain transition-all duration-300 group-hover:scale-105 md:h-20 lg:h-24"
                sizes="(max-width: 768px) 38vw, (max-width: 1280px) 20vw, 200px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
