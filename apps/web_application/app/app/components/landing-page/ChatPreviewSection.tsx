import { Badge } from "@/components/ui/badge";

const messages = [
  { id: 1, avatar: "MK", text: "Hey! I saw you are into indie music. Any favorite bands lately?", time: "10:32 AM", isMe: false },
  { id: 2, avatar: "YO", text: "Oh absolutely! I have been obsessed with Men I Trust and Crumb recently.", time: "10:33 AM", isMe: true },
  { id: 3, avatar: "MK", text: "No way!! Crumb is incredible. Have you listened to their latest album?", time: "10:34 AM", isMe: false },
  { id: 4, avatar: "YO", text: "Yes! Ice Melt on repeat. The production is insane.", time: "10:35 AM", isMe: true },
  { id: 5, avatar: "MK", text: "Okay we need to be friends now. Sending you a request!", time: "10:36 AM", isMe: false },
];

const experienceCards = [
  { value: "0", label: "refreshes", description: "Messages stream into the room instantly." },
  { value: "3", label: "signal cues", description: "Presence, typing, and match state stay visible." },
  { value: "1 tap", label: "friend request", description: "Save a good conversation before it ends." },
];

function InitialAvatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 pl-2 pt-1" aria-label="Mia is typing">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
    </div>
  );
}

export default function ChatPreviewSection() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-muted/30 py-14 md:py-20" aria-labelledby="chat-preview-heading">
      <div className="pointer-events-none absolute left-0 top-16 h-72 w-72 rounded-full bg-secondary/55 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Experience</span>
            <h2 id="chat-preview-heading" className="max-w-xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Conversations that feel real
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 tracking-[0.01em] text-muted-foreground">A messaging experience designed for connection. Clean, fast, compact, and built for the way people actually talk.</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {experienceCards.map((card, index) => (
                <div key={card.label} className={`rounded-3xl border border-border bg-card p-4 shadow-sm ${index === 1 ? "sm:translate-y-5 lg:translate-y-0" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold tracking-[-0.04em] text-foreground">{card.value}</p>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 tracking-[0.01em] text-muted-foreground">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-3 top-10 hidden rounded-3xl border border-border bg-card px-4 py-3 shadow-md lg:block" aria-hidden="true">
              <p className="text-xs font-semibold tracking-[0.08em] text-foreground">Friend request ready</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">1 shared interest</p>
            </div>

            <div className="overflow-hidden rounded-4xl border border-border bg-card shadow-md">
              <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
                <div className="relative">
                  <InitialAvatar initials="MK" className="h-10 w-10" />
                  <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold tracking-[0.01em] text-foreground">Mia K.</p>
                  <p className="flex items-center gap-1 text-xs tracking-[0.08em] text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                    Online
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
                  Matched
                </Badge>
              </div>

              <div className="space-y-3 px-4 py-5 sm:px-5">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.isMe ? "flex-row-reverse" : ""}`}>
                    {!msg.isMe && <InitialAvatar initials={msg.avatar} />}
                    <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${msg.isMe ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted text-foreground"}`}>
                      <p className="text-sm leading-relaxed tracking-[0.005em]">{msg.text}</p>
                      <p className={`mt-1 text-[0.65rem] tracking-[0.06em] ${msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-3">
                  <InitialAvatar initials="MK" />
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 flex-1 items-center rounded-xl border border-border bg-background px-4">
                    <span className="text-sm text-muted-foreground">Type a message...</span>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary" aria-hidden="true">
                    <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
