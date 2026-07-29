'use client';

import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ImageUploader';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Sparkles, ArrowRight, Download, Share2, RefreshCw, Key, ShieldCheck, HelpCircle, Activity, User, Check, Trash2, Settings, CreditCard, X, Venus, Mars, Coins } from 'lucide-react';

interface StyleItem {
  name: string;
  emoji: string;
  image: string;
  upsell: string;
  careOption: string;
  careCost: string;
  designOption: string;
  designCost: string;
  stylingTip: string;
}

// 기장 데이터 정의
const LENGTH_OPTIONS = {
  여성: ['숏컷', '단발', '미디움', '롱', '특수 레이어드'],
  남성: ['숏(크롭)', '미디움', '댄디', '리프(장발)', '아이롱'],
};

// 스타일별 가변 옵션 데이터
// 스타일별 가변 옵션 데이터
const STYLE_OPTIONS: Record<'여성' | '남성', StyleItem[]> = {
  여성: [
    {
      name: '레이어드 C컬펌',
      emoji: '💈',
      image: '/f_layered_c_curl.png',
      upsell: '추가 제안 : 볼륨 셋팅 시술 추가 (50,000원 ~ 80,000원)',
      careOption: '🧪 열펌 전용 수분 아쿠아 클리닉',
      careCost: '추가 비용 : 50,000원 ~ 80,000원',
      designOption: '🧴 뿌리 볼륨 셋팅 디테일링',
      designCost: '추가 비용 : 30,000원 ~ 40,000원',
      stylingTip: '머리를 뒤에서 앞으로 쓸어내리듯 털어 말린 후, 모발 끝부분에만 가벼운 에센스나 컬크림을 도포하여 자연스러운 C컬 안쪽 말림을 유지해 주세요.',
    },
    {
      name: '태슬컷 & 슬릭펌',
      emoji: '✨',
      image: '/f_tassel_sleek.png',
      upsell: '추가 제안 : 매직 스트레이트 + 볼륨매직 (80,000원 ~ 120,000원)',
      careOption: '🧪 차분한 결 정돈 케라틴 매직 클리닉',
      careCost: '추가 비용 : 60,000원 ~ 90,000원',
      designOption: '🧴 페이스라인 교정 앞머리 류 매직',
      designCost: '추가 비용 : 20,000원 ~ 30,000원',
      stylingTip: '드라이기 바람을 머리 위에서 아래 방향으로 쏘이며 말려주시고, 모발 전체가 건조되면 폴리쉬 오일을 손끝에 소량 묻혀 끝부분의 가닥 결(웨트한 텍스처)을 살려 빗질해 줍니다.',
    },
    {
      name: '결개선 볼륨매직',
      emoji: '💧',
      image: '/f_repair_volume_magic.png',
      upsell: '추가 제안 : 케라틴 영양 + 환원제 (100,000원 ~ 150,000원)',
      careOption: '🧪 고농축 단백질 딥 케어 탄력 리페어',
      careCost: '추가 비용 : 100,000원 ~ 150,000원',
      designOption: '🧴 두피 보호 진정 스칼프 앰플 케어',
      designCost: '추가 비용 : 30,000원 ~ 40,000원',
      stylingTip: '쿠션 브러시로 머릿결을 아래로 빗어내리며 완전히 건조시키고, 수분 스프레이 트리트먼트나 부드러운 로션 에센스를 도포해 건조함과 정전기를 방지합니다.',
    },
    {
      name: '빌드펌 / 엘리자벳펌',
      emoji: '👑',
      image: '/f_build_elisabeth.png',
      upsell: '추가 제안 : 뿌리 볼륨펌 패키지 (70,000원 ~ 100,000원)',
      careOption: '🧪 수분 폭탄 아미노 클리닉 세트',
      careCost: '추가 비용 : 70,000원 ~ 90,000원',
      designOption: '🧴 고급 수제 뿌리 볼륨 디렉팅',
      designCost: '추가 비용 : 30,000원 ~ 40,000원',
      stylingTip: '모발이 80% 정도 말랐을 때 머리카락 가닥을 네 갈래로 나누어 얼굴 바깥 방향으로 돌돌 돌려가며 드라이 열을 줍니다. 다 마른 후 브러시로 쓸어주고 오일 에센스로 윤기를 냅니다.',
    },
    {
      name: '발레아쥬 옴브레',
      emoji: '🎨',
      image: '/f_balayage_ombre.png',
      upsell: '추가 제안 : 탈색 2회 + 전체 염색 (150,000원 ~ 200,000원)',
      careOption: '🧪 모발 손상 방지 프리미엄 본드 클리닉',
      careCost: '추가 비용 : 80,000원 ~ 100,000원',
      designOption: '🧴 밀착 토닝 & 노란기 제거 보색 케어',
      designCost: '추가 비용 : 40,000원 ~ 60,000원',
      stylingTip: '타월 드라이 후 열보호 크림을 골고루 바르고, 모발이 건조해지지 않도록 가급적 찬바람 위주로 말린 뒤 헤어 오일을 끝부분에 발라 윤기를 더해 줍니다.',
    },
    {
      name: '내추럴 히피펌 / 물결펌',
      emoji: '🌀',
      image: '/f_natural_hippie.png',
      upsell: '추가 제안 : 디자인 일반펌 + 에센스 (50,000원 ~ 70,000원)',
      careOption: '🧪 컬 탄력 강화 콜라겐 영양 코팅',
      careCost: '추가 비용 : 50,000원 ~ 70,000원',
      designOption: '🧴 두피 스케일링 & 수분 헤드스파',
      designCost: '추가 비용 : 30,000원 ~ 50,000원',
      stylingTip: '타월 드라이 후 두피만 따뜻한 바람으로 살짝 말려주세요. 모발이 젖은 상태에서 컬 전용 무스나 웨이브 젤을 듬뿍 바르고 아래에서 위로 움켜쥐듯 쥐어가며 자연 건조합니다.',
    },
  ],
  남성: [
    {
      name: '시스루 댄디컷',
      emoji: '💈',
      image: '/m_dandy_cut.png',
      upsell: '추가 제안 : 사이드/백 다운펌 (30,000원 ~ 40,000원)',
      careOption: '🧪 두피 스케일링 & 모근 영양 공급',
      careCost: '추가 비용 : 30,000원 ~ 40,000원',
      designOption: '🧴 뜨는 구석 압축 옆머리 다운펌',
      designCost: '추가 비용 : 20,000원 ~ 30,000원',
      stylingTip: '윗머리는 앞으로 차분히 쏟아가며 빗질하듯 위에서 아래로 드라이합니다. 아주 묽고 가벼운 에센스를 끝부분 결을 따라 살짝 발라 시스루하고 댄디한 질감을 연출합니다.',
    },
    {
      name: '드롭컷 & 가일컷',
      emoji: '✂️',
      image: '/m_drop_gail.png',
      upsell: '추가 제안 : 앞머리 매직 + 슬릭 다운펌 (40,000원 ~ 50,000원)',
      careOption: '🧪 모발 장벽 강화 단백질 영양 케어',
      careCost: '추가 비용 : 40,000원 ~ 50,000원',
      designOption: '🧴 M자 커버 페이스라인 교정 컷',
      designCost: '추가 비용 : 20,000원 ~ 30,000원',
      stylingTip: '한쪽 머리는 포마드 스타일로 완전히 넘겨 건조하고, 반대쪽 내릴 앞머리는 이마 라인을 타며 툭 떨어지게 드라이합니다. 매트 왁스를 전체적으로 바르고 스프레이로 단단하게 고정합니다.',
    },
    {
      name: '내추럴 리프컷',
      emoji: '🌿',
      image: '/m_leaf_down.png',
      upsell: '추가 제안 : 전체 밀착 다운펌 (50,000원 ~ 70,000원)',
      careOption: '🧪 모발 거칠기 개선 진정 트리트먼트',
      careCost: '추가 비용 : 40,000원 ~ 60,000원',
      designOption: '🧴 헤어라인 정밀 교정 정돈 컷',
      designCost: '추가 비용 : 20,000원 ~ 30,000원',
      stylingTip: '앞머리와 구레나룻 라인이 뒤로 자연스럽게 흐르도록 넘겨가며 건조합니다. 찬바람으로 말린 후 웨트 에센스나 소프트 왁스를 이용해 뒤로 넘어가는 흐름을 고정해 줍니다.',
    },
    {
      name: '소프트 크롭컷',
      emoji: '✨',
      image: '/m_iron_pomade.png', // 크롭컷 전용 디자인 이미지 매칭
      upsell: '추가 제안 : 전체 다운펌 + 두피 스케일링 (40,000원 ~ 60,000원)',
      careOption: '🧪 모발 손상 방지 아미노 수분 케어',
      careCost: '추가 비용 : 30,000원 ~ 40,000원',
      designOption: '🧴 정밀 쉐이빙 스킨 페이드 컷 라인',
      designCost: '추가 비용 : 25,000원 ~ 35,000원',
      stylingTip: '드라이기로 윗머리를 앞으로 완전히 눕혀가며 건조한 뒤 구레나룻 부분은 꾹 누르며 말립니다. 무광택 하드 왁스를 소량 덜어 가닥가닥 텍스처를 집어 고정해 줍니다.',
    },
    {
      name: '쉐도우 애즈펌',
      emoji: '🌀',
      image: '/m_shadow_as.png',
      upsell: '추가 제안 : 텍스처펌 + 라인 다운펌 (40,000원 ~ 60,000원)',
      careOption: '🧪 모발 수분 단백질 코팅 케어',
      careCost: '추가 비용 : 40,000원 ~ 50,000원',
      designOption: '🧴 구간별 맞춤 라인 다운펌 디자인',
      designCost: '추가 비용 : 30,000원 ~ 40,000원',
      stylingTip: '머리를 감고 이마 앞머리 갈라지는 부분(가르마)의 모근을 손가락으로 들어올리며 바람을 쐽니다. 컬이 살도록 쥐어가며 말린 후, 컬크림을 전체적으로 털어 바르며 모양을 정돈합니다.',
    },
    {
      name: '볼륨매직 & 다운펌',
      emoji: '💧',
      image: '/m_volume_down.png',
      upsell: '추가 제안 : 곱슬 교정 매직 + 밀착 다운펌 (80,000원 ~ 100,000원)',
      careOption: '🧪 곱슬 개선 극손상 모발 복구 앰플',
      careCost: '추가 비용 : 60,000원 ~ 80,000원',
      designOption: '🧴 네이프(뒷머리 밑선) 초밀착 다운펌',
      designCost: '추가 비용 : 30,000원 ~ 40,000원',
      stylingTip: '정수리에서 앞머리 방향으로 자연스럽게 바람을 주며 빗질하듯 건조합니다. 오일 제형의 헤어 에센스를 소량 덜어 모발에 도포하여 잔머리를 차분히 눕히고 매끄러운 윤기를 냅니다.',
    },
  ],
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
          return res || { initialized: true, credits: 5 };
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
        localStorage.setItem('credits_remaining', '5');
        localStorage.setItem('user_plan', '무료체험');
        localStorage.setItem('total_plan_credits', '5');
        return { initialized: true, credits: 5 };
      }
      const savedCredits = parseInt(localStorage.getItem('credits_remaining') || '0', 10);
      return { initialized: false, credits: savedCredits };
    }

    return { initialized: false, credits: 0 };
  },

  // 크레딧 데이터 획득
  getCreditsData: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const remaining = parseInt(localStorage.getItem('credits_remaining') || '5', 10);
      const total = parseInt(localStorage.getItem('total_plan_credits') || '5', 10);
      const plan = (localStorage.getItem('user_plan') as any) || '무료체험';
      return { remaining, total, plan };
    }
    return { remaining: 5, total: 5, plan: '무료체험' as const };
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
          const total = plan === '살롱' ? 1000 : plan === '라이트' ? 300 : plan === '1회충전' ? 30 : 5;
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
        const total = planType === '살롱' ? 1000 : planType === '라이트' ? 300 : 30;
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

  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // 히스토리 목록
  const [resultsList, setResultsList] = useState<SimulationResult[]>([]);

  // 헤어 AI 진단 상태
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
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

  // 성별 변경 시 기장과 스타일 초기화 및 sessionStorage에 성별 백업
  useEffect(() => {
    setSelectedLength(LENGTH_OPTIONS[gender][0]);
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

    // 0-4. 제안서 목록(resultsList) 복구 및 워터마크 파일 백그라운드 재생성
    const savedResults = safeSessionStorage.getItem('modestyle_results_list');
    const tempSalonName = safeLocalStorage.getItem('modestyle_salon_name') || '';
    if (savedResults) {
      try {
        const parsedList: SimulationResult[] = JSON.parse(savedResults);
        setResultsList(parsedList);

        // 백그라운드에서 워터마크 파일 비동기 재생성하여 매핑
        parsedList.forEach((item) => {
          createWatermarkedFile(item.afterImage, item.styleName, tempSalonName)
            .then((file) => {
              setResultsList((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, watermarkedFile: file } : p))
              );
            })
            .catch((err) => console.error('마운트 시 워터마크 재생성 실패:', err));
        });
      } catch (e) {
        console.error('결과 리스트 세션 복구 실패:', e);
      }
    }

    // 1. 살롱 설정 정보 로드
    const savedSalon = safeLocalStorage.getItem('modestyle_salon_name');
    if (savedSalon) setSalonName(savedSalon);
    const savedDesigner = safeLocalStorage.getItem('modestyle_designer_name');
    if (savedDesigner) setDesignerName(savedDesigner);

    // 2. 기기 식별 기반 최초 무료 크레딧 초기화 및 상태 동기화
    nativeBridge.initializeFreeCredits().then(() => {
      const data = nativeBridge.getCreditsData();
      setRemainingCredits(data.remaining);
      setTotalPlanCredits(data.total);
      setUserPlan(data.plan);
    });
  }, []);

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

  // RevenueCat IAP 플랜 결제 처리 함수
  const handlePurchasePlan = async (planType: '1회충전' | '라이트' | '살롱') => {
    setIsLoading(true);
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
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: originalImage,
            gender,
            hairLength: selectedLength,
            hairStyle: job.styleName,
            customPrompt: job.customPrompt,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `${job.styleName} 시뮬레이션 생성 실패`);
        }

        const endTime = performance.now();
        const duration = parseFloat(((endTime - startTime) / 1000).toFixed(1));

        // 스타일 정보 매칭
        const matchedStyleInfo = STYLE_OPTIONS[gender].find(s => s.name === job.styleName);

        const careOption = matchedStyleInfo?.careOption || '🧪 스타일 유지력 향상을 위한 모발 수분 단백질 케어';
        const careCost = matchedStyleInfo?.careCost || '추가 비용 : 50,000원 ~ 80,000원';
        const designOption = matchedStyleInfo?.designOption || '🧴 디자인 디테일 교정 (사이드 다운펌 / 뿌리 볼륨 디테일링)';
        const designCost = matchedStyleInfo?.designCost || '추가 비용 : 30,000원 ~ 40,000원';

        // 스타일링 팁 매칭 (진단 추천 스타일에서 추출하거나 우측 리스트 프리셋에서 추출)
        const recommendedStyleInfo = diagnosisResult?.recommendations.find(r => r.styleName === job.styleName);
        const stylingTip = recommendedStyleInfo?.stylingTip
          || matchedStyleInfo?.stylingTip
          || '샴푸 후 찬바람으로 건조시킨 뒤 가벼운 헤어 에센스를 발라 부스스함을 정돈해 줍니다.';

        // 신규 결과를 히스토리 리스트 맨 앞에 추가 (최신순 누적)
        const newResult: SimulationResult = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          beforeImage: originalImage,
          afterImage: data.image,
          gender,
          length: selectedLength,
          styleName: job.styleName,
          generationTime: duration,
          careOption,
          careCost,
          designOption,
          designCost,
          stylingTip,
          upsell: matchedStyleInfo?.upsell
        };

        // 워터마크가 합성된 공유용 이미지 파일 사전 생성 (비동기)
        createWatermarkedFile(data.image, job.styleName, salonName)
          .then((file) => {
            newResult.watermarkedFile = file;
            setResultsList((prev) => {
              const next = [newResult, ...prev];
              const serializedList = next.map(({ watermarkedFile, ...rest }) => rest);
              safeSessionStorage.setItem('modestyle_results_list', JSON.stringify(serializedList));
              return next;
            });
          })
          .catch((err) => {
            console.error('워터마크 이미지 사전 생성 실패:', err);
            // 실패해도 결과 카드는 정상 노출되도록 추가
            setResultsList((prev) => {
              const next = [newResult, ...prev];
              const serializedList = next.map(({ watermarkedFile, ...rest }) => rest);
              safeSessionStorage.setItem('modestyle_results_list', JSON.stringify(serializedList));
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

  // 개별 결과 삭제
  const handleDeleteResultItem = (id: string) => {
    setResultsList((prev) => {
      const next = prev.filter((item) => item.id !== id);
      // 동기식 세션 백업
      if (next.length > 0) {
        const serializedList = next.map(({ watermarkedFile, ...rest }) => rest);
        safeSessionStorage.setItem('modestyle_results_list', JSON.stringify(serializedList));
      } else {
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('modestyle_results_list');
          }
        } catch (e) { }
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
                  placeholder="예: 살롱오하이"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold block">디자이너 이름</label>
                <input
                  type="text"
                  defaultValue={designerName}
                  id="setting-designer-input"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:border-amber-400 focus:outline-none text-zinc-100"
                  placeholder="예: 지오 디자이너"
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
                  <p className="text-[10px] text-zinc-500">30회 시뮬레이션 제공 (장당 166원 상당)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">5,000원 결제</span>
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
                  <h3 className="font-extrabold text-lg text-white">무료 체험 5회를 모두 사용하셨습니다!</h3>
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
                    5,000원으로 30회 시작하기
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
                  <h3 className="font-extrabold text-lg text-white">30회를 모두 소진하셨습니다!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                    {"30회 추가 충전(5,000원)을 하거나, 더 저렴한 구독 요금제로 전환해 보세요."}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePurchasePlan('1회충전')}
                    className="w-full py-3.5 gold-bg-gradient text-zinc-950 font-extrabold rounded-xl text-xs sm:text-sm hover:scale-[1.02] transition-all shadow-md"
                  >
                    5,000원 추가 충전
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

            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              디자이너의 디자인 감각에 정밀 분석 데이터를 더해<br />
              완성도 높은 스타일을 제안해 드립니다.
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
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center ${isChecked ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-900 text-amber-400 border border-zinc-850'
                                      }`}>
                                      {idx + 1}
                                    </span>
                                    <span className={`text-sm font-extrabold ${isChecked ? 'text-amber-400' : 'text-zinc-100'}`}>{rec.styleName}</span>
                                  </div>
                                  <p className={`text-xs leading-normal max-w-xs ${isChecked ? 'text-amber-300 font-medium' : 'text-zinc-300'}`}>{rec.reason}</p>
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
              <div ref={stylesSectionRef} className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-3 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold">2</span>
                    {gender} 헤어 스타일 (다중 선택 가능)
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-medium">
                    {selectedStyles.length}개 선택됨
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STYLE_OPTIONS[gender].map((style) => {
                    const isChecked = selectedStyles.includes(style.name);
                    return (
                      <div
                        key={style.name}
                        onClick={() => handleStyleToggle(style.name)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 group relative cursor-pointer ${isChecked
                          ? 'bg-amber-400/5 border-amber-400 text-amber-400 shadow-sm'
                          : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/50 text-zinc-300'
                          }`}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-850 bg-zinc-950 shrink-0 relative">
                              <img
                                src={style.image}
                                alt={style.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {style.name}
                          </span>
                          <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isChecked
                            ? 'border-amber-400 bg-amber-400 text-zinc-950'
                            : 'border-zinc-700'
                            }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 직접 스타일 요청 입력 폼 */}
                <div className="border-t border-zinc-800/80 pt-4 mt-3.5 space-y-2">
                  <span className="text-zinc-400 text-[11px] font-bold block">
                    ✨ 원하는 스타일 직접 요청하기 (직접 입력)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customStyleText}
                      onChange={(e) => handleCustomStyleChange(e.target.value)}
                      placeholder="예: 리프 가르마펌, 슬릭백 언더컷 등"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 text-xs md:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleCustomStyleToggle}
                      disabled={!customStyleText.trim()}
                      className={`px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${isCustomStyleApplied && customStyleText.trim()
                        ? 'bg-amber-400 border-amber-400 text-zinc-950 font-extrabold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                      {isCustomStyleApplied && customStyleText.trim() ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          적용됨
                        </>
                      ) : (
                        '적용'
                      )}
                    </button>
                  </div>
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
          <section id="simulation-results-container" className="space-y-8 scroll-mt-24">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white">시뮬레이션 히스토리 목록</h3>
                <p className="text-xs text-zinc-400">
                  생성된 헤어 시뮬레이션들이 최신순으로 아래로 쌓입니다. 비교하고 싶은 스타일을 선택하여 상담에 이용하세요.
                </p>
              </div>
              <div className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400">
                🗂️ 총 <span className="text-amber-400 font-bold">{resultsList.length}개</span>의 제안서 보관 중
              </div>
            </div>

            <div className="space-y-8">
              {resultsList.map((result) => (
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

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* 피드백 반영: 다운로드 클릭 시 ModeStylePro + 미용실 명 워터마크 자동 합성 */}
                        <button
                          onClick={() => handleShareOrDownloadItem(result)}
                          type="button"
                          className="flex-1 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-xs md:text-sm"
                        >
                          <Share2 className="w-4 h-4" />
                          제안 이미지 공유하기
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* 푸터 및 카운트 배지 */}
      <footer className="mt-auto border-t border-zinc-900 py-6 px-4 md:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">

          <div className="flex items-center gap-4 text-zinc-500">
            <span>© 2026 {salonName}. All rights reserved. Powered by ModeStyle Pro</span>
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
    </div>
  );
}
