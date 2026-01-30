import { useQuery } from '@tanstack/react-query'
import { fetchRecommendedQuestion } from '@/api/questionApi'

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
      const response = await fetchRecommendedQuestion()
      const mapped = mapQuestion(response)
      return mapped?.id ? mapped : null
    },
  })
}
