import { Navigate } from 'react-router-dom';
import { getOAuthAuthorizationUrl } from '@/api/authApi';
import { useAuth } from '@/context/AuthContext';

const AuthLogin = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleKakaoLogin = () => {
    window.location.href = getOAuthAuthorizationUrl('kakao');
  };

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#fcedf2' }}
    >
      {/* 상단 로고 영역 - 남는 공간을 채우며 화면에 맞게 스케일 */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-4">
        <div
          className="w-full flex-shrink flex flex-col items-center"
          style={{ maxWidth: 'min(300px, 80vw)' }}
        >
          <img
            src="/main-logo.png"
            alt="Q-Feed Logo"
            className="w-full h-auto object-contain"
            style={{ maxHeight: 'min(35vh, 200px)', objectFit: 'contain' }}
          />
        </div>
        <p className="text-gray-500 text-sm sm:text-base mt-4 flex-shrink-0">
          AI 기반 개발자 기술 면접 트레이닝 서비스
        </p>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black rounded-md h-14 flex items-center justify-center gap-2 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.02944 0.5 0 3.69 0 7.62C0 10.06 1.558 12.22 3.931 13.48L2.933 17.04C2.845 17.36 3.213 17.61 3.491 17.42L7.873 14.55C8.243 14.59 8.619 14.61 9 14.61C13.9706 14.61 18 11.42 18 7.49C18 3.56 13.9706 0.5 9 0.5Z" fill="black" />
          </svg>
          <span className="font-medium">카카오 로그인</span>
        </button>
      </div>
    </div>
  );
};

export default AuthLogin;
