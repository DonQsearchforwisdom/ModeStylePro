'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import ImageUploader from '@/components/ImageUploader';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Sparkles, ArrowRight, Download, Share2, RefreshCw, Key, ShieldCheck, HelpCircle, Activity, User, Check, Trash2, Settings, CreditCard, X, Venus, Mars, Coins, Compass } from 'lucide-react';

import { STYLE_OPTIONS, LENGTH_OPTIONS, type StyleItem } from '@/data/styleOptions';
import { saveProposalsToDB, loadProposalsFromDB, clearProposalsFromDB } from '@/utils/indexedDB';

// 기장 데이터 및 아이콘 정의
const LENGTH_ICONS: Record<string, string> = {
  '전체': '🌟',
  '숏컷': '✂️',
  '숏': '✂️',
  '숏(크롭)': '✂️',
  '단발': '🎀',
  '미디움 숏': '💈',
  '미디움': '💈',
  '롱': '👑',
  '특수 레이어드': '✨',
  '리프(장발)': '🌿',
  '롱 / 특수': '🌿',
};



const LOADING_MESSAGES = [
  '고객님의 두상과 얼굴형을 분석 중입니다...',
  '헤어라인과 이목구비의 조화를 최적화하는 중...',
  '스타일에 맞는 완벽한 모발 텍스처를 구성하는 중...',
  '빛 반사와 건강한 엔젤링(머릿결 윤기)을 살리는 중...',
  '거의 다 되었습니다! 자연스러운 모발 컬러 렌더링 중...',
];

interface DiagnosisResult {
  faceShape: string;
  hairCondition: string;
  currentLength?: string;
  recommendations: Array<{
    styleName: string;
    reason: string;
    recommendedOutfit?: string;
    stylingTip?: string;
    hiddenPrompt?: string;
  }>;
}

interface SimulationResult {
  id: string;
  timestamp: string;
  beforeImage: string;
  afterImage: string;
  gender: '여성' | '남성';
  length: string;
  styleName: string;
  generationTime: number;
  careOption: string;
  careCost: string;
  designOption: string;
  designCost: string;
  stylingTip: string;
  recommendedOutfit?: string;
  watermarkedFile?: File;
  upsell?: string;
}

