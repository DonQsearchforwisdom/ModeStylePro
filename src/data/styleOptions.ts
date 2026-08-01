export interface StyleItem {
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
export const LENGTH_OPTIONS = {
  여성: ['숏컷', '단발', '미디움', '롱', '특수 레이어드'],
  남성: ['숏(크롭)', '미디움', '댄디', '리프(장발)', '아이롱'],
};

// 스타일별 가변 옵션 데이터
export const STYLE_OPTIONS: Record<'여성' | '남성', StyleItem[]> = {
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
      image: '/m_iron_pomade.png',
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
