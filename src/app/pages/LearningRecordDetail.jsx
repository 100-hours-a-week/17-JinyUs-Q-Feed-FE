import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/app/components/AppHeader'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { AlertCircle, Home, Loader2, Sparkles, ThumbsUp } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { useAnswerDetail } from '@/app/hooks/useAnswerDetail'
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories'
import { useQuestionTypes } from '@/app/hooks/useQuestionTypes'

const TEXT_PAGE_TITLE = '학습 기록 상세'
const TEXT_HEADER_DESC = '제출한 답변과 AI 피드백을 확인해보세요'
const TEXT_LOADING = '학습 기록을 불러오는 중...'
const TEXT_NOT_FOUND = '학습 기록을 찾을 수 없습니다'
const TEXT_QUESTION_LABEL = '질문'
const TEXT_MY_ANSWER_LABEL = '내 답변'
const TEXT_STRENGTHS_TITLE = '잘한 점'
const TEXT_IMPROVEMENTS_TITLE = '개선하면 좋은 점'
const TEXT_RADAR_TITLE = '답변 평가'
const TEXT_FEEDBACK_EMPTY = '아직 AI 피드백이 준비되지 않았습니다.'
const TEXT_GO_PROFILE = '학습 기록으로 돌아가기'
const TEXT_RETRY_HELP = '잠시 후 다시 시도해 주세요.'
const FEEDBACK_SECTION_DELIMITER = '\n\n'
const FEEDBACK_SPLIT_DELIMITER = '●'
const FEEDBACK_BULLET = '•'
const FEEDBACK_DASH = '-'

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}년 ${month}월 ${day}일 ${hour}:${minute} 답변했어요`
}

const normalizeRadarValue = (metric) => {
  const score = Number(metric?.score)
  const maxScore = Number(metric?.maxScore)

  if (Number.isNaN(score)) return 0

  if (!Number.isNaN(maxScore) && maxScore > 0) {
    return Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)))
  }

  // maxScore가 내려오지 않을 때 1~5 스케일을 1~100으로 변환한다.
  if (score >= 0 && score <= 5) {
    return Math.min(100, Math.max(0, Math.round((score / 5) * 100)))
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

const renderFeedbackText = (text, className) => {
  const normalized = (text || '').replace(/\n+/g, '\n').trim()
  const lines = normalized
    ? normalized.split(FEEDBACK_SPLIT_DELIMITER).map((line) => line.trim()).filter(Boolean)
    : []

  if (lines.length === 0) {
    return <p className={className}>{TEXT_FEEDBACK_EMPTY}</p>
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, idx) => {
        const content = line.startsWith(FEEDBACK_DASH) ? line.slice(1).trim() : line
        return (
          <p key={idx} className="leading-relaxed pl-5 relative">
            <span className="absolute left-0">{FEEDBACK_BULLET}</span>
            {content}
          </p>
        )
      })}
    </div>
  )
}

const LearningRecordDetail = () => {
  const navigate = useNavigate()
  const { answerId } = useParams()
  const { data, isLoading, error } = useAnswerDetail(answerId)
  const { data: CATEGORY_LABELS = {} } = useQuestionCategories()
  const { data: QUESTION_TYPE_LABELS = {} } = useQuestionTypes()

  const answerDetail = data?.data ?? data ?? {}
  const hasAnswerDetail = Boolean(answerDetail?.answerId)
  const detail = answerDetail
  const question = detail?.question
  const aiFeedback = detail?.aiFeedback
  const metrics = Array.isArray(aiFeedback?.metrics) ? aiFeedback.metrics : []
  const radarData = (metrics ?? []).map(metric => ({
    ...metric,
    value: normalizeRadarValue(metric),
  }));

  const hasRadarChart = radarData.length > 0

  const feedbackText = (aiFeedback?.feedback ?? '').trim()
  const [strengthsText, improvementsText] = feedbackText
    ? [
        feedbackText.split(FEEDBACK_SECTION_DELIMITER)[0] || '',
        feedbackText.split(FEEDBACK_SECTION_DELIMITER)[1] || '',
      ]
    : ['', '']
  const mergedImprovementsText = hasRadarChart
    ? improvementsText
    : [strengthsText, improvementsText].filter(Boolean).join('\n')
  const questionTypeLabel = question?.type ? QUESTION_TYPE_LABELS[question.type] || question.type : null
  const questionCategory = question?.category ? (
    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
      {CATEGORY_LABELS[question.category] || question.category}
    </Badge>
  ) : null

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
    )
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
    )
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{TEXT_QUESTION_LABEL}</p>
            <div className="flex items-center gap-2">
              {questionTypeLabel && (
                <Badge variant="outline" className="text-pink-700 border-pink-200">
                  {questionTypeLabel}
                </Badge>
              )}
              {questionCategory}
            </div>
          </div>
          <p className="leading-relaxed">{question?.content || TEXT_NOT_FOUND}</p>
          <p className="text-xs text-muted-foreground text-right mt-3">{formatDateTime(detail?.createdAt)}</p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted-foreground mb-2">{TEXT_MY_ANSWER_LABEL}</p>
          <div className="h-44 overflow-y-auto overscroll-contain pr-1">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {detail?.content || '제출한 답변 내용이 없습니다.'}
            </p>
          </div>
        </Card>

        {hasRadarChart && (
          <Card className="p-5 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-pink-600" />
              <h3>{TEXT_RADAR_TITLE}</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="평가" dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasRadarChart && (
          <Card className="p-5 border-2 border-rose-200 bg-rose-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-rose-900">{TEXT_STRENGTHS_TITLE}</h3>
                {renderFeedbackText(strengthsText, 'text-sm text-rose-800')}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-5 border-2 border-pink-200 bg-pink-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-pink-900">{TEXT_IMPROVEMENTS_TITLE}</h3>
              {renderFeedbackText(mergedImprovementsText, 'text-sm text-pink-800')}
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
  )
}

export default LearningRecordDetail
