import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '@/app/components/AppHeader';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, Home, ListChecks, Loader2, Sparkles, ThumbsUp } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { useAnswerDetail } from '@/app/hooks/useAnswerDetail';
import { getFileReadPresignedUrl } from '@/api/fileApi';

const TEXT_PAGE_TITLE = '실전 학습 기록 상세';
const TEXT_HEADER_DESC = '실전 면접 결과와 AI 피드백을 확인해보세요';
const TEXT_LOADING = '실전 학습 기록을 불러오는 중...';
const TEXT_NOT_FOUND = '실전 학습 기록을 찾을 수 없습니다';
const TEXT_GO_PROFILE = '학습 기록으로 돌아가기';
const TEXT_RETRY_HELP = '잠시 후 다시 시도해 주세요.';
const TEXT_QUESTION_LABEL = '질문';
const TEXT_MY_ANSWER_LABEL = '내 답변';
const TEXT_METRICS_TITLE = '종합 역량 점수';
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
const TEXT_INTERVIEW_VIDEO_TITLE = '질문별 답변 영상';
const TEXT_INTERVIEW_VIDEO_EMPTY = '표시할 답변 영상이 없습니다.';
const TEXT_TURN_LABEL = '주제';
const TEXT_VIDEO_LABEL = '답변 영상';
const TEXT_VIDEO_EXPIRES_LABEL = '영상 링크 만료 시 새로고침 해주세요.';
const TEXT_VIDEO_MISSING_CARD = '영상이 없습니다.';
const TEXT_VIDEO_LOADING = '영상 불러오는 중...';

const FEEDBACK_SPLIT_DELIMITER = '●';
const FEEDBACK_BULLET = '•';
const FEEDBACK_DASH = '-';
const METRIC_SCORE_MAX = 5;
const RADAR_DOMAIN_MAX = 100;

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

const buildTurnVideoKey = (turnOrder, index) => `${turnOrder}-${index}`;

const parseAmzDateMs = (value) => {
  const normalized = toTrimmedString(value);
  const match = normalized.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const timestamp = Date.UTC(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10),
    Number.parseInt(second, 10)
  );
  return Number.isFinite(timestamp) ? timestamp : null;
};

