import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { markSplashShown } from '@/app/utils/splashUtils';

/** 스플래시 GIF 1회 재생으로 간주하는 시간(ms). GIF 실제 길이에 맞게 조정 가능 */
const SPLASH_GIF_DURATION_MS = 3000;

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [gifLoaded, setGifLoaded] = useState(false);
  const navigateRef = useRef(false);

  useEffect(() => {
    if (isLoading || !gifLoaded) return;
    if (navigateRef.current) return;
    navigateRef.current = true;

    const timer = setTimeout(() => {
      markSplashShown();
      navigate(isAuthenticated ? '/' : '/login', { replace: true });
    }, SPLASH_GIF_DURATION_MS);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, isLoading, gifLoaded]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F5F7]">
      <img
        src="/q-feed-splash.gif"
        alt="Q-Feed"
        className="h-full w-full object-contain object-center"
        onLoad={() => setGifLoaded(true)}
      />
    </div>
  );
};

export default Splash;
