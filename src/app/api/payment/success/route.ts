import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { plan, credits, total, paymentKey, orderId, amount } = body;

    if (session?.user?.id) {
      const userId = session.user.id;

      // 1. 크레딧 정보 업데이트 (Prisma increment 지원으로 기존 값에 누적 합산)
      const userCredit = await db.userCredit.upsert({
        where: { userId },
        update: {
          remainingCredits: { increment: credits },
          totalPlanCredits: { increment: total },
          userPlan: plan,
        },
        create: {
          userId,
          remainingCredits: credits,
          totalPlanCredits: total,
          userPlan: plan,
        },
      });

      // 2. 결제 상세 이력(PaymentHistory) 저장
      await db.paymentHistory.create({
        data: {
          userId,
          planType: plan,
          amount: parseInt(amount || '0', 10),
          status: 'COMPLETED',
          paymentKey,
          orderId,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        dbUpdated: true,
        credits: userCredit.remainingCredits,
        total: userCredit.totalPlanCredits,
        plan: userCredit.userPlan,
      });
    }

    return NextResponse.json({
      success: true,
      dbUpdated: false,
      message: '비회원 상태이므로 로컬 저장소 갱신이 진행됩니다.',
    });
  } catch (error: any) {
    console.error('[Payment Success API Error]:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 데이터 갱신 중 에러가 발생했습니다.' }, { status: 500 });
  }
}