const isExpiredS3PresignedUrl = (resourceUrl) => {
  const normalizedUrl = toTrimmedString(resourceUrl);
  if (!normalizedUrl) return true;

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return false;
  }

  const amzDateRaw =
    parsedUrl.searchParams.get('X-Amz-Date') ??
    parsedUrl.searchParams.get('x-amz-date');
  const expiresRaw =
    parsedUrl.searchParams.get('X-Amz-Expires') ??
    parsedUrl.searchParams.get('x-amz-expires');

  const issuedAtMs = parseAmzDateMs(amzDateRaw);
  if (issuedAtMs === null) return false;

  const expiresSeconds = Number.parseInt(toTrimmedString(expiresRaw), 10);
  if (!Number.isFinite(expiresSeconds) || expiresSeconds < 0) return false;

  return Date.now() >= issuedAtMs + expiresSeconds * 1000;
};

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
  const [resolvedVideoSources, setResolvedVideoSources] = useState({});
  const [videoLoadFailedMap, setVideoLoadFailedMap] = useState({});
  const [videoReadyMap, setVideoReadyMap] = useState({});
  const videoReadUrlCacheRef = useRef(new Map());
  const inFlightVideoReadUrlRef = useRef(new Map());
  const refreshingTurnVideoRef = useRef(new Set());

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

    return rows
      .map((item, idx) => {
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
          category: toTrimmedString(item?.category),
          videoPlayUrl,
          videoPlayUrlExpired: isExpiredS3PresignedUrl(videoPlayUrl),
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
  }, [feedbackData]);

  const getTurnVideoReadUrl = useCallback(async (fileId, { forceRefresh = false } = {}) => {
    const normalizedFileId = toFileId(fileId);
    if (!normalizedFileId) return '';
    const fileIdKey = String(normalizedFileId);

    if (forceRefresh) {
      videoReadUrlCacheRef.current.delete(fileIdKey);
      inFlightVideoReadUrlRef.current.delete(fileIdKey);
    } else {
      const cachedUrl = toTrimmedString(videoReadUrlCacheRef.current.get(fileIdKey));
      if (cachedUrl) return cachedUrl;
    }

    let readPromise = inFlightVideoReadUrlRef.current.get(fileIdKey);
    if (!readPromise) {
      readPromise = getFileReadPresignedUrl(normalizedFileId)
        .then((readResult) => {
          const readPayload = readResult?.data ?? readResult ?? {};
          return toTrimmedString(readPayload.presignedUrl ?? readPayload.presigned_url);
        })
        .finally(() => {
          inFlightVideoReadUrlRef.current.delete(fileIdKey);
        });
      inFlightVideoReadUrlRef.current.set(fileIdKey, readPromise);
    }

    const resolvedUrl = toTrimmedString(await readPromise);
    if (resolvedUrl) {
      videoReadUrlCacheRef.current.set(fileIdKey, resolvedUrl);
    }
    return resolvedUrl;
  }, []);

  const handleTurnVideoLoadError = useCallback(async (turn, turnIndex) => {
    const turnKey = buildTurnVideoKey(turn?.turnOrder, turnIndex);

    if (!turn?.videoFileId) {
      setVideoLoadFailedMap((prev) => ({ ...prev, [turnKey]: true }));
      return;
    }
    if (refreshingTurnVideoRef.current.has(turnKey)) {
      return;
    }

    refreshingTurnVideoRef.current.add(turnKey);
    try {
      const refreshedUrl = await getTurnVideoReadUrl(turn.videoFileId, { forceRefresh: true });
      if (!refreshedUrl) {
        throw new Error('empty_video_url');
      }

      setResolvedVideoSources((prev) => ({
        ...prev,
        [turnKey]: refreshedUrl,
      }));
      setVideoLoadFailedMap((prev) => {
        if (!prev[turnKey]) return prev;
        const next = { ...prev };
        delete next[turnKey];
        return next;
      });
    } catch {
      setVideoLoadFailedMap((prev) => ({ ...prev, [turnKey]: true }));
    } finally {
      refreshingTurnVideoRef.current.delete(turnKey);
    }
  }, [getTurnVideoReadUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadTurnVideos = async () => {
      const targets = interviewHistory
        .map((turn, idx) => ({ turn, idx }))
        .filter(
          ({ turn }) =>
            (!turn.videoPlayUrl || turn.videoPlayUrlExpired) &&
            Boolean(turn.videoFileId)
        );

      if (targets.length === 0) {
        if (!cancelled) setResolvedVideoSources({});
        return;
      }

      const nextVideoSources = {};

      for (let idx = 0; idx < targets.length; idx += 1) {
        const turn = targets[idx]?.turn;
        const originalIndex = targets[idx]?.idx ?? idx;
        if (!turn) continue;

        try {
          const fallbackUrl = toTrimmedString(await getTurnVideoReadUrl(turn.videoFileId));
          if (!fallbackUrl) continue;
          nextVideoSources[buildTurnVideoKey(turn.turnOrder, originalIndex)] = fallbackUrl;
        } catch {
          // fallback URL 조회 실패 시 해당 턴은 텍스트만 표시
        }
      }

      if (cancelled) return;
      setResolvedVideoSources(nextVideoSources);
    };

    void loadTurnVideos();

    return () => {
      cancelled = true;
    };
  }, [getTurnVideoReadUrl, interviewHistory]);

  useEffect(() => {
    setVideoLoadFailedMap({});
  }, [interviewHistory, resolvedVideoSources]);

  useEffect(() => {
    setVideoReadyMap({});
  }, [interviewHistory, resolvedVideoSources]);

  const questionText = toTrimmedString(
    answerDetail?.question?.content ?? answerDetail?.question?.title
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={TEXT_PAGE_TITLE} onBack={() => navigate('/profile')} showNotifications={false} />
        <div className="p-6 max-w-lg mx-auto">
          <Card className="p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-pink-600" />
            <p className="text-sm text-muted-foreground">{TEXT_LOADING}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !hasAnswerDetail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <AppHeader
            title={TEXT_PAGE_TITLE}
            onBack={() => navigate('/profile')}
            showNotifications={false}
            tone="dark"
            className="!static"
          />
          <div className="text-center pb-6 pt-1 px-6">
            <p className="text-white/80 text-sm">{TEXT_HEADER_DESC}</p>
          </div>
        </div>

        <div className="p-6 max-w-lg mx-auto space-y-4 -mt-4">
          <Card className="p-5 border-2 border-rose-200 bg-rose-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-rose-800">{error?.message || TEXT_NOT_FOUND}</p>
                <p className="text-xs text-rose-700 mt-1">{TEXT_RETRY_HELP}</p>
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
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
        <AppHeader
          title={TEXT_PAGE_TITLE}
          onBack={() => navigate('/profile')}
          showNotifications={false}
          tone="dark"
          className="!static"
        />

        <div className="text-center pb-6 pt-1 px-6">
          <p className="text-white/80 text-sm">{TEXT_HEADER_DESC}</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-4 -mt-4">
        <Card className="p-5 bg-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-pink-600" />
            <h3>{TEXT_METRICS_TITLE}</h3>
          </div>
          {hasRadarData ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, RADAR_DOMAIN_MAX]} tick={false} axisLine={false} />
                <Radar name={TEXT_RADAR_LABEL} dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">{TEXT_FEEDBACK_EMPTY}</p>
          )}
        </Card>

        {questionText && (
          <Card className="p-5 bg-white shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">{TEXT_QUESTION_LABEL}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{questionText}</p>
          </Card>
        )}

        <Card className="p-5 bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            <h3>{TEXT_INTERVIEW_VIDEO_TITLE}</h3>
          </div>
          {interviewHistory.length > 0 ? (
            <div className="space-y-4">
              {interviewHistory.map((turn, idx) => {
                const turnKey = buildTurnVideoKey(turn.turnOrder, idx);
                const resolvedVideoUrl = toTrimmedString(
                  resolvedVideoSources[turnKey] ?? turn.videoPlayUrl
                );
                const hasVideoLoadFailed = Boolean(videoLoadFailedMap[turnKey]);
                const canRenderVideoPlayer = Boolean(resolvedVideoUrl) && !hasVideoLoadFailed;
                const displayTopicOrder = Math.max(turn.turnOrder + 1, 1);

                return (
                  <div key={turnKey} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-rose-700">
                      {TEXT_TURN_LABEL} {displayTopicOrder}
                      {turn.category ? ` · ${turn.category}` : ''}
                    </p>
                    {turn.question && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{TEXT_QUESTION_LABEL}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{turn.question}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{TEXT_VIDEO_LABEL}</p>
                      {canRenderVideoPlayer ? (
                        <div className="relative">
                          <video
                            controls
                            preload="metadata"
                            playsInline
                            className="w-full aspect-video rounded-lg border border-gray-200 bg-black"
                            src={resolvedVideoUrl}
                            onError={() => {
                              void handleTurnVideoLoadError(turn, idx);
                            }}
                            onLoadedData={() => {
                              setVideoReadyMap((prev) => ({ ...prev, [turnKey]: true }));
                              setVideoLoadFailedMap((prev) => {
                                if (!prev[turnKey]) return prev;
                                const next = { ...prev };
                                delete next[turnKey];
                                return next;
                              });
                            }}
                          />
                          {!videoReadyMap[turnKey] && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/65">
                              <p className="text-xs text-white/90">{TEXT_VIDEO_LOADING}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center">
                          <p className="text-sm font-medium text-gray-600">{TEXT_VIDEO_MISSING_CARD}</p>
                        </div>
                      )}
                      {canRenderVideoPlayer && (
                        <p className="text-xs text-muted-foreground">
                          {turn.videoExpiresAt
                            ? `${TEXT_VIDEO_EXPIRES_LABEL} (${turn.videoExpiresAt})`
                            : TEXT_VIDEO_EXPIRES_LABEL}
                        </p>
                      )}
                    </div>
                    {turn.answerText && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{TEXT_MY_ANSWER_LABEL}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{turn.answerText}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{TEXT_INTERVIEW_VIDEO_EMPTY}</p>
          )}
        </Card>

        {hasKeywordSummary && (
          <Card className="p-5 bg-white shadow-sm space-y-3">
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
                <p className="text-xs text-rose-700 mb-1">{TEXT_MISSING}</p>
                <p className="text-sm text-gray-700">
                  {missingKeywords.length > 0 ? missingKeywords.join(', ') : TEXT_NONE}
                </p>
              </div>
            </div>
          </Card>
        )}

        {topicsFeedback.length > 0 && (
          <Card className="p-5 bg-white shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-pink-600" />
              <h3>{TEXT_TOPIC_FEEDBACK_TITLE}</h3>
            </div>
            <div className="space-y-3">
              {topicsFeedback.map((topic, idx) => (
                <div
                  key={`${topic?.topic_id ?? 'topic'}-${idx}`}
                  className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 space-y-3"
                >
                  <p className="text-sm text-rose-700 font-semibold">
                    {TEXT_TOPIC_LABEL} {topic?.topic_id ?? idx + 1}
                  </p>
                  <p className="text-[15px] leading-relaxed text-gray-900">
                    <span className="font-semibold">{TEXT_MAIN_QUESTION}: </span>
                    {toTrimmedString(topic?.main_question) || TEXT_FEEDBACK_EMPTY}
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 mb-1.5">{TEXT_TOPIC_STRENGTHS}</p>
                    {renderFeedbackText(topic?.strengths, 'text-sm text-gray-700')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-pink-700 mb-1.5">{TEXT_TOPIC_IMPROVEMENTS}</p>
                    {renderFeedbackText(topic?.improvements, 'text-sm text-gray-700')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5 border-2 border-rose-200 bg-rose-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-rose-900">{TEXT_STRENGTHS_TITLE}</h3>
              {renderFeedbackText(overallFeedback?.strengths, 'text-sm text-rose-800')}
            </div>
          </div>
        </Card>

        <Card className="p-5 border-2 border-pink-200 bg-pink-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-pink-900">{TEXT_IMPROVEMENTS_TITLE}</h3>
              {renderFeedbackText(overallFeedback?.improvements, 'text-sm text-pink-800')}
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
};

export default RealLearningRecordDetail;
