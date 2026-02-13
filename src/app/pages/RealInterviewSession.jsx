import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera,
    Circle,
    Clock3,
    RefreshCcw,
} from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { Button } from '@/app/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

const INITIAL_QUESTION = '대규모 트래픽 상황에서 API 응답 지연이 발생할 때, 원인을 어떻게 분류하고 우선순위를 정해 해결하실 건가요?';
const MAX_RECORDING_SECONDS = 300;
const TIME_WARNING_SECONDS = 60;
const ANALYSIS_ENDPOINT = import.meta.env.VITE_REAL_INTERVIEW_ANALYSIS_ENDPOINT;
const ORIGIN_QUESTION_TYPE = '메인 질문';

const COPY = {
    headerTitle: '실전 면접',
    interviewStateReady: '면접 준비',
    interviewStateRecording: '답변 중',
    roundPrefix: '라운드',
    remainingPrefix: '남은',
    followUpQuestionPrefix: '꼬리 질문',
    processingAnswer: '답변을 정리하고 있습니다.',
    processingFollowUp: '면접관의 다음 질문을 준비하고 있습니다.',
    cameraInitializing: '카메라 초기화 중입니다.',
    cameraUnsupported: '현재 브라우저에서는 웹캠을 사용할 수 없습니다.',
    cameraPermissionRequired: '카메라 권한이 필요합니다. 브라우저 권한을 허용해주세요.',
    cameraConnectionFailed: '웹캠 연결에 실패했습니다. 장치 연결 상태를 확인해주세요.',
    cameraReconnect: '카메라 다시 연결',
    micPermissionRequired: '녹음하려면 마이크 권한도 허용해주세요.',
    micConnectionFailed: '마이크 연결을 확인한 후 다시 시도해주세요.',
    recordingUnsupported: '현재 브라우저에서 녹화 기능을 지원하지 않습니다.',
    recordingStartFailed: '녹화를 시작하지 못했습니다. 브라우저 권한 또는 장치를 확인해주세요.',
    interviewFinishedQuestion: '모든 면접 질문이 종료되었습니다. AI 분석 요청으로 종합 피드백을 받아보세요.',
    analysisRequestFailed: 'AI 분석 요청을 전송하지 못했습니다.',
    analysisRequestAccepted: 'AI 분석 요청이 접수되었습니다. 결과가 준비되면 확인할 수 있어요.',
    analysisRequestRetry: 'AI 분석 요청에 실패했습니다. 다시 시도해주세요.',
    autoStopNotice: '최대 답변 시간 5분에 도달해 자동으로 답변이 종료되었습니다.',
    questionFallback: '질문 정보를 불러오지 못했습니다.',
    reviewToggleClose: '내 답변 닫기',
    reviewToggleOpen: '내 답변 열기',
    reviewTitle: '내 답변 확인',
    reviewDescription: '답변 텍스트를 확인한 뒤 다음 질문으로 진행하세요.',
    reviewPanelClosed: '답변 확인 패널이 닫혀 있습니다. 필요하면 다시 열어 확인하세요.',
    timeWarning: '답변 시간이 곧 종료됩니다. 핵심 결론을 정리해주세요.',
    trailButtonLabel: '질문 내역',
    trailOpen: '보기',
    trailClose: '닫기',
    trailTitle: '질문 흐름',
    trailItemFallback: '질문',
    retryAnswer: '다시 답변하기',
    submitAndNext: '답변 제출하고 다음 질문 받기',
    analysisSubmitting: 'AI 분석 요청 중...',
    analysisSuccess: 'AI 분석 요청 완료',
    analysisRequest: 'AI 분석 요청하기',
    analysisSummarySuffix: '개 질문과 답변을 묶어 분석 요청합니다.',
    answerStopAndReview: '답변 종료 후 확인하기',
    answerStart: '답변 시작하기',
    exitTitle: '면접을 종료하시겠어요?',
    exitDescription: '지금 나가면 지금까지 진행한 면접 내용은 저장되지 않고 사라집니다.',
    exitCancel: '계속 면접하기',
    exitConfirm: '나가기',
};

const MOCK_FOLLOW_UPS = [
    '좋습니다. 그렇다면 캐시를 도입했는데도 지연이 지속된다면 어떤 지표부터 다시 확인하실 건가요?',
    '이번에는 데이터베이스 인덱스 최적화가 충분하지 않은 상황이라고 가정해볼게요. 어떤 방식으로 개선하시겠어요?',
    '마지막으로, 장애 재발 방지를 위해 팀 차원에서 어떤 운영 체계를 제안하시겠어요?',
];

