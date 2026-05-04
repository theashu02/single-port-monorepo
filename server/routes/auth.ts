import { Elysia, t } from "elysia";
import { generateNonce } from "@/core/auth/nonceStore";

export const authRoutes = new Elysia().get(
  "/nonce",
  ({ query, set }) => {
    const address = query.address;
    if (!address) {
      set.status = 400;
      return { error: "Missing address" };
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
