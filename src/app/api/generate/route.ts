import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 로컬 이미지 파일 매핑 테이블
const LOCAL_IMAGE_MAP: Record<string, Record<string, string>> = {
  여성: {
    '레이어드 C컬펌': 'f_레이어드C컬펌.png',
    '발레아쥬 옴브레': 'f_발레아쥬 옴브레.png',
    '태슬컷 & 슬릭펌': 'f_태슬컷n슬릭펌.png',
    '복구 클리닉 볼륨매직': 'f_복구클리닉 볼륨매직.png',
    '내추럴 히피/물결펌': 'f_내출럴히피 물결펌.png',
    '애쉬 바이올렛 톤다운': 'f_애쉬 바이올렛 톤다운.png',
    '숏재킷 & 리프컷': 'f_숏재킷 리프컷.png',
    '빌드/엘리자벳 디자이너 펌': 'f_빌드 엘리자벳 디자이너펌.png',
  },
  남성: {
    '쉐도우 애즈펌': 'm_쉐도우애즈펌.png',
    '시스루 댄디컷': 'm_댄디컷.png',
    '리프컷 & 전체 다운펌': 'm_리프컷다운펌.png',
    '아이롱 가르마 포마드': 'm_아이롱가르마포마드.png',
    '드롭컷 & 가일 스타일': 'm_드롭컷가일스타일.png',
    '스핀스왈로 / 쉐도우 믹스': 'm_스핀스왈로.png',
    '플래티넘 애쉬 탈색': 'm_플래티넘애쉬탈색.png',
    '볼륨매직 & 구구다운': 'm_볼륨매직구구다운.png',
  }
};

// 로컬 이미지 획득 헬퍼 함수 (API 키가 없거나 Quota 초과 시 데모 안정성을 위한 fallback 제공)
function getLocalFallbackImage(gender: string, hairStyle: string): string | null {
  const genderMap = LOCAL_IMAGE_MAP[gender];
  if (genderMap) {
    const fileName = genderMap[hairStyle];
    if (fileName) {
      const filePath = path.join(process.cwd(), 'public', fileName);
      if (fs.existsSync(filePath)) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const ext = path.extname(fileName).substring(1);
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          const base64Data = fileBuffer.toString('base64');
          return `data:${mime};base64,${base64Data}`;
        } catch (readErr) {
          console.error('Failed to read local fallback image file:', readErr);
        }
      }
    }
  }
  return null;
}

// IP별 데모 생성 횟수 제한을 관리할 인메모리 맵
// Vercel Serverless 환경에서는 인스턴스가 다운되면 리셋될 수 있으나 간이 Rate Limiter로 작동합니다.
interface LimiterData {
  count: number;
  date: string;
}
const ipLimitMap = new Map<string, LimiterData>();

// 바디 용량 확인 함수 (~8MB 제한)
function getByteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

