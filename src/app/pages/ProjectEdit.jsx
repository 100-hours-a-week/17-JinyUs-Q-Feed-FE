import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { AppHeader } from '@/app/components/AppHeader';
import BottomNav from '@/app/components/BottomNav';
import { Upload, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';

const ProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Mock initial data
  const initialData = {
    name: '프로젝트 1',
    techStack: '스프링부트, 리액트',
    architecture: { name: '시스템_아키텍처_이미지.jpg' },
    description: `해결한 문제 1
• N+1 문제

해결한 문제 2
• DB 조회 성능 속도 개선
  • redis 캐시 적용`,
  };

  const [formData, setFormData] = useState(initialData);

  const isFormValid =
    formData.name.trim() &&
    formData.techStack.trim() &&
    formData.description.trim();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('이미지는 5MB 이하만 가능합니다.');
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('jpg, jpeg, png, gif 형식만 업로드 가능합니다.');
        return;
      }

      setFormData({ ...formData, architecture: file });
      setIsModified(true);
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, architecture: null });
    setIsModified(true);
  };

  const handleBack = () => {
    if (isModified) {
      setShowExitDialog(true);
    } else {
      navigate(`/portfolio/${id}`);
    }
  };

  const handleSubmit = () => {
    toast.success('수정되었습니다');
    navigate(`/portfolio/${id}`);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setIsModified(true);
  };

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
            disabled={!isFormValid}
            className="text-primary-500 hover:text-primary-600 disabled:opacity-50"
          >
            완료
          </Button>
        }
      />

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {/* 프로젝트명 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            프로젝트 이름 *
          </label>
          <Input
            placeholder="프로젝트 이름을 작성해주세요."
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 30) {
                handleChange('name', value);
              }
            }}
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.name.length}/30자
          </p>
        </section>

        {/* 기술 스택 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            기술 스택 *
          </label>
          <Input
            placeholder="기술 스택을 작성해주세요(콤마로 구분)"
            value={formData.techStack}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 100) {
                handleChange('techStack', value);
              }
            }}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.techStack.length}/100자
          </p>
        </section>

        {/* 시스템 아키텍처 이미지 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            시스템 아키텍처
          </label>
          <Card className="p-4">
            {formData.architecture ? (
              <div className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">
                  {typeof formData.architecture === 'object'
                    ? formData.architecture.name
                    : formData.architecture}
                </span>
                <div className="flex gap-2 ml-2">
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-1" />
                        첨부하기
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    첨부하기
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </Card>
        </section>

        {/* 프로젝트 설명 */}
        <section>
          <label className="text-sm text-muted-foreground mb-2 block">
            해결한 문제 / 성과 *
          </label>
          <Textarea
            placeholder="프로젝트 간 겪은 문제와 해결 스토리를 적어주세요"
            value={formData.description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 1000) {
                handleChange('description', value);
              }
            }}
            maxLength={1000}
            rows={10}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.description.length}/1000자
          </p>
        </section>
      </div>

      {/* 이탈 확인 다이얼로그 */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              수정된 내용이 저장되지 않습니다.
            </AlertDialogTitle>
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
  );
};

export default ProjectEdit;
