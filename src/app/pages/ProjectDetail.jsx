import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { AppHeader } from '@/app/components/AppHeader'
import BottomNav from '@/app/components/BottomNav'
import ProjectDescriptionGuideDialog from '@/app/components/ProjectDescriptionGuideDialog'
import { fetchS3ResourceBlob } from '@/api/fileApi'
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
  findPortfolioProjectById,
  findPortfolioProjectIndex,
  getImageFileName,
  getProjectTechStackNames,
  resolvePortfolioErrorMessage,
  toPortfolioProjectPayload,
} from '@/app/utils/portfolio'
import {
  useDeletePortfolio,
  usePortfolio,
  useReplacePortfolio,
} from '@/app/hooks/usePortfolio'
import { Download, Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const ProjectDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDownloadingArchitecture, setIsDownloadingArchitecture] = useState(false)

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
  const project = findPortfolioProjectById(projects, id)
  const projectIndex = findPortfolioProjectIndex(projects, id)
  const techStackNames = getProjectTechStackNames(project)
  const isDeleting =
    replacePortfolioMutation.isPending || deletePortfolioMutation.isPending

  const handleArchitectureDownload = async () => {
    if (!project?.architectureImageUrl || isDownloadingArchitecture) return

    setIsDownloadingArchitecture(true)

    try {
      const blob = await fetchS3ResourceBlob(project.architectureImageUrl)
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = getImageFileName(project.architectureImageUrl) || 'architecture-image'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch {
      toast.error('시스템 아키텍처 이미지 다운로드에 실패했습니다.')
    } finally {
      setIsDownloadingArchitecture(false)
    }
  }

  const handleDelete = async () => {
    if (!project || projectIndex < 0) return

    try {
      if (projects.length <= 1) {
        await deletePortfolioMutation.mutateAsync()
      } else {
        await replacePortfolioMutation.mutateAsync({
          projects: projects
            .filter((_, index) => index !== projectIndex)
            .map(toPortfolioProjectPayload),
        })
      }

      toast.success('삭제되었습니다.')
      navigate('/portfolio', { replace: true })
    } catch (deleteError) {
      toast.error(resolvePortfolioErrorMessage(deleteError, '삭제에 실패했습니다.'))
    } finally {
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="내 프로젝트 확인" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">프로젝트를 불러오는 중입니다.</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="내 프로젝트 확인" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="mb-4 text-sm text-muted-foreground">
              {error?.message || '프로젝트를 불러오지 못했습니다.'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader title="내 프로젝트 확인" onBack={() => navigate('/portfolio')} />
        <div className="mx-auto max-w-lg p-6">
          <div className="rounded-2xl border border-[#F3F3F3] bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="mb-4 text-sm text-muted-foreground">
              요청한 프로젝트를 찾을 수 없습니다.
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader
        title="내 프로젝트 확인"
        onBack={() => navigate('/portfolio')}
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        }
      />

      <div className="mx-auto max-w-lg space-y-6 p-6">
        <section>
          <label className="mb-2 block text-sm text-muted-foreground">
            프로젝트 이름
          </label>
          <Card className="p-4">
            <p className="text-sm break-words [overflow-wrap:anywhere]">
              {project.projectName}
            </p>
          </Card>
        </section>

        <section>
          <label className="mb-2 block text-sm text-muted-foreground">
            기술 스택
          </label>
          <Card className="p-4">
            {techStackNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {techStackNames.map((techStackName) => (
                  <span
                    key={techStackName}
                    className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    {techStackName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm break-words text-muted-foreground [overflow-wrap:anywhere]">
                등록된 기술 스택이 없습니다.
              </p>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm text-muted-foreground">
              해결한 문제 / 성과
            </label>
            <ProjectDescriptionGuideDialog />
          </div>
          <Card className="p-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm [overflow-wrap:anywhere]">
              {project.content}
            </pre>
          </Card>
        </section>

        <section>
          <label className="mb-2 block text-sm text-muted-foreground">
            시스템 아키텍처
          </label>
          <Card className="gap-4 p-4">
            {project.architectureImageUrl ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleArchitectureDownload}
                  disabled={isDownloadingArchitecture}
                  className="w-fit"
                >
                  {isDownloadingArchitecture ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  이미지 다운로드
                </Button>
                <img
                  src={project.architectureImageUrl}
                  alt="시스템 아키텍처"
                  className="max-h-72 w-full rounded-xl border border-[#F3F3F3] object-contain"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                등록된 시스템 아키텍처 이미지가 없습니다.
              </p>
            )}
          </Card>
        </section>

        <Button
          onClick={() => navigate(`/portfolio/edit/${project.projectId}`)}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700"
        >
          <Pencil className="mr-2 h-4 w-4" />
          수정
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '삭제 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  )
}

export default ProjectDetail
