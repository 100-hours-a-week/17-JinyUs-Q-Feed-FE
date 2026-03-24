import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'
import { AppHeader } from '@/app/components/AppHeader'
import BottomNav from '@/app/components/BottomNav'
import PortfolioProjectFields from '@/app/components/PortfolioProjectFields'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import {
  MAX_PORTFOLIO_PROJECTS,
  buildPortfolioProjectPayload,
  getSelectedTechStacks,
  mergeTechStackLookup,
  resolvePortfolioErrorMessage,
  toPortfolioProjectPayload,
  uploadPortfolioImage,
  validatePortfolioImage,
} from '@/app/utils/portfolio'
import { usePortfolio, useReplacePortfolio, useTechStacks } from '@/app/hooks/usePortfolio'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const INITIAL_FORM_DATA = {
  projectName: '',
  content: '',
  techStackIds: [],
  architectureImageFileId: null,
  architectureImageUrl: '',
  architectureImageFile: null,
}

const ProjectAdd = () => {
  const navigate = useNavigate()
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [techStackSearch, setTechStackSearch] = useState('')
  const [techStackLookup, setTechStackLookup] = useState({})
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: portfolio,
    isLoading: isPortfolioLoading,
    isError: isPortfolioError,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = usePortfolio()
  const {
    techStacks = [],
    isLoading: isTechStacksLoading,
    isFetching: isTechStacksFetching,
    isFetchingNextPage: isFetchingNextTechStacks,
    error: techStacksError,
    hasNextPage: hasNextTechStacks,
    fetchNextPage: fetchNextTechStacks,
    refetch: refetchTechStacks,
    debouncedQuery: debouncedTechStackQuery,
    hasQuery: hasTechStackQuery,
  } = useTechStacks({ query: techStackSearch })
  const replacePortfolioMutation = useReplacePortfolio()

  const projects = portfolio?.projects ?? []
  const techStackSearchKeyword = techStackSearch.trim()
  const isFormValid = Boolean(
    formData.projectName.trim() &&
      formData.content.trim() &&
      formData.techStackIds.length > 0
  )

  useEffect(() => {
    if (!formData.architectureImageFile) {
      setImagePreviewUrl(formData.architectureImageUrl || '')
      return undefined
    }

    const nextPreviewUrl = URL.createObjectURL(formData.architectureImageFile)
    setImagePreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [formData.architectureImageFile, formData.architectureImageUrl])

  useEffect(() => {
    setTechStackLookup((current) => mergeTechStackLookup(current, techStacks))
  }, [techStacks])

  const isLoading = isPortfolioLoading
  const isError = isPortfolioError
  const errorMessage = portfolioError?.message
  const techStacksEmptyMessage = techStackSearchKeyword
    ? '검색된 기술 스택이 없습니다.'
    : '기술 스택 이름을 입력해 검색하세요.'

  const canSubmit = isFormValid && projects.length < MAX_PORTFOLIO_PROJECTS

  const retry = () => {
    refetchPortfolio()
    if (hasTechStackQuery) {
      refetchTechStacks()
    }
  }

  const selectedTechStacks = useMemo(
    () => getSelectedTechStacks(formData.techStackIds, techStackLookup),
    [formData.techStackIds, techStackLookup]
  )

  const handleFieldChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleTechStackToggle = (techStackId) => {
    setFormData((current) => {
      const exists = current.techStackIds.includes(techStackId)
      return {
        ...current,
        techStackIds: exists
          ? current.techStackIds.filter((value) => value !== techStackId)
          : [...current.techStackIds, techStackId],
      }
    })
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const validationMessage = validatePortfolioImage(file)
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    setFormData((current) => ({
      ...current,
      architectureImageFileId: null,
      architectureImageFile: file,
      architectureImageUrl: '',
    }))
  }

  const handleRemoveFile = () => {
    setFormData((current) => ({
      ...current,
      architectureImageFileId: null,
      architectureImageFile: null,
      architectureImageUrl: '',
    }))
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    if (projects.length >= MAX_PORTFOLIO_PROJECTS) {
      toast.error('프로젝트는 3개까지 등록할 수 있습니다.')
      return
    }

    setShowWarningDialog(true)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)

    try {
      const uploadedArchitectureImage = formData.architectureImageFile
        ? await uploadPortfolioImage(formData.architectureImageFile)
        : null
      const architectureImageFileId =
        uploadedArchitectureImage?.fileId ?? formData.architectureImageFileId

      const newProjectPayload = buildPortfolioProjectPayload({
        projectName: formData.projectName,
        content: formData.content,
        architectureImageFileId,
        techStackIds: selectedTechStacks.map((techStack) => techStack.techStackId),
      })

      const response = await replacePortfolioMutation.mutateAsync({
        projects: [
          ...projects.map(toPortfolioProjectPayload),
          newProjectPayload,
        ],
      })

      const responseProjects = response?.data?.projects ?? []
      const savedProject = responseProjects[responseProjects.length - 1]

      toast.success('프로젝트가 추가되었습니다.')
      navigate(
        savedProject?.projectId ? `/portfolio/${savedProject.projectId}` : '/portfolio',
        { replace: true }
      )
    } catch (error) {
      toast.error(resolvePortfolioErrorMessage(error, '프로젝트 추가에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
      setShowWarningDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="프로젝트 추가" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">필수 데이터를 불러오는 중입니다.</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="프로젝트 추가" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="mb-4 text-sm text-muted-foreground">
              {errorMessage || '데이터를 불러오지 못했습니다.'}
            </p>
            <Button variant="outline" onClick={retry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="프로젝트 추가" onBack={() => navigate('/portfolio')} />

      <div className="mx-auto max-w-lg space-y-6 p-6">
        <PortfolioProjectFields
          formData={formData}
          imagePreviewUrl={imagePreviewUrl}
          techStacks={techStacks}
          selectedTechStacks={selectedTechStacks}
          techStackSearch={techStackSearch}
          isTechStacksLoading={hasTechStackQuery && isTechStacksLoading && techStacks.length === 0}
          isTechStacksSearching={
            techStackSearchKeyword !== debouncedTechStackQuery ||
            (hasTechStackQuery && isTechStacksFetching)
          }
          techStacksErrorMessage={techStacksError?.message || ''}
          emptyTechStacksMessage={techStacksEmptyMessage}
          hasNextTechStacks={Boolean(hasNextTechStacks)}
          isFetchingNextTechStacks={isFetchingNextTechStacks}
          onFieldChange={handleFieldChange}
          onTechStackSearchChange={setTechStackSearch}
          onTechStackToggle={handleTechStackToggle}
          onLoadMoreTechStacks={() => fetchNextTechStacks()}
          onFileUpload={handleFileUpload}
          onFileRemove={handleRemoveFile}
        />

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || replacePortfolioMutation.isPending}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:opacity-50"
        >
          {isSubmitting || replacePortfolioMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            '추가하기'
          )}
        </Button>
      </div>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              프로젝트 제출 시 개인 정보가 포함된 내용은 반드시 제외해주세요!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? '제출 중...' : '제출하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  )
}

export default ProjectAdd
