import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AppHeader } from '@/app/components/AppHeader';
import BottomNav from '@/app/components/BottomNav';
import { Pencil, Trash2, FileImage } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Mock data - 실제로는 API에서 가져와야 함
  const project = {
    id: id,
    name: '프로젝트 이름',
    techStack: '스프링부트, 리액트',
    architecture: '시스템_아키텍처_이미지.jpg',
    description: `해결한 문제 1
• N+1 문제

해결한 문제 2
• DB 조회 성능 속도 개선
  • redis 캐시 적용`,
    createdAt: '2025.12.29',
  };

  const handleDelete = () => {
    toast.success('삭제되었습니다');
    navigate('/portfolio');
  };

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
            <Trash2 className="w-5 h-5" />
          </Button>
        }
      />

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {/* 프로젝트명 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            프로젝트 이름
          </label>
          <Card className="p-4">
            <p className="text-sm">{project.name}</p>
          </Card>
        </section>

        {/* 기술 스택 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            기술 스택
          </label>
          <Card className="p-4">
            <p className="text-sm">{project.techStack}</p>
          </Card>
        </section>

        {/* 시스템 아키텍처 이미지 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            시스템 아키텍처
          </label>
          <Card className="p-4">
            <button className="flex items-center gap-2 text-sm text-primary hover:underline">
              <FileImage className="w-4 h-4" />
              <span className="underline">{project.architecture}</span>
            </button>
          </Card>
        </section>

        {/* 프로젝트 설명 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            해결한 문제 / 성과
          </label>
          <Card className="p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {project.description}
            </pre>
          </Card>
        </section>

        {/* 수정 버튼 */}
        <Button
          onClick={() => navigate(`/portfolio/edit/${id}`)}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
        >
          <Pencil className="w-4 h-4 mr-2" />
          수정
        </Button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default ProjectDetail;
