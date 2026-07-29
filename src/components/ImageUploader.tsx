'use client';

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';

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
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

    // 용량 제한 (15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('파일 용량이 15MB를 초과합니다. 더 작은 이미지를 선택해 주세요.');
      return;
    }

    // OOM 방지를 위해 FileReader 대신 URL.createObjectURL을 사용하여 메모리 사용량 최소화
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Canvas를 이용해 이미지 리사이징 (최대 긴 축 1024px)
      const canvas = document.createElement('canvas');
      const MAX_WIDTH_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH_HEIGHT) {
          height = Math.round((height * MAX_WIDTH_HEIGHT) / width);
          width = MAX_WIDTH_HEIGHT;
        }
      } else {
        if (height > MAX_WIDTH_HEIGHT) {
          width = Math.round((width * MAX_WIDTH_HEIGHT) / height);
          height = MAX_WIDTH_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // 퀄리티 0.85로 JPG base64 변환
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        onImageSelected(resizedBase64);
      } else {
        setError('이미지 처리 중 오류가 발생했습니다.');
      }
      // 즉시 메모리 해제
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      setError('유효하지 않은 이미지 파일입니다.');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
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
    cameraInputRef.current?.click();
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
                  onClick={triggerCameraInput}
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
          {/* 숨겨진 일반 파일 인풋 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {/* 숨겨진 카메라 촬영 인풋 */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture={true}
            className="hidden"
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={isMobile ? undefined : triggerFileInput}
          className={`relative w-full aspect-[4/5] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
            isMobile ? '' : 'cursor-pointer hover:border-zinc-700'
          } ${
            isDragOver
              ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_20px_rgba(197,168,128,0.15)]'
              : 'border-zinc-800 bg-zinc-900/30'
          }`}
        >
          {/* 갤러리 파일 업로드용 인풋 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* 모바일 카메라 촬영용 인풋 */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture={true}
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
              : 'JPG, PNG, WebP 지원 (최대 15MB)'}
            <br />
            업로드 시 AI 연산을 위해 이미지 크기가 자동으로 최적화됩니다.
          </p>

          {isMobile ? (
            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              <button
                type="button"
                onClick={triggerCameraInput}
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
    </div>
  );
}
