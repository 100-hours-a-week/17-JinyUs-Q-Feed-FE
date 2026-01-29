import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion as Motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { getOAuthAuthorizationUrl } from '@/api/authApi';
import { toast } from 'sonner';
import { AppHeader } from '@/app/components/AppHeader';
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col">
            <AppHeader title="Q-Feed" showBack={false} showNotifications={false} />

            <div className="flex-1 flex items-center justify-center p-6">
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">Q-Feed</h1>
                        <p className="text-muted-foreground text-sm">
                            AI 기반 면접 답변 피드백 플랫폼
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-xl mb-6">시작하기</h2>

                        <div className="flex items-start gap-3 mb-6">
                            <Checkbox
                                id="terms"
                                checked={agreedToTerms}
                                onCheckedChange={(checked) => setAgreedToTerms(checked)}
                                className="mt-1"
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                                서비스 이용약관 및 개인정보 처리방침에 동의합니다
                            </label>
                        </div>

                        <Button
                            onClick={handleKakaoLogin}
                            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black rounded-xl h-12"
                        >
                            <span className="mr-2">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.02944 0.5 0 3.69 0 7.62C0 10.06 1.558 12.22 3.931 13.48L2.933 17.04C2.845 17.36 3.213 17.61 3.491 17.42L7.873 14.55C8.243 14.59 8.619 14.61 9 14.61C13.9706 14.61 18 11.42 18 7.49C18 3.56 13.9706 0.5 9 0.5Z" fill="black"/>
                                </svg>
                            </span>
                            카카오로 시작하기
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            로그인하면 Q-Feed의 모든 기능을 이용할 수 있습니다
                        </p>
                    </div>
                </Motion.div>
            </div>
        </div>
    );
};

export default AuthLogin;
