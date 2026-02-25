import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera,
    Circle,
    Clock3,
    Loader2,
    RefreshCcw,
    Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/app/components/AppHeader';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import {
    fetchInterviewSession,
    requestInterviewSessionFeedback,
    submitRealInterviewAnswer,
} from '@/api/interviewApi';
import { useAudioSttPipeline } from '@/app/hooks/useAudioSttPipeline';
import { useQuestionTtsPlayer } from '@/app/hooks/useQuestionTtsPlayer';
import { SESSION_STORAGE_KEYS } from '@/app/constants/storageKeys';
import { useAuth } from '@/context/AuthContext';
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

const INITIAL_QUESTION = '';
const MAX_RECORDING_SECONDS = 300;
const TIME_WARNING_SECONDS = 60;
const ORIGIN_QUESTION_TYPE = '메인 질문';
const REAL_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.REAL_INTERVIEW_SESSION;
const DEFAULT_TTS_USER_ID = 1;

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
    sessionNotFound: '실전 면접 세션 정보를 찾을 수 없습니다. 다시 시작해주세요.',
    sessionLoadFailed: '세션 정보를 불러오지 못했습니다.',
    answerSubmitFailed: '답변 제출에 실패했습니다. 다시 시도해주세요.',
    nextQuestionMissing: '다음 질문을 받지 못해 면접을 종료합니다.',
    questionTtsPlay: '질문 듣기',
    questionTtsStop: '재생 중지',
    questionTtsLoading: '생성 중...',
    questionTtsFailed: '질문 음성 재생에 실패했습니다.',
    badCaseDetected: '답변이 기준을 충족하지 못해 다시 녹화가 필요합니다.',
    badCaseFeedbackFallback: '답변을 보완해 다시 시도해주세요.',
    badCaseRetryPrompt: '피드백을 반영해 다시 답변해주세요.',
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
    trailEmpty: '아직 누적된 질문 내역이 없습니다.',
    retryAnswer: '다시 답변하기',
    submitAndNext: '답변 제출하고 다음 질문 받기',
    analysisSubmitting: 'AI 분석 요청 중...',
    analysisSuccess: 'AI 분석 요청 완료',
    analysisRequest: 'AI 분석하기',
    analysisSummarySuffix: '개 질문과 답변을 묶어 분석 요청합니다.',
    answerStopAndReview: '답변 종료 후 확인하기',
    answerStart: '답변 시작하기',
    startGateTitle: '면접 시작 안내',
    startGateDescription: '시작하기 버튼을 누르면 면접이 시작됩니다.',
    startGatePermissionGuide: '시작 전에 카메라/마이크 권한을 확인해주세요.',
    startGateCheckPermissions: '권한 확인',
    startGateCheckingPermissions: '권한 확인 중...',
    startGatePermissionRequired: '카메라와 마이크 권한이 모두 필요합니다.',
    startGatePermissionGranted: '카메라/마이크 권한이 확인되었습니다.',
    startGatePermissionDenied: '권한이 거부되었습니다. 브라우저 설정에서 허용 후 다시 확인해주세요.',
    startGatePermissionCheckFailed: '권한 확인에 실패했습니다. 잠시 후 다시 시도해주세요.',
    startGateDeviceUnsupported: '현재 브라우저는 카메라/마이크 권한 확인을 지원하지 않습니다.',
    startGateDeviceMissing: '카메라 또는 마이크 장치를 찾지 못했습니다.',
    startGatePermissionDisableHint: '권한 해제는 브라우저 설정에서 변경할 수 있습니다.',
    startGatePermissionStatusGranted: '허용됨',
    startGatePermissionStatusDenied: '거부됨',
    startGatePermissionStatusPrompt: '확인 필요',
    startGatePermissionStatusUnknown: '확인 전',
    startGatePermissionStatusUnsupported: '미지원',
    startGateCameraLabel: '카메라',
    startGateMicLabel: '마이크',
    startGateStart: '시작하기',
    startGateCancel: '나가기',
    startGatePreparing: '세션 준비 중...',
    exitTitle: '면접을 종료하시겠어요?',
    exitDescription: '지금 나가면 지금까지 진행한 면접 내용은 저장되지 않고 사라집니다.',
    exitCancel: '계속 면접하기',
    exitConfirm: '나가기',
};

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

const START_GATE_PERMISSION_STATE = {
    UNKNOWN: 'unknown',
    PROMPT: 'prompt',
    GRANTED: 'granted',
    DENIED: 'denied',
    UNSUPPORTED: 'unsupported',
};
const START_GATE_PERMISSION_TARGET = {
    CAMERA: 'camera',
    MIC: 'microphone',
};

const safeGetSessionItem = (key) => {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeSetSessionItem = (key, value) => {
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // sessionStorage 사용 불가 환경에서는 무시한다.
    }
};

const safeRemoveSessionItem = (key) => {
    try {
        sessionStorage.removeItem(key);
    } catch {
        // sessionStorage 사용 불가 환경에서는 무시한다.
    }
};

const safeParseJson = (raw) => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const resolveUserIdFromAccessToken = (token) => {
    if (!token) return DEFAULT_TTS_USER_ID;

    const parts = token.split('.');
    if (parts.length < 2) return DEFAULT_TTS_USER_ID;

    try {
        const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(
            normalized.length + (4 - (normalized.length % 4 || 4)) % 4,
            '='
        );
        const payload = JSON.parse(atob(padded));
        const candidates = [
            payload?.userId,
            payload?.user_id,
            payload?.memberId,
            payload?.member_id,
            payload?.id,
            payload?.sub,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'number' && Number.isInteger(candidate)) {
                return candidate;
            }
            if (typeof candidate === 'string' && /^\d+$/.test(candidate.trim())) {
                return Number(candidate.trim());
            }
        }
    } catch {
        return DEFAULT_TTS_USER_ID;
    }

    return DEFAULT_TTS_USER_ID;
};

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

const toTrimmedString = (value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed || '';
};

const toIntegerOrNull = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
        return Number.parseInt(value.trim(), 10);
    }
    return null;
};

const normalizeTurnType = (value, fallback = 'follow_up') => {
    const normalized = toTrimmedString(value).toLowerCase();
    return normalized || fallback;
};

const normalizeTurnOrder = (value, fallback = 1) => {
    const parsed = toIntegerOrNull(value);
    if (parsed !== null && parsed >= 0) return parsed;
    return fallback;
};

const isTopicTurnType = (value) => {
    const normalized = normalizeTurnType(value, 'follow_up');
    return normalized === 'main' || normalized === 'new_topic';
};

const isSessionEndTurnType = (value) => {
    return normalizeTurnType(value, 'follow_up') === 'session_end';
};