const PHASE = {
    READY: 'ready',
    RECORDING: 'recording',
    UPLOADING: 'uploading',
    STT: 'stt',
    REVIEW: 'review',
    FOLLOW_UP: 'follow_up',
};

const CAMERA_STATE = {
    LOADING: 'loading',
    READY: 'ready',
    DENIED: 'denied',
    ERROR: 'error',
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toRenderableText = (value, fallback = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
};

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const MOCK_TRANSCRIPT_LINES = [
    '먼저 병목 지점을 애플리케이션, 데이터베이스, 네트워크로 나누어 확인하겠습니다.',
    'APM과 로그를 통해 p95/p99 지연 구간을 찾고, 트래픽 급증 구간과 오류율 변화를 함께 보겠습니다.',
    '우선순위는 사용자 영향도와 복구 가능 시간을 기준으로 두고, 단기 완화 조치와 근본 원인 해결을 병행하겠습니다.',
];

const createMockTranscript = () => {
    return MOCK_TRANSCRIPT_LINES.join('\n');
};

const getRecorderOptions = () => {
    if (typeof MediaRecorder === 'undefined') return {};

    if (MediaRecorder.isTypeSupported('video/mp4')) {
        return { mimeType: 'video/mp4' };
    }
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        return { mimeType: 'video/webm;codecs=vp9,opus' };
    }
    if (MediaRecorder.isTypeSupported('video/webm')) {
        return { mimeType: 'video/webm' };
    }
    return {};
};

const BUBBLE_BASE =
    'bg-[linear-gradient(145deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.035)_46%,rgba(255,255,255,0.015)_100%)] border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.015),0_6px_12px_rgba(12,7,12,0.08)] backdrop-blur-[18px] backdrop-saturate-150';
const HUD_TEXT_SHADOW = 'drop-shadow-[0_1px_8px_rgba(0,0,0,0.72)]';

