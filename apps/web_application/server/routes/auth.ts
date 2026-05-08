import { Elysia, t } from "elysia";
import { generateNonce } from "@/core/auth/nonceStore";

export const authRoutes = new Elysia().get(
  "/nonce",
  ({ query, set }) => {
    const address = query.address?.trim();
    if (!address) {
      set.status = 400;
      return { error: "Missing address" };
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      set.status = 400;
      return { error: "Invalid wallet address" };
    }
    const nonce = generateNonce(address);
    return { nonce };
  },
  {
    query: t.Object({
      address: t.Optional(t.String()),
    }),
  },
);
