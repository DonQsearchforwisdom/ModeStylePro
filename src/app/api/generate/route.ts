import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { STYLE_OPTIONS } from '@/data/styleOptions';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 로컬 이미지 파일 매핑 테이블 (프리셋 fallback)
const LOCAL_IMAGE_MAP: Record<string, Record<string, string>> = {
  여성: {
    '레이어드 C컬펌': 'kr_medium_c_curl.jpg',
    '그레이스펌 (여신 웨이브)': 'east_female_long_grace.png',
    '태슬컷 (슬릭 단발)': 'kr_bob_tassel.jpg',
    '태슬컷 & 슬릭펌': 'kr_bob_tassel.jpg',
    '모즈펌 (단발 C컬)': 'kr_bob_mods.jpg',
    '보니펌 (C컬 볼륨 단발)': 'kr_bob_bonnie.jpg',
    '단발 스트레이트': 'kr_bob_straight.jpg',
    '숏 리프컷': 'kr_short_leaf.jpg',
    '숏 볼륨매직 & 픽시컷': 'kr_short_volume.jpg',
    '픽시 스트레이트컷': 'kr_short_straight.jpg',
    '엘리자벳 빌드펌': 'kr_medium_build.jpg',
    '소프트 레이어드 C컬펌': 'kr_medium_c_curl.jpg',
    '윈드펌 (허쉬 C컬)': 'kr_medium_wind.jpg',
    '결개선 볼륨매직': 'kr_medium_straight.jpg',
    '내추럴 히피펌 / 물결펌': 'east_female_semilong_straight.png',
    '세미롱 레이어드 S컬펌': 'east_female_semilong_s_curl.png',
    '허쉬 레이어드 믹스펌': 'e_female_wind_hush.png',
  },
  남성: {
    '아이비리그컷': 'kr_male_ivy_league.png',
    '드롭컷': 'kr_male_drop_cut.png',
    '플랫컷': 'kr_male_flat_cut.png',
    '파일컷': 'kr_male_file_cut.png',
    '리젠트컷': 'kr_male_regent_cut.png',
    '시스루 댄디컷': 'kr_male_see_through_dandy.png',
    '가일컷': 'kr_male_guile_cut.png',
    '투블럭 댄디 + 다운펌': 'kr_male_twoblock_dandy.png',
    '애즈펌 / 시스루 애즈펌': 'kr_male_as_perm.png',
    '쉐도우펌': 'kr_male_shadow_perm.png',
    '가르마펌': 'kr_male_garma_perm.png',
    '세미 리프컷': 'kr_male_semi_leaf_cut.png',
    '롱 리프펌': 'kr_male_long_leaf_perm.png',
    '울프컷 (모던 머릿)': 'kr_male_wolf_cut.png',
    '맨번': 'kr_male_man_bun.png',
  }
};