const normalizeHistoryItem = (item, index) => {
    const fallbackOrder = index;
    return {
        question: toTrimmedString(item?.question),
        answer_text: toTrimmedString(item?.answer_text ?? item?.answerText),
        turn_type: normalizeTurnType(item?.turn_type ?? item?.turnType, index === 0 ? 'main' : 'follow_up'),
        turn_order: normalizeTurnOrder(item?.turn_order ?? item?.turnOrder, fallbackOrder),
        topic_id: toIntegerOrNull(item?.topic_id ?? item?.topicId),
        category: toTrimmedString(item?.category),
    };
};

const normalizeCurrentQuestion = (rawCurrentQuestion, fallbackQuestionText = '') => {
    const source = rawCurrentQuestion && typeof rawCurrentQuestion === 'object'
        ? rawCurrentQuestion
        : {
            question: fallbackQuestionText,
        };

    const questionText = toTrimmedString(source?.question ?? source?.content ?? source?.text);
    if (!questionText) return null;

    return {
        question: questionText,
        turn_type: normalizeTurnType(source?.turn_type ?? source?.turnType, 'main'),
        turn_order: normalizeTurnOrder(source?.turn_order ?? source?.turnOrder, 0),
        topic_id: toIntegerOrNull(source?.topic_id ?? source?.topicId),
        category: toTrimmedString(source?.category),
    };
};

const normalizeStoredRealSession = (raw, fallbackUserId) => {
    if (!raw || typeof raw !== 'object') return null;

    const sessionId = raw.session_id ?? raw.sessionId;
    if (!sessionId) return null;

    const parsedUserId = toIntegerOrNull(raw.user_id ?? raw.userId);
    const interviewHistoryRaw = Array.isArray(raw.interview_history)
        ? raw.interview_history
        : Array.isArray(raw.interviewHistory)
            ? raw.interviewHistory
            : [];

    return {
        user_id: parsedUserId ?? fallbackUserId,
        session_id: String(sessionId),
        question_type: toTrimmedString(raw.question_type ?? raw.questionType),
        interview_history: interviewHistoryRaw
            .map((item, index) => {
                const normalized = normalizeHistoryItem(item, index);
                return {
                    ...normalized,
                    turn_order: index,
                };
            })
            .filter((item) => Boolean(item.question) || Boolean(item.answer_text)),
        current_question: normalizeCurrentQuestion(
            raw.current_question ?? raw.currentQuestion,
            raw.question_text ?? raw.questionText ?? ''
        ),
        status: toTrimmedString(raw.status),
        expires_at: raw.expires_at ?? raw.expiresAt ?? null,
        created_at: raw.created_at ?? raw.createdAt ?? null,
    };
};

const persistRealSession = (session) => {
    if (!session || typeof session !== 'object') return;

    const persistedSession = {
        ...session,
    };
    delete persistedSession.user_id;
    delete persistedSession.userId;

    safeSetSessionItem(REAL_SESSION_STORAGE_KEY, JSON.stringify(persistedSession));
};

const resolveQuestionFromCandidate = (candidate) => {
    if (typeof candidate === 'string') {
        const text = toTrimmedString(candidate);
        if (!text) return null;
        return {
            text,
            questionId: null,
            category: '',
            turnType: null,
            topicId: null,
            turnOrder: null,
        };
    }

    if (!candidate || typeof candidate !== 'object') {
        return null;
    }

    const text =
        toTrimmedString(candidate.question) ||
        toTrimmedString(candidate.text) ||
        toTrimmedString(candidate.content) ||
        toTrimmedString(candidate.title) ||
        toTrimmedString(candidate.questionText);

    if (!text) return null;

    const questionId =
        candidate.questionId ??
        candidate.question_id ??
        candidate.id ??
        null;

    return {
        text,
        questionId,
        category: toTrimmedString(candidate.category),
        turnType: toTrimmedString(candidate.turn_type ?? candidate.turnType),
        topicId: toIntegerOrNull(candidate.topic_id ?? candidate.topicId),
        turnOrder: toIntegerOrNull(candidate.turn_order ?? candidate.turnOrder),
    };
};

const extractQuestionFromPayload = (payload) => {
    const candidates = [
        payload?.currentQuestion,
        payload?.current_question,
        payload?.nextQuestion,
        payload?.next_question,
        payload?.question,
        payload?.questionText,
        payload?.question_text,
        payload?.nextQuestionText,
        payload?.next_question_text,
    ];

    for (const candidate of candidates) {
        const resolved = resolveQuestionFromCandidate(candidate);
        if (resolved) {
            return resolved;
        }
    }

    if (Array.isArray(payload?.questions) && payload.questions.length > 0) {
        const resolved = resolveQuestionFromCandidate(payload.questions[0]);
        if (resolved) {
            return resolved;
        }
    }

    const topLevelText = toTrimmedString(payload?.question_text ?? payload?.questionText);
    if (topLevelText) {
        return {
            text: topLevelText,
            questionId: toIntegerOrNull(payload?.question_id ?? payload?.questionId),
            category: toTrimmedString(payload?.category),
            turnType: toTrimmedString(payload?.turn_type ?? payload?.turnType),
            topicId: toIntegerOrNull(payload?.topic_id ?? payload?.topicId),
            turnOrder: toIntegerOrNull(payload?.turn_order ?? payload?.turnOrder),
        };
    }

    return null;
};

const resolveInterviewFinished = (payload) => {
    const explicitFinalCandidates = [payload?.is_final, payload?.isFinal];
    for (const candidate of explicitFinalCandidates) {
        if (typeof candidate === 'boolean') {
            return candidate;
        }
    }

    const turnTypeCandidates = [
        payload?.turn_type,
        payload?.turnType,
        payload?.next_question?.turn_type,
        payload?.next_question?.turnType,
        payload?.nextQuestion?.turn_type,
        payload?.nextQuestion?.turnType,
        payload?.current_question?.turn_type,
        payload?.current_question?.turnType,
    ];
    for (const candidate of turnTypeCandidates) {
        if (isSessionEndTurnType(candidate)) {
            return true;
        }
    }

    const booleanCandidates = [
        payload?.isFinished,
        payload?.finished,
        payload?.interviewFinished,
        payload?.isInterviewFinished,
    ];

    for (const candidate of booleanCandidates) {
        if (typeof candidate === 'boolean') {
            return candidate;
        }
    }

    if (typeof payload?.hasNextQuestion === 'boolean') {
        return !payload.hasNextQuestion;
    }

    if (typeof payload?.has_next_question === 'boolean') {
        return !payload.has_next_question;
    }

    const status = toTrimmedString(payload?.status).toUpperCase();
    if (status === 'COMPLETED' || status === 'FINISHED' || status === 'DONE' || status === 'ENDED') {
        return true;
    }

    return false;
};

