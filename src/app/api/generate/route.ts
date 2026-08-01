import { NextRequest, NextResponse } from 'next/server';
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

// 로컬 이미지 획득 헬퍼 함수
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

// 바디 용량 확인 함수
function getByteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

export async function POST(request: NextRequest) {
  let gender = '여성';
  let hairStyle = '';
  try {
    const cloneReq = request.clone();
    const rawBody = await cloneReq.text();
    
    // ~8MB 제한 검사
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

    // 서버 환경변수에서 Stability AI API 키 획득
    const apiKey = process.env.STABILITY_API_KEY || '';
    
    // 키가 설정되지 않았다면 로컬 Fallback 이미지 적용 (데모 비용 0원 보호 정책)
    if (!apiKey) {
      const fallbackImage = getLocalFallbackImage(gender, hairStyle);
      if (fallbackImage) {
        return NextResponse.json({ image: fallbackImage });
      }
      return NextResponse.json(
        { error: '서버 AI 서비스 키(STABILITY_API_KEY)가 설정되지 않았습니다. .env.local을 확인해 주세요.' },
        { status: 500 }
      );
    }

    // base64 이미지 디코딩
    const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Image = image;

    if (match) {
      mimeType = match[1];
      base64Image = match[2];
    }

    // 프롬프트 가이드 보강 (동양인 헤어 텍스처 및 정밀 조명 튜닝)
    let instruction = '';
    if (customPrompt) {
      instruction = customPrompt;
    } else {
      const isMale = gender === '남성';
      if (isMale) {
        instruction = `Redesign the hair of the Asian male in this photo to a ${hairLength} ${hairStyle} hairstyle. Keep the original face, facial features, clothing, background, and camera perspective exactly the same. Replace ONLY the hair to match the target style cleanly and naturally with a high-end Korean salon finish, natural volume, and healthy hair texture. K-beauty style, flawless skin, natural defined eyebrows, neat look. Photorealistic, professional studio lighting, 8k resolution, clear details.`;
      } else {
        instruction = `Redesign the hair of the Asian female in this photo to a ${hairLength} ${hairStyle} hairstyle. Keep the original face, facial features, clothing, background, and camera perspective exactly the same. Replace ONLY the hair to match the target style with elegant Korean salon hair design, beautiful healthy hair shine, perfect volume, and natural flowing textures. flawless radiant skin, soft eyeliner, lovely lip color that fits the hair tone. Photorealistic, professional studio lighting, 8k resolution, clear details.`;
      }
    }

    // Stability AI Multipart Form Data 구성
    const formData = new FormData();
    const buffer = Buffer.from(base64Image, 'base64');
    const blob = new Blob([buffer], { type: mimeType });
    
    formData.append('init_image', blob, `image.${mimeType.split('/')[1] || 'jpeg'}`);
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    // 얼굴 형태 및 이목구비를 최대한 조화롭게 유지하고 헤어 스타일 변화 강도를 높이기 위해 0.45 수준으로 튜닝
    formData.append('image_strength', '0.45');
    
    // 긍정 프롬프트
    formData.append('text_prompts[0][text]', instruction);
    formData.append('text_prompts[0][weight]', '1.0');
    // 부정 프롬프트 (서양인 왜곡 및 이목구비 찌그러짐 원천 차단)
    formData.append('text_prompts[1][text]', 'distorted face, blurry face, different person, ugly, bad anatomy, deformed eyes, different clothing, different background, low quality');
    formData.append('text_prompts[1][weight]', '-1.0');

    // Stability AI API 호출 (SDXL Image-to-Image 엔드포인트)
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI Response Error:', errorText);
      throw new Error(`Stability API HTTP ${response.status}: ${errorText}`);
    }

    const responseJSON = await response.json();
    const generatedImageBase64 = responseJSON.artifacts?.[0]?.base64;

    if (!generatedImageBase64) {
      throw new Error('Stability AI did not return base64 image data.');
    }

    // 결과 이미지 리턴 (기본 png 반환)
    return NextResponse.json({
      image: `data:image/png;base64,${generatedImageBase64}`
    });

  } catch (error: any) {
    console.error('Stability API Error:', error);
    
    // 에러 발생 시 최후의 수단으로 로컬 이미지 fallback 반환 시도
    const fallbackImage = getLocalFallbackImage(gender, hairStyle);
    if (fallbackImage) {
      console.log(`Fallback local image applied for ${gender} - ${hairStyle}`);
      return NextResponse.json({ image: fallbackImage });
    }

    const errorMessage = error?.message || '';
    
    // API 키가 유효하지 않은 경우 처리
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: '입력하신 Stability AI API 키가 유효하지 않습니다. platform.stability.ai에서 올바른 키를 생성했는지 확인해 주세요.' },
        { status: 401 }
      );
    }

    // 크레딧 부족 등 제한 처리
    if (errorMessage.includes('402') || errorMessage.includes('Payment Required') || errorMessage.includes('credit')) {
      return NextResponse.json(
        { error: 'Stability AI API 크레딧이 부족합니다. 계정에 크레딧을 추가하시거나 로컬 데모 모드를 확인해 주세요.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${errorMessage || '알 수 없는 에러'}` },
      { status: 500 }
    );
  }
}
