import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '@/app/components/AppHeader';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  ListChecks,
  Loader2,
  CircleHelp,
  CircleQuestionMark,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { useAnswerDetail } from '@/app/hooks/useAnswerDetail';
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories';
import { getQuestionCategoryLabel } from '@/app/constants/questionCategoryMeta';
import { useTurnVideoSource } from '@/app/hooks/useTurnVideoSource';
import TopicTurnVideoCard from '@/app/components/TopicTurnVideoCard';

const TEXT_PAGE_TITLE = '실전 학습 기록 상세';
const TEXT_HEADER_DESC = '실전 면접 결과와 AI 피드백을 확인해보세요';
const TEXT_LOADING = '실전 학습 기록을 불러오는 중...';
const TEXT_NOT_FOUND = '실전 학습 기록을 찾을 수 없습니다';
const TEXT_GO_PROFILE = '학습 기록으로 돌아가기';
const TEXT_RETRY_HELP = '잠시 후 다시 시도해 주세요.';
const TEXT_QUESTION_LABEL = '질문';
const TEXT_FOLLOW_UP_QUESTION_LABEL = '꼬리질문';
const TEXT_METRICS_TITLE = '종합 역량 점수';
const TEXT_OVERALL_FEEDBACK_SECTION_TITLE = '전체 피드백';
const TEXT_STRENGTHS_TITLE = '전체 강점';
const TEXT_IMPROVEMENTS_TITLE = '전체 개선점';
const TEXT_TOPIC_FEEDBACK_TITLE = '주제별 피드백';
const TEXT_TOPIC_LABEL = '주제';
const TEXT_MAIN_QUESTION = '메인 질문';
const TEXT_TOPIC_STRENGTHS = '좋았던 점';
const TEXT_TOPIC_IMPROVEMENTS = '개선 포인트';
const TEXT_COVERAGE = '키워드 커버리지';
const TEXT_COVERED = '반영된 키워드';
const TEXT_MISSING = '누락 키워드';
const TEXT_NONE = '없음';
const TEXT_FEEDBACK_EMPTY = '피드백 정보가 없습니다.';
const TEXT_RADAR_LABEL = '평가';
const TEXT_INTERVIEW_VIDEO_EMPTY = '표시할 답변 영상이 없습니다.';
const TEXT_PREV_TOPIC = '이전 질문';
const TEXT_NEXT_TOPIC = '다음 질문';

const FEEDBACK_SPLIT_DELIMITER = '●';
const FEEDBACK_BULLET = '•';
const FEEDBACK_DASH = '-';
const METRIC_SCORE_MAX = 5;
const RADAR_DOMAIN_MAX = 100;
const SWIPE_THRESHOLD_PX = 48;
const TOPIC_TURN_SWIPE_DURATION_MS = 300;

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed || '';
};

const normalizeScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  const clamped = Math.max(0, Math.min(METRIC_SCORE_MAX, score));
  return Math.round((clamped / METRIC_SCORE_MAX) * RADAR_DOMAIN_MAX);
};

const splitFeedbackText = (text) => {
  if (typeof text !== 'string') return [];
  const normalized = text.replace(/\n+/g, '\n').trim();
  if (!normalized) return [];
  return normalized
    .split(FEEDBACK_SPLIT_DELIMITER)
    .map((line) => line.trim())
    .filter(Boolean);
};

const renderFeedbackText = (text, className) => {
  const lines = splitFeedbackText(text);

  if (lines.length === 0) {
    return <p className={className}>{TEXT_FEEDBACK_EMPTY}</p>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, idx) => {
        const content = line.startsWith(FEEDBACK_DASH)
          ? line.slice(1).trim()
          : line;

        return (
          <p key={idx} className="leading-relaxed pl-5 relative">
            <span className="absolute left-0">{FEEDBACK_BULLET}</span>
            {content}
          </p>
        );
      })}
    </div>
  );
};

