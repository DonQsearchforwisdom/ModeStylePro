import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import Naver from 'next-auth/providers/naver';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || 'dummy_id',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || 'dummy_secret',
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID || 'dummy_id',
      clientSecret: process.env.AUTH_KAKAO_SECRET || 'dummy_secret',
    }),
    Naver({
      clientId: process.env.AUTH_NAVER_ID || 'dummy_id',
      clientSecret: process.env.AUTH_NAVER_SECRET || 'dummy_secret',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // DB에서 유저의 크레딧 현황을 조회하여 세션에 주입
        const userCredit = await db.userCredit.findUnique({
          where: { userId: user.id },
        });

        if (userCredit) {
          (session as any).user.remainingCredits = userCredit.remainingCredits;
          (session as any).user.totalPlanCredits = userCredit.totalPlanCredits;
          (session as any).user.userPlan = userCredit.userPlan;
        } else {
          (session as any).user.remainingCredits = 5;
          (session as any).user.totalPlanCredits = 5;
          (session as any).user.userPlan = '무료체험';
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await db.userCredit.create({
          data: {
            userId: user.id,
            remainingCredits: 5,
            totalPlanCredits: 5,
            userPlan: '무료체험',
          },
        });
      }
    },
  },
});
