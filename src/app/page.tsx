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

  // 비즈니스 과금 상태 (하루 5회 무료 제공 & 유료 충전 크레딧)
  const [freeGensLeft, setFreeGensLeft] = useState<number>(5);
  const [paidGensLeft, setPaidGensLeft] = useState<number>(0);
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);

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
        setDiagnosisResult(JSON.parse(savedDiagnosis));
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

    // 2. 일일 5회 무료 갱신 로직 (날짜 비교)
    const today = new Date().toISOString().split('T')[0];
    const savedResetDate = safeLocalStorage.getItem('modestyle_free_reset_date');
    const savedFreeCount = safeLocalStorage.getItem('modestyle_free_count');

    if (savedResetDate !== today) {
      // 날짜가 다르다면 오늘 최초 구동이므로 5회로 리셋
      safeLocalStorage.setItem('modestyle_free_reset_date', today);
      safeLocalStorage.setItem('modestyle_free_count', '5');
      setFreeGensLeft(5);
    } else if (savedFreeCount !== null) {
      setFreeGensLeft(parseInt(savedFreeCount, 10));
    } else {
      setFreeGensLeft(5);
    }

    // 3. 유료 충전 크레딧 로드
    const savedPaidCount = safeLocalStorage.getItem('modestyle_paid_count');
    if (savedPaidCount !== null) {
      setPaidGensLeft(parseInt(savedPaidCount, 10));
    } else {
      safeLocalStorage.setItem('modestyle_paid_count', '0');
      setPaidGensLeft(0);
    }

    // 4. Toss Payments 성공/실패 쿼리 스트링 감지 (결제완료 처리)
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const plan = urlParams.get('plan');

    if (paymentStatus === 'success' && plan) {
      const addedGens = plan === '50' ? 50 : plan === '500' ? 500 : 1000;
      const currentPaid = savedPaidCount ? parseInt(savedPaidCount, 10) : 0;
      const nextPaid = currentPaid + addedGens;

      safeLocalStorage.setItem('modestyle_paid_count', nextPaid.toString());
      setPaidGensLeft(nextPaid);

      alert(`🎉 결제가 정상 완료되어 헤어 시뮬레이션 ${addedGens}회권이 성공적으로 충전되었습니다!`);

      // 주소창 파라미터 삭제 정돈
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'fail') {
      alert('❌ 결제에 실패했거나 취소되었습니다. 다시 시도해 주세요.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Toss Payments SDK 스크립트 동적 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
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
    } catch (e) {}

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
    } catch (e) {}
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

  // Toss Payments 결제 요청 함수
  const triggerTossPayment = async (plan: '50' | '500' | '1000') => {
    if (!window.TossPayments) {
      alert('결제 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 눌러주세요.');
      return;
    }

    // 토스페이먼츠 공식 테스트 클라이언트 키 (Sandbox)
    const clientKey = 'test_ck_D5b4lyZaAnpKyAGQoQ43vgFWp2N3';
    const tossPayments = window.TossPayments(clientKey);

    const priceMap = {
      '50': 7900,
      '500': 29000,
      '1000': 49000,
    };

    const nameMap = {
      '50': 'ModeStyle Pro 헤어 시뮬레이션 50회권',
      '500': 'ModeStyle Pro 헤어 시뮬레이션 500회권',
      '1000': 'ModeStyle Pro 헤어 시뮬레이션 1000회권',
    };

    const orderId = `order_${Math.random().toString(36).substring(2, 11)}`;

    try {
      await tossPayments.requestPayment('카드', {
        amount: priceMap[plan],
        orderId: orderId,
        orderName: nameMap[plan],
        customerName: designerName || '헤어 디자이너',
        successUrl: `${window.location.origin}/?payment_status=success&plan=${plan}`,
        failUrl: `${window.location.origin}/?payment_status=fail`,
      });
    } catch (paymentErr) {
      console.error('Payment window error:', paymentErr);
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

    setIsLoading(true);
    setErrorMsg(null);
    setCurrentGeneratingIndex(0);

    let tempFreeCount = freeGensLeft;
    let tempPaidCount = paidGensLeft;

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

        // 사용 횟수 차감: 무료 횟수가 먼저 차감되고 바닥나면 유료 횟수 차감
        if (tempFreeCount > 0) {
          tempFreeCount = Math.max(0, tempFreeCount - 1);
          setFreeGensLeft(tempFreeCount);
          safeLocalStorage.setItem('modestyle_free_count', tempFreeCount.toString());
        } else {
          tempPaidCount = Math.max(0, tempPaidCount - 1);
          setPaidGensLeft(tempPaidCount);
          safeLocalStorage.setItem('modestyle_paid_count', tempPaidCount.toString());
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
        } catch (e) {}
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
            <span className="text-[11px] text-zinc-300 font-semibold select-none">
              개발 모드 | <span className="text-amber-400 font-bold">무제한 ♾️</span>
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

      {/* 피드백 반영: Toss Payments 크레딧 충전 결제 모달 */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-zinc-800 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  시뮬레이션 크레딧 충전
                </h3>
                <p className="text-[10px] text-zinc-400">
                  결제 즉시 유료 시뮬레이션 장수가 충전되며, 토스페이먼츠로 안전하게 결제됩니다.
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
              <div
                onClick={() => triggerTossPayment('50')}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200">50장 충전권 🎟️</span>
                  <p className="text-[10px] text-zinc-500">장당 약 158원 상당</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">7,900원 결제</span>
                </div>
              </div>

              <div
                onClick={() => triggerTossPayment('500')}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    500장 충전권 🚀
                    <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-extrabold">BEST</span>
                  </span>
                  <p className="text-[10px] text-zinc-500">장당 약 58원 상당 · 63% 파격 할인</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">29,000원 결제</span>
                </div>
              </div>

              <div
                onClick={() => triggerTossPayment('1000')}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    1,000장 충전권 👑
                    <span className="text-[8px] bg-amber-400/20 text-amber-400 border border-amber-400/10 px-1.5 py-0.5 rounded font-extrabold">MAX VALUE</span>
                  </span>
                  <p className="text-[10px] text-zinc-500">장당 약 49원 상당 · 초특가 벌크 패키지</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 group-hover:underline">49,000원 결제</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] text-zinc-500 leading-relaxed text-center">
              ⚠️ 테스트 결제(Sandbox) 모드로 구동 중입니다. 실제 카드 정보를 입력하여도 실 결제 승인이 발생하지 않으며, 결제 프로세스 테스트 완료 즉시 정상적으로 크레딧 충전 가산이 이루어집니다.
            </div>
          </div>
        </div>
      )}

      {/* 메인 본문 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-16 flex flex-col gap-16">

        {/* 1. HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              헤어·얼굴형 분석부터<br />
              <span className="gold-gradient">프리미엄 스타일 제안까지</span>
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              디자이너의 감각을 완성하는 프리미엄 파트너
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={scrollToSimulator}
                className="gold-bg-gradient hover:bg-gold-hover text-zinc-950 font-bold px-8 py-3.5 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
              >
                헤어 시뮬레이션 시작하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-xs text-zinc-500 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800/60 font-medium flex items-center gap-1.5">
                <span>서비스 모드:</span>
                <span className="text-amber-400 font-extrabold">개발용 무제한 ♾️</span>
              </div>
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
                  여성 예시 👩
                </button>
                <button
                  type="button"
                  onClick={() => setSampleGender('남성')}
                  className={`flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition-all ${sampleGender === '남성'
                    ? 'bg-zinc-800 text-amber-400 shadow-md border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  남성 예시 👨
                </button>
              </div>

              {/* 샘플 Before/After 슬라이더 */}
              <BeforeAfterSlider
                beforeImage={sampleGender === '여성' ? '/sample-before.jpg' : '/sample-male-before.jpg'}
                afterImage={sampleGender === '여성' ? '/sample-after.jpg' : '/sample-male-after.jpg'}
              />

              <div className="mt-4 space-y-2 text-center lg:text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">시뮬레이션 스타일</span>
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
                      ? '부스스한 중단발 반곱슬 기장에서 우아한 레이어드 C컬/S컬 볼륨과 수분 클리닉을 결합하여 세련된 분위기를 연출한 시뮬레이션 제안서 예시입니다.'
                      : '뜨고 덥수룩한 생머리 기장에서 트렌디한 쉐도우 애즈펌 볼륨과 깔끔한 라인 다운펌을 결합하여 댄디하고 스마트한 인상을 연출한 시뮬레이션 제안서 예시입니다.'}
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
              고객님의 성별과 사진을 등록하여 시뮬레이션을 준비해 주세요.
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
                    {gender} 시뮬레이션 타겟 헤어 스타일 (다중 선택 가능)
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
                      className={`px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                        isCustomStyleApplied && customStyleText.trim()
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
            <span>개발 모드 | 무제한 ♾️ (테스트 충전: {paidGensLeft}회)</span>
          </div>

        </div>
      </footer>
    </div>
  );
}