export async function POST(request: NextRequest) {
  let gender = '여성';
  let hairStyle = '';
  try {
    const cloneReq = request.clone();
    const rawBody = await cloneReq.text();
    
    // ~8MB 제한 검사 (8 * 1024 * 1024 = 8,388,608 bytes)
    const bodySize = getByteLength(rawBody);
    if (bodySize > 8.3 * 1024 * 1024) {
      return NextResponse.json(
        { error: '업로드 이미지 용량이 너무 큽니다. 8MB 이하의 이미지만 전송 가능합니다.' },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    gender = body.gender || '여성';
    hairStyle = body.hairStyle || '';
    const { image, hairLength, customPrompt } = body;

    if (!image || !gender || !hairLength || !hairStyle) {
      return NextResponse.json(
        { error: '필수 데이터(이미지, 성별, 모발 길이, 타겟 스타일)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 서버 환경변수에서 API 키 획득
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    if (!apiKey) {
      const fallbackImage = getLocalFallbackImage(gender, hairStyle);
      if (fallbackImage) {
        return NextResponse.json({ image: fallbackImage });
      }
      return NextResponse.json(
        { error: '서버 AI 서비스 키가 설정되지 않았습니다. 관리자에게 문의해 주세요.' },
        { status: 500 }
      );
    }

    // IP 제한 검증 (하루 10회 방어 제한 - 개발 테스트를 위해 비활성화)
    /*
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown-ip';
    const today = new Date().toISOString().split('T')[0];

    const limitInfo = ipLimitMap.get(ip);

    if (limitInfo) {
      if (limitInfo.date === today) {
        if (limitInfo.count >= 10) {
          return NextResponse.json(
            { error: '오늘 일일 무료 시뮬레이션 제한(10회)을 초과했습니다. 내일 다시 시도해 주세요.' },
            { status: 429 }
          );
        }
        limitInfo.count += 1;
      } else {
        // 날짜가 바뀐 경우 초기화
        limitInfo.date = today;
        limitInfo.count = 1;
      }
      ipLimitMap.set(ip, limitInfo);
    } else {
      ipLimitMap.set(ip, { count: 1, date: today });
    }
    */

    // base64 이미지 디코딩 및 mimeType 추출
    // 예: "data:image/png;base64,iVBOR..." -> mimeType: "image/png", base64Image: "iVBOR..."
    const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Image = image;

    if (match) {
      mimeType = match[1];
      base64Image = match[2];
    }

    // 영문 프롬프트 변환 매핑
    const englishGender = gender === '남성' ? 'male' : 'female';
    
    // 프롬프트 작성 - customPrompt 분기 및 수동 선택 시 메이크업/디자인 개선 템플릿 적용
    let instruction = '';
    if (customPrompt) {
      instruction = customPrompt;
    } else {
      const isMale = gender === '남성';
      if (isMale) {
        instruction = `Redesign the hair of the male in this photo to a ${hairLength} ${hairStyle} style. Keep the original face, facial features, clothing, background, and camera perspective exactly the same. Replace ONLY the hair to match the target style cleanly and naturally with a high-end salon finish, professional styling, refined hair line, natural volume, and healthy hair texture. Apply clean, subtle male grooming to the face (flawless clear skin, natural defined eyebrows, neat look, and natural lip balm) to make the overall appearance more handsome, polished, and ideal, perfectly matching the ${hairStyle} hairstyle. Photorealistic, professional studio lighting, 8k resolution, clear details.`;
      } else {
        instruction = `Redesign the hair of the female in this photo to a ${hairLength} ${hairStyle} style. Keep the original face, facial features, clothing, background, and camera perspective exactly the same. Replace ONLY the hair to match the target style with elegant salon hair design, beautiful healthy hair shine (angel ring), perfect volume, and natural flowing textures. Naturally apply a sophisticated, matching makeup style (flawless radiant skin, soft eyeliner, nicely shaped eyebrows, and lovely lip color such as soft rose or warm coral that fits the hair tone) to enhance her overall beauty and present the most ideal, stylish appearance that harmonizes with the ${hairStyle} hairstyle. Photorealistic, professional studio lighting, 8k resolution, clear details.`;
      }
    }

    // Gemini API 호출
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Image } },
            { text: instruction }
          ]
        }
      ]
    });

    // 응답에서 인라인 이미지 데이터 추출
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const imageBase64 = part?.inlineData?.data;

    if (!imageBase64) {
      // 이미지 생성이 차단되었거나 실패한 경우
      return NextResponse.json(
        { error: 'AI 이미지 생성에 실패했거나 부적절한 컨텐츠(예: 얼굴 미인식, 유해 이미지 우려)로 인해 차단되었습니다. 다른 사진으로 시도해 주세요.' },
        { status: 422 }
      );
    }

    // 결과 base64 이미지 리턴
    return NextResponse.json({
      image: `data:${part?.inlineData?.mimeType || 'image/png'};base64,${imageBase64}`
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // 에러 발생 시 최후의 수단으로 로컬 이미지 fallback 반환 시도
    const fallbackImage = getLocalFallbackImage(gender, hairStyle);
    if (fallbackImage) {
      console.log(`Fallback local image applied for ${gender} - ${hairStyle}`);
      return NextResponse.json({ image: fallbackImage });
    }

    const errorMessage = error?.message || '';
    
    // API 키가 유효하지 않은 경우 처리
    if (errorMessage.includes('API key not valid') || errorMessage.includes('invalid api key')) {
      return NextResponse.json(
        { error: '입력하신 Gemini API 키가 유효하지 않습니다. AI Studio에서 발급받은 올바른 키인지 확인해 주세요.' },
        { status: 401 }
      );
    }

    // 할당량 초과 처리 (Rate Limit / Quota Exceeded)
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('429') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'Gemini API의 일일/분당 사용 한도(Quota Exceeded)를 초과했습니다. 약 1분 뒤에 다시 시도하시거나, 결제 정보가 연동된 다른 API 키를 사용해 주세요.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${errorMessage || '알 수 없는 에러'}` },
      { status: 500 }
    );
  }
}
