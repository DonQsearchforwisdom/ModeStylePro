'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 쿼리 파라미터에서 정보 파싱
    const plan = searchParams.get('plan') || '무료체험';
    const credits = parseInt(searchParams.get('credits') || '0', 10);
    const total = parseInt(searchParams.get('total') || '0', 10);

    // Toss Payments 결과 검증용 파라미터
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    const syncPaymentData = async () => {
      try {
        // 1. 서버 API 호출을 통해 DB 갱신 시도 (회원 세션 상태인 경우)
        const res = await fetch('/api/payment/success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, credits, total, paymentKey, orderId, amount }),
        });
        const data = await res.json();

        if (data.success && data.dbUpdated) {
          console.log('[Server DB Sync Success]', data);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('credits_remaining', data.credits.toString());
            localStorage.setItem('total_plan_credits', data.total.toString());
            localStorage.setItem('user_plan', data.plan);
            localStorage.setItem('free_credits_initialized', 'true');
            localStorage.setItem('last_purchased_plan', data.plan);
          }
          return;
        }
      } catch (err) {
        console.warn('Server payment update failed, falling back to local storage:', err);
      }

      // 2. 비회원이거나 서버 통신 실패 시 로컬스토리지 백업 저장 (합산)
      if (credits > 0) {
        if (typeof window !== 'undefined' && window.localStorage) {
          const prevRemaining = parseInt(localStorage.getItem('credits_remaining') || '5', 10);
          const prevTotal = parseInt(localStorage.getItem('total_plan_credits') || '5', 10);
          const newRemaining = prevRemaining + credits;
          const newTotal = prevTotal + total;

          localStorage.setItem('credits_remaining', newRemaining.toString());
          localStorage.setItem('total_plan_credits', newTotal.toString());
          localStorage.setItem('user_plan', plan);
          localStorage.setItem('free_credits_initialized', 'true');
          localStorage.setItem('last_purchased_plan', plan);

          // 네이티브 연동 백업 브릿지가 있는 경우 호출
          try {
            if ((window as any).webkit?.messageHandlers?.keychainHandler) {
              (window as any).webkit.messageHandlers.keychainHandler.postMessage({
                action: 'saveCredits',
                data: { remaining: newRemaining, total: newTotal, plan }
              });
            }
            if ((window as any).AndroidSecureStorage) {
              (window as any).AndroidSecureStorage.saveCredits(newRemaining, newTotal, plan);
            }
          } catch (e) {
            console.warn('Native secure storage sync failed on success page:', e);
          }
        }
      }
    };

    syncPaymentData();

    // 3초 후 메인화면으로 자동 리다이렉트
    const timer = setTimeout(() => {
      router.push('/');
    }, 3500);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  const planName = searchParams.get('plan') || '요금제';
  const creditsNum = searchParams.get('credits') || '0';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full glass-panel border border-zinc-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        {/* 장식용 골드 그라데이션 원 */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full gold-bg-gradient opacity-10 blur-xl" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full gold-bg-gradient opacity-10 blur-xl" />

        <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
          <CheckCircle2 className="w-9 h-9 stroke-[1.8]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">결제가 완료되었습니다!</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            충전 내역이 기기에 즉시 반영되었습니다. 이제 제한 없이 아름다운 헤어 시뮬레이션을 생성하실 수 있습니다.
          </p>
        </div>

        {/* 결제 내역 확인 상자 */}
        <div className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl text-left space-y-2.5 text-xs text-zinc-300">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
            <span className="text-zinc-500 font-medium">충전 상품</span>
            <span className="text-white font-bold">{planName} 요금제</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">충전 횟수</span>
            <span className="text-amber-400 font-extrabold font-mono">{parseInt(creditsNum, 10).toLocaleString('ko-KR')}회</span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 gold-bg-gradient hover:scale-[1.01] text-zinc-950 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/5 active:scale-[0.99] transition-all"
          >
            스타일링 랩으로 이동
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
            <span>이 거래는 256비트 암호화로 안전하게 보호됩니다.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin mb-4" />
        <p className="text-xs text-zinc-500">결제 완료 내역을 복원하는 중입니다...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
