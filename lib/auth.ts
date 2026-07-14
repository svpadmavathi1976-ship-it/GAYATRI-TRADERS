import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        remember: { label: 'Remember', type: 'boolean' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const identifier = (credentials.identifier || '').trim().toLowerCase();
        const password = credentials.password || '';

        if (!identifier || !password) return null;

        const admin = await prisma.admin.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        });

        if (!admin) {
          throw new Error('No account found for the provided username or email.');
        }

        const passwordMatch = await bcrypt.compare(password, admin.password || '');

        if (!passwordMatch) {
          throw new Error('Incorrect password.');
        }

        if (!admin.isVerified) {
          throw new Error('Account not verified. Please check your email for the verification code.');
        }

        return {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          fullName: admin.fullName,
          profilePicture: admin.profilePicture,
          remember: Boolean(credentials.remember),
        } as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        if ((user as any).remember) token.remember = true;
      }
      return token;
    },
    async session({ session, token }) {
    if (token?.sub) {
    const admin = await prisma.admin.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        profilePicture: true,
      },
    });

    if (admin) {
      session.user = {
        ...session.user,
        ...admin,
      } as any;
    }
  }

  return session;
},
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
