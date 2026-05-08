import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { MetaMaskButton } from "@/components/auth/MetaMaskButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import Image from "next/image";
import { getServerAuthSession } from "@/core/auth/session";
import { GuestLoginButton } from "@/components/auth/GuestLoginButton";

export default async function AuthPage() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/app");

  return (
    <main className="flex min-h-screen">
      {/* LEFT 60% - HERO IMAGE */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/auth-hero.png" alt="Authentication Background" fill className="object-cover opacity-80" priority />
        </div>
      </div>

      {/* RIGHT 40% - AUTH FORM */}
      <div className="flex w-full lg:w-[40%] items-center justify-center bg-white dark:bg-gray-950 px-8 py-12 lg:px-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h4 className="text-4xl font-bold tracking-wide text-gray-900 dark:text-white">Great to see you !</h4>
            <p className="mt-2 tracking-wider text-sm text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
          </div>

          <div className="space-y-4">
            <GoogleButton />
            <MetaMaskButton />
            <GuestLoginButton />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-950 px-4 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <EmailAuthForm />
        </div>
      </div>
    </main>
  );
}
