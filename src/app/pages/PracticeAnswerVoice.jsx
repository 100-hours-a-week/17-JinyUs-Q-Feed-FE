import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { motion as Motion } from 'motion/react';
import { AppHeader } from '@/app/components/AppHeader';
import { useAudioRecorder } from '@/app/hooks/useAudioRecorder';
import { getPresignedUrl, uploadToS3, confirmFileUpload } from '@/api/fileApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { usePracticeQuestionLoader } from '@/app/hooks/usePracticeQuestionLoader';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/app/components/ui/alert-dialog';

const MAX_RECORDING_SECONDS = 300; // 5분
const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_NOT_FOUND = '질문을 찾을 수 없습니다';

const PracticeAnswerVoice = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const [seconds, setSeconds] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showBackModal, setShowBackModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const timerRef = useRef(null);
    const { question, isLoading: isQuestionLoading, errorMessage: questionError } =
        usePracticeQuestionLoader(questionId);

    const {
        recorderState,
        audioBlob,
        audioLevel,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        discardRecording,
        error: recorderError,
        resetAudioBlob,
    } = useAudioRecorder();

    // 녹음 타이머 (recording 상태일 때만 동작)
    useEffect(() => {
        if (recorderState === 'recording') {
            timerRef.current = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [recorderState]);

    // 5분 제한 체크
    useEffect(() => {
        if (seconds >= MAX_RECORDING_SECONDS && recorderState === 'recording') {
            pauseRecording();
            setShowTimeoutModal(true);
        }
    }, [seconds, recorderState, pauseRecording]);

    // 녹음 에러 처리
    useEffect(() => {
        if (recorderError) {
            toast.error(recorderError);
        }
    }, [recorderError]);

    // 녹음 완료 후 업로드 처리
    useEffect(() => {
        if (!audioBlob) return;

        const processAudio = async () => {
            setIsUploading(true);
            try {
                // mp3를 기본값으로 두고, 명확한 타입이면 그 타입을 사용한다.
                const rawType = audioBlob.type || '';
                let extension = 'mp3';
                let mimeType = 'audio/mpeg';
                if (rawType.includes('wav')) {
                    extension = 'wav';
                    mimeType = 'audio/wav';
                } else if (rawType.includes('mp4') || rawType.includes('m4a')) {
                    extension = 'm4a';
                    mimeType = 'audio/mp4';
                } else if (rawType.includes('mpeg') || rawType.includes('mp3')) {
                    extension = 'mp3';
                    mimeType = 'audio/mpeg';
                }

                // 1. Presigned URL 획득
                const presignedResult = await getPresignedUrl({
                    fileName: `voice_${questionId}_${Date.now()}.${extension}`,
                    fileSize: audioBlob.size,
                    mimeType,
                    category: 'AUDIO',
                });

                const { fileId, presignedUrl } = presignedResult.data;

                // 2. S3 업로드
                await uploadToS3(presignedUrl, audioBlob, mimeType);

                // 3. 업로드 확인 및 S3 URL 획득
                const confirmResult = await confirmFileUpload(fileId);
                const { fileUrl } = confirmResult.data;

                // 4. STT 페이지로 이동 (S3 URL과 questionId 전달)
                navigate(`/practice/stt/${questionId}`, {
                    state: { audioUrl: fileUrl },
                });
            } catch (err) {
                toast.error(err.message || '업로드에 실패했습니다');
                resetAudioBlob();
            } finally {
                setIsUploading(false);
            }
        };

        processAudio();
    }, [audioBlob, questionId, navigate, resetAudioBlob]);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    // 뒤로가기 처리
    const handleBackClick = () => {
        if (recorderState === 'recording') {
            pauseRecording();
            setShowBackModal(true);
        } else if (recorderState === 'paused') {
            setShowBackModal(true);
        } else {
            navigate(`/practice/answer/${questionId}`);
        }
    };

    const handleBackConfirm = () => {
        setShowBackModal(false);
        discardRecording();
        navigate(`/practice/answer/${questionId}`);
    };

    const handleBackCancel = () => {
        setShowBackModal(false);
        // paused 상태에서 취소하면 녹음 재개
        if (recorderState === 'paused' && !showStopModal && !showTimeoutModal) {
            resumeRecording();
        }
    };

    // 답변 종료 버튼 처리
    const handleStopClick = () => {
        pauseRecording();
        setShowStopModal(true);
    };

    // 답변 종료 확인 (업로드 진행)
    const handleStopConfirm = () => {
        setShowStopModal(false);
        setShowTimeoutModal(false);
        stopRecording(); // 업로드 진행
    };

    // 다시 답변하기 - 초기 화면으로 복귀, 녹음 파일 삭제
    const handleRetry = () => {
        setShowStopModal(false);
        setShowTimeoutModal(false);
        discardRecording();
        setSeconds(0);
    };

    // 답변 시작/종료 토글
    const handleToggleRecording = () => {
        if (recorderState === 'recording') {
            handleStopClick();
        } else if (recorderState === 'paused') {
            // paused 상태에서 버튼 클릭 시 답변 종료 모달
            setShowStopModal(true);
        } else {
            setSeconds(0);
            startRecording();
        }
    };

    // 비주얼라이저 상태
    const getVisualizerState = () => {
        if (recorderState === 'permission_error') return 'permission';
        if (recorderState === 'device_error') return 'error';
        if (recorderState === 'recording' && audioLevel > 0.05) return 'active';
        if (recorderState === 'paused') return 'paused';
        return 'idle';
    };

    // 상태 메시지
    const getStatusMessage = () => {
        if (isUploading) return '업로드 중...';
        if (recorderState === 'recording') return '녹음 중...';
        if (recorderState === 'paused') return '일시정지';
        if (recorderState === 'permission_error') return '마이크 권한이 필요합니다';
        if (recorderState === 'device_error') return '마이크를 확인해주세요';
        return '답변 시작 버튼을 눌러주세요';
    };

    // 버튼 텍스트
    const getButtonText = () => {
        if (isUploading) return '업로드 중...';
        if (recorderState === 'recording' || recorderState === 'paused') return '답변 종료';
        return '답변 시작';
    };

    const visualizerState = getVisualizerState();

    if (isQuestionLoading) return <div>{TEXT_LOADING}</div>;
    if (questionError) return <div>{questionError}</div>;
    if (!question) return <div>{TEXT_NOT_FOUND}</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-500 text-white flex flex-col">
            <AppHeader
                title="음성 답변"
                onBack={handleBackClick}
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
                    <Motion.div
                        className={`w-40 h-40 rounded-full backdrop-blur-sm flex items-center justify-center ${
                            visualizerState === 'paused' ? 'bg-white/30' : 'bg-white/20'
                        }`}
                        animate={{
                            scale: visualizerState === 'active'
                                ? [1, 1 + audioLevel * 0.3, 1]
                                : visualizerState === 'idle' && recorderState === 'idle'
                                    ? [1, 1.02, 1]
                                    : 1,
                        }}
                        transition={{
                            duration: visualizerState === 'active' ? 0.3 : 2,
                            repeat: visualizerState === 'active' || (visualizerState === 'idle' && recorderState === 'idle') ? Infinity : 0,
                        }}
                    >
                        <div className="w-32 h-32 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center">
                                {isUploading ? (
                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                ) : visualizerState === 'paused' ? (
                                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <rect x="6" y="4" width="4" height="16" />
                                        <rect x="14" y="4" width="4" height="16" />
                                    </svg>
                                ) : (
                                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </Motion.div>
                </div>

                {/* Timer */}
                <div className="text-center mb-8">
                    <div className="text-5xl font-mono mb-2">{formatTime(seconds)}</div>
                    <p className="text-white/70 text-sm">{getStatusMessage()}</p>
                    {recorderState === 'recording' && (
                        <p className="text-white/50 text-xs mt-1">
                            최대 {Math.floor(MAX_RECORDING_SECONDS / 60)}분까지 녹음 가능
                        </p>
                    )}
                </div>

                {/* Controls */}
                <Button
                    onClick={handleToggleRecording}
                    disabled={isUploading}
                    className={`w-48 h-14 rounded-full text-lg ${
                        recorderState === 'recording' || recorderState === 'paused'
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-white text-pink-600 hover:bg-white/90'
                    } disabled:opacity-50`}
                >
                    {getButtonText()}
                </Button>

                {recorderState === 'recording' && (
                    <p className="text-white/60 text-sm mt-4">
                        편안하게 답변해주세요
                    </p>
                )}
            </div>

            {/* 뒤로가기 모달 */}
            <AlertDialog open={showBackModal} onOpenChange={setShowBackModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>녹음 중입니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            종료하시겠습니까? (녹음 내용은 저장되지 않습니다!)
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleBackCancel}>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBackConfirm}>확인</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 답변 종료 확인 모달 */}
            <AlertDialog open={showStopModal} onOpenChange={setShowStopModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>답변을 종료하고 분석을 시작하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            *다시 답변할 시 답변 시작 전으로 돌아갑니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleRetry}>다시 답변하기</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStopConfirm}>답변 종료</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 5분 초과 모달 */}
            <AlertDialog open={showTimeoutModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>답변 시간이 초과되었습니다.</AlertDialogTitle>
                        <AlertDialogDescription>
                            그대로 제출 하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleRetry}>다시 답변하기</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStopConfirm}>예 (답변 제출)</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PracticeAnswerVoice;
