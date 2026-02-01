import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getOAuthAuthorizationUrl } from '@/api/authApi';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const AuthLogin = () => {
    const { isAuthenticated } = useAuth();
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleKakaoLogin = () => {
        if (!agreedToTerms) {
            toast.error('서비스 이용약관에 동의해주세요.');
            return;
        }

        window.location.href = getOAuthAuthorizationUrl('kakao');
    };

    const handleQuickSignup = () => {
        setAgreedToTerms(true);
        handleKakaoLogin();
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* 상단 로고 영역 */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
                {/* Q-Feed 로고 이미지 */}
                <div className="mb-8 flex flex-col items-center">
                    <img 
                        src="/qfeed-logo-vect.jpeg" 
                        alt="Q-Feed Logo" 
                        className="w-auto h-auto max-w-xs mb-4"
                        style={{ 
                            width: '280px', 
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </div>
                
                {/* 부제목 */}
                <p className="text-gray-500 text-sm">
                    AI 기반 면접 답변 피드백 플랫폼
                </p>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="px-6 pb-12 space-y-3">
                

                {/* 카카오 로그인 버튼 */}
                <button
                    onClick={handleKakaoLogin}
                    className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black rounded-xl h-14 flex items-center justify-center gap-2 transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.02944 0.5 0 3.69 0 7.62C0 10.06 1.558 12.22 3.931 13.48L2.933 17.04C2.845 17.36 3.213 17.61 3.491 17.42L7.873 14.55C8.243 14.59 8.619 14.61 9 14.61C13.9706 14.61 18 11.42 18 7.49C18 3.56 13.9706 0.5 9 0.5Z" fill="black"/>
                    </svg>
                    <span className="font-medium">카카오 로그인</span>
                </button>

                {/* 약관 동의 체크박스 (작게 하단에) */}
                <div className="flex items-center justify-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer">
                        서비스 이용약관 및 개인정보 처리방침에 동의합니다
                    </label>
                </div>
            </div>
        </div>
    );
};

export default AuthLogin;