// 워터마크가 합성된 이미지를 파일 객체로 미리 생성하는 유틸리티
const createWatermarkedFile = (imageSrc: string, styleName: string, salonName: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // base64 data URL이 아닌 외부 웹 이미지인 경우에만 CORS 헤더 요청 적용
    if (imageSrc && imageSrc.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      // 1. After 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 2. 하단 그라데이션 어두운 오버레이 바 생성 (가독성 향상)
      const barHeight = img.height * 0.07;
      const grad = ctx.createLinearGradient(0, img.height - barHeight, 0, img.height);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, img.height - barHeight, img.width, barHeight);

      // 3. 워터마크 텍스트 합성: ModeStylePro _ [살롱 상호명]
      const watermarkText = salonName ? `ModeStylePro _ ${salonName}` : 'ModeStylePro';
      const fontSize = Math.round(img.height * 0.022);
      ctx.font = `bold ${fontSize}px 'Pretendard', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // 우측 하단 여백 설정
      const paddingRight = img.width * 0.04;
      const centerY = img.height - (barHeight / 2);

      // 텍스트 섀도우 처리
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(watermarkText, img.width - paddingRight, centerY);

      const filePrefix = salonName ? `modestyle-${salonName}` : 'modestyle';
      const fileName = `${filePrefix}-${styleName.replace(/\s+/g, '-')}.png`;

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Blob 생성 실패'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/png' });
        resolve(file);
      }, 'image/png');
    };
    img.onerror = (e) => {
      reject(e || new Error('이미지 로드 실패'));
    };
    img.src = imageSrc;
  });
};

// localStorage 보안 예외 방지 안전 래퍼
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage getItem failed:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
    }
  }
};

// sessionStorage 보안 예외 방지 안전 래퍼
const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage getItem failed:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('sessionStorage setItem failed:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage removeItem failed:', e);
    }
  }
};

// Toss Payments 결제창을 위한 글로벌 타입 보강
declare global {
  interface Window {
    TossPayments?: any;
  }
}

// 하이브리드 앱 네이티브 연동을 위한 보안 스토리지 & RevenueCat 브릿지
const nativeBridge = {
  // 기기 최초 무료 크레딧 초기화 여부 체크 및 초기값 세팅 (보안 스토리지 연동)
  initializeFreeCredits: async (): Promise<{ initialized: boolean; credits: number }> => {
    try {
      if (typeof window !== 'undefined') {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        // iOS Keychain 연동 시뮬레이션 및 실제 네이티브 브릿지 호출
        if (isIOS && (window as any).webkit?.messageHandlers?.keychainHandler) {
          const res = await (window as any).webkit.messageHandlers.keychainHandler.postMessage({
            action: 'checkInitFreeCredits'
          });
          return res || { initialized: true, credits: 3 };
        }
        // Android EncryptedSharedPreferences 연동 시뮬레이션
        if ((window as any).AndroidSecureStorage) {
          const resStr = (window as any).AndroidSecureStorage.checkInitFreeCredits();
          return JSON.parse(resStr);
        }
      }
    } catch (e) {
      console.warn('Native secure storage access failed, fallback to localStorage:', e);
    }

    // 브라우저 Fallback (localStorage)
    if (typeof window !== 'undefined' && window.localStorage) {
      const initialized = localStorage.getItem('free_credits_initialized') === 'true';
      if (!initialized) {
        localStorage.setItem('free_credits_initialized', 'true');
        localStorage.setItem('credits_remaining', '3');
        localStorage.setItem('user_plan', '무료체험');
        localStorage.setItem('total_plan_credits', '3');
        return { initialized: true, credits: 3 };
      }
      const savedCredits = parseInt(localStorage.getItem('credits_remaining') || '0', 10);
      return { initialized: false, credits: savedCredits };
    }

    return { initialized: false, credits: 0 };
  },

  // 크레딧 데이터 획득
  getCreditsData: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const remaining = parseInt(localStorage.getItem('credits_remaining') || '3', 10);
      const total = parseInt(localStorage.getItem('total_plan_credits') || '3', 10);
      const plan = (localStorage.getItem('user_plan') as any) || '무료체험';
      return { remaining, total, plan };
    }
    return { remaining: 3, total: 3, plan: '무료체험' as const };
  },

  // 크레딧 데이터 저장
  saveCreditsData: (remaining: number, total: number, plan: string) => {
    try {
      if (typeof window !== 'undefined') {
        if ((window as any).webkit?.messageHandlers?.keychainHandler) {
          (window as any).webkit.messageHandlers.keychainHandler.postMessage({
            action: 'saveCredits',
            data: { remaining, total, plan }
          });
        }
        if ((window as any).AndroidSecureStorage) {
          (window as any).AndroidSecureStorage.saveCredits(remaining, total, plan);
        }
      }
    } catch (e) {
      console.warn('Native secure storage save failed:', e);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('credits_remaining', remaining.toString());
      localStorage.setItem('total_plan_credits', total.toString());
      localStorage.setItem('user_plan', plan);
    }
  },

  // RevenueCat 구매 내역 복원 (Restore Purchases)
  restorePurchases: async (): Promise<{ success: boolean; plan: string; credits: number; total: number } | null> => {
    try {
      if (typeof window !== 'undefined') {
        if ((window as any).webkit?.messageHandlers?.revenueCatHandler) {
          const res = await (window as any).webkit.messageHandlers.revenueCatHandler.postMessage({
            action: 'restore'
          });
          return res;
        }
        if ((window as any).AndroidRevenueCat) {
          const resStr = (window as any).AndroidRevenueCat.restorePurchases();
          return JSON.parse(resStr);
        }
      }
    } catch (e) {
      console.warn('Native RevenueCat restore failed:', e);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const plan = localStorage.getItem('last_purchased_plan') || '무료체험';
          const total = plan === '살롱' ? 1000 : plan === '라이트' ? 300 : plan === '1회충전' ? 10 : 3;
          const remaining = total;
          localStorage.setItem('credits_remaining', remaining.toString());
          localStorage.setItem('total_plan_credits', total.toString());
          localStorage.setItem('user_plan', plan);
          resolve({ success: true, plan, credits: remaining, total });
        } else {
          resolve(null);
        }
      }, 1000);
    });
  },

  // RevenueCat IAP 결제 처리
  purchasePlan: async (planType: '1회충전' | '라이트' | '살롱'): Promise<{ success: boolean; credits: number; total: number }> => {
    try {
      if (typeof window !== 'undefined') {
        if ((window as any).webkit?.messageHandlers?.revenueCatHandler) {
          const res = await (window as any).webkit.messageHandlers.revenueCatHandler.postMessage({
            action: 'purchase',
            plan: planType
          });
          return res;
        }
        if ((window as any).AndroidRevenueCat) {
          const resStr = (window as any).AndroidRevenueCat.purchasePlan(planType);
          return JSON.parse(resStr);
        }
      }
    } catch (e) {
      console.warn('Native IAP purchase failed:', e);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const total = planType === '살롱' ? 1000 : planType === '라이트' ? 300 : 10;
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('last_purchased_plan', planType);
          localStorage.setItem('credits_remaining', total.toString());
          localStorage.setItem('total_plan_credits', total.toString());
          localStorage.setItem('user_plan', planType);
        }
        resolve({ success: true, credits: total, total });
      }, 800);
    });
  }
};

export default function HomePage() {
  const [gender, setGender] = useState<'여성' | '남성'>('여성');
  const [selectedLength, setSelectedLength] = useState<string>('');

  // AI 진단 추천 시 적용할 히든 메이크업 프롬프트 (수동 적용 백업용)
  const [activeHiddenPrompt, setActiveHiddenPrompt] = useState<string | null>(null);

  // 스타일 다중 선택
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // 직접 요청 스타일 직접 입력 상태
  const [customStyleText, setCustomStyleText] = useState<string>('');
  const [isCustomStyleApplied, setIsCustomStyleApplied] = useState<boolean>(false);

  // AI 추천 스타일 다중 선택 추가
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);

  // 의상 맞춤 코디 자동 변환 옵션 상태 (기본값 ON)
  const [enableOutfitStyling, setEnableOutfitStyling] = useState<boolean>(true);

  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // 히스토리 목록
  const [resultsList, setResultsList] = useState<SimulationResult[]>([]);
  // 선택된 활성 제안서 필터 ('all' 또는 특정 result.id)
  const [activeProposalId, setActiveProposalId] = useState<string>('all');
  // 공유 팝업 모달 대상 제안서 상태
  const [sharingReportResult, setSharingReportResult] = useState<SimulationResult | null>(null);
  const [isCopiedReport, setIsCopiedReport] = useState<boolean>(false);

  // 전체 스타일 통합 제안서 공유 모달 상태
  const [showCombinedReportModal, setShowCombinedReportModal] = useState<boolean>(false);
  const [isCopiedCombinedReport, setIsCopiedCombinedReport] = useState<boolean>(false);
  const [combinedReportImage, setCombinedReportImage] = useState<string | null>(null);
  const [isGeneratingCombinedImage, setIsGeneratingCombinedImage] = useState<boolean>(false);

  // 헤어 AI 진단 상태
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  // 테스트용 히든 치트키 충전 상태 및 핸들러
  const [cheatCount, setCheatCount] = useState<number>(0);
  const handleCheatClick = () => {
    setCheatCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('credits_remaining', '999');
          localStorage.setItem('total_plan_credits', '999');
          localStorage.setItem('user_plan', '1회충전');
          alert('🔮 테스트용 무제한 크레딧(999회)이 즉시 충전되었습니다!');
          location.reload();
        }
        return 0;
      }
      return next;
    });
  };

  // 통합 크레딧 및 플랜 상태 관리 (비회원 기기 인증 기반)
  // 중복 제거를 위해 주석 처리: const [userPlan, setUserPlan] = useState<'무료체험' | '1회충전' | '라이트' | '살롱'>('무료체험');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 총 생성 대상 개수 (우측 다중 스타일 선택 개수 + AI 진단 추천 스타일 선택 개수)
  const totalJobsCount = selectedStyles.length + selectedRecommendations.length;

  // 모바일 앱 설정 상태 (상호명, 디자이너명)
  const [salonName, setSalonName] = useState<string>('');
  const [designerName, setDesignerName] = useState<string>('지오 디자이너');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // 샘플 Before/After 시연 성별 선택 상태
  const [sampleGender, setSampleGender] = useState<'여성' | '남성'>('여성');

  // 통합 크레딧 및 플랜 상태 관리 (비회원 기기 인증 기반)
  const [userPlan, setUserPlan] = useState<'무료체험' | '1회충전' | '라이트' | '살롱'>('무료체험');
  const [remainingCredits, setRemainingCredits] = useState<number>(5);
  const [totalPlanCredits, setTotalPlanCredits] = useState<number>(5);
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [isIosKakao, setIsIosKakao] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const { data: session, status } = useSession();

  // 상단 동적 뱃지 텍스트 렌더링 헬퍼
  const renderCreditBadgeText = () => {
    // 1. 개발/테스트 모드 (development 환경)
    if (process.env.NODE_ENV === 'development') {
      return (
        <>
          개발 모드 | <span className="text-amber-400 font-bold">무제한 ♾️</span>
        </>
      );
    }

    // 2. 운영 환경일 때는 유저 플랜 상태에 따라 포맷팅 적용
    const formattedRemaining = remainingCredits.toLocaleString('ko-KR');
    const formattedTotal = totalPlanCredits.toLocaleString('ko-KR');

    switch (userPlan) {
      case '1회충전':
        return (
          <>
            1회 충전 | <span className="text-amber-400 font-bold">{formattedRemaining}/{formattedTotal}</span>
          </>
        );
      case '라이트':
        return (
          <>
            라이트 | <span className="text-amber-400 font-bold">{formattedRemaining}/{formattedTotal}</span>
          </>
        );
      case '살롱':
        return (
          <>
            살롱 | <span className="text-amber-400 font-bold">{formattedRemaining}/{formattedTotal}</span>
          </>
        );
      case '무료체험':
      default:
        return (
          <>
            무료 체험 | <span className="text-amber-400 font-bold">{formattedRemaining}/{formattedTotal}</span>
          </>
        );
    }
  };

  const simulatorRef = useRef<HTMLDivElement>(null);
  const stylesSectionRef = useRef<HTMLDivElement>(null);
  const isRestored = useRef<boolean>(false);

  // 성별 변경 시 기장과 스타일 초기화 및 sessionStorage에 성별 백업
  useEffect(() => {
    setSelectedLength('전체');
    setSelectedStyles([STYLE_OPTIONS[gender][0].name]);
    setSelectedRecommendations([]); // AI 추천 선택 리셋
    setCustomStyleText('');
    setIsCustomStyleApplied(false);
    safeSessionStorage.removeItem('modestyle_custom_style_text');
    safeSessionStorage.removeItem('modestyle_is_custom_style_applied');
    setActiveHiddenPrompt(null);
    setDiagnosisResult(null);
    setDiagnosisError(null);
    safeSessionStorage.setItem('modestyle_gender', gender);
  }, [gender]);

  // selectedLength 변경 시 세션스토리지에 자동 백업
  useEffect(() => {
    if (!isRestored.current) return;
    safeSessionStorage.setItem('modestyle_selected_length', selectedLength);
  }, [selectedLength]);

  // selectedStyles 변경 시 세션스토리지에 자동 백업
  useEffect(() => {
    if (!isRestored.current) return;
    safeSessionStorage.setItem('modestyle_selected_styles', JSON.stringify(selectedStyles));
  }, [selectedStyles]);



  // 카카오톡 인앱 브라우저 외부 이탈 스크립트
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isKakao = /KAKAOTALK/i.test(userAgent);

    if (isKakao) {
      const currentUrl = window.location.href;

      // 1. 안드로이드 기기 -> Intent 스키마 사용하여 크롬으로 즉시 강제 이동
      if (/Android/i.test(userAgent)) {
        const schemeUrl = currentUrl.replace(/^https?:\/\//, '');
        const intentUrl = `intent://${schemeUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;
        window.location.href = intentUrl;
      }
      // 2. iOS 기기 -> 외부 앱 열기 스키마 시도 및 사파리 수동 이동 가이드 오버레이 활성화
      else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        const externalAppUrl = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(currentUrl)}`;
        window.location.href = externalAppUrl;
        setIsIosKakao(true);
      }
    }
  }, []);

  // 로컬스토리지 정보 마운트 시 로드 및 일일 무료 5회 리셋 처리
  useEffect(() => {
    // 0-1. 성별 정보 복구
    const savedGender = safeSessionStorage.getItem('modestyle_gender');
    if (savedGender === '여성' || savedGender === '남성') {
      setGender(savedGender);
    }

    // 0-1-2. 직접 요청 스타일 정보 복구
    const savedCustomText = safeSessionStorage.getItem('modestyle_custom_style_text');
    if (savedCustomText) {
      setCustomStyleText(savedCustomText);
    }
    const savedCustomApplied = safeSessionStorage.getItem('modestyle_is_custom_style_applied');
    if (savedCustomApplied === 'true') {
      setIsCustomStyleApplied(true);
    }

    // 0-1-3. 기장 및 스타일 선택 상태 복구
    const savedLength = safeSessionStorage.getItem('modestyle_selected_length');
    if (savedLength) {
      setSelectedLength(savedLength);
    } else {
      setSelectedLength('전체');
    }

    const savedStyles = safeSessionStorage.getItem('modestyle_selected_styles');
    if (savedStyles) {
      try {
        setSelectedStyles(JSON.parse(savedStyles));
      } catch (e) {
        setSelectedStyles([STYLE_OPTIONS[savedGender === '남성' ? '남성' : '여성'][0].name]);
      }
    } else {
      setSelectedStyles([STYLE_OPTIONS[savedGender === '남성' ? '남성' : '여성'][0].name]);
    }

    // 0-2. 업로드된 원본 이미지 복구
    const savedOriginalImage = safeSessionStorage.getItem('modestyle_original_image');
    if (savedOriginalImage) {
      setOriginalImage(savedOriginalImage);
    }

    // 0-3. AI 실시간 진단 리포트 복구
    const savedDiagnosis = safeSessionStorage.getItem('modestyle_diagnosis_result');
    if (savedDiagnosis) {
      try {
        const parsed = JSON.parse(savedDiagnosis);
        setDiagnosisResult(parsed);
        // 복구 시 제안 스타일들도 모두 자동 적용 상태로 매핑 복원
        if (parsed && parsed.recommendations && Array.isArray(parsed.recommendations)) {
          const defaultRecs = parsed.recommendations.map((r: any) => r.styleName);
          setSelectedRecommendations(defaultRecs);
        }
      } catch (e) {
        console.error('진단 리포트 세션 복구 실패:', e);
      }
    }

    // 0-4. 제안서 목록 IndexedDB 대용량 영구 저장소에서 완전 복구
    const tempSalonName = safeLocalStorage.getItem('modestyle_salon_name') || '';
    loadProposalsFromDB().then((dbList) => {
      if (dbList && dbList.length > 0) {
        const restoredList = dbList.map((item: any) => ({
          ...item,
          beforeImage: savedOriginalImage || item.beforeImage
        }));
        setResultsList(restoredList);

        // 워터마크 파일 비동기 재생성
        restoredList.forEach((item: any) => {
          createWatermarkedFile(item.afterImage, item.styleName, tempSalonName)
            .then((file) => {
              setResultsList((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, watermarkedFile: file } : p))
              );
            })
            .catch((err) => console.error('워터마크 재생성 실패:', err));
        });
      } else {
        // Fallback: 기존 세션스토리지에 있는 경우 복구
        const savedResults = safeSessionStorage.getItem('modestyle_results_list');
        if (savedResults) {
          try {
            const parsedList: SimulationResult[] = JSON.parse(savedResults);
            const restoredList = parsedList.map(item => ({
              ...item,
              beforeImage: savedOriginalImage || item.beforeImage
            }));
            setResultsList(restoredList);
            saveProposalsToDB(restoredList);
          } catch (e) { }
        }
      }
    }).catch(err => console.error('IndexedDB 로드 오류:', err));

    // 1. 살롱 설정 정보 로드
    const savedSalon = safeLocalStorage.getItem('modestyle_salon_name');
    if (savedSalon) setSalonName(savedSalon);
    const savedDesigner = safeLocalStorage.getItem('modestyle_designer_name');
    if (savedDesigner) setDesignerName(savedDesigner);

    // 2. 기기 식별 기반 최초 무료 크레딧 초기화
    nativeBridge.initializeFreeCredits();
  }, []);

  // 로그인 세션 상태와 로컬 크레딧 동기화
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const sUser = session.user as any;
      setRemainingCredits(sUser.remainingCredits ?? 3);
      setTotalPlanCredits(sUser.totalPlanCredits ?? 3);
      setUserPlan(sUser.userPlan ?? '무료체험');
    } else if (status === 'unauthenticated') {
      const data = nativeBridge.getCreditsData();
      setRemainingCredits(data.remaining);
      setTotalPlanCredits(data.total);
      setUserPlan(data.plan);
    }
  }, [session, status]);

  // 로딩 텍스트 순환 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // 이미지 선택 시 자동 진단 API 구동
  const handleImageSelected = async (base64: string) => {
    // 렌더링 스케줄 지연 없이 즉각 동기식 세션 백업 실행 (카카오 OOM 리로드에 대비)
    safeSessionStorage.setItem('modestyle_original_image', base64);

    // 기존 세션 정보 비우기
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('modestyle_results_list');
        sessionStorage.removeItem('modestyle_diagnosis_result');
      }
    } catch (e) { }

    setOriginalImage(base64);
    setErrorMsg(null);
    setResultsList([]);
    setActiveHiddenPrompt(null);
    setSelectedRecommendations([]); // AI 추천 선택 초기화
    setDiagnosisResult(null);
    setDiagnosisError(null);
    setIsDiagnosing(true);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '진단 리포트 생성에 실패했습니다.');
      }

      setDiagnosisResult(data);
      // 진단 결과 동기 백업
      safeSessionStorage.setItem('modestyle_diagnosis_result', JSON.stringify(data));

      // AI 제안 스타일 기본값으로 전부 자동 적용(체크)
      if (data.recommendations && Array.isArray(data.recommendations)) {
        const defaultRecs = data.recommendations.map((r: any) => r.styleName);
        setSelectedRecommendations(defaultRecs);
      }

      if (data.currentLength) {
        setSelectedLength(data.currentLength);
      }
    } catch (err: any) {
      console.error(err);
      setDiagnosisError(err.message || '헤어 진단 중 오류가 발생했습니다.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const scrollToSimulator = () => {
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setOriginalImage(null);
    setResultsList([]);
    setErrorMsg(null);
    setActiveHiddenPrompt(null);
    setSelectedRecommendations([]); // AI 추천 선택 초기화
    setDiagnosisResult(null);
    setDiagnosisError(null);

    // 세션 스토리지 백업 데이터 제거
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('modestyle_original_image');
        sessionStorage.removeItem('modestyle_results_list');
        sessionStorage.removeItem('modestyle_diagnosis_result');
      }
    } catch (e) { }
  };

  // 설정 저장
  const handleSaveSettings = (name: string, designer: string) => {
    setSalonName(name);
    safeLocalStorage.setItem('modestyle_salon_name', name);
    setDesignerName(designer);
    safeLocalStorage.setItem('modestyle_designer_name', designer);
    setShowSettings(false);
  };

  // 스타일 다중 토글 핸들러
  const handleStyleToggle = (styleName: string) => {
    // 수동 선택 변경 시 진단 기반 히든 메이크업 프롬프트 무효화
    setActiveHiddenPrompt(null);
    setSelectedStyles((prev) => {
      if (prev.includes(styleName)) {
        if (prev.length === 1 && selectedRecommendations.length === 0) return prev; // 적어도 하나는 선택되어 있도록
        return prev.filter((s) => s !== styleName);
      } else {
        return [...prev, styleName];
      }
    });
  };

  // 직접 요청 스타일 입력값 변경 핸들러
  const handleCustomStyleChange = (text: string) => {
    const oldVal = customStyleText.trim();
    const newVal = text.trim();
    setCustomStyleText(text);

    // 동기 세션 백업
    safeSessionStorage.setItem('modestyle_custom_style_text', text);
    safeSessionStorage.setItem('modestyle_is_custom_style_applied', newVal ? 'true' : 'false');

    if (newVal) {
      setIsCustomStyleApplied(true);
      setSelectedStyles(prev => {
        const base = prev.filter(s => s !== oldVal);
        if (!base.includes(newVal)) {
          return [...base, newVal];
        }
        return base;
      });
    } else {
      setIsCustomStyleApplied(false);
      if (oldVal) {
        setSelectedStyles(prev => prev.filter(s => s !== oldVal));
      }
    }
  };

  // 직접 요청 스타일 적용 토글 핸들러
  const handleCustomStyleToggle = () => {
    const val = customStyleText.trim();
    if (!val) return;

    setIsCustomStyleApplied(prev => {
      const nextApplied = !prev;
      // 동기 세션 백업
      safeSessionStorage.setItem('modestyle_is_custom_style_applied', nextApplied ? 'true' : 'false');
      if (nextApplied) {
        setSelectedStyles(s => s.includes(val) ? s : [...s, val]);
      } else {
        setSelectedStyles(s => s.filter(x => x !== val));
      }
      return nextApplied;
    });
  };

  // 진단 추천 스타일 다중 토글 핸들러
  const handleRecommendationToggle = (rec: { styleName: string; reason: string; hiddenPrompt?: string }) => {
    setSelectedRecommendations((prev) => {
      if (prev.includes(rec.styleName)) {
        if (prev.length === 1 && selectedStyles.length === 0) return prev; // 적어도 하나는 선택되어 있도록
        return prev.filter((name) => name !== rec.styleName);
      } else {
        return [...prev, rec.styleName];
      }
    });
  };

  // 다음 결제 예정일 계산 헬퍼 (+30일 뒤 날짜)
  const calcNextBillingDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}년 ${mm}월 ${dd}일`;
  };

  // 하이브리드 앱 브릿지 감지 헬퍼
  const isHybridApp = () => {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).webkit?.messageHandlers?.keychainHandler ||
      (window as any).webkit?.messageHandlers?.revenueCatHandler ||
      (window as any).AndroidSecureStorage ||
      (window as any).AndroidRevenueCat
    );
  };

  // 토스페이먼츠 결제창 요청 헬퍼
  const requestTossPayment = (planType: '1회충전' | '라이트' | '살롱') => {
    if (typeof window === 'undefined') return;

    const clientKey = 'test_ck_D5aZMgN5K3Q1vvJQ8Jqv85bGbR51'; // 토스페이먼츠 공식 테스트 클라이언트 키
    const tossPayments = (window as any).TossPayments ? (window as any).TossPayments(clientKey) : null;

    if (!tossPayments) {
      alert('Toss Payments 결제 모듈을 로드하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsLoading(false);
      return;
    }

    let price = 3000;
    let credits = 10;
    let total = 10;

    if (planType === '라이트') {
      price = 29000;
      credits = 300;
      total = 300;
    } else if (planType === '살롱') {
      price = 69000;
      credits = 1000;
      total = 1000;
    }

    const successUrl = `${window.location.origin}/payment/success?plan=${encodeURIComponent(planType)}&credits=${credits}&total=${total}`;
    const failUrl = `${window.location.origin}/payment/fail`;

    try {
      tossPayments.requestPayment('카드', {
        amount: price,
        orderId: `order-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`,
        orderName: `ModeStyle Pro [${planType}] 요금제 충전`,
        customerName: 'ModeStyle 고객',
        successUrl,
        failUrl,
      });
    } catch (err) {
      console.error('Toss Payments request failed:', err);
      alert('결제창을 실행하는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // RevenueCat IAP 플랜 결제 처리 함수
  const handlePurchasePlan = async (planType: '1회충전' | '라이트' | '살롱') => {
    setIsLoading(true);
    if (!isHybridApp()) {
      requestTossPayment(planType);
      return;
    }

    try {
      const res = await nativeBridge.purchasePlan(planType);
      if (res.success) {
        setRemainingCredits(res.credits);
        setTotalPlanCredits(res.total);
        setUserPlan(planType);
        nativeBridge.saveCreditsData(res.credits, res.total, planType);
        alert(`🎉 결제가 완료되어 [${planType}] 요금제(${res.credits}회)가 성공적으로 충전되었습니다!`);
        setShowBillingModal(false);
        setShowExhaustedModal(false);
      }
    } catch (e) {
      console.error(e);
      alert('결제 처리 도중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 해지 / 정기 결제 취소 처리 함수
  const handleCancelSubscription = async () => {
    const isSubscribed = userPlan === '라이트' || userPlan === '살롱';
    const planText = isSubscribed ? '구독 정기 결제' : '플랜 이용';

    if (userPlan === '무료체험') {
      alert('현재 가입된 유료 플랜 또는 구독 요금제가 없습니다.');
      return;
    }

    const confirmCancel = confirm(
      `정말로 [${userPlan}] ${planText}를 취소/해지하시겠습니까?\n해지 시 다음 주기에 자동 갱신(결제)이 중지되며, 현재 보유하신 잔여 횟수(${remainingCredits.toLocaleString()}회)는 계속 유지됩니다.`
    );

    if (!confirmCancel) return;

    setIsLoading(true);
    try {
      // 1. 하이브리드 앱 환경인 경우 스토어 구독 취소 가이드 및 네이티브 시그널 전달
      if (isHybridApp()) {
        if (typeof window !== 'undefined') {
          if ((window as any).webkit?.messageHandlers?.revenueCatHandler) {
            await (window as any).webkit.messageHandlers.revenueCatHandler.postMessage({
              action: 'cancel'
            });
          }
          if ((window as any).AndroidRevenueCat) {
            (window as any).AndroidRevenueCat.cancelSubscription();
          }
        }
        alert('💡 모바일 앱의 정기 구독 해지는 App Store / Play Store의 [설정 > 구독 관리] 메뉴를 통해서도 안전하게 취소하실 수 있습니다.');
      }

      // 2. 공통 스토리지 업데이트 및 무료체험 복귀 (기존 잔여 크레딧은 보존)
      setUserPlan('무료체험');
      nativeBridge.saveCreditsData(remainingCredits, 3, '무료체험');

      alert('🔒 구독 요금제가 정상적으로 해지되었으며, 기본 [무료 체험] 플랜으로 안전하게 전환되었습니다. 남은 크레딧은 계속 사용하실 수 있습니다.');
      setShowBillingModal(false);
    } catch (e) {
      console.error(e);
      alert('구독 해지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인앱 결제 구매 내역 복원 (Restore Purchases)
  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const res = await nativeBridge.restorePurchases();
      if (res && res.success) {
        setRemainingCredits(res.credits);
        setTotalPlanCredits(res.total);
        setUserPlan(res.plan as any);
        nativeBridge.saveCreditsData(res.credits, res.total, res.plan);
        alert(`🎉 구매 내역이 정상적으로 복원되었습니다!\n[${res.plan}] 요금제 (잔여: ${res.credits}회)`);
      } else {
        alert('복원 가능한 인앱 결제 활성 내역이 없습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('구매 복원 도중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 유저 조기 리셋 결제 처리 함수 (즉시 한도 리셋 및 주기 갱신)
  const handleEarlyResetPurchase = async (planType: '라이트' | '살롱') => {
    setIsLoading(true);
    if (!isHybridApp()) {
      requestTossPayment(planType);
      return;
    }

    try {
      const res = await nativeBridge.purchasePlan(planType);
      if (res.success) {
        setRemainingCredits(res.credits);
        setTotalPlanCredits(res.total);
        setUserPlan(planType);
        nativeBridge.saveCreditsData(res.credits, res.total, planType);

        // 정기 결제 스케줄 취소 및 주기 재설정 백엔드 연동 데이터 시뮬레이션
        // DB 내 subscription_period_start를 오늘로, subscription_period_end를 1달 뒤로 업데이트
        const billingStart = new Date().toISOString().split('T')[0];
        const billingEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log(`[Subscription Reset Success] DB Update -> start: ${billingStart}, end: ${billingEnd}`);

        alert(`🎉 [${planType}] 요금제 구독 조기 리셋이 성공적으로 승인되었습니다! 오늘부터 새로운 결제 주기가 적용되며, ${res.credits.toLocaleString()}회가 즉시 리셋 충전되었습니다.`);
        setShowExhaustedModal(false);
      }
    } catch (e) {
      console.error(e);
      alert('조기 리셋 결제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 다중 스타일 일괄 시뮬레이션 비동기 실행 및 히스토리 누적
  const handleGenerate = async () => {
    if (!originalImage) {
      setErrorMsg('먼저 시뮬레이션을 진행할 고객 사진을 업로드해 주세요.');
      return;
    }

    // 빌드 작업 큐
    const queue: Array<{ styleName: string; customPrompt: string | null }> = [];

    // 1. 진단 추천 스타일 중 선택된 항목 추가
    if (diagnosisResult) {
      diagnosisResult.recommendations.forEach((rec) => {
        if (selectedRecommendations.includes(rec.styleName)) {
          queue.push({
            styleName: rec.styleName,
            customPrompt: rec.hiddenPrompt || null
          });
        }
      });
    }

    // 2. 우측 스타일 목록 중 선택된 항목 추가
    selectedStyles.forEach((styleName) => {
      queue.push({
        styleName,
        customPrompt: null
      });
    });

    if (queue.length === 0) {
      setErrorMsg('시뮬레이션할 타겟 헤어 스타일 또는 추천 스타일을 최소 하나 이상 선택해 주세요.');
      return;
    }

    // 개발 모드가 아닐 때 크레딧 소진 가드
    const isDevMode = process.env.NODE_ENV === 'development';
    if (!isDevMode && remainingCredits <= 0) {
      setShowExhaustedModal(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setCurrentGeneratingIndex(0);

    let tempCredits = remainingCredits;

    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];
      setCurrentGeneratingIndex(i);
      const startTime = performance.now();

      try {
        // 스타일 정보 매칭 및 실제 기장 결정 (스타일 고유 기장 최우선 반영)
        const matchedStyleInfo = STYLE_OPTIONS[gender].find(s => s.name === job.styleName);
        const resolvedLength = matchedStyleInfo?.lengthCategory
          || ((selectedLength && selectedLength !== '전체') ? selectedLength : (gender === '남성' ? '미디움' : '미디움'));

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: originalImage,
            gender,
            hairLength: resolvedLength,
            hairStyle: job.styleName,
            customPrompt: job.customPrompt,
            outfitPrompt: matchedStyleInfo?.outfitPrompt,
            changeOutfit: enableOutfitStyling,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `${job.styleName} 시뮬레이션 생성 실패`);
        }

        const endTime = performance.now();
        const duration = parseFloat(((endTime - startTime) / 1000).toFixed(1));

        const careOption = matchedStyleInfo?.careOption || '🧪 스타일 유지력 향상을 위한 모발 수분 단백질 케어';
        const careCost = matchedStyleInfo?.careCost || '추가 비용 : 50,000원 ~ 80,000원';
        const designOption = matchedStyleInfo?.designOption || '🧴 디자인 디테일 교정 (사이드 다운펌 / 뿌리 볼륨 디테일링)';
        const designCost = matchedStyleInfo?.designCost || '추가 비용 : 30,000원 ~ 40,000원';

        // 스타일링 팁 매칭 (진단 추천 스타일에서 추출하거나 우측 리스트 프리셋에서 추출)
        const recommendedStyleInfo = diagnosisResult?.recommendations.find(r => r.styleName === job.styleName);
        const stylingTip = recommendedStyleInfo?.stylingTip
          || matchedStyleInfo?.stylingTip
          || '샴푸 후 찬바람으로 건조시킨 뒤 가벼운 헤어 에센스를 발라 부스스함을 정돈해 줍니다.';

        // 추천 의상 코디 매칭
        const recommendedOutfit = recommendedStyleInfo?.recommendedOutfit
          || matchedStyleInfo?.recommendedOutfit
          || (gender === '남성' ? '모던 스마트 캐주얼 셋업 & 옥스포드 셔츠' : '프렌치 시크 테일러드 자켓 & 실키 니트 코디');

        // 신규 결과를 히스토리 리스트 맨 앞에 추가 (최신순 누적)
        const newResult: SimulationResult = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          beforeImage: originalImage,
          afterImage: data.image,
          gender,
          length: resolvedLength,
          styleName: job.styleName,
          generationTime: duration,
          careOption,
          careCost,
          designOption,
          designCost,
          stylingTip,
          recommendedOutfit,
          upsell: matchedStyleInfo?.upsell
        };

        // 워터마크가 합성된 공유용 이미지 파일 사전 생성 (비동기)
        createWatermarkedFile(data.image, job.styleName, salonName)
          .then((file) => {
            newResult.watermarkedFile = file;
            setResultsList((prev) => {
              const next = [newResult, ...prev];
              // IndexedDB 대용량 영구 저장소에 전체 제안서 안전 저장
              saveProposalsToDB(next);
              return next;
            });
          })
          .catch((err) => {
            console.error('워터마크 이미지 사전 생성 실패:', err);
            // 실패해도 결과 카드는 정상 노출되도록 추가
            setResultsList((prev) => {
              const next = [newResult, ...prev];
              saveProposalsToDB(next);
              return next;
            });
          });

        // 사용 횟수 실시간 차감 및 네이티브/로컬 스토리지에 즉시 동기화
        if (process.env.NODE_ENV !== 'development') {
          tempCredits = Math.max(0, tempCredits - 1);
          setRemainingCredits(tempCredits);
          nativeBridge.saveCreditsData(tempCredits, totalPlanCredits, userPlan);
        }

      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || '시뮬레이션 생성 도중 연결 실패가 발생했습니다.');
        break;
      }
    }

    setIsLoading(false);
    setCurrentGeneratingIndex(null);

    // 생성 완료 후 결과 목록 영역으로 자동 스크롤
    setTimeout(() => {
      const resultSection = document.getElementById('simulation-results-container');
      resultSection?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // 피드백 반영: 다운로드 또는 공유 시 ModeStylePro 로고와 미용실 이름 워터마크 합성 처리
  const handleShareOrDownloadItem = async (result: SimulationResult) => {
    const filePrefix = salonName ? `modestyle-${salonName}` : 'modestyle';
    const fileName = `${filePrefix}-${result.styleName.replace(/\s+/g, '-')}.png`;

    // 다운로드(저장) 헬퍼 함수
    const triggerDownload = (dataUrl: string) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // 인앱 브라우저 여부 판별 (카카오톡, 네이버, 인스타그램 등)
    const isInsideApp = () => {
      if (typeof window === 'undefined') return false;
      const ua = window.navigator.userAgent.toLowerCase();
      return ua.indexOf('kakaotalk') > -1 || ua.indexOf('naver') > -1 || ua.indexOf('instagram') > -1 || ua.indexOf('fb') > -1;
    };

    // 1. 이미 준비된 워터마크 파일이 있는 경우 (동기 실행으로 모바일 사용자 제스처 컨텍스트 유지)
    if (result.watermarkedFile && navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: [result.watermarkedFile] })) {
        try {
          await navigator.share({
            files: [result.watermarkedFile],
            title: `${salonName ? salonName : 'ModeStyle Pro'} 헤어 제안서`,
            text: `${result.styleName} 스타일 제안 이미지입니다.`
          });
          return; // 성공적으로 공유창이 뜨면 종료
        } catch (error: any) {
          if (error.name === 'AbortError') {
            return; // 사용자가 취소한 경우 다운로드로 넘어가지 않음
          }
          console.error('사전 생성 파일 공유 실패, 다운로드로 대체:', error);
        }
      }
    }

    // 파일 공유가 불가능하여 다운로드로 폴백될 때, 카카오톡 등의 인앱 브라우저인 경우 안내 추가
    if (isInsideApp()) {
      alert("💡 카카오톡 앱 내부에서는 보안 정책상 이미지 직접 공유(카카오톡 전송 등)가 제한되어 있어 제안서 이미지가 갤러리에 다운로드(저장)됩니다.\n\n오른쪽 상단 메뉴(또는 삼점/더보기) 버튼을 눌러 '다른 브라우저(Safari/Chrome)로 열기'를 선택하시면 곧장 카카오톡 및 메시지 전송 공유 기능을 사용하실 수 있습니다!");
    }

    // 2. 파일이 준비되지 않았거나 Web Share API가 지원되지 않는 경우 동적 생성 및 다운로드(저장)
    const img = new Image();
    if (result.afterImage && result.afterImage.startsWith('http')) {
      img.crossOrigin = 'anonymous'; // CORS 에러 방지 (외부 이미지인 경우에만)
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        triggerDownload(result.afterImage);
        return;
      }

      // 1. After 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 2. 하단 그라데이션 어두운 오버레이 바 생성
      const barHeight = img.height * 0.07;
      const grad = ctx.createLinearGradient(0, img.height - barHeight, 0, img.height);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, img.height - barHeight, img.width, barHeight);

      // 3. 워터마크 텍스트 합성
      const watermarkText = salonName ? `ModeStylePro _ ${salonName}` : 'ModeStylePro';
      const fontSize = Math.round(img.height * 0.022);
      ctx.font = `bold ${fontSize}px 'Pretendard', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const paddingRight = img.width * 0.04;
      const centerY = img.height - (barHeight / 2);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(watermarkText, img.width - paddingRight, centerY);

      // 다운로드 유도
      triggerDownload(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      triggerDownload(result.afterImage);
    };
    img.src = result.afterImage;
  };

  // 📄 제안서 종합 리포트 공유 모달 오픈
  const handleShareFullReport = (result: SimulationResult) => {
    setIsCopiedReport(false);
    setSharingReportResult(result);
  };

  // 모달 내 리포트 텍스트 복사 핸들러
  const handleCopyReportText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopiedReport(true);
      setTimeout(() => setIsCopiedReport(false), 3000);
    } catch (e) {
      alert(text);
    }
  };

  // 모달 내 모바일 네이티브 공유 핸들러 (모바일 기기일 때만 트리거)
  const handleNativeShare = async (result: SimulationResult, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (result.watermarkedFile && navigator.canShare && navigator.canShare({ files: [result.watermarkedFile] })) {
          await navigator.share({
            title: `${salonName || 'ModeStyle Pro'} 헤어 제안서`,
            text: text,
            files: [result.watermarkedFile]
          });
        } else {
          await navigator.share({
            title: `${salonName || 'ModeStyle Pro'} 헤어 제안서`,
            text: text
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyReportText(text);
        }
      }
    } else {
      handleCopyReportText(text);
    }
  };

  // 전체 스타일 종합 제안서 캔버스 이미지 생성기 (Before 1장 + After 3~4장 + 코디 비교표 합성)
  const generateCombinedReportCanvasImage = async (): Promise<string | null> => {
    if (!originalImage || resultsList.length === 0) return null;
    setIsGeneratingCombinedImage(true);

    try {
      // 이미지 로드 헬퍼
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          if (src.startsWith('http')) {
            img.crossOrigin = 'anonymous';
          }
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      const beforeImg = await loadImage(originalImage);
      const afterItems = resultsList.slice(0, 3);
      const afterImgs = await Promise.all(afterItems.map((item) => loadImage(item.afterImage)));

      // 캔버스 크기 계산 (1200px 기준 고화질)
      const canvas = document.createElement('canvas');
      const totalCards = 1 + afterItems.length; // Before 1개 + After 최대 3개 (총 2~4개)
      const cols = totalCards <= 2 ? 2 : totalCards === 3 ? 3 : 2;
      const rows = totalCards <= 3 ? 1 : 2;

      const cardWidth = 540;
      const cardHeight = 540;
      const gap = 30;
      const padding = 50;
      const headerHeight = 180;
      const footerHeight = 240;

      canvas.width = padding * 2 + cols * cardWidth + (cols - 1) * gap;
      canvas.height = headerHeight + rows * (cardHeight + 90) + footerHeight + padding * 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // 1. 다크 프리미엄 배경 채우기
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#09090b');
      bgGrad.addColorStop(0.5, '#121215');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 테두리 골드 라인
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

      // 2. 상단 헤더 텍스트
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✨ ${salonName || 'ModeStyle Pro'} 헤어 & 패션 종합 스타일링 리포트`, canvas.width / 2, padding + 55);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '20px sans-serif';
      const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillText(`담당: ${designerName || '지오 디자이너'}  |  컨설팅 일자: ${todayStr}`, canvas.width / 2, padding + 95);

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, headerHeight);
      ctx.lineTo(canvas.width - padding, headerHeight);
      ctx.stroke();

      // 3. 카드 렌더링 (Before + After 스타일들)
      const allCards = [
        {
          title: '📷 BEFORE (현재 스타일)',
          outfit: '현재 본연의 헤어 & 스타일링 상태',
          img: beforeImg,
          badgeColor: '#71717a'
        },
        ...afterItems.map((res, i) => ({
          title: `✨ 추천 ${i + 1}: ${res.styleName}`,
          outfit: `👗 ${res.recommendedOutfit || '헤어 맞춤 모던 코디'}`,
          img: afterImgs[i],
          badgeColor: '#f59e0b'
        }))
      ];

      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = padding + c * (cardWidth + gap);
        const y = headerHeight + 30 + r * (cardHeight + 90);

        // 카드 테두리 배경
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, 16);
        ctx.fill();
        ctx.stroke();

        // 이미지 클리핑 & 그리기
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, cardWidth - 20, cardHeight - 20, 12);
        ctx.clip();
        ctx.drawImage(card.img, x + 10, y + 10, cardWidth - 20, cardHeight - 20);
        ctx.restore();

        // 스타일 타이틀 배지
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.roundRect(x, y + cardHeight + 8, cardWidth, 40, 10);
        ctx.fill();

        ctx.fillStyle = card.badgeColor;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(card.title, x + 15, y + cardHeight + 35);

        // 추천 코디 배지
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '16px sans-serif';
        ctx.fillText(card.outfit, x + 15, y + cardHeight + 68);
      }

      // 4. 하단 요약 및 살롱 안내 푸터
      const footerY = canvas.height - footerHeight + 20;
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, footerY);
      ctx.lineTo(canvas.width - padding, footerY);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📋 고객님만의 시그니처 룩을 위한 프리미엄 맞춤 제안입니다`, canvas.width / 2, footerY + 50);

      ctx.fillStyle = '#d4d4d8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`📍 예약 및 스타일 상담 문의: ${salonName || 'ModeStyle Pro 살롱'} (${designerName || '지오 디자이너'})`, canvas.width / 2, footerY + 90);

      ctx.fillStyle = '#71717a';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Generated by ModeStyle Pro AI Consulting Solution  |  ${todayStr}`, canvas.width / 2, footerY + 130);

      const combinedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCombinedReportImage(combinedDataUrl);
      return combinedDataUrl;
    } catch (err) {
      console.error('Failed to generate combined report image:', err);
      return null;
    } finally {
      setIsGeneratingCombinedImage(false);
    }
  };

  // 전체 스타일 종합 제안서 모달 열기 핸들러
  const handleOpenCombinedReport = () => {
    setShowCombinedReportModal(true);
    generateCombinedReportCanvasImage();
  };

  // 종합 리포트 텍스트 복사 핸들러
  const handleCopyCombinedReportText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopiedCombinedReport(true);
      setTimeout(() => setIsCopiedCombinedReport(false), 3000);
    } catch (e) {
      alert(text);
    }
  };

  // 종합 리포트 이미지 다운로드
  const handleDownloadCombinedImage = () => {
    if (!combinedReportImage) {
      alert('종합 리포트 이미지를 생성하는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const link = document.createElement('a');
    link.href = combinedReportImage;
    link.download = `ModeStylePro_전체스타일_종합제안서_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 개별 결과 삭제
  const handleDeleteResultItem = (id: string) => {
    if (activeProposalId === id) {
      setActiveProposalId('all');
    }
    setResultsList((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length > 0) {
        saveProposalsToDB(next);
      } else {
        clearProposalsFromDB();
      }
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* 글로벌 네비게이션 헤더 (피드백 반영: 상호명 추가 및 설정 연동) */}
      <header className="sticky top-0 z-40 glass-panel border-b border-zinc-800/80 px-4 py-3 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gold-bg-gradient flex items-center justify-center text-zinc-950 font-bold text-lg shadow-lg shadow-amber-400/10">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-sm md:text-base tracking-wider text-zinc-100 flex items-center gap-1.5">
              {salonName ? (
                <>
                  {salonName} <span className="text-[10px] text-zinc-400 font-normal">| ModeStyle Pro</span>
                </>
              ) : (
                <span>ModeStyle Pro</span>
              )}
            </h1>
          </div>
        </div>

        {/* 상단 우측 설정 및 충전 잔량 정보 */}
        <div className="flex items-center gap-3">

          {/* 크레딧 현황 배지 */}
          <div
            onClick={() => setShowBillingModal(true)}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer px-3 py-1.5 rounded-full transition-all"
            title="크레딧 충전하기"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] text-zinc-300 font-semibold select-none flex items-center gap-1">
              {renderCreditBadgeText()}
            </span>
          </div>

          {/* 간편 로그인 / 회원 정보 상태 */}
          {status === 'authenticated' && session?.user ? (
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1.5 rounded-full text-xs">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || '유저'}
                  className="w-5.5 h-5.5 rounded-full object-cover border border-zinc-800"
                />
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
                  {session.user.name?.[0] || 'U'}
                </div>
              )}
              <span className="text-[11px] font-bold text-zinc-300 max-w-[80px] truncate">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut()}
                type="button"
                className="text-[10px] text-zinc-500 hover:text-red-400 font-bold ml-1 transition-colors"
                title="로그아웃"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              type="button"
              className="px-3.5 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 font-bold text-[11px] active:scale-[0.98] transition-all"
            >
              로그인
            </button>
          )}

          {/* 피드백 반영: 우측 상단 톱니바퀴 환경설정 버튼 */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-amber-400 transition-colors flex items-center justify-center shadow-md"
            title="상호 및 디자이너 정보 설정"
            type="button"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 톱니바퀴 설정 모달 팝업 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-zinc-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm md:text-base text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                스타일리스트 환경설정
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-zinc-500 hover:text-zinc-300"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold block">살롱 상호명</label>
                <input
                  type="text"
                  defaultValue={salonName}
                  id="setting-salon-input"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:border-amber-400 focus:outline-none text-zinc-100"
                  placeholder="예: 드림헤어"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold block">디자이너 이름</label>
                <input
                  type="text"
                  defaultValue={designerName}
                  id="setting-designer-input"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:border-amber-400 focus:outline-none text-zinc-100"
                  placeholder="예: 지오"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                type="button"
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold text-xs transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const sInput = document.getElementById('setting-salon-input') as HTMLInputElement;
                  const dInput = document.getElementById('setting-designer-input') as HTMLInputElement;
                  handleSaveSettings(sInput?.value || '', dInput?.value || '지오 디자이너');
                }}
                type="button"
                className="flex-1 py-2.5 rounded-xl gold-bg-gradient text-zinc-950 font-bold text-xs transition-colors shadow-lg"
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 요금제 충전 및 플랜 가입 모달 */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-zinc-800 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  이용 플랜 충전 및 구독
                </h3>
                <p className="text-[10px] text-zinc-400">
                  로그인 없는 간편 충전. 결제 즉시 기기 식별을 통해 안전하게 크레딧이 부여됩니다.
                </p>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 현재 이용 중인 플랜 정보 요약 및 해지 단추 */}
            <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-500 font-bold block">이용 중인 플랜</span>
                <span className="text-xs font-extrabold text-white">
                  {userPlan} 요금제
                  <span className="text-[10px] text-zinc-400 font-normal ml-1.5">
                    ({remainingCredits.toLocaleString('ko-KR')}회 남음)
                  </span>
                </span>
              </div>
              {(userPlan === '라이트' || userPlan === '살롱') && (
                <button
                  onClick={handleCancelSubscription}
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg border border-red-950 bg-red-950/20 hover:bg-red-900/40 text-red-400 font-bold text-[10px] active:scale-[0.98] transition-all"
                >
                  구독 취소
                </button>
              )}
            </div>

            {/* 충전 요금제 목록 */}
            <div className="space-y-3.5">
              {/* 1회 충전 */}
              <div
                onClick={() => handlePurchasePlan('1회충전')}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-400/80 transition-all flex items-center justify-between group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200">1회 충전 🎟️</span>
                  <p className="text-[10px] text-zinc-500">10회 시뮬레이션 제공 (장당 300원 상당)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">3,000원 결제</span>
                </div>
              </div>

              {/* 라이트 구독 */}
              <div
                onClick={() => handlePurchasePlan('라이트')}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-400/80 transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden"
                role="button"
                tabIndex={0}
              >
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-bl-lg">
                  BEST
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200">라이트 구독 🚀</span>
                  <p className="text-[10px] text-zinc-500">월 300회 시뮬레이션 제공 (장당 96원 상당)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">월 29,000원</span>
                </div>
              </div>

              {/* 살롱 구독 */}
              <div
                onClick={() => handlePurchasePlan('살롱')}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-400/80 transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden"
                role="button"
                tabIndex={0}
              >
                <div className="absolute top-0 right-0 bg-amber-400 text-zinc-950 text-[8px] font-extrabold px-2 py-0.5 rounded-bl-lg">
                  PREMIUM
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200">살롱 구독 👑</span>
                  <p className="text-[10px] text-zinc-500">월 1,000회 대용량 시뮬레이션 (장당 69원 상당)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">월 69,000원</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleRestorePurchases}
                className="w-full py-2.5 rounded-xl border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition-all text-center flex items-center justify-center gap-1.5"
              >
                🔄 기기 변경 / 앱 재설치 구매 내역 복원하기 (Restore Purchases)
              </button>
              <p className="text-[9px] text-zinc-600 text-center leading-relaxed">
                * 인앱 결제는 Apple/Google 계정과 연동되어 기기를 변경하더라도 복원을 통해 크레딧이 동일하게 이전됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. 크레딧 소진 유저 상태별 맞춤형 안내 모달 */}
      {showExhaustedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-zinc-800 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            {/* 무료체험 소진 케이스 */}
            {userPlan === '무료체험' && (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🎀</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-white">무료 체험 3회를 모두 사용하셨습니다!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                    {"헤어 스타일 시뮬레이션이 마음에 드셨나요?\n지속적인 스타일 탐색을 위해 원하시는 플랜을 선택해 주세요."}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePurchasePlan('1회충전')}
                    className="w-full py-3.5 gold-bg-gradient text-zinc-950 font-extrabold rounded-xl text-xs sm:text-sm hover:scale-[1.02] transition-all shadow-md"
                  >
                    3,000원으로 10회 시작하기
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePurchasePlan('라이트')}
                    className="w-full py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-200 text-xs sm:text-sm font-bold hover:bg-zinc-900/60 hover:text-white transition-all"
                  >
                    월 29,000원 라이트 구독하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExhaustedModal(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-400 pt-1"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

            {/* 1회 충전 소진 케이스 */}
            {userPlan === '1회충전' && (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🎟️</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-white">10회를 모두 소진하셨습니다!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                    {"10회 추가 충전(3,000원)을 하거나, 더 저렴한 구독 요금제로 전환해 보세요."}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePurchasePlan('1회충전')}
                    className="w-full py-3.5 gold-bg-gradient text-zinc-950 font-extrabold rounded-xl text-xs sm:text-sm hover:scale-[1.02] transition-all shadow-md"
                  >
                    3,000원 추가 충전 (10회)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExhaustedModal(false);
                      setShowBillingModal(true);
                    }}
                    className="w-full py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-200 text-xs sm:text-sm font-bold hover:bg-zinc-900/60 hover:text-white transition-all"
                  >
                    구독 플랜 둘러보기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExhaustedModal(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-400 pt-1"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

            {/* 라이트 구독 소진 케이스 */}
            {userPlan === '라이트' && (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🚀</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-white">300회를 모두 소진하셨습니다!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed text-left whitespace-pre-line">
                    {`지금 29,000원을 결제하시면 즉시 300회가 충전되며, 오늘을 기준으로 다음 정기 결제일이 변경됩니다.\n(다음 결제 예정일: ${calcNextBillingDate()})`}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleEarlyResetPurchase('라이트')}
                    className="w-full py-3.5 gold-bg-gradient text-zinc-950 font-extrabold rounded-xl text-[11px] sm:text-xs hover:scale-[1.02] transition-all shadow-md"
                  >
                    지금 결제하고 300회 즉시 리셋 (29,000원)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePurchasePlan('살롱')}
                    className="w-full py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-200 text-[11px] sm:text-xs font-bold hover:bg-zinc-900/60 hover:text-white transition-all"
                  >
                    살롱 구독으로 업그레이드 (69,000원)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExhaustedModal(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-400 pt-1"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

            {/* 살롱 구독 소진 케이스 */}
            {userPlan === '살롱' && (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl">👑</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-white">1,000회를 모두 소진하셨습니다!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed text-left whitespace-pre-line">
                    {`지금 69,000원을 결제하시면 즉시 1,000회가 충전되며, 오늘을 기준으로 다음 정기 결제일이 변경됩니다.\n(다음 결제 예정일: ${calcNextBillingDate()})`}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleEarlyResetPurchase('살롱')}
                    className="w-full py-3.5 gold-bg-gradient text-zinc-950 font-extrabold rounded-xl text-[11px] sm:text-xs hover:scale-[1.02] transition-all shadow-md"
                  >
                    지금 결제하고 1,000회 즉시 리셋 (69,000원)
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const res = await new Promise<{ success: boolean; credits: number }>((resolve) => {
                          setTimeout(() => resolve({ success: true, credits: 100 }), 800);
                        });
                        if (res.success) {
                          const nextVal = remainingCredits + res.credits;
                          setRemainingCredits(nextVal);
                          nativeBridge.saveCreditsData(nextVal, totalPlanCredits, userPlan);
                          alert(`🎉 구독자 전용 100회(8,900원) 추가 충전이 성공적으로 완료되었습니다!`);
                          setShowExhaustedModal(false);
                        }
                      } catch (e) {
                        alert('추가 충전 도중 오류가 발생했습니다.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-200 text-xs sm:text-sm font-bold hover:bg-zinc-900/60 hover:text-white transition-all"
                  >
                    구독자 전용 100회 추가 (8,900원)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExhaustedModal(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-400 pt-1"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메인 본문 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-16 flex flex-col gap-16">

        {/* 1. HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              전문 디자이너를 위한<br />
              <span className="gold-gradient">헤어 컨설팅 솔루션</span>
            </h2>

            {/* 타이틀 하단 대표 비주얼 이미지 추가 (브라우저 확장 프로그램 DOM 침범 방지) */}
            <div
              suppressHydrationWarning={true}
              className="relative w-full max-w-[600px] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-lg mx-auto lg:mx-0 my-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                suppressHydrationWarning={true}
                src="/Front%20image.jpg"
                alt="ModeStyle Pro 대표 예시"
                className="w-full h-auto block"
              />
            </div>

            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              사진 한 장만으로, 고객이 원하던 특별한 변신을 제안해보세요.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={scrollToSimulator}
                className="gold-bg-gradient hover:bg-gold-hover text-zinc-950 font-bold px-8 py-3.5 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
              >
                헤어 시뮬레이션 시작하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Before / After 샘플 시연 카드 */}
          <div className="w-full max-w-sm lg:max-w-md shrink-0">
            <div className="glass-panel p-4 rounded-3xl border border-zinc-800/80 shadow-2xl relative flex flex-col">
              <div className="absolute -top-3.5 -right-3.5 bg-amber-400 text-zinc-950 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase shadow-lg shadow-amber-400/20">
                시뮬레이션 예시
              </div>

              {/* 예시 성별 탭 추가 */}
              <div className="flex gap-2 p-1.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 mb-4 max-w-[260px] mx-auto lg:mx-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => setSampleGender('여성')}
                  className={`flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition-all ${sampleGender === '여성'
                    ? 'bg-zinc-800 text-amber-400 shadow-md border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  여성 예시 🎀
                </button>
                <button
                  type="button"
                  onClick={() => setSampleGender('남성')}
                  className={`flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition-all ${sampleGender === '남성'
                    ? 'bg-zinc-800 text-amber-400 shadow-md border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  남성 예시 👔
                </button>
              </div>

              {/* 샘플 Before/After 슬라이더 */}
              <BeforeAfterSlider
                beforeImage={sampleGender === '여성' ? '/sample-before.jpg' : '/sample-male-before.jpg'}
                afterImage={sampleGender === '여성' ? '/sample-after.jpg' : '/sample-male-after.jpg'}
              />

              <div className="mt-4 space-y-2 text-center lg:text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">스타일 제안</span>
                  <span className="text-amber-400 font-bold">
                    {sampleGender === '여성'
                      ? '여성 중단발 빌드펌 & 볼륨 레이어드 ✨'
                      : '남성 쉐도우 애즈펌 & 다운펌 ✨'}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-500 leading-relaxed min-h-[58px] flex items-center">
                  <span>
                    📢 <strong>안내:</strong>{' '}
                    {sampleGender === '여성'
                      ? '부스스한 중단발 반곱슬 기장에서 우아한 레이어드 C컬/S컬 볼륨과 수분 클리닉을 결합하여 세련된 분위기를 연출했습니다.'
                      : '뜨고 덥수룩한 생머리 기장에서 트렌디한 쉐도우 애즈펌 볼륨과 깔끔한 라인 다운펌을 결합하여 댄디하고 스마트한 인상을 연출했습니다.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-900" />

        {/* 2. TOOL SECTION */}
        <section ref={simulatorRef} id="simulator" className="space-y-8 scroll-mt-24">

          <div className="max-w-xl mx-auto text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">헤어 스타일링 랩 (Styling Lab)</h3>
            <p className="text-zinc-500 text-xs md:text-sm">
              고객님의 성별과 사진을 등록해주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* 좌측 입력 칼럼: 성별 선택, 업로더 & AI 진단 */}
            <div className="lg:col-span-5 space-y-6">

              {/* 1. 고객 성별 선택 */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
                <span className="text-zinc-300 text-sm font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold">1</span>
                  고객 성별 선택
                </span>

                <div className="grid grid-cols-2 gap-2 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-900 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setGender('여성')}
                    className={`py-3 px-6 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${gender === '여성'
                      ? 'bg-zinc-850 text-amber-400 shadow-md border border-zinc-700/50'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    <Venus className="w-4 h-4" />
                    여성 (Female)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('남성')}
                    className={`py-3 px-6 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${gender === '남성'
                      ? 'bg-zinc-850 text-amber-400 shadow-md border border-zinc-700/50'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    <Mars className="w-4 h-4" />
                    남성 (Male)
                  </button>
                </div>
              </div>

              {/* 2. 고객 사진 업로드 */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-zinc-300 text-sm font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold">2</span>
                  고객 사진 업로드
                </span>

                <ImageUploader
                  onImageSelected={handleImageSelected}
                  onClear={handleClearImage}
                  previewImage={originalImage}
                />
              </div>

              {/* AI 실시간 진단 카드 */}
              {originalImage && (
                <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-400" />
                      실시간 헤어 진단 리포트
                    </span>
                  </div>

                  {isDiagnosing ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-amber-400/10 border-t-amber-400 animate-spin" />
                      <p className="text-[11px] text-zinc-500 animate-pulse">고객님의 얼굴형과 두상을 분석 중입니다...</p>
                    </div>
                  ) : diagnosisError ? (
                    <p className="text-xs text-red-400 p-2.5 bg-red-950/20 border border-red-900/50 rounded-lg">
                      ⚠️ {diagnosisError}
                    </p>
                  ) : diagnosisResult ? (
                    <div className="space-y-4">
                      {/* 얼굴형 및 모질 진단 칩 */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-950/80 border border-zinc-850 p-2.5 rounded-xl">
                          <span className="text-zinc-400 text-xs block mb-0.5 font-bold">얼굴형 진단</span>
                          <span className="text-zinc-100 font-extrabold text-sm">👤 {diagnosisResult.faceShape}</span>
                        </div>
                        <div className="bg-zinc-950/80 border border-zinc-850 p-2.5 rounded-xl">
                          <span className="text-zinc-400 text-xs block mb-0.5 font-bold">두상 및 모질 상태</span>
                          <span className="text-zinc-100 font-extrabold text-sm">💇 {diagnosisResult.hairCondition}</span>
                        </div>
                      </div>

                      {/* TOP 3 추천 스타일 */}
                      <div className="space-y-2.5">
                        <span className="text-zinc-300 text-xs font-bold block uppercase tracking-wider">
                          💡 추천 스타일 TOP 3 (상담 매칭)
                        </span>

                        <div className="space-y-2">
                          {diagnosisResult.recommendations.map((rec, idx) => {
                            const isChecked = selectedRecommendations.includes(rec.styleName);
                            return (
                              <div
                                key={rec.styleName + idx}
                                onClick={() => handleRecommendationToggle(rec)}
                                className={`border p-3.5 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer ${isChecked
                                  ? 'bg-amber-400/5 border-amber-400 text-amber-400 shadow-sm'
                                  : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900/70 text-zinc-300'
                                  }`}
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center ${isChecked ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-900 text-amber-400 border border-zinc-850'
                                      }`}>
                                      {idx + 1}
                                    </span>
                                    <span className={`text-sm font-extrabold ${isChecked ? 'text-amber-400' : 'text-zinc-100'}`}>{rec.styleName}</span>
                                  </div>
                                  <p className={`text-xs leading-normal max-w-xs ${isChecked ? 'text-amber-300 font-medium' : 'text-zinc-300'}`}>{rec.reason}</p>
                                  {rec.recommendedOutfit && (
                                    <div className="pt-0.5">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 ${isChecked ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                                        }`}>
                                        👗 <strong>추천 코디:</strong> {rec.recommendedOutfit}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecommendationToggle(rec);
                                  }}
                                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${isChecked
                                    ? 'bg-amber-400 text-zinc-950 font-extrabold shadow-sm'
                                    : 'text-amber-400 hover:text-zinc-950 hover:bg-amber-400 border border-amber-400/20 hover:border-amber-400 bg-amber-400/5'
                                    }`}
                                >
                                  {isChecked ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      적용됨
                                    </>
                                  ) : (
                                    <>
                                      적용
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 text-center py-6">
                      사진을 업로드하면 실시간 진단 결과가 여기에 노출됩니다.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 우측 입력 칼럼: 모발 길이 및 다중 스타일 선택 */}
            <div className="lg:col-span-7 space-y-6">

              {/* Step 3: 스타일 그리드 (다중 선택 가능) */}
              <div ref={stylesSectionRef} className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-5 scroll-mt-24">

                {/* 기장별 헤어 스타일 선택 섹션 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 text-sm font-bold flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold">3</span>
                      {gender} 기장별 헤어 스타일 (다중 선택 가능)
                    </span>
                    <span className="text-xs text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                      {selectedStyles.length}개 선택됨
                    </span>
                  </div>

                  {/* 기장별 순서대로 그룹화하여 배치 */}
                  <div className="space-y-6">
                    {LENGTH_OPTIONS[gender].map((category) => {
                      const categoryStyles = STYLE_OPTIONS[gender].filter(
                        (s) => s.lengthCategory === category
                      );
                      if (categoryStyles.length === 0) return null;
                      const categoryIcon = LENGTH_ICONS[category] || '✨';

                      return (
                        <div key={category} className="space-y-3">
                          {/* 기장 그룹 헤더 */}
                          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-zinc-800/80">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-400">
                              <span>{categoryIcon}</span>
                              <span>{category}</span>
                              <span className="text-[11px] text-zinc-500 font-normal ml-1">
                                ({categoryStyles.length}개 디자인)
                              </span>
                            </div>
                          </div>

                          {/* 기장에 속한 스타일 카드 그리드 (2배 이상 큰 이미지 & 스타일명만 표시) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categoryStyles.map((style) => {
                              const isChecked = selectedStyles.includes(style.name);
                              return (
                                <div
                                  key={style.name}
                                  onClick={() => handleStyleToggle(style.name)}
                                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group relative cursor-pointer ${isChecked
                                    ? 'bg-amber-400/10 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                                    : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/70 text-zinc-300'
                                    }`}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    {/* 기존 44px 대비 2.2배 이상 확대된 100px 대형 썸네일 */}
                                    <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 relative flex items-center justify-center shadow-inner">
                                      {style.image && (
                                        <img
                                          src={style.image}
                                          alt={style.name}
                                          className="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <span className="text-3xl absolute select-none">
                                        {style.emoji || '✨'}
                                      </span>
                                    </div>

                                    {/* 스타일 명칭 및 추천 의상 표시 */}
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors leading-snug">
                                        {style.name}
                                      </div>
                                      {style.recommendedOutfit && (
                                        <div className="text-[10px] text-zinc-400 font-medium truncate flex items-center gap-1">
                                          <span>👗</span>
                                          <span className="truncate">{style.recommendedOutfit}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 체크마크 */}
                                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isChecked
                                    ? 'border-amber-400 bg-amber-400 text-zinc-950 font-bold'
                                    : 'border-zinc-700 bg-zinc-900/40'
                                    }`}>
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 직접 스타일 요청 입력 폼 */}
                <div className="border-t border-zinc-800/80 pt-4 mt-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCustomStyleToggle}
                      disabled={!customStyleText.trim()}
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isCustomStyleApplied && customStyleText.trim()
                        ? 'border-amber-400 bg-amber-400 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900/40'
                        }`}
                    >
                      {isCustomStyleApplied && customStyleText.trim() && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span
                      onClick={customStyleText.trim() ? handleCustomStyleToggle : undefined}
                      className={`text-[11px] font-bold select-none ${customStyleText.trim() ? 'text-zinc-300 cursor-pointer hover:text-amber-400' : 'text-zinc-500'
                        }`}
                    >
                      ✨ 원하는 스타일 직접 입력
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customStyleText}
                      onChange={(e) => handleCustomStyleChange(e.target.value)}
                      placeholder="예: 리프 가르마펌, 슬릭백 언더컷 등"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 text-xs md:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* 의상 맞춤 코디 자동 변환 옵션 컨트롤 */}
              <div
                onClick={() => setEnableOutfitStyling(prev => !prev)}
                className="glass-panel p-4 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all flex items-center justify-between cursor-pointer group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 text-base shrink-0 group-hover:scale-105 transition-transform">
                    👗
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <span>헤어 맞춤 의상 코디</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${enableOutfitStyling ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                        {enableOutfitStyling ? 'ON(추천)' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      선택한 헤어 스타일과 최상의 조화를 이루는 트렌디한 의상으로 함께 코디합니다.
                    </p>
                  </div>
                </div>

                <div className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 shrink-0 flex items-center ${enableOutfitStyling ? 'bg-amber-400' : 'bg-zinc-800'
                  }`}>
                  <div className={`w-5.5 h-5.5 rounded-full bg-zinc-950 transition-transform shadow-md ${enableOutfitStyling ? 'translate-x-5.5' : 'translate-x-0'
                    }`} />
                </div>
              </div>

              {/* 실행 에러 메시지 */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-400 text-xs leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* 생성 실행 버튼 및 다중 로딩 스케켈톤 */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  type="button"
                  className={`w-full py-4 rounded-2xl font-extrabold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${isLoading
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'gold-bg-gradient hover:scale-[1.01] text-zinc-950 shadow-amber-400/5'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>
                        {totalJobsCount > 1
                          ? `[${totalJobsCount}개 중 ${currentGeneratingIndex! + 1}번째 스타일] `
                          : ''}
                        {LOADING_MESSAGES[loadingMessageIndex]}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>
                        헤어 디자인 시뮬레이션 시작
                        {totalJobsCount > 0 ? ` (${totalJobsCount}개 디자인)` : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* 다중 스타일 동시 생성 시 진행 바 및 로딩 스피너 */}
              {isLoading && (
                <div className="glass-panel p-6 rounded-2xl border border-zinc-800/60 flex flex-col items-center justify-center py-12 gap-4 animate-pulse">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
                  <div className="space-y-2 text-center w-full max-w-xs">
                    <p className="text-zinc-200 font-bold text-sm">
                      {totalJobsCount > 1
                        ? `전체 ${totalJobsCount}개 스타일 중 ${currentGeneratingIndex! + 1}번째 진행 중...`
                        : '헤어 스타일 변환 중...'}
                    </p>

                    {totalJobsCount > 1 && (
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 mt-2 border border-zinc-800">
                        <div
                          className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${((currentGeneratingIndex!) / totalJobsCount) * 100}%` }}
                        />
                      </div>
                    )}
                    <p className="text-zinc-500 text-xs pt-1">안전한 전용 서버에서 렌더링을 차례로 가동하고 있습니다.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* 3. SIMULATION RESULT SECTION (최신순 결과 히스토리 누적 및 스타일별 가변 옵션화) */}
        {resultsList.length > 0 && originalImage && (
          <section id="simulation-results-container" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
                  <span>📂</span> 헤어 제안서 리포트 보관함
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  생성된 헤어 시뮬레이션 결과가 자동으로 저장됩니다. 아래 목록에서 원하는 제안서를 클릭해 상세 리포트를 확인하세요.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleOpenCombinedReport}
                  className="gold-bg-gradient hover:opacity-95 text-zinc-950 font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 text-xs sm:text-sm active:scale-[0.98] transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>📑 전체 스타일 종합 제안서 한 번에 공유하기</span>
                  <span className="bg-zinc-950 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {resultsList.length}개 스타일
                  </span>
                </button>
              </div>
            </div>

            {/* 🗂️ 제안서 목록 퀵 선택 네비게이터 바 (Quick Proposal Selector) */}
            <div className="bg-zinc-950/80 border border-zinc-850 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>📑</span> 제안서 빠른 선택 목록 (클릭하여 보기)
                </span>
                {activeProposalId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveProposalId('all')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
                  >
                    전체 모아보기로 전환
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-zinc-700">
                {/* 1. 전체 모아보기 탭 */}
                <button
                  type="button"
                  onClick={() => setActiveProposalId('all')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 border ${activeProposalId === 'all'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-850'
                    }`}
                >
                  <span>✨ 전체 모아보기</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeProposalId === 'all' ? 'bg-amber-400 text-zinc-950 font-extrabold' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                    {resultsList.length}
                  </span>
                </button>

                {/* 2. 각 제안서별 개별 선택 카드 탭 */}
                {resultsList.map((res, idx) => {
                  const isSelected = activeProposalId === res.id;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setActiveProposalId(res.id)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 border ${isSelected
                          ? 'bg-amber-400/20 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/40'
                          : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-850'
                        }`}
                    >
                      {/* 미니 썸네일 */}
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={res.afterImage}
                          alt={res.styleName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                            {res.styleName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 font-mono">
                            {res.length}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {res.timestamp || `#${idx + 1}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 제안서 리포트 카드 렌더링 (선택된 항목 또는 전체) */}
            <div className="space-y-8">
              {(activeProposalId === 'all' ? resultsList : resultsList.filter(r => r.id === activeProposalId)).map((result) => (
                <div
                  key={result.id}
                  className="glass-panel p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6 relative transition-all duration-300 hover:border-zinc-700"
                >
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDeleteResultItem(result.id)}
                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 transition-colors p-1.5 hover:bg-zinc-900/80 rounded-lg border border-transparent hover:border-zinc-800"
                    title="결과 삭제"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div className="space-y-1">
                      <h4 className="text-lg md:text-xl font-bold text-zinc-100 flex items-center gap-2">
                        {result.gender} {result.length} <span className="text-amber-400 font-extrabold">‘{result.styleName}’</span> 제안서
                      </h4>
                    </div>

                    <div className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400 shrink-0 self-start md:self-auto">
                      ⏱️ 소요 시간: <span className="text-amber-400 font-bold">{result.generationTime}초</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* BeforeAfterSlider 렌더 */}
                    <div className="lg:col-span-5 max-w-sm mx-auto w-full">
                      <BeforeAfterSlider
                        beforeImage={result.beforeImage}
                        afterImage={result.afterImage}
                      />
                    </div>

                    {/* 스타일별 가변 옵션화 */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

                      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl space-y-3 text-left">
                        <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                          📋 맞춤 추천 스타일링 옵션
                        </span>

                        <div className="grid grid-cols-1 gap-2 text-sm text-zinc-200">
                          <div className="flex items-start justify-between p-2.5 bg-zinc-900/60 rounded-lg">
                            <span>💡 <strong className="text-white">{result.styleName}</strong> 헤어 디자인 시술</span>
                            <span className="text-zinc-100 font-extrabold">기본 시술</span>
                          </div>

                          {/* 스타일별 맞춤 케어 2,3번 분리 및 "예상" 단어 배제 */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg gap-1">
                            <span className="text-zinc-100">{result.careOption}</span>
                            <span className="text-amber-300 font-extrabold font-mono shrink-0">{result.careCost}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg gap-1">
                            <span className="text-zinc-100">{result.designOption}</span>
                            <span className="text-amber-300 font-extrabold font-mono shrink-0">{result.designCost}</span>
                          </div>

                          {result.upsell && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-amber-400/5 border border-amber-400/10 rounded-lg gap-1">
                              <span className="text-amber-400 font-bold">✨ {result.upsell.split(' : ')[0]}</span>
                              <span className="text-amber-300 font-extrabold font-mono shrink-0">{result.upsell.split(' : ')[1]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 홈 스타일링 방법 가이드 섹션 추가 */}
                      {result.stylingTip && (
                        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl space-y-2 text-left">
                          <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                            🧴 홈 스타일링 & 관리 가이드
                          </span>
                          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                            {result.stylingTip}
                          </p>
                        </div>
                      )}

                      {/* 헤어 맞춤 추천 의상 코디 섹션 */}
                      {result.recommendedOutfit && (
                        <div className="bg-zinc-950 border border-amber-400/20 bg-amber-400/5 p-4 rounded-2xl space-y-2 text-left">
                          <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                            👗 헤어 맞춤 추천 의상 코디 (Fashion Styling)
                          </span>
                          <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                            {result.recommendedOutfit}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            * 헤어 실루엣과 분위기를 극대화하도록 엄선된 베스트 스타일링 코디입니다.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        {/* 1. 제안서 종합 리포트 공유하기 버튼 (메인 골드 강조) */}
                        <button
                          onClick={() => handleShareFullReport(result)}
                          type="button"
                          className="flex-1 w-full gold-bg-gradient hover:opacity-95 text-zinc-950 font-extrabold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 text-xs md:text-sm active:scale-[0.98]"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>📋 헤어 제안서 리포트 공유하기</span>
                        </button>

                        {/* 2. 제안 이미지 다운로드/저장 버튼 */}
                        <button
                          onClick={() => handleShareOrDownloadItem(result)}
                          type="button"
                          className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 font-bold py-3.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-xs md:text-sm active:scale-[0.98]"
                          title="워터마크 합성 이미지 파일 저장"
                        >
                          <Download className="w-4 h-4 text-amber-400" />
                          <span>이미지 저장</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* 🌟 제안서 보관함 최하단 빠른 공유 & 상담 안내 배너 */}
            <div className="glass-panel p-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg shrink-0">
                  💬
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">고객 맞춤 상담 제안서 완성</h5>
                  <p className="text-xs text-zinc-400">
                    원하시는 스타일 제안서를 선택하여 고객님께 카카오톡이나 메시지로 간편하게 공유해 보세요.
                  </p>
                </div>
              </div>

              {resultsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const target = activeProposalId !== 'all'
                      ? resultsList.find(r => r.id === activeProposalId) || resultsList[0]
                      : resultsList[0];
                    handleShareFullReport(target);
                  }}
                  className="w-full sm:w-auto gold-bg-gradient hover:opacity-95 text-zinc-950 font-extrabold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 text-xs md:text-sm shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                  <span>현재 제안서 리포트 공유하기</span>
                </button>
              )}
            </div>
          </section>
        )}

      </main>

      {/* 푸터 및 카운트 배지 */}
      <footer className="mt-auto border-t border-zinc-900 py-6 px-4 md:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">

          <div className="flex items-center gap-4 text-zinc-500">
            <span
              onClick={handleCheatClick}
              className="cursor-pointer select-none active:text-amber-400"
            >
              © 2026 {salonName}. All rights reserved. Powered by ModeStyle Pro
            </span>
          </div>

          <div
            onClick={() => setShowBillingModal(true)}
            className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 px-3.5 py-1.5 rounded-full font-bold text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>
              {process.env.NODE_ENV === 'development'
                ? '개발 모드 | 무제한 ♾️'
                : `${userPlan} | ${remainingCredits.toLocaleString('ko-KR')}/${totalPlanCredits.toLocaleString('ko-KR')}`}
            </span>
          </div>

        </div>
      </footer>

      {/* 2. iOS 카카오톡 인앱 브라우저 Safari 열기 안내 오버레이 */}
      {isIosKakao && (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/98 flex flex-col items-center justify-center p-6 text-center font-sans">
          {/* 지시선 애니메이션용 SVG 화살표 */}
          <div className="absolute top-4 right-8 flex flex-col items-end gap-1 text-amber-400 animate-bounce">
            <span className="text-xs font-bold font-mono">Safari로 열기 클릭!</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </div>

          <div className="max-w-xs w-full space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
              <Compass className="w-9 h-9 animate-spin-slow" />
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-extrabold text-white">Safari 브라우저로 이동합니다</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                카카오톡 내부 브라우저에서는 결제 정보 및 횟수가 저장되지 않습니다.<br />
                더욱 안정적인 시뮬레이션 이용을 위해 반드시 아래 가이드를 진행해 주세요!
              </p>
            </div>

            {/* 안내 가이드 카드 */}
            <div className="bg-zinc-900 border border-zinc-800 p-4.5 rounded-2xl text-left space-y-3.5 text-xs text-zinc-300">
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-amber-400 font-extrabold shrink-0">1</span>
                <span className="leading-relaxed">우측 상단 또는 하단의 <strong>더보기(...)</strong> 또는 <strong>내보내기(공유)</strong> 아이콘을 탭합니다.</span>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-amber-400 font-extrabold shrink-0">2</span>
                <span className="leading-relaxed">나타나는 메뉴 리스트에서 <strong>[Safari로 열기]</strong>를 탭하여 전환합니다.</span>
              </div>
            </div>

            {/* 수동 강제 닫기 (임시 입장용) */}
            <button
              onClick={() => setIsIosKakao(false)}
              type="button"
              className="text-[10px] text-zinc-600 hover:text-zinc-400 underline transition-colors"
            >
              그냥 카카오톡 웹뷰에서 구경할게요
            </button>
          </div>
        </div>
      )}

      {/* 3. 소셜 로그인 모달 팝업 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-zinc-800 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                간편 로그인 / 회원가입
              </h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              간편 소셜 로그인 및 개발자 테스트 로그인을 통해<br />
              결제 정보와 횟수를 안전하게 서버 DB에 연동하세요!
            </p>

            <div className="space-y-3">
              {/* 개발자용 간편 로그인 (로컬 테스트용) */}
              <button
                onClick={() => {
                  signIn('credentials', { username: '테스트 디자이너', callbackUrl: '/' });
                  setShowLoginModal(false);
                }}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-amber-400/5 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                🧪 개발자용 1초 간편 로그인 (테스트용)
              </button>

              <div className="flex items-center my-2 text-zinc-700">
                <hr className="w-full border-zinc-800" />
                <span className="px-2 text-[10px] whitespace-nowrap">소셜 간편 로그인</span>
                <hr className="w-full border-zinc-800" />
              </div>

              {/* 구글 로그인 */}
              <button
                onClick={() => signIn('google')}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="font-extrabold font-mono text-[13px] text-red-500">G</span>
                구글 계정으로 로그인
              </button>

              {/* 네이버 로그인 */}
              <button
                onClick={() => signIn('naver')}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl bg-[#03C75A] hover:bg-[#02b350] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="font-extrabold text-[13px]">N</span>
                네이버 계정으로 로그인
              </button>

              {/* 카카오 로그인 */}
              <button
                onClick={() => signIn('kakao')}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="font-extrabold text-[13px]">K</span>
                카카오 계정으로 로그인
              </button>
            </div>

            <div className="text-[10px] text-zinc-600 text-center">
              로그인 시 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
            </div>
          </div>
        </div>
      )}

      {/* 4. 📄 헤어 제안서 리포트 공유 전용 모달 */}
      {sharingReportResult && (
        <div className="fixed inset-0 z-[999] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-zinc-750 shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSharingReportResult(null)}
              type="button"
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl gold-bg-gradient flex items-center justify-center text-zinc-950 font-bold text-lg shrink-0 shadow-md">
                📋
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">헤어 맞춤 제안서 리포트 공유</h3>
                <p className="text-xs text-zinc-400">
                  {sharingReportResult.gender} {sharingReportResult.length} ‘<span className="text-amber-400 font-bold">{sharingReportResult.styleName}</span>’
                </p>
              </div>
            </div>

            {/* 리포트 내용 미리보기 박스 */}
            {(() => {
              const reportText = `[${salonName || 'ModeStyle Pro'} 헤어 맞춤 제안서]
✨ 추천 스타일: ${sharingReportResult.gender} ${sharingReportResult.length} ‘${sharingReportResult.styleName}’

👗 추천 의상 코디 (Fashion Styling):
${sharingReportResult.recommendedOutfit || '헤어 스타일에 어울리는 트렌디 모던 룩'}

📋 추천 시술 견적 옵션:
• 기본 시술: ${sharingReportResult.styleName} 헤어 디자인
• ${sharingReportResult.careOption} (${sharingReportResult.careCost})
• ${sharingReportResult.designOption} (${sharingReportResult.designCost})
${sharingReportResult.upsell ? `• ${sharingReportResult.upsell}` : ''}

🧴 홈 스타일링 & 관리 가이드:
${sharingReportResult.stylingTip || '샴푸 후 가볍게 드라이하여 볼륨을 살려주세요.'}

📍 상담 및 예약 문의: ${salonName || 'ModeStyle Pro 헤어 살롱'}`;

              return (
                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-bold pb-1 border-b border-zinc-850">
                      <span>📄 리포트 전송 내용</span>
                      {isCopiedReport && (
                        <span className="text-amber-400 flex items-center gap-1 font-bold animate-in fade-in">
                          <Check className="w-3.5 h-3.5" /> 복사 완료!
                        </span>
                      )}
                    </div>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto pr-1">
                      {reportText}
                    </pre>
                  </div>

                  {/* 공유 액션 버튼 그룹 */}
                  <div className="space-y-2.5">
                    {/* 1. 카카오톡/메시지용 텍스트 복사 (PC/모바일 공통 1순위) */}
                    <button
                      type="button"
                      onClick={() => handleCopyReportText(reportText)}
                      className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${isCopiedReport
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'gold-bg-gradient text-zinc-950 shadow-amber-400/20 hover:opacity-95'
                        }`}
                    >
                      {isCopiedReport ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>복사 완료! (카카오톡/문자에 붙여넣기 하세요)</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>📋 리포트 텍스트 복사하기 (카카오톡 전송용)</span>
                        </>
                      )}
                    </button>

                    {/* 2. 모바일 OS 공유창 열기 */}
                    <button
                      type="button"
                      onClick={() => handleNativeShare(sharingReportResult, reportText)}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-750 text-zinc-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <span>💬 SNS / 메시지 앱으로 바로 보내기</span>
                    </button>

                    {/* 3. 워터마크 이미지 파일 다운로드 */}
                    <button
                      type="button"
                      onClick={() => handleShareOrDownloadItem(sharingReportResult)}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>제안서 완성 이미지 파일 저장</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 5. 📑 전체 스타일 종합 제안서 일괄 공유 전용 모달 (Combined All-in-One Report Modal) */}
      {showCombinedReportModal && (
        <div className="fixed inset-0 z-[999] bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-zinc-700 shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative max-h-[92vh] overflow-y-auto">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowCombinedReportModal(false)}
              type="button"
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 헤더 */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl gold-bg-gradient flex items-center justify-center text-zinc-950 font-bold text-xl shrink-0 shadow-lg shadow-amber-400/20">
                📑
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>헤어 & 패션 토탈 종합 제안서</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                    총 {resultsList.length}개 스타일 룩
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  {salonName || 'ModeStyle Pro'} • {designerName || '지오 디자이너'}
                </p>
              </div>
            </div>

            {/* 1. 종합 합성 리포트 이미지 미리보기 영역 */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>📸</span> 종합 스타일링 포트폴리오 이미지 (Before + After 비교)
                </span>
                {isGeneratingCombinedImage && (
                  <span className="text-[11px] text-zinc-400 animate-pulse">
                    ⚡ 고화질 합성 렌더링 중...
                  </span>
                )}
              </div>

              {combinedReportImage ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-750 max-h-72 flex items-center justify-center bg-black/60 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={combinedReportImage}
                    alt="종합 스타일링 리포트"
                    className="max-h-72 w-auto object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleDownloadCombinedImage}
                      className="bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      <span>고화질 이미지로 저장하기</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>전체 제안서 이미지를 합성하고 있습니다...</span>
                </div>
              )}
            </div>

            {/* 2. 전체 제안서 텍스트 영역 */}
            {(() => {
              const combinedText = `[${salonName || 'ModeStyle Pro'} 헤어 & 패션 종합 스타일링 제안서]
담당 디자이너: ${designerName || '지오 디자이너'}
고객 맞춤 종합 컨설팅 리포트 (${resultsList.length}가지 추천 스타일)

━━━━━━━━━━━━━━━━━━━━
${resultsList.map((res, idx) => `
✨ [스타일 ${idx + 1}] ${res.gender} ${res.length} ‘${res.styleName}’
👗 추천 의상 코디 (Fashion Styling):
${res.recommendedOutfit || '헤어에 어울리는 트렌디 모던 룩'}

📋 추천 시술 옵션:
• 기본 시술: ${res.styleName} 헤어 디자인
• ${res.careOption} (${res.careCost})
• ${res.designOption} (${res.designCost})
${res.upsell ? `• ${res.upsell}` : ''}

🧴 홈 스타일링 & 드라이 가이드:
${res.stylingTip || '샴푸 후 가볍게 드라이하여 볼륨을 살려 손질해 주세요.'}
`).join('\n────────────────────\n')}
━━━━━━━━━━━━━━━━━━━━

📍 상담 및 예약 문의: ${salonName || 'ModeStyle Pro 헤어 살롱'}`;

              return (
                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-bold pb-1 border-b border-zinc-850">
                      <span>📄 종합 리포트 전문</span>
                      {isCopiedCombinedReport && (
                        <span className="text-amber-400 flex items-center gap-1 font-bold animate-in fade-in">
                          <Check className="w-3.5 h-3.5" /> 복사 완료!
                        </span>
                      )}
                    </div>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto pr-1">
                      {combinedText}
                    </pre>
                  </div>

                  {/* 액션 버튼 그룹 */}
                  <div className="space-y-2.5 pt-1">
                    {/* 1. 종합 리포트 이미지 다운로드 (한 장으로 모아 저장) */}
                    <button
                      type="button"
                      onClick={handleDownloadCombinedImage}
                      disabled={!combinedReportImage}
                      className="w-full py-3.5 px-4 rounded-xl gold-bg-gradient text-zinc-950 font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>📸 전체 스타일 종합 이미지 한 장으로 다운로드 (Before + After + 코디)</span>
                    </button>

                    {/* 2. 텍스트 리포트 복사 */}
                    <button
                      type="button"
                      onClick={() => handleCopyCombinedReportText(combinedText)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border ${isCopiedCombinedReport
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
                          : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-750 text-zinc-200'
                        }`}
                    >
                      {isCopiedCombinedReport ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>복사 완료! (카카오톡/문자에 바로 붙여넣기 하세요)</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-amber-400" />
                          <span>📋 전체 리포트 텍스트 복사하기 (카카오톡/문자 전송용)</span>
                        </>
                      )}
                    </button>

                    {/* 3. 모바일 네이티브 공유 */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          try {
                            await navigator.share({
                              title: `${salonName || 'ModeStyle Pro'} 헤어&패션 종합 제안서`,
                              text: combinedText
                            });
                          } catch (err: any) {
                            if (err.name !== 'AbortError') {
                              handleCopyCombinedReportText(combinedText);
                            }
                          }
                        } else {
                          handleCopyCombinedReportText(combinedText);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <span>💬 모바일 SNS / 메시지 앱으로 전체 공유하기</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
