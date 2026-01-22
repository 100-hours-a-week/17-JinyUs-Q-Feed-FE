import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import { AppHeader } from '@/app/components/AppHeader';

const AuthLogin = () => {
    const navigate = useNavigate();
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleKakaoLogin = () => {
        // Auto-agree to terms and log in
        setAgreedToTerms(true);

        // Mock Kakao login
        storage.setLoggedIn(true);
        storage.setNickname('면접 준비생');
        toast.success('로그인 성공!');

        setTimeout(() => {
            navigate('/', { replace: true });
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col">
            <AppHeader title="Q-Feed" showBack={false} showNotifications={false} />

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
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
                            <span className="mr-2">💬</span>
                            카카오로 시작하기
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            로그인하면 Q-Feed의 모든 기능을 이용할 수 있습니다
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLogin;
