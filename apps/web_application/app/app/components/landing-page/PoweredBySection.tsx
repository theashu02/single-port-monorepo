import Image from "next/image";

import { BUN_LOGO, ELYSIA_JS, METAMASK_LOGO, LIB_P2P } from "@/core/constants/config";

const technologies = [
  {
    image: BUN_LOGO,
    name: "Bun",
    description: "Fast runtime",
    className: "col-span-2 sm:col-span-2 sm:row-span-2",
    imageClassName: "h-16 sm:h-20 lg:h-24",
  },
  {
    image: ELYSIA_JS,
    name: "ElysiaJS",
    description: "Lean API layer",
    className: "col-span-1 sm:col-span-1",
    imageClassName: "h-12 sm:h-14 lg:h-16",
  },
  {
    image: METAMASK_LOGO,
    name: "MetaMask",
    description: "Wallet-native entry",
    className: "col-span-1 sm:col-span-1",
    imageClassName: "h-12 sm:h-14 lg:h-16",
  },
  {
    image: LIB_P2P,
    name: "libp2p",
    description: "Peer transport",
    className: "col-span-2 sm:col-span-2",
    imageClassName: "h-14 sm:h-16 lg:h-20",
  },
];

export default function PoweredBySection() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-muted/30 py-14 md:py-20" aria-labelledby="powered-by-heading">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-secondary/55 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Powered by these
            </span>
            <h2 id="powered-by-heading" className="max-w-xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Core technologies behind the landing experience
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 tracking-[0.01em] text-muted-foreground">
              A focused stack chosen for fast page loads, wallet-native onboarding, and crisp real-time communication without adding visual weight.
            </p>

            <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xl font-bold tracking-[-0.03em] text-foreground">Static-first</p>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lighthouse friendly</p>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xl font-bold tracking-[-0.03em] text-foreground">Realtime</p>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Low latency stack</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {technologies.map((tech) => (
              <div key={tech.name} className={`group flex min-h-36 flex-col justify-between rounded-4xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/25 ${tech.className}`}>
                <div className="flex min-h-20 items-center justify-center rounded-[1.4rem] bg-muted/60 px-4 py-5">
                  <Image
                    src={tech.image}
                    alt={tech.name}
                    width={200}
                    height={88}
                    className={`w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${tech.imageClassName}`}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 220px"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold tracking-[0.04em] text-foreground">{tech.name}</p>
                  <p className="mt-1 text-xs leading-relaxed tracking-[0.04em] text-muted-foreground">{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