const normalizeKeywordItems = (value) => {
  return Array.isArray(value)
    ? value.map((item) => toTrimmedString(item)).filter(Boolean)
    : [];
};

const toCoveragePercent = (coverageRatio) => {
  if (typeof coverageRatio !== 'number' || Number.isNaN(coverageRatio)) return null;
  const normalized = Math.max(0, Math.min(1, coverageRatio));
  return Math.round(normalized * 100);
};

const toTurnOrder = (value, fallbackOrder) => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return fallbackOrder;
};

const toFileId = (value) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
};

const toTopicId = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
};

const buildTurnVideoKey = (turnOrder, index) => `${turnOrder}-${index}`;

const hasRealFeedbackShape = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return false;
  return Boolean(
    Array.isArray(candidate.metrics) ||
      Array.isArray(candidate.topics_feedback) ||
      candidate.overall_feedback ||
      candidate.keyword_result ||
      candidate.bad_case_feedback
  );
};

const resolveRealFeedback = (detail) => {
  const candidates = [
    detail?.sessionFinalFeedback,
    detail?.session_final_feedback,
    detail?.final_feedback,
    detail?.finalFeedback,
    detail?.aiFeedback,
    detail?.feedback,
    detail?.immediateFeedback,
    detail?.immediate_feedback,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (hasRealFeedbackShape(candidate)) return candidate;

    const nestedData = candidate?.data;
    if (hasRealFeedbackShape(nestedData)) return nestedData;

    const nestedResponse = candidate?.response?.data;
    if (hasRealFeedbackShape(nestedResponse)) return nestedResponse;
  }

  return null;
};

