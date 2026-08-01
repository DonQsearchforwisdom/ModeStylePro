'use client';

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';

// Stability AI SDXL이 지원하는 공식 해상도 규격 및 비율 리스트
const SDXL_RESOLUTIONS = [
  { w: 1024, h: 1024, ratio: 1.0 },
  { w: 1152, h: 896,  ratio: 1152 / 896 },
  { w: 1216, h: 832,  ratio: 1216 / 832 },
  { w: 1344, h: 768,  ratio: 1344 / 768 },
  { w: 1536, h: 640,  ratio: 1536 / 640 },
  { w: 640,  h: 1536, ratio: 640 / 1536 },
  { w: 768,  h: 1344, ratio: 768 / 1344 },
  { w: 832,  h: 1216, ratio: 832 / 1216 },
  { w: 896,  h: 1152, ratio: 896 / 1152 }
];

// 업로드된 이미지 종횡비와 가장 흡사한 SDXL 규격 해상도를 반환하는 함수
const findClosestSDXLResolution = (srcWidth: number, srcHeight: number) => {
  const srcRatio = srcWidth / srcHeight;
  let bestMatch = SDXL_RESOLUTIONS[0];
  let minDiff = Math.abs(srcRatio - bestMatch.ratio);

  for (let i = 1; i < SDXL_RESOLUTIONS.length; i++) {
    const diff = Math.abs(srcRatio - SDXL_RESOLUTIONS[i].ratio);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = SDXL_RESOLUTIONS[i];
    }
  }
  return bestMatch;
};

interface ImageUploaderProps {
  onImageSelected: (base64Image: string) => void;
  onClear: () => void;
  previewImage: string | null;
}

