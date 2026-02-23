import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { motion as Motion } from 'motion/react';
import { AppHeader } from '@/app/components/AppHeader';
import { useAudioRecorder } from '@/app/hooks/useAudioRecorder';
import { useAudioSttPipeline } from '@/app/hooks/useAudioSttPipeline';
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
  const { state } = useLocation();
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
  const { uploadAudioBlob } = useAudioSttPipeline();

  const prefillAnswerText =
    typeof state?.prefillAnswerText === 'string' ? state.prefillAnswerText : '';

  useEffect(() => {
    if (!prefillAnswerText.trim()) return;

    navigate(`/practice/answer-edit/${questionId}`, {
      replace: true,
      state: { transcribedText: prefillAnswerText },
    });
  }, [navigate, prefillAnswerText, questionId]);

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
        const { audioUrl } = await uploadAudioBlob({
          audioBlob,
          fileNamePrefix: `voice_${questionId}`,
        });

        // 4. STT 페이지로 이동 (S3 URL과 questionId 전달)
        navigate(`/practice/stt/${questionId}`, {
          state: { audioUrl },
        });
      } catch (err) {
        toast.error(err.message || '업로드에 실패했습니다');
        resetAudioBlob();
      } finally {
        setIsUploading(false);
      }
    };

    processAudio();
  }, [audioBlob, navigate, questionId, resetAudioBlob, uploadAudioBlob]);

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
    if (recorderState === 'recording' && audioLevel > 0.02) return 'active';
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
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(165deg, var(--primary-50) 0%, var(--primary-100) 40%, var(--primary-50) 100%)',
      }}
    >
      <AppHeader
        title="음성 답변"
        onBack={handleBackClick}
        showNotifications={false}
        tone="light"
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl p-6 mb-8 w-full max-w-lg shadow-sm border border-white/80">
          <p className="text-center text-[var(--gray-600)] text-sm mb-2">질문</p>
          <h2 className="text-center text-lg font-semibold text-[var(--gray-900)]">{question.title}</h2>
        </div>

        {/* Audio Visualizer - 처음엔 원 1개, 소리 감지 시 바깥 원이 생기는 모션 */}
        <div className="relative mb-12 w-44 h-44 flex items-center justify-center">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {(() => {
              const isRecording = recorderState === 'recording'
              const rawLevel = audioLevel ?? 0
              const level = isRecording ? Math.min(rawLevel * 5, 1) : 0 // 민감도 5배
              const circles = [
                { size: 55, threshold: 0 },
                { size: 70, threshold: 0.08 },
                { size: 85, threshold: 0.18 },
                { size: 100, threshold: 0.3 },
                { size: 115, threshold: 0.45 },
                { size: 130, threshold: 0.6 },
                { size: 145, threshold: 0.75 },
                { size: 160, threshold: 0.88 },
              ]
              return circles.map(({ size, threshold }, i) => {
                const isBase = i === 0
                const intensity = level >= threshold ? (level - threshold) / (1 - threshold || 1) : 0
                const scale = isBase ? 0.9 + level * 0.12 : intensity > 0 ? 0.85 + intensity * 0.25 : 0.7
                const opacity = isBase ? (level > 0 ? 0.22 : 0.15) : intensity > 0 ? 0.07 + intensity * 0.2 : 0
                const borderWidth = 1 + i * 0.5 // 안쪽 1px → 바깥 4.5px
                return (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 rounded-full border border-[var(--primary-400)] transition-all duration-100"
                    style={{
                      width: size,
                      height: size,
                      transform: `translate(-50%, -50%) scale(${scale})`,
                      opacity,
                      borderWidth,
                    }}
                  />
                )
              })
            })()}
          </div>
          {/* 중앙 마이크 아이콘 */}
          <Motion.div
            className="relative z-10 flex items-center justify-center"
            animate={
              visualizerState === 'idle' && recorderState === 'idle'
                ? { scale: [1, 1.02, 1] }
                : {}
            }
            transition={
              visualizerState === 'idle' && recorderState === 'idle'
                ? { duration: 2, repeat: Infinity }
                : {}
            }
          >
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-[var(--primary-600)] animate-spin" />
            ) : visualizerState === 'paused' ? (
              <svg
                className="w-10 h-10 text-[var(--primary-600)]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                className="w-12 h-12 text-[var(--primary-500)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </Motion.div>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-5xl font-mono font-semibold text-[var(--gray-800)] mb-2">
            {formatTime(seconds)}
          </div>
          <p className="text-[var(--gray-600)] text-sm">{getStatusMessage()}</p>
          {recorderState === 'recording' && (
            <p className="text-[var(--gray-500)] text-xs mt-1">
              최대 {Math.floor(MAX_RECORDING_SECONDS / 60)}분까지 녹음 가능
            </p>
          )}
        </div>

        {/* Controls */}
        <Button
          onClick={handleToggleRecording}
          disabled={isUploading}
          className={`w-48 h-14 rounded-full text-lg font-semibold ${
            recorderState === 'recording' || recorderState === 'paused'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white text-[var(--primary-600)] hover:bg-[var(--primary-50)] border border-[var(--primary-200)] shadow-sm'
          } disabled:opacity-50`}
        >
          {getButtonText()}
        </Button>

        {recorderState === 'recording' && (
          <p className="text-[var(--gray-600)] text-sm mt-4">충분히 답변 후 종료 버튼을 눌러주세요.</p>
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
