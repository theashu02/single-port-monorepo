import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth/session";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { MetaMaskButton } from "@/components/auth/MetaMaskButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import Image from "next/image";

export default async function AuthPage() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen">
      {/* LEFT 60% - HERO IMAGE */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/auth-hero.png" 
            alt="Authentication Background" 
            fill
            className="object-cover opacity-80"
            priority
          />
        </div>
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0"></div>
        <div className="relative z-10 p-12 max-w-2xl text-white">
          <div className="mb-6 inline-flex h-12 items-center justify-center rounded-lg bg-white/10 px-4 py-2 backdrop-blur-md border border-white/20">
            <span className="font-semibold tracking-wide text-lg text-white">NextGen SaaS Engine</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            Build at the speed of thought.
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Unleash the full potential of your business with our cutting-edge AI-driven platform. Manage teams, analyze data, and scale globally—all in one place.
          </p>
        </div> */}
      </div>

      {/* RIGHT 40% - AUTH FORM */}
      <div className="flex w-full lg:w-[40%] items-center justify-center bg-white dark:bg-gray-950 px-8 py-12 lg:px-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h4 className="text-4xl font-bold tracking-wide text-gray-900 dark:text-white">
              Great to see you !
            </h4>
            <p className="mt-2 tracking-wider text-sm text-gray-500 dark:text-gray-400">
              Please enter your details to sign in.
            </p>
          </div>
          
          <div className="space-y-4">
            <GoogleButton />
            <MetaMaskButton />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-950 px-4 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <EmailAuthForm />
        </div>
      </div>
    </main>
  );
}
