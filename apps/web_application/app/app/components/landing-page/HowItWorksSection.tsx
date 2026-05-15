import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Users, MessageCircle, UserPlus, Heart } from "lucide-react";

const steps = [
  { number: "01", icon: LogIn, title: "Join the platform", description: "Create your profile in seconds. No lengthy forms, no friction. Just pick a username and go." },
  { number: "02", icon: Users, title: "Match with strangers", description: "Our smart matching engine pairs you with someone interesting based on shared topics and availability." },
  { number: "03", icon: MessageCircle, title: "Start chatting instantly", description: "Messages flow in real time. No awkward pauses, no refresh needed. Just pure conversation." },
  { number: "04", icon: UserPlus, title: "Send friend requests", description: "Vibed with someone? Send a friend request to keep the conversation going beyond the match." },
  { number: "05", icon: Heart, title: "Stay connected", description: "Build your friend list, see who is online, and never lose touch with the people you meet." },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-background py-20 md:py-28" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-center text-center md:mb-18">
          <span className="mb-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">How it works</span>
          <h2 id="how-it-works-heading" className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Five steps to your next conversation
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">We have stripped away the complexity. Meeting new people should be as easy as sending a text.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
          {steps.map((step) => (
            <Card key={step.number} className="group h-full border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-sm rounded-3xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors duration-300 group-hover:bg-primary/10" aria-hidden="true">
                    <step.icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground">
                    {step.number}
                  </Badge>
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