const RealLearningRecordDetail = () => {
  const navigate = useNavigate();
  const { answerId } = useParams();
  const { data, isLoading, error } = useAnswerDetail(answerId);
  const { data: categoryData } = useQuestionCategories();
  const CATEGORY_LABELS = useMemo(() => categoryData?.flat ?? {}, [categoryData]);
  const [activeTurnIndexByTopic, setActiveTurnIndexByTopic] = useState({});
  const [topicTurnMotionMap, setTopicTurnMotionMap] = useState({});
  const swipeStartXRef = useRef({});
  const topicTurnMotionTimeoutRef = useRef(new Map());

  const answerDetail = useMemo(() => {
    const resolved = data?.data ?? data;
    if (resolved && typeof resolved === 'object') {
      return resolved;
    }
    return null;
  }, [data]);
  const hasAnswerDetail = Boolean(answerDetail?.answerId);
  const feedbackData = useMemo(() => resolveRealFeedback(answerDetail), [answerDetail]);

  const metrics = useMemo(() => {
    return Array.isArray(feedbackData?.metrics)
      ? feedbackData.metrics.filter((metric) => metric && typeof metric === 'object')
      : [];
  }, [feedbackData]);

  const radarData = useMemo(() => {
    return metrics.map((metric, idx) => ({
      subject: metric?.name || `${TEXT_METRICS_TITLE} ${idx + 1}`,
      value: normalizeScore(metric?.score),
    }));
  }, [metrics]);

  const topicsFeedback = useMemo(() => {
    return Array.isArray(feedbackData?.topics_feedback)
      ? feedbackData.topics_feedback.filter((item) => item && typeof item === 'object')
      : [];
  }, [feedbackData]);

  const overallFeedback = feedbackData?.overall_feedback ?? {};
  const keywordResult = useMemo(() => {
    const rawKeywordResult = feedbackData?.keyword_result;
    if (rawKeywordResult && typeof rawKeywordResult === 'object') return rawKeywordResult;
    return null;
  }, [feedbackData]);

  const coveredKeywords = useMemo(
    () => normalizeKeywordItems(keywordResult?.covered_keywords),
    [keywordResult]
  );
  const missingKeywords = useMemo(
    () => normalizeKeywordItems(keywordResult?.missing_keywords),
    [keywordResult]
  );
  const coveragePercent = useMemo(
    () => toCoveragePercent(keywordResult?.coverage_ratio),
    [keywordResult]
  );
  const hasKeywordSummary = coveredKeywords.length > 0 || missingKeywords.length > 0;
  const hasRadarData = radarData.length > 0;
  const interviewHistory = useMemo(() => {
    const rows = Array.isArray(feedbackData?.interview_history)
      ? feedbackData.interview_history
      : [];

    const normalizedTurns = rows
      .map((item, idx) => {
        const categoryKey = toTrimmedString(item?.category);
        const videoPlayUrl = toTrimmedString(
          item?.video_play_url ??
            item?.videoPlayUrl ??
            item?.video_url ??
            item?.videoUrl ??
            item?.play_url ??
            item?.playUrl
        );

        return {
          turnOrder: toTurnOrder(item?.turn_order ?? item?.turnOrder, idx),
          turnType: toTrimmedString(item?.turn_type ?? item?.turnType),
          question: toTrimmedString(item?.question),
          answerText: toTrimmedString(item?.answer_text ?? item?.answerText),
          category: categoryKey,
          categoryLabel: getQuestionCategoryLabel(categoryKey, CATEGORY_LABELS),
          topicId: toTopicId(item?.topic_id ?? item?.topicId),
          videoPlayUrl,
          videoExpiresAt: toTrimmedString(
            item?.video_url_expires_at ??
              item?.videoUrlExpiresAt ??
              item?.video_expires_at ??
              item?.videoExpiresAt
          ),
          videoFileId: toFileId(item?.video_file_id ?? item?.videoFileId),
        };
      })
      .sort((a, b) => a.turnOrder - b.turnOrder);

    return normalizedTurns.map((turn, idx) => ({
      ...turn,
      turnKey: buildTurnVideoKey(turn.turnOrder, idx),
    }));
  }, [feedbackData, CATEGORY_LABELS]);

  const interviewHistoryByTopic = useMemo(() => {
    return interviewHistory.reduce((acc, turn) => {
      const topicKey = turn.topicId === null ? 'unknown' : String(turn.topicId);
      if (!acc[topicKey]) {
        acc[topicKey] = [];
      }
      acc[topicKey].push(turn);
      return acc;
    }, {});
  }, [interviewHistory]);

  const {
    ensureTurnVideoUrl,
    refreshTurnVideoUrl,
    getTurnVideoUrl,
  } = useTurnVideoSource(interviewHistory);

  const clearTopicTurnMotionTimeout = useCallback((topicKey) => {
    const existingTimeoutId = topicTurnMotionTimeoutRef.current.get(topicKey);
    if (typeof existingTimeoutId === 'number') {
      window.clearTimeout(existingTimeoutId);
    }
    topicTurnMotionTimeoutRef.current.delete(topicKey);
  }, []);

  useEffect(() => {
    const timeoutMap = topicTurnMotionTimeoutRef.current;
    return () => {
      timeoutMap.forEach((timeoutId) => {
        if (typeof timeoutId === 'number') {
          window.clearTimeout(timeoutId);
        }
      });
      timeoutMap.clear();
    };
  }, []);

  const getTopicTurnIndex = useCallback((topicKey, totalCount) => {
    if (totalCount <= 0) return 0;

    const rawIndex = activeTurnIndexByTopic?.[topicKey];
    if (typeof rawIndex !== 'number' || !Number.isFinite(rawIndex)) return 0;
    return Math.max(0, Math.min(Math.trunc(rawIndex), totalCount - 1));
  }, [activeTurnIndexByTopic]);

  const shiftTopicTurnIndex = useCallback((topicKey, totalCount, step) => {
    if (!topicKey || totalCount <= 0) return;
    setActiveTurnIndexByTopic((prev) => {
      const current = typeof prev?.[topicKey] === 'number' ? prev[topicKey] : 0;
      const normalized = Math.max(0, Math.min(Math.trunc(current), totalCount - 1));
      const nextIndex = Math.max(0, Math.min(normalized + step, totalCount - 1));
      if (nextIndex === normalized) return prev;
      return {
        ...prev,
        [topicKey]: nextIndex,
      };
    });
  }, []);

  const triggerTopicTurnMotion = useCallback((topicKey, direction) => {
    if (!topicKey || !direction) return;
    setTopicTurnMotionMap((prev) => ({
      ...prev,
      [topicKey]: direction,
    }));
    clearTopicTurnMotionTimeout(topicKey);

    const timeoutId = window.setTimeout(() => {
      setTopicTurnMotionMap((prev) => {
        if (!prev[topicKey]) return prev;
        const next = { ...prev };
        delete next[topicKey];
        return next;
      });
      topicTurnMotionTimeoutRef.current.delete(topicKey);
    }, TOPIC_TURN_SWIPE_DURATION_MS);

    topicTurnMotionTimeoutRef.current.set(topicKey, timeoutId);
  }, [clearTopicTurnMotionTimeout]);

  const moveTopicTurnIndex = useCallback((topicKey, totalCount, step) => {
    if (!topicKey || totalCount <= 0) return;
    const currentIndex = getTopicTurnIndex(topicKey, totalCount);
    const nextIndex = Math.max(0, Math.min(currentIndex + step, totalCount - 1));
    if (nextIndex === currentIndex) return;

    shiftTopicTurnIndex(topicKey, totalCount, step);
    triggerTopicTurnMotion(topicKey, step > 0 ? 'next' : 'prev');
  }, [getTopicTurnIndex, shiftTopicTurnIndex, triggerTopicTurnMotion]);

  const handlePrevTurn = useCallback((topicKey, totalCount) => {
    moveTopicTurnIndex(topicKey, totalCount, -1);
  }, [moveTopicTurnIndex]);

  const handleNextTurn = useCallback((topicKey, totalCount) => {
    moveTopicTurnIndex(topicKey, totalCount, 1);
  }, [moveTopicTurnIndex]);

  const handleCarouselTouchStart = useCallback((topicKey, event) => {
    if (!topicKey) return;
    swipeStartXRef.current[topicKey] = event.changedTouches?.[0]?.clientX ?? null;
  }, []);

  const handleCarouselTouchEnd = useCallback((topicKey, totalCount, event) => {
    if (!topicKey || totalCount <= 0) return;
    const startX = swipeStartXRef.current[topicKey];
    const endX = event.changedTouches?.[0]?.clientX;
    swipeStartXRef.current[topicKey] = null;

    if (typeof startX !== 'number' || typeof endX !== 'number') return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    if (deltaX < 0) {
      handleNextTurn(topicKey, totalCount);
      return;
    }
    handlePrevTurn(topicKey, totalCount);
  }, [handleNextTurn, handlePrevTurn]);

  const questionText = toTrimmedString(
    answerDetail?.question?.content ?? answerDetail?.question?.title
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={TEXT_PAGE_TITLE} onBack={() => navigate('/profile')} showNotifications={false} />
        <div className="p-6 max-w-lg mx-auto">
          <Card className="p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">{TEXT_LOADING}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !hasAnswerDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary-50 via-white to-secondary-50">
        <div className="border-b border-primary-100/80 bg-gradient-to-r from-primary-50 via-white to-secondary-50 text-gray-900">
          <AppHeader
            title={TEXT_PAGE_TITLE}
            onBack={() => navigate('/profile')}
            showNotifications={false}
            tone="light"
            className="!static"
          />
          <div className="text-center pb-6 pt-1 px-6">
            <p className="text-gray-600 text-sm">{TEXT_HEADER_DESC}</p>
          </div>
        </div>

        <div className="p-6 max-w-lg mx-auto space-y-4 -mt-3">
          <Card className="p-5 rounded-2xl border border-amber-100 bg-amber-50/70 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-800">{error?.message || TEXT_NOT_FOUND}</p>
                <p className="text-xs text-amber-700 mt-1">{TEXT_RETRY_HELP}</p>
              </div>
            </div>
          </Card>

          <Button
            onClick={() => navigate('/profile')}
            className="w-full rounded-xl h-12 gap-2"
            variant="default"
          >
            <Home className="w-5 h-5" />
            {TEXT_GO_PROFILE}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 via-white to-secondary-50">
      <div className="border-b border-primary-100/80 bg-gradient-to-r from-primary-50 via-white to-secondary-50 text-gray-900">
        <AppHeader
          title={TEXT_PAGE_TITLE}
          onBack={() => navigate('/profile')}
          showNotifications={false}
          tone="light"
          className="!static"
        />

        <div className="text-center pb-6 pt-1 px-6">
          <p className="text-gray-600 text-sm">{TEXT_HEADER_DESC}</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-4 -mt-3">
        <Card className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm animate-feedback-reveal stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h3>{TEXT_METRICS_TITLE}</h3>
          </div>
          {hasRadarData ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, RADAR_DOMAIN_MAX]} tick={false} axisLine={false} />
                <Radar
                  name={TEXT_RADAR_LABEL}
                  dataKey="value"
                  stroke="#ff8fa3"
                  fill="#ffccd5"
                  fillOpacity={0.8}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">{TEXT_FEEDBACK_EMPTY}</p>
          )}
        </Card>

        {questionText && (
          <Card className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm animate-feedback-reveal stagger-2">
            <p className="text-sm text-muted-foreground mb-2">{TEXT_QUESTION_LABEL}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{questionText}</p>
          </Card>
        )}

        {hasKeywordSummary && (
          <Card className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 animate-feedback-reveal stagger-3">
            <h3>{TEXT_COVERAGE}</h3>
            <p className="text-sm text-gray-700">
              {coveragePercent === null ? TEXT_FEEDBACK_EMPTY : `${coveragePercent}%`}
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-emerald-700 mb-1">{TEXT_COVERED}</p>
                <p className="text-sm text-gray-700">
                  {coveredKeywords.length > 0 ? coveredKeywords.join(', ') : TEXT_NONE}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700 mb-1">{TEXT_MISSING}</p>
                <p className="text-sm text-gray-700">
                  {missingKeywords.length > 0 ? missingKeywords.join(', ') : TEXT_NONE}
                </p>
              </div>
            </div>
          </Card>
        )}

        {topicsFeedback.length > 0 && (
          <Card className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 animate-feedback-reveal stagger-4">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-500" />
              <h3>{TEXT_TOPIC_FEEDBACK_TITLE}</h3>
            </div>
            <div className="space-y-3">
              {topicsFeedback.map((topic, idx) => {
                const topicId = toTopicId(topic?.topic_id ?? topic?.topicId);
                const topicKey = topicId === null ? 'unknown' : String(topicId);
                const topicTurns = interviewHistoryByTopic[topicKey] ?? [];
                const activeTurnIndex = getTopicTurnIndex(topicKey, topicTurns.length);
                const activeTurn = topicTurns[activeTurnIndex] ?? null;
                const topicTurnMotionDirection = topicTurnMotionMap[topicKey] ?? '';
                const topicTurnMotionClass = topicTurnMotionDirection === 'next'
                  ? 'animate-topic-turn-swipe-next'
                  : topicTurnMotionDirection === 'prev'
                    ? 'animate-topic-turn-swipe-prev'
                    : '';
                const topicCategoryLabel = toTrimmedString(
                  activeTurn?.categoryLabel ?? topicTurns[0]?.categoryLabel
                );
                const topicTitle = `${TEXT_TOPIC_LABEL} ${topic?.topic_id ?? idx + 1}`;
                const topicTitleWithCategory = topicCategoryLabel
                  ? `${topicTitle} : ${topicCategoryLabel}`
                  : topicTitle;
                const activeQuestion = toTrimmedString(activeTurn?.question);
                const fallbackMainQuestion = toTrimmedString(topic?.main_question);
                const topicQuestionText = activeQuestion || fallbackMainQuestion || TEXT_FEEDBACK_EMPTY;
                const activeTurnType = toTrimmedString(activeTurn?.turnType).toLowerCase();
                const isFollowUpQuestion = activeTurnType === 'follow_up';
                const topicQuestionLabel = isFollowUpQuestion
                  ? TEXT_FOLLOW_UP_QUESTION_LABEL
                  : TEXT_QUESTION_LABEL;
                const TopicQuestionIcon = isFollowUpQuestion ? CircleQuestionMark : CircleHelp;
                const topicStaggerClass = `stagger-${(idx % 5) + 1}`;

                return (
                  <div
                    key={`${topic?.topic_id ?? 'topic'}-${idx}`}
                    className={`rounded-xl border border-primary-100 bg-primary-50/60 p-4 space-y-3 animate-feedback-reveal ${topicStaggerClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-primary-700 font-semibold">
                        {topicTitleWithCategory}
                      </p>
                      {topicTurns.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-muted-foreground">
                            {activeTurnIndex + 1} / {topicTurns.length}
                          </p>
                          {topicTurns.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePrevTurn(topicKey, topicTurns.length)}
                                disabled={activeTurnIndex === 0}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={TEXT_PREV_TOPIC}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNextTurn(topicKey, topicTurns.length)}
                                disabled={activeTurnIndex >= topicTurns.length - 1}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={TEXT_NEXT_TOPIC}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`space-y-3 ${topicTurnMotionClass}`}>
                      <p className="text-[15px] leading-relaxed text-gray-900">
                        <span
                          className="inline-flex align-middle mr-1.5 text-primary-700"
                          aria-label={topicQuestionLabel}
                          title={topicQuestionLabel}
                        >
                          <TopicQuestionIcon className="w-4 h-4" />
                        </span>
                        {topicQuestionText}
                      </p>
                      {topicTurns.length > 0 ? (
                        <div
                          className="overflow-hidden"
                          onTouchStart={(event) => handleCarouselTouchStart(topicKey, event)}
                          onTouchEnd={(event) => handleCarouselTouchEnd(topicKey, topicTurns.length, event)}
                        >
                          {activeTurn && (
                            <div key={activeTurn.turnKey} className="w-full px-px">
                              <TopicTurnVideoCard
                                turn={activeTurn}
                                videoUrl={getTurnVideoUrl(activeTurn)}
                                onEnsureVideoUrl={ensureTurnVideoUrl}
                                onRefreshVideoUrl={refreshTurnVideoUrl}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{TEXT_INTERVIEW_VIDEO_EMPTY}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 mb-1.5 inline-flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                        {TEXT_TOPIC_STRENGTHS}
                      </p>
                      {renderFeedbackText(topic?.strengths, 'text-sm text-gray-700')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1.5 inline-flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        {TEXT_TOPIC_IMPROVEMENTS}
                      </p>
                      {renderFeedbackText(topic?.improvements, 'text-sm text-gray-700')}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 animate-feedback-reveal stagger-5">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary-500" />
            <h3>{TEXT_OVERALL_FEEDBACK_SECTION_TITLE}</h3>
          </div>

          <Card className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-emerald-900">{TEXT_STRENGTHS_TITLE}</h3>
                {renderFeedbackText(overallFeedback?.strengths, 'text-sm text-gray-700')}
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border border-amber-100 bg-amber-50/70 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-amber-900">{TEXT_IMPROVEMENTS_TITLE}</h3>
                {renderFeedbackText(overallFeedback?.improvements, 'text-sm text-gray-700')}
              </div>
            </div>
          </Card>
        </Card>

        <Button
          onClick={() => navigate('/profile')}
          className="w-full rounded-xl h-12 gap-2 shadow-sm"
          variant="default"
        >
          <Home className="w-5 h-5" />
          {TEXT_GO_PROFILE}
        </Button>
      </div>
    </div>
  );
};

export default RealLearningRecordDetail;
