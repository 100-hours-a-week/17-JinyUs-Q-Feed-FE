export const QUESTION_TYPE_FALLBACK_LABELS = Object.freeze({
  CS: 'CS',
  SYSTEM_DESIGN: '시스템 디자인',
  PORTFOLIO: '포트폴리오',
})

export const QUESTION_CATEGORY_FALLBACK_LABELS = Object.freeze({
  OS: '운영체제',
  NETWORK: '네트워크',
  DB: '데이터베이스',
  COMPUTER_ARCHITECTURE: '컴퓨터 구조',
  DATA_STRUCTURE_ALGORITHM: '자료구조&알고리즘',
  SOCIAL: '소셜/피드 시스템',
  NOTIFICATION: '알림 시스템',
  REALTIME: '실시간 통신 시스템',
  SEARCH: '검색 시스템',
  MEDIA: '미디어/스트리밍 시스템',
  STORAGE: '파일 저장/협업 시스템',
  PLATFORM: '플랫폼 인프라 시스템',
  TRANSACTION: '거래/정산 시스템',
})

export const DEFAULT_QUESTION_CATEGORY_COLOR = Object.freeze({
  bg: '#F5F5F5',
  text: '#616161',
})

export const QUESTION_CATEGORY_COLOR_BY_KEY = Object.freeze({
  OS: { bg: '#F3E5F5', text: '#7B1FA2' },
  NETWORK: { bg: '#E8F5E9', text: '#2E7D32' },
  DB: { bg: '#FFF3E0', text: '#E65100' },
  COMPUTER_ARCHITECTURE: { bg: '#E8EAF6', text: '#3949AB' },
  DATA_STRUCTURE_ALGORITHM: { bg: '#E3F2FD', text: '#1565C0' },
  SOCIAL: { bg: '#F3E5F5', text: '#7B1FA2' },
  NOTIFICATION: { bg: '#E0F2F1', text: '#00695C' },
  REALTIME: { bg: '#E8F0FE', text: '#1A73E8' },
  SEARCH: { bg: '#FFF8E1', text: '#F57F17' },
  MEDIA: { bg: '#FCE4EC', text: '#AD1457' },
  STORAGE: { bg: '#EDE7F6', text: '#5E35B1' },
  PLATFORM: { bg: '#E1F5FE', text: '#0277BD' },
  TRANSACTION: { bg: '#F1F8E9', text: '#558B2F' },
})

export function getQuestionTypeLabel(typeKey, typeMap = {}) {
  if (!typeKey) return ''
  return typeMap[typeKey] || QUESTION_TYPE_FALLBACK_LABELS[typeKey] || typeKey
}

export function getQuestionCategoryLabel(categoryKey, categoryMap = {}) {
  if (!categoryKey) return ''
  return categoryMap[categoryKey] || QUESTION_CATEGORY_FALLBACK_LABELS[categoryKey] || categoryKey
}

export function getQuestionCategoryColor(categoryKey) {
  if (!categoryKey) return DEFAULT_QUESTION_CATEGORY_COLOR
  return QUESTION_CATEGORY_COLOR_BY_KEY[categoryKey] || DEFAULT_QUESTION_CATEGORY_COLOR
}
