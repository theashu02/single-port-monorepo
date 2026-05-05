import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      // Check for our custom guest session cookie
      const isGuest = req.cookies.has("guest_session_token");
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
