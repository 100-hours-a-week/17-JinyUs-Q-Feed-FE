import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { AlertCircle, Home, ListChecks, Target, ThumbsUp } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { SESSION_STORAGE_KEYS } from '@/app/constants/storageKeys';

const TEXT_PAGE_TITLE = '실전 면접 AI 피드백';
const TEXT_COMPLETE_TITLE = '분석 완료!';
const TEXT_COMPLETE_DESC = '실전 면접 답변을 분석했어요';
const TEXT_HOME_BUTTON = '홈으로 이동';
const TEXT_METRICS_TITLE = '종합 역량 점수';
const TEXT_STRENGTHS_TITLE = '전체 강점';
const TEXT_IMPROVEMENTS_TITLE = '전체 개선점';
const TEXT_TOPIC_FEEDBACK_TITLE = '주제별 피드백';
const TEXT_TOPIC_LABEL = '주제';
const TEXT_MAIN_QUESTION = '메인 질문';
const TEXT_TOPIC_STRENGTHS = '좋았던 점';
const TEXT_TOPIC_IMPROVEMENTS = '개선 포인트';
const TEXT_FEEDBACK_EMPTY = '피드백 정보가 없습니다.';
const TEXT_MISSING_RESULT = '분석 결과 정보를 찾을 수 없습니다.';
const TEXT_COVERAGE = '키워드 커버리지';
const TEXT_COVERED = '반영된 키워드';
const TEXT_MISSING = '누락 키워드';
const TEXT_NONE = '없음';
const TEXT_RADAR_LABEL = '평가';
const TEXT_QUESTION_COUNT_SUFFIX = '개 질문 분석';

const FEEDBACK_SPLIT_DELIMITER = '●';
const FEEDBACK_BULLET = '•';
const FEEDBACK_DASH = '-';
const METRIC_SCORE_MAX = 5;
const RADAR_DOMAIN_MAX = 100;
const REAL_SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS.REAL_INTERVIEW_SESSION;

const safeRemoveRealSession = () => {
  try {
    sessionStorage.removeItem(REAL_SESSION_STORAGE_KEY);
  } catch {
    // sessionStorage 사용 불가 환경에서는 무시
  }
};

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

const RealInterviewResultAI = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const feedbackResponse = state?.feedbackResponse;
  const feedbackData = useMemo(
    () => (feedbackResponse?.data ?? feedbackResponse ?? null),
    [feedbackResponse]
  );
  const interviewEntries = Array.isArray(state?.interviewEntries)
    ? state.interviewEntries
    : [];

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

  const overallFeedback = feedbackData?.overall_feedback ?? {};
  const topicsFeedback = useMemo(() => {
    return Array.isArray(feedbackData?.topics_feedback)
      ? feedbackData.topics_feedback.filter((item) => item && typeof item === 'object')
      : [];
  }, [feedbackData]);

  const keywordResult = useMemo(() => {
    const rawKeywordResult = feedbackData?.keyword_result;
    if (rawKeywordResult && typeof rawKeywordResult === 'object') {
      return rawKeywordResult;
    }
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
  const hasResult = Boolean(feedbackData);
  const hasRadarData = radarData.length > 0;
  const hasKeywordSummary = coveredKeywords.length > 0 || missingKeywords.length > 0;

  useEffect(() => {
    safeRemoveRealSession();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={TEXT_PAGE_TITLE}
        onBack={() => navigate('/real-interview')}
        showNotifications={false}
        tone="light"
      />

      <div
        className="text-center pb-6 px-6 pt-2"
        style={{
          background:
            'linear-gradient(165deg, var(--primary-50) 0%, var(--primary-100) 50%, var(--primary-50) 100%)',
        }}
      >
        <div className="mb-2 flex justify-center">
          <Target className="w-14 h-14 text-primary-500" />
        </div>
        <h2 className="text-2xl mb-1 font-semibold text-[var(--gray-900)]">{TEXT_COMPLETE_TITLE}</h2>
        <p className="text-[var(--gray-600)] text-sm">{TEXT_COMPLETE_DESC}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant="outline" className="border-pink-200 text-pink-700 bg-white/80">
            {interviewEntries.length}
            {TEXT_QUESTION_COUNT_SUFFIX}
          </Badge>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-4 -mt-4">
        {!hasResult && (
          <Card className="p-5 border-2 border-rose-200 bg-rose-50">
            <p className="text-sm text-rose-800">{TEXT_MISSING_RESULT}</p>
          </Card>
        )}

        {hasResult && (
          <Card className="p-6 bg-white shadow-lg">
            <h3 className="text-base mb-3">{TEXT_METRICS_TITLE}</h3>
            {hasRadarData ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, RADAR_DOMAIN_MAX]} tick={false} axisLine={false} />
                  <Radar
                    name={TEXT_RADAR_LABEL}
                    dataKey="value"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{TEXT_FEEDBACK_EMPTY}</p>
            )}
          </Card>
        )}

        {hasResult && hasKeywordSummary && (
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

        {hasResult && (
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
        )}

        {hasResult && (
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
        )}

        <Button
          onClick={() => navigate('/')}
          className="w-full rounded-md h-12 gap-2"
        >
          <Home className="w-5 h-5" />
          {TEXT_HOME_BUTTON}
        </Button>
      </div>
    </div>
  );
};

export default RealInterviewResultAI;
