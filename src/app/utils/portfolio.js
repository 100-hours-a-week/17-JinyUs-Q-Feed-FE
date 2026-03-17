import { confirmFileUpload, getPresignedUrl, uploadToS3 } from '@/api/fileApi'

export const MAX_PORTFOLIO_PROJECTS = 3
export const MAX_PROJECT_NAME_LENGTH = 100
export const MAX_PROJECT_CONTENT_LENGTH = 1000
export const MAX_PROJECT_IMAGE_SIZE = 5 * 1024 * 1024
export const PORTFOLIO_IMAGE_UPLOAD_CATEGORY = 'ARCHITECTURE'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']

const PORTFOLIO_ERROR_MESSAGE_MAP = {
  PORT001: '프로젝트는 최대 3개까지 저장할 수 있습니다.',
  PORT002: '포트폴리오를 찾을 수 없습니다.',
  TS001: '존재하지 않는 기술 스택이 포함되어 있습니다.',
}

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed || ''
}

const toNullablePositiveInteger = (value) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null
}

const createUploadPrefix = (date = new Date()) => {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`
}

const createUploadFileName = (file) => {
  const originalName = typeof file?.name === 'string' ? file.name.trim() : ''
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'png'
  const randomToken =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
  return `${createUploadPrefix()}_ARCHITECTURE_${randomToken}.${extension}`
}

export function validatePortfolioImage(file) {
  if (!file) return ''

  if (file.size > MAX_PROJECT_IMAGE_SIZE) {
    return '이미지는 5MB 이하만 가능합니다.'
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'jpg, jpeg, png, gif 형식만 업로드 가능합니다.'
  }

  return ''
}

export function buildPortfolioProjectPayload({
  projectName,
  content,
  architectureImageFileId,
  techStackIds,
}) {
  return {
    projectName: toTrimmedString(projectName),
    content: toTrimmedString(content),
    architectureImageFileId: toNullablePositiveInteger(architectureImageFileId),
    techStackIds: Array.isArray(techStackIds)
      ? techStackIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
      : [],
  }
}

export function toPortfolioProjectPayload(project) {
  return buildPortfolioProjectPayload({
    projectName: project?.projectName,
    content: project?.content,
    architectureImageFileId: project?.architectureImageFileId,
    techStackIds:
      project?.techStackIds ??
      project?.techStacks?.map((techStack) => techStack?.techStackId) ??
      [],
  })
}

export function findPortfolioProjectIndex(projects, projectId) {
  return Array.isArray(projects)
    ? projects.findIndex((project) => String(project?.projectId) === String(projectId))
    : -1
}

export function findPortfolioProjectById(projects, projectId) {
  const projectIndex = findPortfolioProjectIndex(projects, projectId)
  return projectIndex >= 0 ? projects[projectIndex] : null
}

export function getProjectTechStackIds(project) {
  if (Array.isArray(project?.techStackIds)) {
    return project.techStackIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  }

  if (!Array.isArray(project?.techStacks)) return []

  return project.techStacks
    .map((techStack) => Number(techStack?.techStackId))
    .filter((value) => Number.isInteger(value) && value > 0)
}

export function getProjectTechStackNames(project) {
  if (!Array.isArray(project?.techStacks)) return []

  return project.techStacks
    .map((techStack) => toTrimmedString(techStack?.techStackName || techStack?.name))
    .filter(Boolean)
}

export function mergeTechStackLookup(currentLookup, techStacks) {
  const baseLookup =
    currentLookup && typeof currentLookup === 'object' && !Array.isArray(currentLookup)
      ? currentLookup
      : {}
  const source = Array.isArray(techStacks) ? techStacks : []

  if (source.length === 0) {
    return baseLookup
  }

  let hasChanges = false
  const nextLookup = { ...baseLookup }

  source.forEach((techStack) => {
    const techStackId = Number(techStack?.techStackId)
    if (!Number.isInteger(techStackId) || techStackId <= 0) return

    const previous = nextLookup[techStackId]
    const nextEntry = {
      techStackId,
      name: toTrimmedString(techStack?.name || techStack?.techStackName || previous?.name),
      description: toTrimmedString(techStack?.description || previous?.description),
    }

    if (
      !previous ||
      previous.name !== nextEntry.name ||
      previous.description !== nextEntry.description
    ) {
      nextLookup[techStackId] = nextEntry
      hasChanges = true
    }
  })

  return hasChanges ? nextLookup : baseLookup
}

export function getSelectedTechStacks(techStackIds, techStackLookup) {
  if (!Array.isArray(techStackIds) || !techStackLookup) return []

  return techStackIds
    .map((techStackId) => techStackLookup[techStackId])
    .filter((techStack) => techStack?.techStackId > 0 && techStack?.name)
}

export function getImageFileName(source) {
  if (!source) return ''

  if (typeof source === 'object' && source?.name) {
    return source.name
  }

  const normalized = toTrimmedString(source)
  if (!normalized) return ''

  try {
    const url = new URL(normalized)
    const lastSegment = url.pathname.split('/').filter(Boolean).pop()
    return lastSegment || normalized
  } catch {
    return normalized.split('/').filter(Boolean).pop() || normalized
  }
}

export function resolvePortfolioErrorMessage(error, fallbackMessage) {
  const code = toTrimmedString(error?.code)
  if (code && PORTFOLIO_ERROR_MESSAGE_MAP[code]) {
    return PORTFOLIO_ERROR_MESSAGE_MAP[code]
  }
  return error?.message || fallbackMessage
}

export function isPortfolioNotFoundError(error) {
  return error?.code === 'PORT002'
}

export async function uploadPortfolioImage(file) {
  if (!file) {
    return {
      fileId: null,
      fileUrl: '',
    }
  }

  const validationMessage = validatePortfolioImage(file)
  if (validationMessage) {
    throw new Error(validationMessage)
  }

  const presignedResult = await getPresignedUrl({
    fileName: createUploadFileName(file),
    fileSize: file.size,
    mimeType: file.type,
    category: PORTFOLIO_IMAGE_UPLOAD_CATEGORY,
    method: 'PUT',
  })
  const presignedPayload = presignedResult?.data ?? {}
  const fileId = presignedPayload.fileId ?? presignedPayload.file_id
  const presignedUrl = presignedPayload.presignedUrl ?? presignedPayload.presigned_url

  if (!fileId || !presignedUrl) {
    throw new Error('이미지 업로드 URL을 받지 못했습니다.')
  }

  await uploadToS3(presignedUrl, file, file.type)

  const confirmResult = await confirmFileUpload(fileId)
  const confirmPayload = confirmResult?.data ?? {}
  const fileUrl = toTrimmedString(confirmPayload.fileUrl ?? confirmPayload.file_url)

  if (!fileUrl) {
    throw new Error('업로드된 이미지 URL을 확인할 수 없습니다.')
  }

  return {
    fileId,
    fileUrl,
  }
}