const extractBadCaseFeedback = (response, payload) => {
    const pickFirstText = (candidates) => {
        for (const candidate of candidates) {
            const normalized = toTrimmedString(candidate);
            if (normalized) {
                return normalized;
            }
        }
        return '';
    };
    const isBadCaseMarker = (value) => {
        const normalized = toTrimmedString(value).toLowerCase();
        return normalized.startsWith('bad_case');
    };

    const responseMessage = toTrimmedString(response?.message);
    const payloadMessage = toTrimmedString(payload?.message);
    const badCaseFeedback =
        payload?.bad_case_feedback ??
        payload?.badCaseFeedback ??
        response?.bad_case_feedback ??
        response?.badCaseFeedback;
    const messageFromVariantFields = pickFirstText([
        payload?.bad_case_feedback_message,
        payload?.badCaseFeedbackMessage,
        payload?.bad_case_message,
        payload?.badCaseMessage,
        payload?.feedback_message,
        payload?.feedbackMessage,
        response?.bad_case_feedback_message,
        response?.badCaseFeedbackMessage,
        response?.bad_case_message,
        response?.badCaseMessage,
        response?.feedback_message,
        response?.feedbackMessage,
    ]);
    const hasBadCaseFeedback = Boolean(
        (badCaseFeedback && typeof badCaseFeedback === 'object') ||
        messageFromVariantFields
    );
    const isBadCase =
        isBadCaseMarker(responseMessage) ||
        isBadCaseMarker(payloadMessage) ||
        hasBadCaseFeedback;

    if (!isBadCase) return null;

    const message = pickFirstText([
        badCaseFeedback?.message,
        messageFromVariantFields,
        badCaseFeedback?.guidance,
        payload?.bad_case_feedback_guidance,
        payload?.badCaseFeedbackGuidance,
        response?.bad_case_feedback_guidance,
        response?.badCaseFeedbackGuidance,
        COPY.badCaseFeedbackFallback,
    ]);
    const guidance = pickFirstText([
        badCaseFeedback?.guidance,
        payload?.bad_case_feedback_guidance,
        payload?.badCaseFeedbackGuidance,
        response?.bad_case_feedback_guidance,
        response?.badCaseFeedbackGuidance,
    ]);

    return {
        message,
        guidance,
    };
};

const getRecorderOptions = () => {
    if (typeof MediaRecorder === 'undefined') return {};

    if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return { mimeType: 'audio/mp4' };
    }
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        return { mimeType: 'audio/webm;codecs=opus' };
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
        return { mimeType: 'audio/webm' };
    }
    return {};
};

const BUBBLE_BASE =
    'bg-[linear-gradient(145deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.035)_46%,rgba(255,255,255,0.015)_100%)] border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.015),0_6px_12px_rgba(12,7,12,0.08)] backdrop-blur-[18px] backdrop-saturate-150';
const HUD_TEXT_SHADOW = 'drop-shadow-[0_1px_8px_rgba(0,0,0,0.72)]';

