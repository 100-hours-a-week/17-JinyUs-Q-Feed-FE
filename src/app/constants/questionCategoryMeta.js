import { QUESTION_CATEGORIES, QUESTION_TYPES } from '@/app/constants/interviewTaxonomy'

const CS = QUESTION_CATEGORIES.CS
const SYSTEM_DESIGN = QUESTION_CATEGORIES.SYSTEM_DESIGN

export const QUESTION_TYPE_FALLBACK_LABELS = Object.freeze({
  [QUESTION_TYPES.CS]: 'CS',
  [QUESTION_TYPES.SYSTEM_DESIGN]: '시스템 디자인',
  [QUESTION_TYPES.PORTFOLIO]: '포트폴리오',
})

export const QUESTION_CATEGORY_FALLBACK_LABELS = Object.freeze({
  [CS.OS]: '운영체제',
  [CS.NETWORK]: '네트워크',
  [CS.DB]: '데이터베이스',
  [CS.COMPUTER_ARCHITECTURE]: '컴퓨터 구조',
  [CS.DATA_STRUCTURE_ALGORITHM]: '자료구조&알고리즘',
  [SYSTEM_DESIGN.SOCIAL]: '소셜/피드 시스템',
  [SYSTEM_DESIGN.NOTIFICATION]: '알림 시스템',
  [SYSTEM_DESIGN.REALTIME]: '실시간 통신 시스템',
  [SYSTEM_DESIGN.SEARCH]: '검색 시스템',
  [SYSTEM_DESIGN.MEDIA]: '미디어/스트리밍 시스템',
  [SYSTEM_DESIGN.STORAGE]: '파일 저장/협업 시스템',
  [SYSTEM_DESIGN.PLATFORM]: '플랫폼 인프라 시스템',
  [SYSTEM_DESIGN.TRANSACTION]: '거래/정산 시스템',
})

export const DEFAULT_QUESTION_CATEGORY_COLOR = Object.freeze({
  bg: '#F5F5F5',
  text: '#616161',
})

export const QUESTION_CATEGORY_COLOR_BY_KEY = Object.freeze({
  [CS.OS]: { bg: '#F3E5F5', text: '#7B1FA2' },
  [CS.NETWORK]: { bg: '#E8F5E9', text: '#2E7D32' },
  [CS.DB]: { bg: '#FFF3E0', text: '#E65100' },
  [CS.COMPUTER_ARCHITECTURE]: { bg: '#E8EAF6', text: '#3949AB' },
  [CS.DATA_STRUCTURE_ALGORITHM]: { bg: '#E3F2FD', text: '#1565C0' },
  [SYSTEM_DESIGN.SOCIAL]: { bg: '#F3E5F5', text: '#7B1FA2' },
  [SYSTEM_DESIGN.NOTIFICATION]: { bg: '#E0F2F1', text: '#00695C' },
  [SYSTEM_DESIGN.REALTIME]: { bg: '#E8F0FE', text: '#1A73E8' },
  [SYSTEM_DESIGN.SEARCH]: { bg: '#FFF8E1', text: '#F57F17' },
  [SYSTEM_DESIGN.MEDIA]: { bg: '#FCE4EC', text: '#AD1457' },
  [SYSTEM_DESIGN.STORAGE]: { bg: '#EDE7F6', text: '#5E35B1' },
  [SYSTEM_DESIGN.PLATFORM]: { bg: '#E1F5FE', text: '#0277BD' },
  [SYSTEM_DESIGN.TRANSACTION]: { bg: '#F1F8E9', text: '#558B2F' },
})

export function getQuestionTypeLabel(typeKey, typeMap = {}) {
  if (!typeKey) return ''
  const mapped = typeMap?.[typeKey]
  if (typeof mapped === 'string' && mapped.trim()) {
    return mapped
  }
  return QUESTION_TYPE_FALLBACK_LABELS[typeKey] || typeKey
}

export function getQuestionCategoryLabel(categoryKey, categoryMap = {}) {
  if (!categoryKey) return ''
  const mapped = categoryMap?.[categoryKey]
  if (typeof mapped === 'string' && mapped.trim()) {
    return mapped
  }
  return QUESTION_CATEGORY_FALLBACK_LABELS[categoryKey] || categoryKey
}

export function getQuestionCategoryColor(categoryKey) {
  if (!categoryKey) return DEFAULT_QUESTION_CATEGORY_COLOR
  return QUESTION_CATEGORY_COLOR_BY_KEY[categoryKey] || DEFAULT_QUESTION_CATEGORY_COLOR
}
