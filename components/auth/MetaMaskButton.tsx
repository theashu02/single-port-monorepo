"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { Button } from "@/components/ui/button";

declare global {
  interface Window { ethereum?: Eip1193Provider; }
}

export function MetaMaskButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address: string = accounts[0];

      const res = await fetch(`/api/nonce?address=${address}`);
      const { nonce } = await res.json();

      const message = `Sign in to [YourApp]\nAddress: ${address}\nNonce: ${nonce}`;

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const result = await signIn("metamask", {
        address,
        signature,
        nonce,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        console.error("MetaMask login failed:", result.error);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("MetaMask error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" className="w-full" disabled={loading} onClick={handleConnect}>
      {loading ? "Connecting..." : "Continue with MetaMask"}
    </Button>
  );
}