// 각 스타일별 정밀 영문 디렉션 맵 (AI가 길이나 형태를 오해하지 않도록 명확한 물리적 특성 정의)
const STYLE_PROMPT_DETAILS: Record<string, string> = {
  // 남성 숏 (Short)
  '아이비리그컷': 'Cut the hair VERY SHORT into a crisp, clean Korean Ivy League crew cut. The forehead must be completely exposed and bare with NO bangs. The short front fringe is styled standing upright with textured volume. The sides, temples, and back are closely cropped and flattened with a neat down perm. Remove all long hair and bangs completely.',
  '드롭컷': 'Short Korean drop cut where the center fringe is raised slightly above the forehead while the side corners of the bangs drop down cleanly towards the temples, creating a modern drop silhouette. Cropped neat sides.',
  '플랫컷': 'Very short flat cut with a sharp horizontal flat top silhouette and cropped tapered sides. Front is clean and structured.',
  '파일컷': 'Short sharp file cut with edgy spiky textured fringe standing upright, short textured top and high clean fade.',
  '리젠트컷': 'Short classic regent cut with front fringe swept backwards and up, exposing forehead with dandy volume, neat sideburns.',

  // 남성 미디움 숏 (Medium-Short)
  '시스루 댄디컷': 'Medium-short see-through dandy cut. Airy textured light bangs resting gently on the eyebrow line with visible forehead gaps, neat straight flow, slim down-permed sides.',
  '가일컷': 'Medium-short guile cut. One side of the fringe is swept cleanly back exposing part of the forehead, while the other side drops down with a subtle comma-curve.',
  '투블럭 댄디 + 다운펌': 'Two-block dandy cut with slim down-permed sides and neat layered volume on top.',

  // 남성 미디움 (Medium)
  '애즈펌 / 시스루 애즈펌': 'Medium length soft wavy as perm with gentle center-part fringe revealing part of forehead, natural C-curl volume.',
  '쉐도우펌': 'Medium length textured shadow perm with rich soft S-curls providing full shadow volume and depth.',
  '가르마펌': 'Medium length classic 6:4 parted garma perm with soft sweeping curves framing the face.',

  // 남성 롱 / 특수 (Long/Special)
  '세미 리프컷': 'Semi-long leaf cut with flowy leaf-shaped hair sweeping back gracefully past the ears and neck.',
  '롱 리프펌': 'Long flowy leaf perm reaching past the jawline with rich textured wavy curls.',
  '맨번': 'Authentic full long hair man bun (classic long hair tied back). All hair is grown long all around without any shaved undercut or fade. The long natural side hair and front hair are smoothly gathered and swept back into a neat stylish bun at the back/crown of the head, with natural flowing texture and soft sideburn flow.',

  // 여성 대표 스타일
  '태슬컷 (슬릭 단발)': 'Sleek blunt tassel bob cut with sharp straight horizontal ends and glossy texture.',
  '태슬컷 & 슬릭펌': 'Sleek blunt tassel bob cut with glossy straight texture.',
  '모즈펌 (단발 C컬)': 'Classic Korean mods perm bob with voluminous inward C-curls hugging the jawline.',
  '보니펌 (C컬 볼륨 단발)': 'Bonnie bob perm with rich rounded C-curl volume and soft airy texture.',
  '숏 리프컷': 'Short feminine leaf cut with soft tapered nape and side bangs tucked behind ears.',
  '엘리자벳 빌드펌': 'Medium-length Elizabeth build perm with voluminous outward S-C curl flow framing the collarbone.',
  '소프트 레이어드 C컬펌': 'Medium layered hair with natural bouncy inward C-curls.',
  '윈드펌 (허쉬 C컬)': 'Feathered wind perm with airy light layers and flipped C-curl ends.',
  '그레이스펌 (여신 웨이브)': 'Long luxurious Grace perm with large bouncy cascading goddess waves.',
  '내추럴 히피펌 / 물결펌': 'Long full-bodied hippie perm with defined continuous mermaid waves from roots to ends.',
  '세미롱 레이어드 S컬펌': 'Semi-long layered hair with dynamic textured S-curl waves.',
  '허쉬 레이어드 믹스펌': 'Edgy hush layered mix perm with airy textured feathered ends.',
};

