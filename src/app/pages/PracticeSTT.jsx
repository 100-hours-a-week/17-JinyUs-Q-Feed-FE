import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion as Motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { requestSTT } from '@/api/sttApi';
import { toast } from 'sonner';

// TODO: 인증 연동 후 실제 사용자 ID로 교체
const DEFAULT_USER_ID = 1;

const PracticeSTT = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { state } = useLocation();
    const audioUrl = state?.audioUrl;

    const [statusMessage, setStatusMessage] = useState('음성을 분석하고 있어요');

    useEffect(() => {
        if (!audioUrl) {
            toast.error('음성 파일 정보가 없습니다');
            navigate(`/practice/answer/${questionId}`);
            return;
        }

        const processSTT = async () => {
            try {
                setStatusMessage('답변을 텍스트로 변환 중입니다...');

                const sessionId = typeof questionId === 'string' ? questionId.trim() : '';
                if (!sessionId) {
                    throw new Error('세션 정보를 확인할 수 없습니다');
                }
                // 백엔드 스키마(user_id, session_id, audio_url)에 맞춰 전달 (session_id string)
                const result = await requestSTT({
                    userId: DEFAULT_USER_ID,
                    sessionId,
                    audioUrl,
                });
                const { text } = result.data;

                navigate(`/practice/answer-edit/${questionId}`, {
                    state: { transcribedText: text },
                });
            } catch (err) {
                toast.error(err.message || '음성 변환에 실패했습니다');
                navigate(`/practice/answer/${questionId}`);
            }
        };

        processSTT();
    }, [audioUrl, questionId, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-white to-pink-50/80 flex flex-col items-center justify-center p-6">
            <Motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
            >
                <Motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="mb-6 inline-block"
                >
                    <Loader2 className="w-16 h-16 text-rose-300" />
                </Motion.div>

                <h2 className="text-2xl font-medium text-gray-600 mb-3">{statusMessage}</h2>
                <p className="text-gray-500 text-sm">
                    잠시만 기다려주세요
                </p>
            </Motion.div>
        </div>
    );
};

export default PracticeSTT;
