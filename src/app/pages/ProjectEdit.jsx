import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'
import { AppHeader } from '@/app/components/AppHeader'
import BottomNav from '@/app/components/BottomNav'
import PortfolioProjectFields from '@/app/components/PortfolioProjectFields'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import {
  buildPortfolioProjectPayload,
  findPortfolioProjectById,
  findPortfolioProjectIndex,
  getSelectedTechStacks,
  getProjectTechStackIds,
  mergeTechStackLookup,
  resolvePortfolioErrorMessage,
  toPortfolioProjectPayload,
  uploadPortfolioImage,
  validatePortfolioImage,
} from '@/app/utils/portfolio'
import { usePortfolio, useReplacePortfolio, useTechStacks } from '@/app/hooks/usePortfolio'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const createFormData = (project) => ({
  projectName: project?.projectName || '',
  content: project?.content || '',
  techStackIds: getProjectTechStackIds(project),
  architectureImageFileId: project?.architectureImageFileId ?? null,
  architectureImageUrl: project?.architectureImageUrl || '',
  architectureImageFile: null,
})

const EMPTY_PROJECTS = []

const ProjectEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [formData, setFormData] = useState(null)
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

  const projects = portfolio?.projects ?? EMPTY_PROJECTS
  const techStackSearchKeyword = techStackSearch.trim()
  const project = useMemo(() => findPortfolioProjectById(projects, id), [id, projects])
  const projectIndex = useMemo(() => findPortfolioProjectIndex(projects, id), [id, projects])
  const initialFormData = useMemo(() => createFormData(project), [project])

  useEffect(() => {
    if (!project) return
    setFormData(createFormData(project))
  }, [project])

  useEffect(() => {
    setTechStackLookup((current) => mergeTechStackLookup(current, project?.techStacks))
  }, [project])

  useEffect(() => {
    if (!formData?.architectureImageFile) {
      setImagePreviewUrl(formData?.architectureImageUrl || '')
      return undefined
    }

    const nextPreviewUrl = URL.createObjectURL(formData.architectureImageFile)
    setImagePreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [formData?.architectureImageFile, formData?.architectureImageUrl])

  useEffect(() => {
    setTechStackLookup((current) => mergeTechStackLookup(current, techStacks))
  }, [techStacks])

  const isLoading = isPortfolioLoading
  const isError = isPortfolioError
  const errorMessage = portfolioError?.message
  const techStacksEmptyMessage = techStackSearchKeyword
    ? '검색된 기술 스택이 없습니다.'
    : '기술 스택 이름을 입력해 검색하세요.'

  const isFormValid = Boolean(
    formData?.projectName?.trim() &&
      formData?.content?.trim() &&
      formData?.techStackIds?.length > 0
  )
  const isModified =
    formData != null && JSON.stringify(formData) !== JSON.stringify(initialFormData)

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

  const handleBack = () => {
    if (isModified) {
      setShowExitDialog(true)
      return
    }

    navigate(`/portfolio/${id}`)
  }

  const retry = () => {
    refetchPortfolio()
    if (hasTechStackQuery) {
      refetchTechStacks()
    }
  }

  const selectedTechStacks = useMemo(
    () => getSelectedTechStacks(formData?.techStackIds ?? [], techStackLookup),
    [formData?.techStackIds, techStackLookup]
  )

  const handleSubmit = async () => {
    if (!isFormValid || !formData || projectIndex < 0) return

    setIsSubmitting(true)

    try {
      const uploadedArchitectureImage = formData.architectureImageFile
        ? await uploadPortfolioImage(formData.architectureImageFile)
        : null
      const architectureImageFileId =
        uploadedArchitectureImage?.fileId ?? formData.architectureImageFileId

      const updatedProjectPayload = buildPortfolioProjectPayload({
        projectName: formData.projectName,
        content: formData.content,
        architectureImageFileId,
        techStackIds: selectedTechStacks.map((techStack) => techStack.techStackId),
      })

      const nextProjects = projects.map((currentProject, index) =>
        index === projectIndex
          ? updatedProjectPayload
          : toPortfolioProjectPayload(currentProject)
      )

      const response = await replacePortfolioMutation.mutateAsync({
        projects: nextProjects,
      })
      const responseProjects = response?.data?.projects ?? []
      const savedProject = responseProjects[projectIndex]

      toast.success('수정되었습니다.')
      navigate(
        savedProject?.projectId ? `/portfolio/${savedProject.projectId}` : '/portfolio',
        { replace: true }
      )
    } catch (error) {
      toast.error(resolvePortfolioErrorMessage(error, '프로젝트 수정에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="프로젝트 수정" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">프로젝트 정보를 불러오는 중입니다.</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="프로젝트 수정" onBack={() => navigate('/portfolio')} />
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

  if (!project || projectIndex < 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="프로젝트 수정" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="mb-4 text-sm text-muted-foreground">
              수정할 프로젝트를 찾을 수 없습니다.
            </p>
            <Button variant="outline" onClick={() => navigate('/portfolio')}>
              목록으로
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="프로젝트 수정" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">프로젝트 정보를 준비하는 중입니다.</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader
        title="프로젝트 수정"
        onBack={handleBack}
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting || replacePortfolioMutation.isPending}
            className="text-primary-500 hover:text-primary-600 disabled:opacity-50"
          >
            {isSubmitting || replacePortfolioMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '완료'
            )}
          </Button>
        }
      />

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
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수정된 내용이 저장되지 않습니다.</AlertDialogTitle>
            <AlertDialogDescription>나가시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/portfolio/${id}`)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  )
}

export default ProjectEdit
