import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { AppHeader } from '@/app/components/AppHeader'
import BottomNav from '@/app/components/BottomNav'
import {
  MAX_PORTFOLIO_PROJECTS,
  getProjectTechStackNames,
  resolvePortfolioErrorMessage,
  toPortfolioProjectPayload,
} from '@/app/utils/portfolio'
import {
  useDeletePortfolio,
  usePortfolio,
  useReplacePortfolio,
} from '@/app/hooks/usePortfolio'
import { Check, ChevronRight, FolderCode, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const PROJECT_NAME_PREVIEW_MAX_LENGTH = 22
const PROJECT_CONTENT_PREVIEW_MAX_LENGTH = 88
const TECH_STACK_PREVIEW_MAX_LENGTH = 14
const TECH_STACK_PREVIEW_MAX_COUNT = 3

const truncateText = (value, maxLength) => {
  if (typeof value !== 'string') return ''

  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized

  return `${normalized.slice(0, maxLength)}...`
}

const PortfolioManagement = () => {
  const navigate = useNavigate()
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState([])
  const {
    data: portfolio,
    isLoading,
    isError,
    error,
    refetch,
  } = usePortfolio()
  const replacePortfolioMutation = useReplacePortfolio()
  const deletePortfolioMutation = useDeletePortfolio()

  const projects = portfolio?.projects ?? []
  const canAddMore = projects.length < MAX_PORTFOLIO_PROJECTS
  const isDeleting =
    replacePortfolioMutation.isPending || deletePortfolioMutation.isPending
  const selectedProjectCount = selectedProjectIds.length
  const selectedProjectIdSet = new Set(selectedProjectIds)

  const resetDeleteMode = () => {
    setIsDeleteMode(false)
    setSelectedProjectIds([])
  }

  const handleEnterDeleteMode = () => {
    if (projects.length === 0 || isDeleting) return

    setIsDeleteMode(true)
    setSelectedProjectIds([])
  }

  const handleToggleProjectSelection = (projectId) => {
    if (!isDeleteMode || isDeleting) return

    const normalizedProjectId = String(projectId)

    setSelectedProjectIds((currentIds) =>
      currentIds.includes(normalizedProjectId)
        ? currentIds.filter((id) => id !== normalizedProjectId)
        : [...currentIds, normalizedProjectId]
    )
  }

  const handleDeleteProject = async () => {
    if (selectedProjectCount === 0 || isDeleting) return

    const remainingProjects = projects.filter(
      (project) => !selectedProjectIdSet.has(String(project.projectId))
    )

    try {
      if (remainingProjects.length === 0) {
        await deletePortfolioMutation.mutateAsync()
      } else {
        await replacePortfolioMutation.mutateAsync({
          projects: remainingProjects.map(toPortfolioProjectPayload),
        })
      }

      toast.success(
        selectedProjectCount > 1
          ? `${selectedProjectCount}개 프로젝트가 삭제되었습니다.`
          : '삭제되었습니다.'
      )
      resetDeleteMode()
    } catch (deleteError) {
      toast.error(resolvePortfolioErrorMessage(deleteError, '삭제에 실패했습니다.'))
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="내 포트폴리오" onBack={() => navigate('/profile')} />

      <div className="mx-auto max-w-lg space-y-6 p-6">
        <Card className="border-primary-200 bg-primary-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h3 className="mb-1 text-primary-700">프로젝트 등록하기</h3>
              <p className="text-sm text-primary-600">
                {projects.length}/{MAX_PORTFOLIO_PROJECTS}개 등록됨
              </p>
              {projects.length === 0 && (
                <p className="mt-2 text-xs leading-5 text-primary-700/80">
                  아직 등록된 프로젝트가 없습니다. 프로젝트를 추가하면 실전 면접 준비에 바로 활용할 수 있습니다.
                </p>
              )}
              {isDeleteMode && projects.length > 0 && (
                <p className="mt-2 text-xs leading-5 text-primary-700/80">
                  삭제할 프로젝트를 선택해주세요. 여러 프로젝트를 동시에 선택할 수 있습니다.
                </p>
              )}
            </div>
            <div className="flex w-full justify-end gap-2 sm:w-auto">
              {isDeleteMode ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDeleteProject}
                    disabled={selectedProjectCount === 0 || isDeleting}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? '삭제 중...' : `선택 삭제${selectedProjectCount > 0 ? ` (${selectedProjectCount})` : ''}`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetDeleteMode}
                    disabled={isDeleting}
                    className="w-fit"
                  >
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/portfolio/add')}
                    disabled={!canAddMore || isDeleting}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    size="sm"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    등록
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnterDeleteMode}
                    disabled={projects.length === 0 || isDeleting}
                    className="w-fit"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        <section>
          {isLoading ? (
            <Card className="items-center p-8 text-center">
              <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary-500" />
              <p className="text-sm text-muted-foreground">
                포트폴리오를 불러오는 중입니다.
              </p>
            </Card>
          ) : isError ? (
            <Card className="items-center p-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                {error?.message || '포트폴리오를 불러오지 못했습니다.'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
            </Card>
          ) : projects.length === 0 ? (
            <Card className="items-center p-8 text-center">
              <p className="text-sm text-muted-foreground">
                아직 등록된 프로젝트가 없습니다.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const techStackNames = getProjectTechStackNames(project)
                const previewTechStackNames = techStackNames.slice(0, TECH_STACK_PREVIEW_MAX_COUNT)
                const hasMoreTechStacks = techStackNames.length > TECH_STACK_PREVIEW_MAX_COUNT
                const isSelected = selectedProjectIdSet.has(String(project.projectId))
                const previewProjectName = truncateText(
                  project.projectName,
                  PROJECT_NAME_PREVIEW_MAX_LENGTH
                )
                const previewContent = truncateText(
                  project.content,
                  PROJECT_CONTENT_PREVIEW_MAX_LENGTH
                )

                return (
                  <Card
                    key={project.projectId}
                    className={`relative gap-0 overflow-hidden rounded-[24px] p-0 transition-all ${
                      isDeleteMode
                        ? 'cursor-pointer'
                        : 'cursor-pointer hover:-translate-y-0.5'
                    } border-[#F1E7EA] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:border-primary-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]`}
                    onClick={() => {
                      if (isDeleteMode) {
                        handleToggleProjectSelection(project.projectId)
                        return
                      }

                      navigate(`/portfolio/${project.projectId}`)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return

                      event.preventDefault()

                      if (isDeleteMode) {
                        handleToggleProjectSelection(project.projectId)
                        return
                      }

                      navigate(`/portfolio/${project.projectId}`)
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isDeleteMode ? isSelected : undefined}
                  >
                    <div className="absolute inset-x-5 top-0 h-px bg-[#F3E7EA]" />
                    <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-primary-100/60 blur-3xl" />
                    <div className="relative flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-500">
                        <FolderCode className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#212121]">
                              {previewProjectName}
                            </h3>
                          </div>
                          {!isDeleteMode && (
                            <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-primary-300" />
                          )}
                        </div>

                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {previewContent}
                        </p>

                        {techStackNames.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {previewTechStackNames.map((techStackName) => (
                              <span
                                key={`${project.projectId}-${techStackName}`}
                                className="inline-flex max-w-full rounded-full border border-[#F2E8EB] bg-[#FCFAFB] px-3 py-1 text-xs font-medium text-[#6B5E63]"
                              >
                                <span className="truncate">
                                  {truncateText(techStackName, TECH_STACK_PREVIEW_MAX_LENGTH)}
                                </span>
                              </span>
                            ))}
                            {hasMoreTechStacks && (
                              <span className="inline-flex rounded-full border border-[#F2E8EB] bg-[#FCFAFB] px-3 py-1 text-xs font-medium text-[#6B5E63]">
                                ...
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isDeleteMode && (
                        <span
                          className={`flex h-5 w-5 shrink-0 self-center items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-[#D6D6D6] bg-white text-transparent'
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  )
}

export default PortfolioManagement
