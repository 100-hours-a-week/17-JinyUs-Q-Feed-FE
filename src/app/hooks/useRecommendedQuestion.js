import { useQuery } from '@tanstack/react-query'
import { fetchRecommendedQuestion } from '@/api/questionApi'

const NOT_FOUND_MESSAGE = '질문을 찾을 수 없습니다'

function mapQuestion(response) {
  const data = response?.data ?? response ?? {}
  return {
    id: data.questionId ?? data.id,
    title: data.content ?? data.title ?? '',
    description: data.content ?? '',
    category: data.category ?? '',
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
  }
}

export function useRecommendedQuestion() {
  return useQuery({
    queryKey: ['questions', 'recommendation'],
    queryFn: async () => {
      try {
        const response = await fetchRecommendedQuestion()
        const mapped = mapQuestion(response)
        return mapped?.id ? mapped : null
      } catch (error) {
        // 추천 질문이 없는 경우(404/Q001)는 예외가 아니라 빈 상태로 처리한다.
        const message = String(error?.message ?? '')
        if (message.includes(NOT_FOUND_MESSAGE) || message.includes('404')) {
          return null
        }
        throw error
      }
    },
  })
}
