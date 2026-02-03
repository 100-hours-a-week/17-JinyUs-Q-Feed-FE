/**
 * Google Analytics (gtag) 유틸
 * - 스크립트는 index.html <head>에서 로드
 * - SPA 라우트 변경 시 페이지뷰 전송
 */

const GA_MEASUREMENT_ID = 'G-5HPHLEQ0CF';

export function sendPageView(path) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: path });
}
