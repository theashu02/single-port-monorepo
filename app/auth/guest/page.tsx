"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Check, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AVATAR_SEEDS, AvatarURL, GENDER_OPTIONS, generateNickname, GuestSessionData, INTEREST_OPTIONS, transition, variants } from "@/core/constants/guest_constant";
import { createGuestSession, refreshGuestSession } from "@/core/apis/Guest_API";

export default function GuestLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [nickname, setNickname] = useState(() => generateNickname());
  const [gender, setGender] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAutoLogin = useCallback(
    async (guestData: GuestSessionData) => {
      try {
        const data = await refreshGuestSession(guestData.guest_id, guestData.session_token);
        localStorage.setItem("guest_session", JSON.stringify(data));
        router.push("/dashboard");
      } catch {
        setStep(1);
      }
    },
    [router],
  );

  useEffect(() => {
    const guestDataStr = localStorage.getItem("guest_session");
    if (guestDataStr) {
      try {
        const guestData = JSON.parse(guestDataStr);
        if (guestData.guest_id && guestData.session_token) {
          // Defer execution to avoid synchronous cascading render
          setTimeout(() => handleAutoLogin(guestData), 0);
          return;
        }
      } catch {
        // Handle potential parsing errors silently
      }
    }

    const t = setTimeout(() => setStep(1), 900);
    return () => clearTimeout(t);
  }, [handleAutoLogin]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : prev.length < 5 ? [...prev, interest] : prev));
  };

  const nextStep = () => {
    setDirection(1);
    setStep((p) => p + 1);
  };
  const prevStep = () => {
    setDirection(-1);
    setStep((p) => p - 1);
  };

  const handleSubmit = async () => {
    setError("");
    if (!ageConfirmed || !termsAccepted) {
      setError("Please accept both to continue.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nickname,
        avatar_id: AVATAR_SEEDS[avatarIdx],
        gender: gender || null,
        interests,
        age_confirmed: ageConfirmed,
        terms_accepted: termsAccepted,
      };

      const data = await createGuestSession(payload);

      localStorage.setItem("guest_session", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--gradient-bg)">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <motion.div className="absolute inset-0 rounded-3xl bg-primary -z-10" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Setting things up…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--gradient-bg) flex flex-col">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-5 max-w-2xl mx-auto w-full">
        <div className="w-10">
          <AnimatePresence mode="wait">
            {step > 1 ? (
              <motion.div key="back" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Button variant="ghost" size="icon" onClick={prevStep} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </motion.div>
            ) : (
              <motion.div key="back-auth">
                <Button variant="ghost" size="icon" onClick={() => router.push("/auth")} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{
                width: step === i ? 28 : 8,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`h-2 rounded-full transition-colors duration-300 ${step >= i ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="w-10 text-right text-xs text-muted-foreground font-medium">{step}/5</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-(--shadow-soft)">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Choose your avatar</h1>
                    <p className="text-muted-foreground text-sm">Pick a profile picture for your anonymous session.</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 sm:gap-4">
                    {AVATAR_SEEDS.map((seed, i) => {
                      const selected = avatarIdx === i;
                      return (
                        <motion.button
                          key={seed}
                          onClick={() => {
                            setAvatarIdx(i);
                            setTimeout(nextStep, 200);
                          }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className={`relative aspect-square flex items-center justify-center transition-all rounded-2xl cursor-pointer z-10 ${selected ? "bg-primary/20 shadow-(--shadow-glow) border-2 border-primary" : "bg-muted hover:bg-muted/70"}`}
                        >
                          <div className="relative w-full h-full scale-110">
                            <Image src={`${AvatarURL}=${seed}`} alt={seed} fill className="object-cover rounded-2xl" />
                          </div>

                          {selected && (
                            <motion.div layoutId="avatar-check" className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg z-20 border-2 border-background">
                              <Check className="w-3 h-3 stroke-3" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-24 h-24 mx-auto rounded-3xl bg-primary/20 shadow-(--shadow-glow) border-2 border-primary overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full scale-110">
                      <Image src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${AVATAR_SEEDS[avatarIdx]}`} alt="Avatar" fill className="object-cover" />
                    </div>
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">What should we call you?</h1>
                    <p className="text-muted-foreground text-sm">Use the suggested nickname or type your own.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Input value={nickname} onChange={(e) => setNickname(e.target.value.substring(0, 20))} className="h-14 text-lg px-4 pr-12 text-center rounded-2xl border-2 focus-visible:ring-primary/30 font-bold tracking-wider text-amber-800" placeholder="Enter nickname" />
                      <Button type="button" size="icon" variant="ghost" onClick={() => setNickname(generateNickname())} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:rotate-180 transition-transform duration-500">
                        <RefreshCcw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{nickname.length}/20</p>
                  </div>

                  <Button onClick={nextStep} disabled={!nickname.trim()} className="w-full h-12 text-base group">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">How do you identify?</h1>
                    <p className="text-muted-foreground text-sm">This helps us match you with the right people.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {GENDER_OPTIONS.map((g) => {
                      const selected = gender === g.toLowerCase();
                      return (
                        <motion.button key={g} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setGender(selected ? "" : g.toLowerCase())} className={`relative h-16 rounded-2xl border-2 font-medium transition-all ${selected ? "border-primary bg-primary/10 text-primary shadow-md" : "border-border bg-muted/40 hover:border-primary/40"}`}>
                          {g}
                          {selected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <Button onClick={nextStep} disabled={!gender} className="w-full h-12 text-base group">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">What are your interests?</h1>
                    <p className="text-muted-foreground text-sm">Pick up to 5 topics — {interests.length}/5 selected.</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {INTEREST_OPTIONS.map((interest) => {
                      const selected = interests.includes(interest);
                      return (
                        <motion.button key={interest} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => toggleInterest(interest)} className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${selected ? "border-transparent bg-primary text-primary-foreground shadow-md" : "border-border bg-muted/40 hover:border-primary/40"}`}>
                          {interest}
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  <Button onClick={nextStep} disabled={interests.length === 0} className="w-full h-12 text-base group">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="w-20 h-20 mx-auto rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center">
                    <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Almost there!</h1>
                    <p className="text-muted-foreground text-sm">Just a few rules to keep the community safe.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                      <Checkbox checked={ageConfirmed} onCheckedChange={(c) => setAgeConfirmed(c === true)} className="mt-0.5 rounded-sm" />
                      <span className="text-sm leading-relaxed">I confirm I am 18 years or older *</span>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                      <Checkbox checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} className="mt-0.5 rounded-sm" />
                      <span className="text-sm leading-relaxed">
                        I agree to the <span className="text-primary underline">Terms</span> and <span className="text-primary underline">Privacy Policy</span> *
                      </span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-destructive text-sm text-center">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Button onClick={handleSubmit} disabled={loading || !ageConfirmed || !termsAccepted} className="group w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Session...
                      </>
                    ) : (
                      <span className="flex items-center">
                        Start Chatting
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
