import { useNavigate } from 'react-router-dom'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { AppHeader } from '@/app/components/AppHeader'
import BottomNav from '@/app/components/BottomNav'
import { MAX_PORTFOLIO_PROJECTS, getProjectTechStackNames } from '@/app/utils/portfolio'
import { usePortfolio } from '@/app/hooks/usePortfolio'
import { ChevronRight, Loader2, Plus, RefreshCw } from 'lucide-react'

const PortfolioManagement = () => {
  const navigate = useNavigate()
  const {
    data: portfolio,
    isLoading,
    isError,
    error,
    refetch,
  } = usePortfolio()

  const projects = portfolio?.projects ?? []
  const canAddMore = projects.length < MAX_PORTFOLIO_PROJECTS

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="내 포트폴리오" onBack={() => navigate('/profile')} />

      <div className="mx-auto max-w-lg space-y-6 p-6">
        <Card className="border-primary-200 bg-primary-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 text-primary-700">프로젝트 등록하기</h3>
              <p className="text-sm text-primary-600">
                {projects.length}/{MAX_PORTFOLIO_PROJECTS}개 등록됨
              </p>
            </div>
            <Button
              onClick={() => navigate('/portfolio/add')}
              disabled={!canAddMore}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              등록
            </Button>
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

                return (
                  <Card
                    key={project.projectId}
                    className="cursor-pointer p-5 transition-shadow hover:shadow-md"
                    onClick={() => navigate(`/portfolio/${project.projectId}`)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 inline-flex rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                          {project.projectName}
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {project.content}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    </div>

                    {techStackNames.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {techStackNames.join(' · ')}
                      </p>
                    )}
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
