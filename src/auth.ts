import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import Naver from 'next-auth/providers/naver';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
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
    Credentials({
      name: 'Test Account',
      credentials: {
        username: { label: '이름', type: 'text' },
      },
      async authorize(credentials) {
        const name = (credentials?.username as string) || '테스트 디자이너';
        const randomId = Math.random().toString(36).substring(7);
        const email = `test-${randomId}@modestyle.pro`;

        // DB에 가상 테스트 유저 및 크레딧(30회) 자동 생성
        const user = await db.user.create({
          data: {
            name,
            email,
            image: null,
            credit: {
              create: {
                remainingCredits: 30,
                totalPlanCredits: 30,
                userPlan: '무료체험',
              },
            },
          },
        });

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const userId = token.id as string;
        session.user.id = userId;

        // DB에서 유저의 크레딧 현황을 조회하여 세션에 주입
        const userCredit = await db.userCredit.findUnique({
          where: { userId },
        });

        if (userCredit) {
          (session as any).user.remainingCredits = userCredit.remainingCredits;
          (session as any).user.totalPlanCredits = userCredit.totalPlanCredits;
          (session as any).user.userPlan = userCredit.userPlan;
        } else {
          (session as any).user.remainingCredits = 3;
          (session as any).user.totalPlanCredits = 3;
          (session as any).user.userPlan = '무료체험';
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // 일반 소셜 로그인의 경우에만 이 이벤트를 통해 크레딧 생성 처리
      if (user.id) {
        const exist = await db.userCredit.findUnique({ where: { userId: user.id } });
        if (!exist) {
          await db.userCredit.create({
            data: {
              userId: user.id,
              remainingCredits: 3,
              totalPlanCredits: 3,
              userPlan: '무료체험',
            },
          });
        }
      }
    },
  },
});