const RealInterviewSession = () => {
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recordingStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const timerRef = useRef(null);
    const storedSessionRef = useRef(null);

    const [cameraState, setCameraState] = useState(CAMERA_STATE.LOADING);
    const [phase, setPhase] = useState(PHASE.READY);
    const [seconds, setSeconds] = useState(0);
    const [realUserId, setRealUserId] = useState(DEFAULT_TTS_USER_ID);
    const [realSessionId, setRealSessionId] = useState('');
    const [realQuestionType, setRealQuestionType] = useState('');
    const [currentTurnType, setCurrentTurnType] = useState('main');
    const [, setCurrentTurnOrder] = useState(1);
    const [currentTopicId, setCurrentTopicId] = useState(null);
    const [currentCategory, setCurrentCategory] = useState('');
    const [isSessionReady, setIsSessionReady] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [transcriptDraft, setTranscriptDraft] = useState('');
    const [interviewRound, setInterviewRound] = useState(1);
    const [, setFollowUpCursor] = useState(0);
    const [isInterviewFinished, setIsInterviewFinished] = useState(false);
    const [permissionHint, setPermissionHint] = useState('');
    const [isTrailOpen, setIsTrailOpen] = useState(false);
    const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(true);
    const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
    const [autoStopNotice, setAutoStopNotice] = useState('');
    const [badCaseNotice, setBadCaseNotice] = useState('');
    const [analysisState, setAnalysisState] = useState('idle');
    const [analysisNotice, setAnalysisNotice] = useState('');
    const [isStartGateOpen, setIsStartGateOpen] = useState(true);
    const [isInterviewStarted, setIsInterviewStarted] = useState(false);
    const [startGateCameraPermission, setStartGateCameraPermission] = useState(
        START_GATE_PERMISSION_STATE.UNKNOWN
    );
    const [startGateMicPermission, setStartGateMicPermission] = useState(
        START_GATE_PERMISSION_STATE.UNKNOWN
    );
    const [isStartGatePermissionChecking, setIsStartGatePermissionChecking] = useState(false);
    const [startGatePermissionMessage, setStartGatePermissionMessage] = useState('');
    const [interviewEntries, setInterviewEntries] = useState([]);
    const [questionTrail, setQuestionTrail] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(INITIAL_QUESTION);
    const { uploadAudioBlob, transcribeAudioUrl } = useAudioSttPipeline();

    const isRecording = phase === PHASE.RECORDING;
    const isProcessing =
        phase === PHASE.UPLOADING || phase === PHASE.STT || phase === PHASE.FOLLOW_UP;
    const canStartRecording =
        isInterviewStarted &&
        isSessionReady &&
        !isInterviewFinished &&
        cameraState === CAMERA_STATE.READY &&
        phase === PHASE.READY;
    const isStartGatePermissionReady =
        startGateCameraPermission === START_GATE_PERMISSION_STATE.GRANTED &&
        startGateMicPermission === START_GATE_PERMISSION_STATE.GRANTED;
    const remainingSeconds = Math.max(MAX_RECORDING_SECONDS - seconds, 0);
    const isTimeWarning = isRecording && remainingSeconds <= TIME_WARNING_SECONDS;

    const getPermissionStatusLabel = useCallback((state) => {
        switch (state) {
            case START_GATE_PERMISSION_STATE.GRANTED:
                return COPY.startGatePermissionStatusGranted;
            case START_GATE_PERMISSION_STATE.DENIED:
                return COPY.startGatePermissionStatusDenied;
            case START_GATE_PERMISSION_STATE.PROMPT:
                return COPY.startGatePermissionStatusPrompt;
            case START_GATE_PERMISSION_STATE.UNSUPPORTED:
                return COPY.startGatePermissionStatusUnsupported;
            default:
                return COPY.startGatePermissionStatusUnknown;
        }
    }, []);

    const getPermissionStatusTone = useCallback((state) => {
        if (state === START_GATE_PERMISSION_STATE.GRANTED) {
            return 'text-emerald-600';
        }
        if (state === START_GATE_PERMISSION_STATE.DENIED) {
            return 'text-rose-600';
        }
        return 'text-zinc-500';
    }, []);

    const queryStartGatePermissionState = useCallback(async () => {
        const fallback = {
            camera: START_GATE_PERMISSION_STATE.UNKNOWN,
            microphone: START_GATE_PERMISSION_STATE.UNKNOWN,
        };

        if (!navigator.permissions?.query) {
            return fallback;
        }

        const normalizeState = (state) => {
            if (state === 'granted') return START_GATE_PERMISSION_STATE.GRANTED;
            if (state === 'denied') return START_GATE_PERMISSION_STATE.DENIED;
            if (state === 'prompt') return START_GATE_PERMISSION_STATE.PROMPT;
            return START_GATE_PERMISSION_STATE.UNKNOWN;
        };

        const readSinglePermission = async (name) => {
            try {
                const status = await navigator.permissions.query({ name });
                return normalizeState(status?.state);
            } catch {
                return START_GATE_PERMISSION_STATE.UNKNOWN;
            }
        };

        const [camera, microphone] = await Promise.all([
            readSinglePermission('camera'),
            readSinglePermission('microphone'),
        ]);

        return {
            camera,
            microphone,
        };
    }, []);

    const resolvePermissionErrorMessage = useCallback((error) => {
        if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
            return COPY.startGatePermissionDenied;
        }
        if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
            return COPY.startGateDeviceMissing;
        }
        return COPY.startGatePermissionCheckFailed;
    }, []);

    const syncStartGatePermissionState = useCallback(async () => {
        const state = await queryStartGatePermissionState();
        setStartGateCameraPermission(state.camera);
        setStartGateMicPermission(state.microphone);
        return state;
    }, [queryStartGatePermissionState]);

    const requestSingleStartGatePermission = useCallback(async (target) => {
        if (isStartGatePermissionChecking) {
            return false;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            if (target === START_GATE_PERMISSION_TARGET.CAMERA) {
                setStartGateCameraPermission(START_GATE_PERMISSION_STATE.UNSUPPORTED);
            } else {
                setStartGateMicPermission(START_GATE_PERMISSION_STATE.UNSUPPORTED);
            }
            setStartGatePermissionMessage(COPY.startGateDeviceUnsupported);
            return false;
        }

        const constraints = target === START_GATE_PERMISSION_TARGET.CAMERA
            ? { video: true, audio: false }
            : { video: false, audio: true };

        setIsStartGatePermissionChecking(true);
        setStartGatePermissionMessage('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach((track) => track.stop());

            if (target === START_GATE_PERMISSION_TARGET.CAMERA) {
                setStartGateCameraPermission(START_GATE_PERMISSION_STATE.GRANTED);
            } else {
                setStartGateMicPermission(START_GATE_PERMISSION_STATE.GRANTED);
            }

            const latestState = await queryStartGatePermissionState();
            const nextCameraState = latestState.camera === START_GATE_PERMISSION_STATE.UNKNOWN
                ? target === START_GATE_PERMISSION_TARGET.CAMERA
                    ? START_GATE_PERMISSION_STATE.GRANTED
                    : startGateCameraPermission
                : latestState.camera;
            const nextMicState = latestState.microphone === START_GATE_PERMISSION_STATE.UNKNOWN
                ? target === START_GATE_PERMISSION_TARGET.MIC
                    ? START_GATE_PERMISSION_STATE.GRANTED
                    : startGateMicPermission
                : latestState.microphone;

            setStartGateCameraPermission(nextCameraState);
            setStartGateMicPermission(nextMicState);
            setStartGatePermissionMessage(
                nextCameraState === START_GATE_PERMISSION_STATE.GRANTED &&
                    nextMicState === START_GATE_PERMISSION_STATE.GRANTED
                    ? COPY.startGatePermissionGranted
                    : COPY.startGatePermissionRequired
            );
            return true;
        } catch (error) {
            const latestState = await queryStartGatePermissionState();

            if (target === START_GATE_PERMISSION_TARGET.CAMERA) {
                setStartGateCameraPermission(
                    latestState.camera === START_GATE_PERMISSION_STATE.UNKNOWN
                        ? START_GATE_PERMISSION_STATE.DENIED
                        : latestState.camera
                );
                if (latestState.microphone !== START_GATE_PERMISSION_STATE.UNKNOWN) {
                    setStartGateMicPermission(latestState.microphone);
                }
            } else {
                setStartGateMicPermission(
                    latestState.microphone === START_GATE_PERMISSION_STATE.UNKNOWN
                        ? START_GATE_PERMISSION_STATE.DENIED
                        : latestState.microphone
                );
                if (latestState.camera !== START_GATE_PERMISSION_STATE.UNKNOWN) {
                    setStartGateCameraPermission(latestState.camera);
                }
            }

            setStartGatePermissionMessage(resolvePermissionErrorMessage(error));
            return false;
        } finally {
            setIsStartGatePermissionChecking(false);
        }
    }, [
        isStartGatePermissionChecking,
        queryStartGatePermissionState,
        resolvePermissionErrorMessage,
        startGateCameraPermission,
        startGateMicPermission,
    ]);

    const requestStartGatePermissions = useCallback(async () => {
        if (isStartGatePermissionChecking) {
            return false;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setStartGateCameraPermission(START_GATE_PERMISSION_STATE.UNSUPPORTED);
            setStartGateMicPermission(START_GATE_PERMISSION_STATE.UNSUPPORTED);
            setStartGatePermissionMessage(COPY.startGateDeviceUnsupported);
            return false;
        }

        setIsStartGatePermissionChecking(true);
        setStartGatePermissionMessage('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            stream.getTracks().forEach((track) => track.stop());

            setStartGateCameraPermission(START_GATE_PERMISSION_STATE.GRANTED);
            setStartGateMicPermission(START_GATE_PERMISSION_STATE.GRANTED);
            setStartGatePermissionMessage(COPY.startGatePermissionGranted);
            return true;
        } catch (error) {
            const latestState = await queryStartGatePermissionState();
            setStartGateCameraPermission(
                latestState.camera === START_GATE_PERMISSION_STATE.UNKNOWN
                    ? START_GATE_PERMISSION_STATE.DENIED
                    : latestState.camera
            );
            setStartGateMicPermission(
                latestState.microphone === START_GATE_PERMISSION_STATE.UNKNOWN
                    ? START_GATE_PERMISSION_STATE.DENIED
                    : latestState.microphone
            );
            setStartGatePermissionMessage(resolvePermissionErrorMessage(error));
            return false;
        } finally {
            setIsStartGatePermissionChecking(false);
        }
    }, [isStartGatePermissionChecking, queryStartGatePermissionState, resolvePermissionErrorMessage]);

    const handleStartGatePermissionToggle = useCallback(async (target, checked) => {
        if (!checked) {
            setStartGatePermissionMessage(COPY.startGatePermissionDisableHint);
            return;
        }
        await requestSingleStartGatePermission(target);
    }, [requestSingleStartGatePermission]);

    const handleStartGateOpenAutoFocus = useCallback((event) => {
        event.preventDefault();
        const target = document.getElementById('start-gate-permission-check-button');
        if (target && target instanceof HTMLElement) {
            target.focus();
        }
    }, []);

    const handleQuestionTtsError = useCallback((error) => {
        toast.error(error?.message || COPY.questionTtsFailed);
    }, []);

    const {
        isLoading: isQuestionTtsLoading,
        isPlaying: isQuestionPlaying,
        playText: playQuestionTtsText,
        toggle: toggleQuestionTtsPlayback,
        stop: stopQuestionTtsPlayback,
    } = useQuestionTtsPlayer({
        sessionId: realSessionId,
        userId: realUserId,
        questionText: currentQuestion,
        finishedQuestionText: COPY.interviewFinishedQuestion,
        autoPlayEnabled: isInterviewStarted && isSessionReady && !isInterviewFinished,
        noSessionErrorMessage: COPY.sessionNotFound,
        onError: handleQuestionTtsError,
    });

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

    const stopRecordingStream = useCallback(() => {
        if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
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
        const currentRecordingStream = recordingStreamRef.current;
        if (currentRecordingStream && currentRecordingStream.getAudioTracks().length > 0) {
            return currentRecordingStream;
        }

        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });

            recordingStreamRef.current = audioStream;
            setPermissionHint('');
            return audioStream;
        } catch (error) {
            if (error?.name === 'NotAllowedError') {
                setPermissionHint(COPY.micPermissionRequired);
            } else {
                setPermissionHint(COPY.micConnectionFailed);
            }
            return null;
        }
    }, []);

    const runPostRecordingPipeline = useCallback(async (audioChunks, mimeType = '') => {
        if (!Array.isArray(audioChunks) || audioChunks.length === 0) {
            setTranscriptDraft('');
            setIsReviewPanelOpen(true);
            setPhase(PHASE.REVIEW);
            toast.error(COPY.micConnectionFailed);
            return;
        }
        if (!realSessionId) {
            setTranscriptDraft('');
            setIsReviewPanelOpen(true);
            setPhase(PHASE.REVIEW);
            toast.error(COPY.sessionNotFound);
            return;
        }

        let resolvedMimeType = typeof mimeType === 'string' && mimeType ? mimeType : 'audio/webm';
        if (!resolvedMimeType || resolvedMimeType === 'application/octet-stream') {
            const firstChunkType = toTrimmedString(audioChunks[0]?.type);
            if (firstChunkType) {
                resolvedMimeType = firstChunkType;
            }
        }

        const audioBlob = new Blob(audioChunks, { type: resolvedMimeType });

        if (!audioBlob.size) {
            setTranscriptDraft('');
            setIsReviewPanelOpen(true);
            setPhase(PHASE.REVIEW);
            toast.error(COPY.micConnectionFailed);
            return;
        }

        try {
            setPhase(PHASE.UPLOADING);
            const uploadResult = await uploadAudioBlob({
                audioBlob,
                mode: 'REAL',
            });

            setPhase(PHASE.STT);
            const sttResult = await transcribeAudioUrl({
                userId: realUserId,
                sessionId: realSessionId,
                audioUrl: uploadResult.audioUrl,
            });
            const sttText = toTrimmedString(sttResult?.text);

            setTranscriptDraft(sttText);
            setBadCaseNotice('');
        } catch (error) {
            setTranscriptDraft('');
            toast.error(error?.message || COPY.micConnectionFailed);
        } finally {
            setSeconds(0);
            setIsReviewPanelOpen(true);
            setPhase(PHASE.REVIEW);
        }
    }, [realSessionId, realUserId, transcribeAudioUrl, uploadAudioBlob]);

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
            recordedChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const chunks = recordedChunksRef.current;
                recordedChunksRef.current = [];
                runPostRecordingPipeline(chunks, recorder.mimeType);
            };

            setSeconds(0);
            setAutoStopNotice('');
            setBadCaseNotice('');
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
        setBadCaseNotice('');
        setIsReviewPanelOpen(true);
        setPhase(PHASE.READY);
    }, []);

    const submitTranscript = useCallback(async () => {
        const answerText = transcriptDraft.trim();
        if (!answerText) return;
        if (!realSessionId) {
            toast.error(COPY.sessionNotFound);
            return;
        }

        const activeSession = storedSessionRef.current;
        if (!activeSession) {
            toast.error(COPY.sessionNotFound);
            return;
        }

        const normalizedCurrentQuestion = toTrimmedString(currentQuestion);
        const historyTurnOrder = (activeSession.interview_history || []).length;
        const historyEntry = {
            question: normalizedCurrentQuestion,
            answer_text: answerText,
            turn_type: normalizeTurnType(currentTurnType, 'main'),
            turn_order: historyTurnOrder,
            topic_id: currentTopicId,
            category: currentCategory,
        };

        const nextInterviewHistory = [...(activeSession.interview_history || []), historyEntry];
        const requestPayload = {
            session_id: activeSession.session_id ?? realSessionId,
            question_type: activeSession.question_type || realQuestionType,
            question: normalizedCurrentQuestion,
            answer_text: answerText,
        };

        const submittedAt = new Date().toISOString();
        const currentEntry = {
            round: interviewRound,
            questionType: interviewRound === 1 ? 'MAIN_QUESTION' : 'FOLLOW_UP',
            question: currentQuestion,
            answer: answerText,
            durationSeconds: seconds,
            submittedAt,
        };

        setPhase(PHASE.FOLLOW_UP);

        try {
            const submitResponse = await submitRealInterviewAnswer({
                payload: requestPayload,
            });

            const payload = submitResponse?.data ?? submitResponse ?? {};
            const submissionStatus = toTrimmedString(payload?.status) || activeSession.status || 'IN_PROGRESS';
            const badCaseFeedback = extractBadCaseFeedback(submitResponse, payload);

            if (badCaseFeedback) {
                const feedbackMessage = toTrimmedString(badCaseFeedback.message) || COPY.badCaseFeedbackFallback;
                const noticeMessage = `${feedbackMessage} ${COPY.badCaseRetryPrompt}`;
                const nextRetryTurnOrder = historyTurnOrder + 1;
                const updatedSession = {
                    ...activeSession,
                    current_question: {
                        ...(activeSession.current_question || {
                            question: normalizedCurrentQuestion,
                            turn_type: currentTurnType,
                            topic_id: currentTopicId,
                            category: currentCategory,
                        }),
                        turn_order: nextRetryTurnOrder,
                    },
                    status: submissionStatus,
                    updated_at: new Date().toISOString(),
                };
                storedSessionRef.current = updatedSession;
                persistRealSession(updatedSession);

                setPhase(PHASE.READY);
                setTranscriptDraft('');
                setSeconds(0);
                setAutoStopNotice('');
                setBadCaseNotice(noticeMessage);
                setIsReviewPanelOpen(true);
                setCurrentTurnOrder(nextRetryTurnOrder);
                toast.warning(COPY.badCaseDetected);
                stopQuestionTtsPlayback();
                await playQuestionTtsText(feedbackMessage, { allowFinishedText: true });
                return;
            }

            setInterviewEntries((prev) => [...prev, currentEntry]);

            const isFinished = resolveInterviewFinished(payload);
            const nextQuestion = extractQuestionFromPayload(payload);

            if (isFinished) {
                const finishedMessage = nextQuestion?.text || COPY.interviewFinishedQuestion;
                const hasFinishedTtsTarget = Boolean(nextQuestion?.text);
                const finishedSession = {
                    ...activeSession,
                    interview_history: nextInterviewHistory,
                    current_question: null,
                    status: submissionStatus,
                    updated_at: new Date().toISOString(),
                };
                storedSessionRef.current = finishedSession;
                persistRealSession(finishedSession);

                setIsInterviewFinished(true);
                setCurrentQuestion(finishedMessage);
                setCurrentTurnType('session_end');
                setCurrentTurnOrder(nextInterviewHistory.length);
                setCurrentTopicId(null);
                setCurrentCategory('');
                setTranscriptDraft('');
                setPhase(PHASE.READY);
                if (hasFinishedTtsTarget) {
                    stopQuestionTtsPlayback();
                    await playQuestionTtsText(finishedMessage, { allowFinishedText: true });
                }
                return;
            }

            const nextQuestionText = nextQuestion?.text;

            if (!nextQuestionText) {
                const finishedSession = {
                    ...activeSession,
                    interview_history: nextInterviewHistory,
                    current_question: null,
                    status: submissionStatus,
                    updated_at: new Date().toISOString(),
                };
                storedSessionRef.current = finishedSession;
                persistRealSession(finishedSession);

                setIsInterviewFinished(true);
                setCurrentQuestion(COPY.interviewFinishedQuestion);
                setCurrentTurnType('follow_up');
                setCurrentTurnOrder(nextInterviewHistory.length);
                setCurrentTopicId(null);
                setCurrentCategory('');
                setTranscriptDraft('');
                setPhase(PHASE.READY);
                toast.error(COPY.nextQuestionMissing);
                return;
            }

            const nextTurnType = normalizeTurnType(nextQuestion?.turnType, 'follow_up');
            const nextTurnOrder = normalizeTurnOrder(nextQuestion?.turnOrder, nextInterviewHistory.length);
            const nextTopicId = nextQuestion?.topicId ?? null;
            const nextCategory = nextQuestion?.category ?? '';

            const updatedSession = {
                ...activeSession,
                interview_history: nextInterviewHistory,
                current_question: {
                    question: nextQuestionText,
                    turn_type: nextTurnType,
                    turn_order: nextTurnOrder,
                    topic_id: nextTopicId,
                    category: nextCategory,
                },
                status: submissionStatus,
                updated_at: new Date().toISOString(),
            };
            storedSessionRef.current = updatedSession;
            persistRealSession(updatedSession);

            const nextRound = interviewRound + 1;
            setFollowUpCursor((prev) => prev + 1);
            setInterviewRound(nextRound);
            setCurrentQuestion(nextQuestionText);
            setCurrentTurnType(nextTurnType);
            setCurrentTurnOrder(nextTurnOrder);
            setCurrentTopicId(nextTopicId);
            setCurrentCategory(nextCategory);
            setQuestionTrail((prev) => [
                ...prev,
                {
                    id: `follow-up-${nextRound}`,
                    type: `${COPY.followUpQuestionPrefix} ${nextRound - 1}`,
                    text: nextQuestionText,
                },
            ]);
            setTranscriptDraft('');
            setSeconds(0);
            setAutoStopNotice('');
            setPhase(PHASE.READY);
        } catch (error) {
            setPhase(PHASE.REVIEW);
            toast.error(error?.message || COPY.answerSubmitFailed);
        }
    }, [
        currentCategory,
        currentQuestion,
        currentTopicId,
        currentTurnType,
        interviewRound,
        playQuestionTtsText,
        realQuestionType,
        realSessionId,
        seconds,
        stopQuestionTtsPlayback,
        transcriptDraft,
    ]);

    const requestAiAnalysis = useCallback(async () => {
        if (analysisState === 'submitting' || interviewEntries.length === 0) return;
        if (!realSessionId) {
            setAnalysisState('error');
            setAnalysisNotice(COPY.sessionNotFound);
            return;
        }

        setAnalysisState('submitting');
        setAnalysisNotice('');

        try {
            const feedbackResponse = await requestInterviewSessionFeedback({ sessionId: realSessionId });
            setAnalysisState('success');
            setAnalysisNotice(COPY.analysisRequestAccepted);
            navigate('/real-interview/result-ai', {
                state: {
                    feedbackResponse,
                    interviewEntries,
                },
            });
        } catch (error) {
            setAnalysisState('error');
            setAnalysisNotice(error?.message || COPY.analysisRequestRetry);
        }
    }, [analysisState, interviewEntries, navigate, realSessionId]);

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

    const handleStartInterview = useCallback(async () => {
        if (!isSessionReady) return;
        if (!isStartGatePermissionReady) {
            const granted = await requestStartGatePermissions();
            if (!granted) {
                if (!startGatePermissionMessage) {
                    setStartGatePermissionMessage(COPY.startGatePermissionRequired);
                }
                return;
            }
        }
        setIsInterviewStarted(true);
        setIsStartGateOpen(false);
    }, [
        isSessionReady,
        isStartGatePermissionReady,
        requestStartGatePermissions,
        startGatePermissionMessage,
    ]);

    const handleStartGateCancel = useCallback(() => {
        safeRemoveSessionItem(REAL_SESSION_STORAGE_KEY);
        navigate(-1);
    }, [navigate]);

    const handleExitConfirm = useCallback(() => {
        setIsExitDialogOpen(false);
        stopTimer();
        stopQuestionTtsPlayback();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        stopRecordingStream();
        stopStream();
        safeRemoveSessionItem(REAL_SESSION_STORAGE_KEY);
        navigate(-1);
    }, [navigate, stopQuestionTtsPlayback, stopRecordingStream, stopStream, stopTimer]);

    const handleExitCancel = useCallback(() => {
        setIsExitDialogOpen(false);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const initializeSession = async () => {
            const rawSession = safeGetSessionItem(REAL_SESSION_STORAGE_KEY);
            const parsedSession = safeParseJson(rawSession);
            const fallbackUserId = resolveUserIdFromAccessToken(accessToken);
            const normalizedSession = normalizeStoredRealSession(parsedSession, fallbackUserId);

            if (!normalizedSession?.session_id) {
                toast.error(COPY.sessionNotFound);
                navigate('/real-interview', { replace: true });
                return;
            }

            storedSessionRef.current = normalizedSession;

            setRealUserId(normalizedSession.user_id ?? fallbackUserId);
            setRealSessionId(normalizedSession.session_id);
            setRealQuestionType(normalizedSession.question_type || '');
            setInterviewEntries(
                normalizedSession.interview_history.map((entry) => ({
                    round: normalizeTurnOrder(entry.turn_order, 0) + 1,
                    questionType: isTopicTurnType(entry.turn_type) ? 'MAIN_QUESTION' : 'FOLLOW_UP',
                    question: entry.question,
                    answer: entry.answer_text,
                    durationSeconds: 0,
                    submittedAt: new Date().toISOString(),
                }))
            );

            const initialRound = Math.max(1, normalizedSession.interview_history.length + 1);
            setInterviewRound(initialRound);
            setFollowUpCursor(Math.max(0, initialRound - 1));
            const currentTurnOrderFallback = Math.max(0, normalizedSession.interview_history.length);

            const currentQuestionFromStorage = normalizedSession.current_question;
            if (currentQuestionFromStorage?.question) {
                const turnTypeFromStorage = normalizeTurnType(currentQuestionFromStorage.turn_type, 'main');
                const isSessionEndedFromStorage = isSessionEndTurnType(turnTypeFromStorage);

                setCurrentQuestion(currentQuestionFromStorage.question);
                setCurrentTurnType(turnTypeFromStorage);
                setCurrentTurnOrder(normalizeTurnOrder(currentQuestionFromStorage.turn_order, currentTurnOrderFallback));
                setCurrentTopicId(currentQuestionFromStorage.topic_id ?? null);
                setCurrentCategory(currentQuestionFromStorage.category ?? '');
                setQuestionTrail([
                    {
                        id: `turn-${normalizeTurnOrder(currentQuestionFromStorage.turn_order, currentTurnOrderFallback)}`,
                        type: isTopicTurnType(currentQuestionFromStorage.turn_type)
                            ? ORIGIN_QUESTION_TYPE
                            : `${COPY.followUpQuestionPrefix} ${Math.max(initialRound - 1, 1)}`,
                        text: currentQuestionFromStorage.question,
                    },
                ]);
                setIsInterviewFinished(isSessionEndedFromStorage);
                if (isSessionEndedFromStorage) {
                    setIsInterviewStarted(true);
                    setIsStartGateOpen(false);
                }
                setIsSessionReady(true);
                return;
            }

            try {
                const sessionResponse = await fetchInterviewSession(normalizedSession.session_id);
                if (cancelled) return;

                const payload = sessionResponse?.data ?? sessionResponse ?? {};
                const resolvedQuestion = extractQuestionFromPayload(payload);
                const isFinished = resolveInterviewFinished(payload);
                const sessionStatus = toTrimmedString(payload?.status) || normalizedSession.status || 'IN_PROGRESS';

                if (resolvedQuestion?.text) {
                    const turnType = normalizeTurnType(resolvedQuestion.turnType, 'main');
                    const turnOrder = normalizeTurnOrder(resolvedQuestion.turnOrder, currentTurnOrderFallback);
                    const topicId = resolvedQuestion.topicId ?? null;
                    const category = resolvedQuestion.category ?? '';

                    const updatedSession = {
                        ...normalizedSession,
                        current_question: {
                            question: resolvedQuestion.text,
                            turn_type: turnType,
                            turn_order: turnOrder,
                            topic_id: topicId,
                            category,
                        },
                        status: sessionStatus,
                    };
                    storedSessionRef.current = updatedSession;
                    persistRealSession(updatedSession);

                    setCurrentQuestion(resolvedQuestion.text);
                    setCurrentTurnType(turnType);
                    setCurrentTurnOrder(turnOrder);
                    setCurrentTopicId(topicId);
                    setCurrentCategory(category);
                    setQuestionTrail([
                        {
                            id: `turn-${turnOrder}`,
                            type: turnType === 'main'
                                ? ORIGIN_QUESTION_TYPE
                                : `${COPY.followUpQuestionPrefix} ${Math.max(turnOrder - 1, 1)}`,
                            text: resolvedQuestion.text,
                        },
                    ]);
                }

                if (isFinished) {
                    const finishedSession = {
                        ...normalizedSession,
                        current_question: null,
                        status: sessionStatus,
                    };
                    storedSessionRef.current = finishedSession;
                    persistRealSession(finishedSession);

                    setIsInterviewFinished(true);
                    setCurrentQuestion(COPY.interviewFinishedQuestion);
                    setCurrentTurnType('follow_up');
                    setCurrentTurnOrder(initialRound);
                    setCurrentTopicId(null);
                    setCurrentCategory('');
                    setIsInterviewStarted(true);
                    setIsStartGateOpen(false);
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(error?.message || COPY.sessionLoadFailed);
                }
            } finally {
                if (!cancelled) {
                    setIsSessionReady(true);
                }
            }
        };

        initializeSession();

        return () => {
            cancelled = true;
        };
    }, [accessToken, navigate]);

    useEffect(() => {
        if (!isInterviewStarted) {
            return undefined;
        }

        initializeCamera();
        return () => {
            stopQuestionTtsPlayback();
            stopTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.onstop = null;
                mediaRecorderRef.current.stop();
            }
            stopRecordingStream();
            stopStream();
        };
    }, [initializeCamera, isInterviewStarted, stopQuestionTtsPlayback, stopRecordingStream, stopStream, stopTimer]);

    useEffect(() => {
        if (!isStartGateOpen || isInterviewStarted || isInterviewFinished) {
            return;
        }

        syncStartGatePermissionState();
    }, [isInterviewFinished, isInterviewStarted, isStartGateOpen, syncStartGatePermissionState]);

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

    const handleQuestionTts = useCallback(async () => {
        if (!isInterviewStarted) {
            return;
        }
        if (!realSessionId) {
            toast.error(COPY.sessionNotFound);
            return;
        }
        await toggleQuestionTtsPlayback();
    }, [isInterviewStarted, realSessionId, toggleQuestionTtsPlayback]);

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

                    <div className="absolute left-3.5 right-3.5 top-[70px] z-[3] isolate flex items-start justify-between gap-2">
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
                        <div className="relative z-[1] flex flex-col items-end gap-2">
                            <span className={`${BUBBLE_BASE} ${HUD_TEXT_SHADOW} inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-xs font-medium text-white/95`}>
                                {COPY.roundPrefix} {interviewRound}
                            </span>
                            <button
                                type="button"
                                className={`${BUBBLE_BASE} ${HUD_TEXT_SHADOW} inline-flex items-center gap-1 rounded-full px-3 py-[7px] text-xs font-medium text-white ${isTrailOpen ? 'border-[#ff8fa3]/90 text-[#ffe9ef]' : ''}`}
                                onClick={() => setIsTrailOpen((prev) => !prev)}
                            >
                                {isTrailOpen ? COPY.trailClose : COPY.trailButtonLabel}
                            </button>

                            {isTrailOpen && (
                                <section className="absolute right-0 top-[calc(100%+6px)] z-[9] w-[min(66vw,250px)] max-h-[230px] overflow-hidden rounded-xl border border-white/25 bg-[rgba(12,8,12,0.46)] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.32)] backdrop-blur-[10px]">
                                    <h3 className="m-0 text-xs font-semibold text-white/95">{COPY.trailTitle}</h3>

                                    {questionTrail.length > 0 ? (
                                        <ul className="mt-2 m-0 flex max-h-[178px] list-none flex-col gap-1.5 overflow-y-auto p-0 pr-1">
                                            {questionTrail.map((item) => (
                                                <li
                                                    key={item.id}
                                                    className="rounded-[9px] border border-white/25 bg-white/[0.08] p-[7px_8px]"
                                                >
                                                    <span className="text-[10px] font-semibold text-[#ffe5ec]">
                                                        {toRenderableText(item.type, COPY.trailItemFallback)}
                                                    </span>
                                                    <p className="m-[4px_0_0] text-[11px] leading-[1.35] text-white/92">
                                                        {toRenderableText(item.text)}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="m-[8px_0_0] text-[11px] text-white/90">{COPY.trailEmpty}</p>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>

                    <article className={`${BUBBLE_BASE} absolute left-3.5 right-3.5 top-[128px] z-[3] rounded-2xl p-3.5 relative`}>
                        <button
                            type="button"
                            onClick={handleQuestionTts}
                            disabled={
                                isQuestionTtsLoading ||
                                !isInterviewStarted ||
                                !isSessionReady ||
                                isInterviewFinished
                            }
                            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[11px] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Volume2 size={13} className={isQuestionPlaying ? 'animate-pulse' : ''} />
                            {isQuestionTtsLoading
                                ? COPY.questionTtsLoading
                                : isQuestionPlaying
                                    ? COPY.questionTtsStop
                                    : COPY.questionTtsPlay}
                        </button>
                        <p className={`${HUD_TEXT_SHADOW} m-0 text-[11px] font-semibold text-[#ffe8ef]`}>
                            {interviewRound === 1
                                ? ORIGIN_QUESTION_TYPE
                                : `${COPY.followUpQuestionPrefix} ${interviewRound - 1}`}
                        </p>
                        <h2 className="m-[7px_0_0] pr-[90px] text-[15px] leading-[1.45] font-medium text-[#f9fafb] drop-shadow-[0_1px_10px_rgba(0,0,0,0.82)]">
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

                    {(isProcessing || permissionHint || autoStopNotice || badCaseNotice || analysisNotice || isTimeWarning) && (
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
                            {badCaseNotice && (
                                <div className={`${BUBBLE_BASE} border-[#ff6b8a]/90 flex items-center gap-2.5 rounded-xl px-3 py-2.5`}>
                                    <p className="m-0 text-xs font-medium text-white/95">{toRenderableText(badCaseNotice)}</p>
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
                                    {analysisState === 'submitting' ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            {COPY.analysisSubmitting}
                                        </span>
                                    ) : analysisState === 'success'
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

            <AlertDialog open={isStartGateOpen} onOpenChange={setIsStartGateOpen}>
                <AlertDialogContent onOpenAutoFocus={handleStartGateOpenAutoFocus}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{COPY.startGateTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {COPY.startGateDescription}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="mt-1 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                        <p className="m-0 text-xs text-zinc-600">{COPY.startGatePermissionGuide}</p>
                        <div className="flex items-center justify-between rounded-md bg-white px-2 py-1.5">
                            <div className="flex flex-col gap-0.5">
                                <span>{COPY.startGateCameraLabel}</span>
                                <span className={`text-[11px] font-medium ${getPermissionStatusTone(startGateCameraPermission)}`}>
                                    {getPermissionStatusLabel(startGateCameraPermission)}
                                </span>
                            </div>
                            <Switch
                                checked={startGateCameraPermission === START_GATE_PERMISSION_STATE.GRANTED}
                                onCheckedChange={(checked) => handleStartGatePermissionToggle(
                                    START_GATE_PERMISSION_TARGET.CAMERA,
                                    checked
                                )}
                                disabled={
                                    isStartGatePermissionChecking ||
                                    startGateCameraPermission === START_GATE_PERMISSION_STATE.UNSUPPORTED
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-white px-2 py-1.5">
                            <div className="flex flex-col gap-0.5">
                                <span>{COPY.startGateMicLabel}</span>
                                <span className={`text-[11px] font-medium ${getPermissionStatusTone(startGateMicPermission)}`}>
                                    {getPermissionStatusLabel(startGateMicPermission)}
                                </span>
                            </div>
                            <Switch
                                checked={startGateMicPermission === START_GATE_PERMISSION_STATE.GRANTED}
                                onCheckedChange={(checked) => handleStartGatePermissionToggle(
                                    START_GATE_PERMISSION_TARGET.MIC,
                                    checked
                                )}
                                disabled={
                                    isStartGatePermissionChecking ||
                                    startGateMicPermission === START_GATE_PERMISSION_STATE.UNSUPPORTED
                                }
                            />
                        </div>
                        {startGatePermissionMessage && (
                            <p className="m-0 text-xs text-zinc-600">{startGatePermissionMessage}</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleStartGateCancel}>
                            {COPY.startGateCancel}
                        </AlertDialogCancel>
                        <Button
                            id="start-gate-permission-check-button"
                            type="button"
                            variant="outline"
                            onClick={requestStartGatePermissions}
                            disabled={isStartGatePermissionChecking}
                        >
                            {isStartGatePermissionChecking
                                ? COPY.startGateCheckingPermissions
                                : COPY.startGateCheckPermissions}
                        </Button>
                        <AlertDialogAction
                            onClick={handleStartInterview}
                            disabled={
                                !isSessionReady ||
                                isStartGatePermissionChecking ||
                                !isStartGatePermissionReady
                            }
                        >
                            {isSessionReady
                                ? COPY.startGateStart
                                : COPY.startGatePreparing}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RealInterviewSession;
