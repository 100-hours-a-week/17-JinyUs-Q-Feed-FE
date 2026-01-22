import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion as Motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';

const PracticeSTT = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();

    useEffect(() => {
        // Simulate STT processing
        const timer = setTimeout(() => {
            navigate(`/practice/answer-edit/${questionId}`);
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, questionId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-500 flex flex-col">
            <AppHeader
                title="음성 분석"
                onBack={() => navigate(-1)}
                showNotifications={false}
                tone="dark"
            />

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <Motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white text-center"
                >
                    <Motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="mb-6 inline-block"
                    >
                        <Loader2 className="w-16 h-16" />
                    </Motion.div>

                    <h2 className="text-2xl mb-3">음성을 분석하고 있어요</h2>
                    <p className="text-white/80">
                        답변을 텍스트로 변환 중입니다...
                    </p>
                </Motion.div>
            </div>
        </div>
    );
};

export default PracticeSTT;
