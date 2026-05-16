import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Users, MessageCircle, UserPlus, Heart } from "lucide-react";

const steps = [
  { number: "01", icon: LogIn, title: "Join the platform", description: "Create your profile in seconds. No lengthy forms, no friction. Just pick a username and go.", className: "md:col-span-3 lg:col-span-5", shape: "rounded-[2rem] rounded-tr-[4rem]" },
  { number: "02", icon: Users, title: "Match with strangers", description: "The queue pairs you with someone interesting based on shared topics and availability.", className: "md:col-span-3 lg:col-span-3", shape: "rounded-[2rem]" },
  { number: "03", icon: MessageCircle, title: "Start chatting instantly", description: "Messages flow in real time. No awkward pauses, no refresh needed. Just pure conversation.", className: "md:col-span-6 lg:col-span-4", shape: "rounded-[2rem] rounded-bl-[4rem]" },
  { number: "04", icon: UserPlus, title: "Send friend requests", description: "Vibed with someone? Send a friend request to keep the conversation going beyond the match.", className: "md:col-span-3 lg:col-span-4", shape: "rounded-[2rem] rounded-br-[4rem]" },
  { number: "05", icon: Heart, title: "Stay connected", description: "Build your friend list, see who is online, and never lose touch with the people you meet.", className: "md:col-span-3 lg:col-span-8", shape: "rounded-[2rem] rounded-tl-[4rem]" },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-background py-14 md:py-20" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 grid gap-4 md:mb-11 md:grid-cols-[0.85fr_1fr] md:items-end">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">How it works</span>
            <h2 id="how-it-works-heading" className="max-w-xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Five steps to your next conversation
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 tracking-[0.01em] text-muted-foreground md:justify-self-end">We stripped away the complexity. Meeting new people should be as direct as sending a text, with safety and follow-up built in.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:gap-4 lg:grid-cols-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isFeatured = index === 0 || index === steps.length - 1;

            return (
              <Card key={step.number} className={`group relative h-full gap-0 overflow-hidden border-border py-0 shadow-sm transition-all duration-300 hover:border-primary/25 ${step.className} ${step.shape} ${isFeatured ? "bg-secondary/65" : "bg-card"}`}>
                <CardContent className="relative flex min-h-44 h-full flex-col justify-between gap-6 p-5 sm:p-6">
                  <span className="pointer-events-none absolute right-5 top-3 text-6xl font-bold tracking-[-0.08em] text-muted-foreground/10" aria-hidden="true">
                    {step.number}
                  </span>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background transition-colors duration-300 group-hover:bg-primary/10" aria-hidden="true">
                      <Icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-background px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Step {step.number}
                    </Badge>
                  </div>
                  <div className="relative">
                    <h3 className="mb-2 text-base font-semibold tracking-[0.01em] text-foreground">{step.title}</h3>
                    <p className="text-sm leading-6 tracking-[0.01em] text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