const RealInterviewSession = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);

    const [cameraState, setCameraState] = useState(CAMERA_STATE.LOADING);
    const [phase, setPhase] = useState(PHASE.READY);
    const [seconds, setSeconds] = useState(0);
    const [cameraError, setCameraError] = useState('');
    const [transcriptDraft, setTranscriptDraft] = useState('');
    const [interviewRound, setInterviewRound] = useState(1);
    const [followUpCursor, setFollowUpCursor] = useState(0);
    const [isInterviewFinished, setIsInterviewFinished] = useState(false);
    const [permissionHint, setPermissionHint] = useState('');
    const [isTrailOpen, setIsTrailOpen] = useState(false);
    const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(true);
    const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
    const [autoStopNotice, setAutoStopNotice] = useState('');
    const [analysisState, setAnalysisState] = useState('idle');
    const [analysisNotice, setAnalysisNotice] = useState('');
    const [interviewEntries, setInterviewEntries] = useState([]);
    const [questionTrail, setQuestionTrail] = useState([
        {
            id: 'origin-1',
            type: ORIGIN_QUESTION_TYPE,
            text: INITIAL_QUESTION,
        },
    ]);
    const [currentQuestion, setCurrentQuestion] = useState(INITIAL_QUESTION);

    const isRecording = phase === PHASE.RECORDING;
    const isProcessing =
        phase === PHASE.UPLOADING || phase === PHASE.STT || phase === PHASE.FOLLOW_UP;
    const canStartRecording =
        !isInterviewFinished &&
        cameraState === CAMERA_STATE.READY &&
        phase === PHASE.READY;
    const remainingSeconds = Math.max(MAX_RECORDING_SECONDS - seconds, 0);
    const isTimeWarning = isRecording && remainingSeconds <= TIME_WARNING_SECONDS;

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        timerRef.current = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);
    }, [stopTimer]);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const attachStreamToVideo = useCallback(async (stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
    }, []);

    const initializeCamera = useCallback(async () => {
        setCameraError('');
        setPermissionHint('');
        setCameraState(CAMERA_STATE.LOADING);

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraState(CAMERA_STATE.ERROR);
            setCameraError(COPY.cameraUnsupported);
            return null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: false,
            });

            streamRef.current = stream;
            await attachStreamToVideo(stream);

            setCameraState(CAMERA_STATE.READY);
            return stream;
        } catch (error) {
            if (error?.name === 'NotAllowedError') {
                setCameraState(CAMERA_STATE.DENIED);
                setCameraError(COPY.cameraPermissionRequired);
            } else {
                setCameraState(CAMERA_STATE.ERROR);
                setCameraError(COPY.cameraConnectionFailed);
            }
            return null;
        }
    }, [attachStreamToVideo]);

    const ensureRecordingStream = useCallback(async () => {
        const currentStream = streamRef.current;
        if (currentStream && currentStream.getAudioTracks().length > 0) {
            return currentStream;
        }

        try {
            const streamWithAudio = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: true,
            });

            if (currentStream) {
                currentStream.getTracks().forEach((track) => track.stop());
            }

            streamRef.current = streamWithAudio;
            await attachStreamToVideo(streamWithAudio);
            setPermissionHint('');
            return streamWithAudio;
        } catch (error) {
            if (error?.name === 'NotAllowedError') {
                setPermissionHint(COPY.micPermissionRequired);
            } else {
                setPermissionHint(COPY.micConnectionFailed);
            }
            return null;
        }
    }, [attachStreamToVideo]);

    const runPostRecordingPipeline = useCallback(
        async () => {
            setPhase(PHASE.UPLOADING);
            await wait(1300);

            setPhase(PHASE.STT);
            await wait(1400);

            const draft = createMockTranscript();
            setTranscriptDraft(draft);
            setPhase(PHASE.REVIEW);
        },
        []
    );

    const startRecording = useCallback(async () => {
        if (!canStartRecording) return;
        if (typeof MediaRecorder === 'undefined') {
            setCameraError(COPY.recordingUnsupported);
            return;
        }

        let stream = streamRef.current;
        if (!stream) {
            stream = await initializeCamera();
            if (!stream) return;
        }
        stream = await ensureRecordingStream();
        if (!stream) return;

        try {
            const options = getRecorderOptions();

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.onstop = () => {
                runPostRecordingPipeline();
            };

            setSeconds(0);
            setAutoStopNotice('');
            setAnalysisNotice('');
            setPhase(PHASE.RECORDING);
            startTimer();
            recorder.start(250);
        } catch {
            setCameraError(COPY.recordingStartFailed);
            setPhase(PHASE.READY);
            stopTimer();
        }
    }, [
        canStartRecording,
        ensureRecordingStream,
        initializeCamera,
        runPostRecordingPipeline,
        startTimer,
        stopTimer,
    ]);

    const stopRecordingAndSubmit = useCallback(() => {
        if (!mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state === 'inactive') return;

        stopTimer();
        setPhase(PHASE.UPLOADING);
        mediaRecorderRef.current.stop();
    }, [stopTimer]);

    const resetToReady = useCallback(() => {
        setTranscriptDraft('');
        setSeconds(0);
        setAutoStopNotice('');
        setIsReviewPanelOpen(true);
        setPhase(PHASE.READY);
    }, []);

    const submitTranscript = useCallback(async () => {
        const answerText = transcriptDraft.trim();
        if (!answerText) return;

        setInterviewEntries((prev) => [
            ...prev,
            {
                round: interviewRound,
                questionType: interviewRound === 1 ? 'MAIN_QUESTION' : 'FOLLOW_UP',
                question: currentQuestion,
                answer: answerText,
                durationSeconds: seconds,
                submittedAt: new Date().toISOString(),
            },
        ]);

        setPhase(PHASE.FOLLOW_UP);
        await wait(1300);

        const nextFollowUp = MOCK_FOLLOW_UPS[followUpCursor];
        if (!nextFollowUp) {
            setIsInterviewFinished(true);
            setCurrentQuestion(COPY.interviewFinishedQuestion);
            setTranscriptDraft('');
            setPhase(PHASE.READY);
            return;
        }

        const nextRound = interviewRound + 1;
        setFollowUpCursor((prev) => prev + 1);
        setInterviewRound(nextRound);
        setCurrentQuestion(nextFollowUp);
        setQuestionTrail((prev) => [
            ...prev,
            {
                id: `follow-up-${nextRound}`,
                type: `${COPY.followUpQuestionPrefix} ${nextRound - 1}`,
                text: nextFollowUp,
            },
        ]);
        setTranscriptDraft('');
        setSeconds(0);
        setAutoStopNotice('');
        setPhase(PHASE.READY);
    }, [currentQuestion, followUpCursor, interviewRound, seconds, transcriptDraft]);

    const requestAiAnalysis = useCallback(async () => {
        if (analysisState === 'submitting' || interviewEntries.length === 0) return;

        setAnalysisState('submitting');
        setAnalysisNotice('');

        const payload = {
            interviewType: 'REAL_INTERVIEW',
            totalRounds: interviewEntries.length,
            requestedAt: new Date().toISOString(),
            qaPairs: interviewEntries.map((entry) => ({
                round: entry.round,
                questionType: entry.questionType,
                question: entry.question,
                answer: entry.answer,
                durationSeconds: entry.durationSeconds,
                submittedAt: entry.submittedAt,
            })),
        };

        try {
            if (ANALYSIS_ENDPOINT) {
                const response = await fetch(ANALYSIS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    throw new Error(COPY.analysisRequestFailed);
                }
            } else {
                await wait(1500);
            }

            setAnalysisState('success');
            setAnalysisNotice(COPY.analysisRequestAccepted);
        } catch (error) {
            setAnalysisState('error');
            setAnalysisNotice(error?.message || COPY.analysisRequestRetry);
        }
    }, [analysisState, interviewEntries]);

    const processingLabel = useMemo(() => {
        if (phase === PHASE.UPLOADING || phase === PHASE.STT) {
            return COPY.processingAnswer;
        }
        if (phase === PHASE.FOLLOW_UP) return COPY.processingFollowUp;
        return '';
    }, [phase]);

    const handleBackClick = useCallback(() => {
        setIsExitDialogOpen(true);
    }, []);

    const handleExitConfirm = useCallback(() => {
        setIsExitDialogOpen(false);
        stopTimer();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        stopStream();
        navigate(-1);
    }, [navigate, stopStream, stopTimer]);

    const handleExitCancel = useCallback(() => {
        setIsExitDialogOpen(false);
    }, []);

    useEffect(() => {
        initializeCamera();
        return () => {
            stopTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            stopStream();
        };
    }, [initializeCamera, stopStream, stopTimer]);

    useEffect(() => {
        if (cameraState !== CAMERA_STATE.READY) return;
        if (!streamRef.current) return;
        attachStreamToVideo(streamRef.current);
    }, [attachStreamToVideo, cameraState]);

    useEffect(() => {
        if (phase === PHASE.REVIEW) {
            setIsReviewPanelOpen(true);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === PHASE.RECORDING && seconds >= MAX_RECORDING_SECONDS) {
            setAutoStopNotice(COPY.autoStopNotice);
            stopRecordingAndSubmit();
        }
    }, [phase, seconds, stopRecordingAndSubmit]);

    return (
        <div className="min-h-screen flex flex-col bg-[#0e0a0f] text-white">
            <main className="h-screen">
                <section className="relative h-screen overflow-hidden bg-[#080709]">
                    <AppHeader
                        title={COPY.headerTitle}
                        showNotifications={false}
                        showSettings={false}
                        tone="dark"
                        className="left-0 right-0"
                        onBack={handleBackClick}
                    />

                    {cameraState === CAMERA_STATE.READY ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-full w-full scale-x-[-1] object-cover"
                        />
                    ) : (
                        <div className="h-full w-full px-6 py-6 flex flex-col items-center justify-center gap-3.5 text-center text-white/90">
                            <Camera size={30} />
                            <p className="m-0 text-sm leading-[1.45]">{cameraError || COPY.cameraInitializing}</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={initializeCamera}
                                className="min-w-[170px]"
                            >
                                <RefreshCcw size={14} />
                                {COPY.cameraReconnect}
                            </Button>
                        </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_50%_at_50%_110%,rgba(255,107,138,0.08)_0%,rgba(255,107,138,0)_70%),radial-gradient(130%_45%_at_50%_-12%,rgba(255,196,209,0.05)_0%,rgba(255,196,209,0)_60%),linear-gradient(180deg,rgba(12,8,12,0.14)_0%,rgba(12,8,12,0.02)_36%,rgba(12,8,12,0.1)_100%)]" />

                    <div className="absolute left-3.5 right-3.5 top-[70px] z-[3] isolate flex items-center justify-between gap-2">
                        <div className="relative z-[1] flex flex-wrap items-center gap-2">
                            <span
                                className={`${BUBBLE_BASE} ${HUD_TEXT_SHADOW} rounded-full px-3 py-[7px] text-[11px] font-bold tracking-[0.05em] text-white/95 ${isRecording ? 'border-[#ff6b8a]/85 text-[#ffe9ef] animate-pulse' : ''}`}
                            >
                                {isRecording ? COPY.interviewStateRecording : COPY.interviewStateReady}
                            </span>
                            <span
                                className={`${BUBBLE_BASE} ${HUD_TEXT_SHADOW} inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-xs font-medium text-white/95 ${isRecording ? 'border-[#ff6b8a]/85 text-[#ffe5ec]' : ''}`}
                            >
                                <Clock3 size={14} />
                                {formatTime(seconds)} / {formatTime(MAX_RECORDING_SECONDS)}
                                {isRecording && <Circle size={10} className="text-[#ff6b8a] animate-pulse" fill="currentColor" />}
                            </span>
                            {isRecording && (
                                <span
                                    className={`${BUBBLE_BASE} ${HUD_TEXT_SHADOW} inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-xs font-medium text-white/95 ${isTimeWarning ? 'border-[#ff6b8a]/90 text-[#ffe9ef]' : ''}`}
                                >
                                    {COPY.remainingPrefix} {formatTime(remainingSeconds)}
                                </span>
                            )}
                        </div>
                        <span className={`${BUBBLE_BASE} ${HUD_TEXT_SHADOW} relative z-[1] inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-xs font-medium text-white/95`}>
                            {COPY.roundPrefix} {interviewRound}
                        </span>
                    </div>

                    <article className={`${BUBBLE_BASE} absolute left-3.5 right-3.5 top-[128px] z-[3] rounded-2xl p-3.5`}>
                        <p className={`${HUD_TEXT_SHADOW} m-0 text-[11px] font-semibold text-[#ffe8ef]`}>
                            {interviewRound === 1
                                ? ORIGIN_QUESTION_TYPE
                                : `${COPY.followUpQuestionPrefix} ${interviewRound - 1}`}
                        </p>
                        <h2 className="m-[7px_0_0] text-[15px] leading-[1.45] font-medium text-[#f9fafb] drop-shadow-[0_1px_10px_rgba(0,0,0,0.82)]">
                            {toRenderableText(currentQuestion, COPY.questionFallback)}
                        </h2>
                    </article>

                    {phase === PHASE.REVIEW && (
                        <button
                            type="button"
                            className={`${BUBBLE_BASE} absolute right-3.5 bottom-[calc(106px+env(safe-area-inset-bottom,0px))] z-[4] rounded-full px-3 py-2 text-xs font-medium text-white`}
                            onClick={() => setIsReviewPanelOpen((prev) => !prev)}
                        >
                            {isReviewPanelOpen ? COPY.reviewToggleClose : COPY.reviewToggleOpen}
                        </button>
                    )}

                    {phase === PHASE.REVIEW && isReviewPanelOpen && (
                        <div className={`${BUBBLE_BASE} absolute left-3.5 right-3.5 bottom-[calc(154px+env(safe-area-inset-bottom,0px))] z-[5] rounded-2xl p-3`}>
                            <div>
                                <h3 className="m-0 text-sm font-semibold text-white">{COPY.reviewTitle}</h3>
                                <p className="m-[6px_0_0] text-xs text-white/90">{COPY.reviewDescription}</p>
                            </div>
                            <textarea
                                value={transcriptDraft}
                                onChange={(event) => setTranscriptDraft(event.target.value)}
                                className="mt-2.5 w-full min-h-[150px] resize-y rounded-xl border border-white/35 bg-white/12 px-3 py-[11px] text-[13px] leading-[1.5] text-white outline-none focus:border-[#ff8fa3]/95 focus:shadow-[0_0_0_3px_rgba(255,143,163,0.3)]"
                            />
                        </div>
                    )}

                    {phase === PHASE.REVIEW && !isReviewPanelOpen && (
                        <div className={`${BUBBLE_BASE} absolute left-3.5 right-3.5 bottom-[calc(150px+env(safe-area-inset-bottom,0px))] z-[4] rounded-xl px-[11px] py-[9px] text-xs text-white/95`}>
                            {COPY.reviewPanelClosed}
                        </div>
                    )}

                    {(isProcessing || permissionHint || autoStopNotice || analysisNotice || isTimeWarning) && (
                        <div className="absolute left-3.5 right-3.5 top-[226px] z-[3] flex flex-col gap-2">
                            {isProcessing && (
                                <div className={`${BUBBLE_BASE} flex items-center gap-2.5 rounded-xl px-3 py-2.5`}>
                                    <div className="h-[13px] w-[13px] rounded-full border-2 border-white/50 border-t-[#ff8fa3] animate-spin" />
                                    <p className="m-0 text-xs font-medium text-white/95">{toRenderableText(processingLabel)}</p>
                                </div>
                            )}
                            {isTimeWarning && (
                                <div className={`${BUBBLE_BASE} border-[#ff6b8a]/90 flex items-center gap-2.5 rounded-xl px-3 py-2.5`}>
                                    <p className="m-0 text-xs font-medium text-white/95">{COPY.timeWarning}</p>
                                </div>
                            )}
                            {autoStopNotice && (
                                <div className={`${BUBBLE_BASE} border-[#ff6b8a]/90 flex items-center gap-2.5 rounded-xl px-3 py-2.5`}>
                                    <p className="m-0 text-xs font-medium text-white/95">{toRenderableText(autoStopNotice)}</p>
                                </div>
                            )}
                            {permissionHint && (
                                <div className={`${BUBBLE_BASE} border-[#ff6b8a]/90 flex items-center gap-2.5 rounded-xl px-3 py-2.5`}>
                                    <p className="m-0 text-xs font-medium text-white/95">{toRenderableText(permissionHint)}</p>
                                </div>
                            )}
                            {analysisNotice && (
                                <div className={`${BUBBLE_BASE} ${analysisState === 'error' ? 'border-[#ff6b8a]/90' : ''} flex items-center gap-2.5 rounded-xl px-3 py-2.5`}>
                                    <p className="m-0 text-xs font-medium text-white/95">{toRenderableText(analysisNotice)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        className={`${BUBBLE_BASE} absolute left-3.5 bottom-[calc(106px+env(safe-area-inset-bottom,0px))] z-[4] rounded-full px-3 py-2 text-xs font-medium text-white`}
                        onClick={() => setIsTrailOpen((prev) => !prev)}
                    >
                        {COPY.trailButtonLabel} {isTrailOpen ? COPY.trailClose : COPY.trailOpen}
                    </button>

                    {isTrailOpen && (
                        <section className={`${BUBBLE_BASE} absolute left-3.5 right-3.5 bottom-[calc(152px+env(safe-area-inset-bottom,0px))] z-[5] max-h-[224px] overflow-auto rounded-[14px] p-3`}>
                            <h3 className="m-[0_0_9px] text-[13px] font-semibold text-white">{COPY.trailTitle}</h3>
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {questionTrail.map((item) => (
                                    <li key={item.id} className="rounded-[10px] border border-white/35 bg-white/10 p-[9px_10px]">
                                        <span className="text-[11px] font-semibold text-[#ffe5ec]">{toRenderableText(item.type, COPY.trailItemFallback)}</span>
                                        <p className="m-[6px_0_0] text-xs leading-[1.42] text-white/95">{toRenderableText(item.text)}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <footer className="absolute inset-x-0 bottom-0 z-[6] px-3.5 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] backdrop-blur-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_32%,rgba(14,10,15,0.22)_100%)]">
                        {phase === PHASE.REVIEW ? (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="min-h-[50px] flex-1 rounded-[14px]"
                                    onClick={resetToReady}
                                >
                                    {COPY.retryAnswer}
                                </Button>
                                <Button
                                    className="min-h-[50px] flex-1 rounded-[14px]"
                                    onClick={submitTranscript}
                                    disabled={!transcriptDraft.trim()}
                                >
                                    {COPY.submitAndNext}
                                </Button>
                            </div>
                        ) : isInterviewFinished ? (
                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full min-h-[52px] rounded-[14px]"
                                    onClick={requestAiAnalysis}
                                    disabled={analysisState === 'submitting' || analysisState === 'success'}
                                >
                                    {analysisState === 'submitting'
                                        ? COPY.analysisSubmitting
                                        : analysisState === 'success'
                                            ? COPY.analysisSuccess
                                            : COPY.analysisRequest}
                                </Button>
                                <p className="m-0 text-center text-xs text-white/90">
                                    {interviewEntries.length}
                                    {COPY.analysisSummarySuffix}
                                </p>
                            </div>
                        ) : (
                            <Button
                                className="w-full min-h-[52px] rounded-[14px] text-base"
                                onClick={isRecording ? stopRecordingAndSubmit : startRecording}
                                disabled={!isRecording && !canStartRecording}
                            >
                                {isRecording ? COPY.answerStopAndReview : COPY.answerStart}
                            </Button>
                        )}
                    </footer>
                </section>
            </main>

            <AlertDialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{COPY.exitTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {COPY.exitDescription}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleExitCancel}>{COPY.exitCancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExitConfirm}>{COPY.exitConfirm}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RealInterviewSession;
