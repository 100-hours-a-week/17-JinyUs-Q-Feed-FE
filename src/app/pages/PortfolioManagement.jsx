import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AppHeader } from '@/app/components/AppHeader';
import BottomNav from '@/app/components/BottomNav';
import { Plus, ChevronRight } from 'lucide-react';

const PortfolioManagement = () => {
  const navigate = useNavigate();

  // Mock data for projects (최대 3개)
  const [projects] = useState([
    {
      id: 1,
      name: '프로젝트 1',
      description: '프로젝트 축약 설명...',
      createdAt: '2025.12.29',
    },
    {
      id: 2,
      name: '프로젝트 2',
      description: '프로젝트 축약 설명...',
      createdAt: '2025.12.29',
    },
    {
      id: 3,
      name: '프로젝트 3',
      description: '프로젝트 축약 설명...',
      createdAt: '2025.12.29',
    },
  ]);

  const canAddMore = projects.length < 3;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="내 포트폴리오" onBack={() => navigate('/profile')} />

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {/* 프로젝트 등록 안내 카드 */}
        <Card className="p-5 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="mb-1 text-primary-700">프로젝트 등록하기</h3>
              <p className="text-sm text-primary-600">
                프로젝트는 3개까지 등록 가능합니다
              </p>
            </div>
            <Button
              onClick={() => navigate('/portfolio/add')}
              disabled={!canAddMore}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              등록
            </Button>
          </div>
        </Card>

        {/* 프로젝트 리스트 */}
        <section>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>아직 등록된 프로젝트가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/portfolio/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="px-3 py-1 bg-primary-100 border border-primary-200 rounded text-xs text-primary-600 font-medium">
                          {project.name}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {project.createdAt}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default PortfolioManagement;
