import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.github_id = Number(profile.id);
        token.github_username = profile.login as string;
        token.avatar_url = profile.avatar_url as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.github_id = token.github_id as number;
        session.user.github_username = token.github_username as string;
        session.user.image = token.avatar_url as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
