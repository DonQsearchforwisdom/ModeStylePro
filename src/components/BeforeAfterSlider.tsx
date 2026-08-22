'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  mode?: 'slider' | 'press'; // 'slider': 드래그 슬라이더 바 모드, 'press': 꾹 누르기 모드
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  mode = 'press'
}: BeforeAfterSliderProps) {
  // 1. 슬라이더 모드 전용 상태
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 2. 꾹 누르기 모드 전용 상태
  const [showBefore, setShowBefore] = useState<boolean>(false);

  // 슬라이더 위치 계산 함수
  const updateSliderPos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleMouseDownSlider = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPos(e.clientX);
  };

  const handleTouchStartSlider = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      updateSliderPos(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    if (mode !== 'slider') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateSliderPos(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      updateSliderPos(e.touches[0].clientX);
    };

    const handleStopDragging = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleStopDragging);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleStopDragging);
      window.addEventListener('touchcancel', handleStopDragging);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleStopDragging);
      window.removeEventListener('touchcancel', handleStopDragging);
    };
  }, [isDragging, mode, updateSliderPos]);

  // 꾹 누르기 핸들러
  const handlePressStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setShowBefore(true);
  };

  const handlePressEnd = () => {
    setShowBefore(false);
  };

  useEffect(() => {
    if (mode !== 'press') return;
    const handleGlobalRelease = () => {
      if (showBefore) setShowBefore(false);
    };

    if (showBefore) {
      window.addEventListener('mouseup', handleGlobalRelease);
      window.addEventListener('touchend', handleGlobalRelease);
      window.addEventListener('touchcancel', handleGlobalRelease);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, [showBefore, mode]);

  // ==========================================
  // [A] 슬라이더 바 모드 (시뮬레이션 예시용)
  // ==========================================
  if (mode === 'slider') {
    return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownSlider}
        onTouchStart={handleTouchStartSlider}
        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 select-none bg-zinc-950 cursor-ew-resize touch-none group"
      >
        {/* 1. 하단 베이스 레이어: Before 이미지 (오른쪽에 노출되는 시술 전 기존 원본) */}
        <img
          src={beforeImage}
          alt="시술 전 기존 원본"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* 2. 상단 오버레이 레이어: After 이미지 (왼쪽에 노출되는 스타일 제안 완성본) */}
        <img
          src={afterImage}
          alt="스타일 제안 완성본"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        />

        {/* 3. 구분선 (Slider Divider Line) */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-400 via-white to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] pointer-events-none"
          style={{ left: `calc(${sliderPosition}% - 1px)` }}
        />

        {/* 4. 중앙 드래그 핸들 (Circular Drag Handle) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-zinc-900/90 border-2 border-amber-400 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none transition-transform duration-100 ${
            isDragging ? 'scale-110 ring-4 ring-amber-400/30' : 'group-hover:scale-105'
          }`}
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="flex items-center gap-1 text-[10px] font-black text-amber-300">
            <span>◀</span>
            <span>▶</span>
          </div>
        </div>

        {/* 5. 플로팅 라벨 배지 (왼쪽: AFTER / 오른쪽: BEFORE) */}
        <div className="absolute top-3 left-3 bg-amber-500/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-950 border border-amber-300/30 pointer-events-none shadow-md">
          AFTER
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-300 border border-white/10 pointer-events-none">
          BEFORE
        </div>

        {/* 하단 인터랙션 안내 힌트 */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-zinc-400 border border-white/10 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
          <span>↔</span>
          <span>좌우로 슬라이드하여 비교</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // [B] 클린 모드 (생성된 제안서 결과 카드용 - 슬라이드바 제외)
  // ==========================================
  return (
    <div
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 select-none bg-zinc-950 cursor-pointer active:scale-[0.99] transition-transform duration-150 touch-manipulation"
      title="사진을 꾹 누르고 있는 동안 시술 전(Before) 원본이 나타납니다"
    >
      {/* 1. Before 이미지 (원본) */}
      <img
        src={beforeImage}
        alt="시술 전 원본"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 pointer-events-none ${
          showBefore ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. After 이미지 (AI 스타일링 완성본) */}
      <img
        src={afterImage}
        alt="스타일 제안 완성본"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 pointer-events-none ${
          showBefore ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}