// 로컬 이미지 획득 헬퍼 함수
function getLocalFallbackImage(gender: string, hairStyle: string, hairLength?: string): string | null {
  const genderMap = LOCAL_IMAGE_MAP[gender];
  if (genderMap) {
    // 1. 정확한 스타일명 매칭
    let fileName = genderMap[hairStyle];
    
    // 2. 부분 일치 매칭
    if (!fileName) {
      const matchedKey = Object.keys(genderMap).find(k => hairStyle.includes(k) || k.includes(hairStyle));
      if (matchedKey) fileName = genderMap[matchedKey];
    }

    // 3. 기장 기반 매칭 (직접 입력 시)
    if (!fileName && hairLength) {
      if (gender === '남성') {
        if (hairLength.includes('숏')) fileName = 'kr_male_ivy_league.png';
        else if (hairLength.includes('롱') || hairLength.includes('특수')) fileName = 'kr_male_semi_leaf_cut.png';
        else fileName = 'kr_male_see_through_dandy.png';
      } else {
        if (hairLength.includes('숏')) fileName = 'kr_short_leaf.jpg';
        else if (hairLength.includes('단발')) fileName = 'kr_bob_bonnie.jpg';
        else if (hairLength.includes('롱')) fileName = 'east_female_long_grace.png';
        else fileName = 'kr_medium_c_curl.jpg';
      }
    }

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
  let gender: '여성' | '남성' = '여성';
  let hairStyle = '';
  let hairLength = '';
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
    gender = body.gender === '남성' ? '남성' : '여성';
    hairStyle = body.hairStyle || '';
    hairLength = body.hairLength || '';
    const { image, customPrompt, outfitPrompt: reqOutfitPrompt, changeOutfit = true } = body;

    if (!image || !gender || !hairStyle) {
      return NextResponse.json(
        { error: '필수 데이터(이미지, 성별, 타겟 스타일)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Gemini API Key 획득 (.env.local 지원)
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

    // base64 이미지 디코딩
    const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Image = image;

    if (match) {
      mimeType = match[1];
      base64Image = match[2];
    }

    // 스타일 고유 세부 영문 디스크립션 추출
    const specificDetail = STYLE_PROMPT_DETAILS[hairStyle]
      || Object.entries(STYLE_PROMPT_DETAILS).find(([k]) => hairStyle.includes(k))?.[1]
      || `Redesign the hair to a ${hairLength} ${hairStyle} hairstyle with premium Korean salon texture and shine.`;

    // 추천 의상 영문 디렉션 추출
    const matchedStyleItem = STYLE_OPTIONS[gender]?.find(
      (s) => s.name === hairStyle || hairStyle.includes(s.name) || s.name.includes(hairStyle)
    );
    const outfitDetail = reqOutfitPrompt
      || matchedStyleItem?.outfitPrompt
      || (gender === '남성'
        ? 'modern stylish Korean tailored blazer over a crisp clean crewneck shirt'
        : 'chic elegant tailored blazer jacket over a minimalist refined knit top');

    // 프롬프트 구성 (동양인 얼굴/이목구비 완벽 보존 & 의상 맞춤 코디 & 512x512 고효율 최적화)
    const resolutionSuffix = 'Output a crisp, high-quality 512x512 square resolution image.';
    let instruction = '';

    if (customPrompt) {
      instruction = `${customPrompt}. Output a crisp, photorealistic studio image. ${resolutionSuffix}`;
    } else if (changeOutfit) {
      instruction = `Total makeover transformation: 1) Redesign and restyle the hair: ${specificDetail}. 2) Simultaneously upgrade and coordinate the customer's outfit into a fashionable, matching clothing style: ${outfitDetail}. Keep the person's original face, eyes, eyebrows, nose, lips, facial structure, skin texture, age, expression, and individual identity faithfully preserved. Photorealistic, professional studio lighting, 8k resolution, healthy hair shine. ${resolutionSuffix}`;
    } else {
      instruction = `${specificDetail} Keep the person's original face, eyes, eyebrows, nose, lips, facial structure, skin texture, age, expression, clothing, and background EXACTLY the same. Replace and restyle ONLY the hair. ${resolutionSuffix}`;
    }

    // 1. Gemini Flash Image API 호출 시도 (0원 무료 키 지원)
    if (geminiApiKey) {
      try {
        const payload = JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                },
                {
                  text: instruction
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: payload,
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
          if (imagePart?.inlineData?.data) {
            const outMime = imagePart.inlineData.mimeType || 'image/png';
            return NextResponse.json({
              image: `data:${outMime};base64,${imagePart.inlineData.data}`
            });
          }
        } else {
          const errText = await geminiRes.text();
          console.warn('Gemini Flash Image API returned non-200:', geminiRes.status, errText);
        }
      } catch (geminiErr) {
        console.warn('Gemini Flash Image Generation error, falling back:', geminiErr);
      }
    }

    // 2. Stability AI 키가 있는 경우 서브 엔진으로 시도
    const stabilityKey = process.env.STABILITY_API_KEY || '';
    if (stabilityKey) {
      try {
        const formData = new FormData();
        const buffer = Buffer.from(base64Image, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        
        formData.append('init_image', blob, `image.${mimeType.split('/')[1] || 'jpeg'}`);
        formData.append('init_image_mode', 'IMAGE_STRENGTH');
        formData.append('image_strength', '0.65');
        formData.append('text_prompts[0][text]', instruction);
        formData.append('text_prompts[0][weight]', '1.0');
        formData.append('text_prompts[1][text]', 'distorted face, blurry face, different person, ugly, bad anatomy, deformed eyes, different clothing, low quality');
        formData.append('text_prompts[1][weight]', '-1.0');

        const response = await fetch(
          'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stabilityKey}`,
              'Accept': 'application/json',
            },
            body: formData,
          }
        );

        if (response.ok) {
          const responseJSON = await response.json();
          const generatedBase64 = responseJSON.artifacts?.[0]?.base64;
          if (generatedBase64) {
            return NextResponse.json({
              image: `data:image/png;base64,${generatedBase64}`
            });
          }
        }
      } catch (stErr) {
        console.warn('Stability AI error:', stErr);
      }
    }

    // 3. Fallback: 고화질 로컬 프리셋 이미지 즉시 매칭
    const fallbackImage = getLocalFallbackImage(gender, hairStyle, hairLength);
    if (fallbackImage) {
      return NextResponse.json({ image: fallbackImage });
    }

    return NextResponse.json(
      { error: '이미지 생성 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('Generate Route Error:', error);
    
    // 에러 시 안전 fallback
    const fallbackImage = getLocalFallbackImage(gender, hairStyle, hairLength);
    if (fallbackImage) {
      return NextResponse.json({ image: fallbackImage });
    }

    return NextResponse.json(
      { error: `이미지 생성 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
