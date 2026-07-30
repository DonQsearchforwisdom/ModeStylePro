'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR';
  const errorMessage = searchParams.get('message') || '결제 진행 중 알 수 없는 오류가 발생했거나 사용자가 결제를 취소했습니다.';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full glass-panel border border-zinc-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
          <XCircle className="w-9 h-9 stroke-[1.8]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">결제에 실패하였습니다</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            결제 도중 오류가 발생했거나 요청이 취소되었습니다. 아래의 사유를 확인해 보시고 다시 시도해 주세요.
          </p>
        </div>

        {/* 실패 정보 상자 */}
        <div className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl text-left space-y-2.5 text-xs text-zinc-300">
          <div className="flex flex-col gap-1 pb-2 border-b border-zinc-800/60">
            <span className="text-zinc-500 font-medium">에러 코드</span>
            <span className="text-red-400 font-mono font-bold">{errorCode}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 font-medium">상세 사유</span>
            <span className="text-zinc-200 leading-normal">{errorMessage}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            스타일링 랩으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin mb-4" />
        <p className="text-xs text-zinc-500">결제 실패 오류를 분석 중입니다...</p>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
