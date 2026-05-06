import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      // Optimistic guest check; secure validation still happens in server/session layer.
      const isGuest = req.cookies.has("guest_session_token") && req.cookies.has("guest_id");
      return !!token || isGuest;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
