import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { QUESTIONS } from '@/data/questions';
import { motion } from 'motion/react';
import { AppHeader } from '@/app/components/AppHeader';

const PracticeAnswerVoice = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);

    const question = QUESTIONS.find((q) => q.id === questionId);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setSeconds((s) => s + 1);
                // Simulate audio level
                setAudioLevel(Math.random());
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            // Stop recording and move to STT
            navigate(`/practice/stt/${questionId}`);
        } else {
            setIsRecording(true);
        }
    };

    if (!question) return <div>질문을 찾을 수 없습니다</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-500 text-white flex flex-col">
            <AppHeader
                title="음성 답변"
                onBack={() => navigate(`/practice/answer/${questionId}`)}
                showNotifications={false}
                tone="dark"
            />

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 w-full max-w-md">
                    <p className="text-center text-white/90 text-sm mb-2">질문</p>
                    <h2 className="text-center text-lg">{question.title}</h2>
                </div>

                {/* Audio Visualizer */}
                <div className="relative mb-12">
                    <motion.div
                        className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                        animate={{
                            scale: isRecording ? [1, 1 + audioLevel * 0.3, 1] : 1,
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <div className="w-32 h-32 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center">
                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Timer */}
                <div className="text-center mb-8">
                    <div className="text-5xl font-mono mb-2">{formatTime(seconds)}</div>
                    <p className="text-white/70 text-sm">
                        {isRecording ? '녹음 중...' : '답변 시작 버튼을 눌러주세요'}
                    </p>
                </div>

                {/* Controls */}
                <Button
                    onClick={handleToggleRecording}
                    className={`w-48 h-14 rounded-full text-lg ${isRecording
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-white text-pink-600 hover:bg-white/90'
                        }`}
                >
                    {isRecording ? '답변 종료' : '답변 시작'}
                </Button>

                {isRecording && (
                    <p className="text-white/60 text-sm mt-4">
                        편안하게 답변해주세요
                    </p>
                )}
            </div>
        </div>
    );
};

export default PracticeAnswerVoice;
