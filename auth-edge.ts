import NextAuth from 'next-auth';

// Edge-safe auth used only by middleware to avoid bundling Node APIs
export const { auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  callbacks: {
    async jwt({ token }) {
      // Pass through token as-is for middleware checks
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          // Align with app session shape
          // token.sub is user id in NextAuth JWTs
          // @ts-ignore - augmenting user shape at runtime
          session.user.id = token.sub;
        }
        if (typeof token.name === 'string') {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});

export type { NextRequest } from 'next/server';