export default function ImageUploader({ onImageSelected, onClear, previewImage }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 인앱 웹카메라 관련 훅
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user'); // 셀카 전면 기본
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 인앱 카메라 켜기
  const startCamera = async () => {
    setError(null);
    setIsCameraLoading(true);
    setIsCameraActive(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // 모바일 기기의 램 부족 OOM 및 시스템 메모리 에러를 방지하기 위해 
      // 모바일 환경일 때는 비디오 스트림의 해상도와 프레임레이트를 극도로 절약합니다.
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: isMobile ? { ideal: 640, max: 800 } : { ideal: 1280 },
          height: isMobile ? { ideal: 480, max: 600 } : { ideal: 720 },
          frameRate: isMobile ? { ideal: 15, max: 20 } : { ideal: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS 사파리 정책 대응 play()
        videoRef.current.play().catch(e => console.error("Video play error:", e));
      }
    } catch (err: any) {
      console.error("Camera activation failed:", err);
      setError("카메라 권한을 획득할 수 없거나 카메라가 사용 중입니다. 앨범 선택을 이용해 주세요.");
      setIsCameraActive(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  // 인앱 카메라 끄기 및 메모리 반환
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // 전면/후면 전환
  const toggleCameraFacing = () => {
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // 카메라 전환 시 재시작
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [cameraFacing]);

  // 언마운트 시 트랙 릴리즈
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 사진 프레임 캡처 후 SDXL 규격에 맞춰 썸네일 변환 및 메모리 수거
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    
    // Stability AI SDXL이 지원하는 가장 최적의 종횡비 규격을 가져옵니다.
    const targetRes = findClosestSDXLResolution(videoWidth, videoHeight);
    
    const canvas = document.createElement('canvas');
    canvas.width = targetRes.w;
    canvas.height = targetRes.h;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 전면 셀카 촬영 시 거울 반전(Mirror Effect) 드로잉 적용
      if (cameraFacing === 'user') {
        ctx.translate(targetRes.w, 0);
        ctx.scale(-1, 1);
      }

      // 종횡비 계산 및 Center Crop & Scale 드로잉
      const srcRatio = videoWidth / videoHeight;
      const targetRatio = targetRes.w / targetRes.h;
      let drawW = targetRes.w;
      let drawH = targetRes.h;
      let offsetX = 0;
      let offsetY = 0;

      if (srcRatio > targetRatio) {
        drawW = targetRes.h * srcRatio;
        offsetX = (targetRes.w - drawW) / 2;
      } else {
        drawH = targetRes.w / srcRatio;
        offsetY = (targetRes.h - drawH) / 2;
      }

      ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
      
      if (cameraFacing === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      const base64 = canvas.toDataURL('image/jpeg', 0.75);
      onImageSelected(base64);
      stopCamera();
    } else {
      setError("사진 캡처 도중 캔버스 렌더링에 실패했습니다.");
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobileQuery = window.matchMedia('(max-width: 768px)');
      setIsMobile(mobileQuery.matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    setError(null);

    // 형식 검사 (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('지원하지 않는 파일 형식입니다. JPG, PNG, WebP 이미지를 업로드해 주세요.');
      return;
    }

    // 용량 제한 (20MB로 확장하여 모바일 카메라 촬영 고화질 파일도 무리 없이 수용)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('파일 용량이 20MB를 초과합니다. 더 작은 이미지를 선택해 주세요.');
      return;
    }

    // 모바일 환경 OOM 예방을 위해 해상도 제한 이원화 (모바일 500px / PC 800px)
    const targetMaxDim = isMobile ? 500 : 800;

    // 리사이징 계산 헬퍼 함수
    const getResizedDimensions = (srcWidth: number, srcHeight: number, maxDim = targetMaxDim) => {
      let width = srcWidth;
      let height = srcHeight;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      return { width, height };
    };

    // 리사이징 후 콜백 호출 및 캔버스 정리 헬퍼 함수
    const drawAndCallback = (source: HTMLImageElement | ImageBitmap, srcWidth: number, srcHeight: number) => {
      // Stability AI SDXL이 지원하는 가장 최적의 종횡비 규격을 가져옵니다.
      const targetRes = findClosestSDXLResolution(srcWidth, srcHeight);
      
      let canvas: HTMLCanvasElement | null = document.createElement('canvas');
      canvas.width = targetRes.w;
      canvas.height = targetRes.h;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 종횡비 계산 및 Center Crop & Scale 드로잉 (찌그러짐 방지)
        const srcRatio = srcWidth / srcHeight;
        const targetRatio = targetRes.w / targetRes.h;
        let drawW = targetRes.w;
        let drawH = targetRes.h;
        let offsetX = 0;
        let offsetY = 0;

        if (srcRatio > targetRatio) {
          drawW = targetRes.h * srcRatio;
          offsetX = (targetRes.w - drawW) / 2;
        } else {
          drawH = targetRes.w / srcRatio;
          offsetY = (targetRes.h - drawH) / 2;
        }

        ctx.drawImage(source, offsetX, offsetY, drawW, drawH);
        // 퀄리티 0.75로 JPG base64 변환 (용량 다이어트)
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        onImageSelected(resizedBase64);
      } else {
        setError('이미지 처리 중 오류가 발생했습니다.');
      }

      // 캔버스 메모리 즉시 소멸 유도
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }

      // ImageBitmap 리소스 즉시 소멸 유도
      if (source && typeof (source as any).close === 'function') {
        (source as any).close();
      }
    };

    // OOM 방지를 위해 createImageBitmap 지원 시 디코더 레벨에서 즉시 다운샘플링 처리
    // 단, 모바일 크롬/사파리 웹뷰 환경에서는 큰 이미지 전달 시 램 버스트로 인한 크래시 버그가 잦으므로
    // 모바일 환경(!isMobile)이 아닐 때만 createImageBitmap 분기를 사용하도록 강제 우회합니다.
    if (typeof window !== 'undefined' && 'createImageBitmap' in window && !isMobile) {
      // 이미지 디코딩 단계에서 타겟 크기(모바일 500px / PC 800px)로 제한하여 OOM 원천 차단
      createImageBitmap(file, { resizeWidth: targetMaxDim })
        .then((bitmap) => {
          drawAndCallback(bitmap, bitmap.width, bitmap.height);
        })
        .catch((err) => {
          console.warn('createImageBitmap failed, falling back to legacy loader:', err);
          legacyLoadFallback(file);
        });
    } else {
      legacyLoadFallback(file);
    }

    function legacyLoadFallback(file: File) {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = 'async'; // 비동기 디코딩 설정 (메인 스레드 OOM 완화)
      img.onload = () => {
        img.decode()
          .then(() => {
            URL.revokeObjectURL(objectUrl);
            drawAndCallback(img, img.width, img.height);
            // 메모리 소멸 유도 및 참조 끊기
            img.onload = null;
            img.onerror = null;
            img.src = '';
          })
          .catch((err) => {
            console.error('Image decoding error:', err);
            try {
              URL.revokeObjectURL(objectUrl);
              drawAndCallback(img, img.width, img.height);
            } catch (fallbackErr) {
              setError('이미지 디코딩 중 오류가 발생했습니다.');
            }
            img.onload = null;
            img.onerror = null;
            img.src = '';
          });
      };
      img.onerror = () => {
        setError('유효하지 않은 이미지 파일입니다.');
        URL.revokeObjectURL(objectUrl);
        img.onload = null;
        img.onerror = null;
        img.src = '';
      };
      img.src = objectUrl;
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {previewImage ? (
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 group shadow-lg">
          <img
            src={previewImage}
            alt="업로드된 고객 사진"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {isMobile ? (
              <div className="flex flex-col gap-2 w-full max-w-[140px]">
                <button
                  onClick={startCamera}
                  type="button"
                  className="bg-amber-400 text-zinc-950 py-2.5 rounded-full font-bold text-xs hover:bg-amber-500 transition-colors shadow-md text-center"
                >
                  사진 촬영
                </button>
                <button
                  onClick={triggerFileInput}
                  type="button"
                  className="bg-white text-zinc-950 py-2.5 rounded-full font-bold text-xs hover:bg-zinc-200 transition-colors shadow-md text-center"
                >
                  앨범 선택
                </button>
                <button
                  onClick={onClear}
                  type="button"
                  className="bg-red-600 text-white py-2.5 rounded-full font-bold text-xs hover:bg-red-700 transition-colors shadow-md text-center"
                >
                  삭제
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={triggerFileInput}
                  type="button"
                  className="bg-white text-zinc-950 px-4 py-2 rounded-full font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-md"
                >
                  사진 변경
                </button>
                <button
                  onClick={onClear}
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-red-700 transition-colors shadow-md"
                >
                  삭제
                </button>
              </>
            )}
          </div>
          {/* 숨겨진 일반 파일 인풋 (통합) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={isMobile ? undefined : triggerFileInput}
          className={`relative w-full aspect-[4/5] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${isMobile ? '' : 'cursor-pointer hover:border-zinc-700'
            } ${isDragOver
              ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_20px_rgba(197,168,128,0.15)]'
              : 'border-zinc-800 bg-zinc-900/30'
            }`}
        >
          {/* 갤러리 파일 업로드용 인풋 (통합) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
          </div>

          <p className="text-zinc-200 font-medium mb-1.5 text-sm md:text-base px-2">
            {isMobile ? '고객 사진 등록하기' : '고객 사진 드래그 앤 드롭 또는 클릭하여 업로드'}
          </p>
          <p className="text-zinc-500 text-xs max-w-[260px] leading-relaxed px-4 mb-5">
            {isMobile
              ? '카메라로 촬영하거나 사진첩에서 불러올 수 있습니다.'
              : 'JPG, PNG, WebP 지원 (최대 20MB)'}
            <br />
          </p>

          {isMobile ? (
            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/10 active:scale-[0.98] transition-transform"
              >
                📸 즉시 사진 촬영하기
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                🖼️ 갤러리에서 선택
              </button>
            </div>
          ) : null}

          {error && (
            <div className="mt-4 px-3 py-1.5 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-lg max-w-[280px]">
              {error}
            </div>
          )}
        </div>
      )}

      {/* 인앱 웹 카메라 모달 오버레이 */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-6">
          {/* 모달 상단 정보바 */}
          <div className="w-full max-w-md flex items-center justify-between text-white py-2">
            <span className="text-xs font-bold tracking-wider text-amber-400">IN-APP WEB CAMERA</span>
            <button
              onClick={stopCamera}
              type="button"
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 비디오 뷰포트 */}
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950 shadow-2xl flex items-center justify-center">
            {isCameraLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/80 gap-3 text-zinc-400 text-xs">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                카메라를 준비하고 있습니다...
              </div>
            )}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          </div>

          {/* 하단 컨트롤러 패널 */}
          <div className="w-full max-w-md flex items-center justify-around py-6 gap-4">
            {/* 전후면 토글 */}
            <button
              onClick={toggleCameraFacing}
              type="button"
              className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-xl active:scale-95 transition-transform"
              title="전/후면 카메라 전환"
            >
              🔄
            </button>

            {/* 찰칵 촬영 */}
            <button
              onClick={capturePhoto}
              type="button"
              className="w-20 h-20 rounded-full border-4 border-white bg-amber-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform relative group"
            >
              <span className="absolute inset-2 rounded-full border-2 border-zinc-950 bg-white group-active:bg-amber-400 transition-colors"></span>
            </button>

            {/* 취소 */}
            <button
              onClick={stopCamera}
              type="button"
              className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-xs font-bold text-red-500 active:scale-95 transition-transform"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
