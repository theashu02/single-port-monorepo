import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth/session";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { MetaMaskButton } from "@/components/auth/MetaMaskButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";

export default async function AuthPage() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign In</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Welcome back to the application
          </p>
        </div>
        
        <div className="space-y-4">
          <GoogleButton />
          <MetaMaskButton />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
          </div>
        </div>

        <EmailAuthForm />
      </div>
    </main>
  );
}
