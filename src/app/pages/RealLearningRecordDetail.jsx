import { useMemo } from 'react';
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

  const questionText = toTrimmedString(
    answerDetail?.question?.content ?? answerDetail?.question?.title
  );
  const answerText = toTrimmedString(answerDetail?.content ?? answerDetail?.answer_text);

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
        {questionText && (
          <Card className="p-5 bg-white shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">{TEXT_QUESTION_LABEL}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{questionText}</p>
          </Card>
        )}

        {answerText && (
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">{TEXT_MY_ANSWER_LABEL}</p>
            <div className="h-44 overflow-y-auto overscroll-contain pr-1">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{answerText}</p>
            </div>
          </Card>
        )}

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
