import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Shuffle, UserPlus, ShieldCheck, Zap, Smartphone, Clock, Bell, Radio, Keyboard } from "lucide-react";

const features = [
  { icon: MessageCircle, title: "Real-time chat", description: "Send and receive messages instantly with zero latency. Feel like you are in the same room." },
  { icon: Shuffle, title: "Random matching", description: "Get paired with interesting strangers based on shared interests and availability." },
  { icon: UserPlus, title: "Friend requests", description: "Had a great conversation? Send a friend request and build lasting connections." },
  { icon: ShieldCheck, title: "Safe moderation", description: "AI-powered content moderation and community standards keep the platform respectful." },
  { icon: Zap, title: "Instant messaging", description: "No delays, no refresh needed. Messages appear the moment they are sent." },
  { icon: Radio, title: "Online status indicators", description: "See who is online, away, or busy with elegant real-time presence indicators." },
  { icon: Smartphone, title: "Mobile responsive", description: "Seamless experience across phones, tablets, and desktops. Chat anywhere." },
  { icon: Clock, title: "Fast matching system", description: "Get matched in under 3 seconds. Our smart queue minimizes wait times." },
  { icon: Keyboard, title: "Typing indicators", description: "Know when someone is typing so you never miss a beat in the conversation." },
  { icon: Bell, title: "Real-time notifications", description: "Get notified instantly for new matches, messages, and friend requests." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-center text-center md:mb-18">
          <span className="mb-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Features</span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need to connect</h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">Built for genuine human connection. Every feature is designed to make meeting new people effortless, safe, and enjoyable.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="group h-full border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-sm">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors duration-300 group-hover:bg-primary/10" aria-hidden="true">
                  <feature.icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
