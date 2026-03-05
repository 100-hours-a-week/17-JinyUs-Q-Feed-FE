import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';

const ProjectAdd = () => {
  const navigate = useNavigate();
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    techStack: '',
    architecture: null,
    description: '',
  });

  const isFormValid =
    formData.name.trim() &&
    formData.techStack.trim() &&
    formData.description.trim();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('이미지는 5MB 이하만 가능합니다.');
        return;
      }

      // 파일 형식 체크
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('jpg, jpeg, png, gif 형식만 업로드 가능합니다.');
        return;
      }

      setFormData({ ...formData, architecture: file });
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, architecture: null });
  };

  const handleSubmit = () => {
    if (isFormValid) {
      setShowWarningDialog(true);
    }
  };

  const handleConfirm = () => {
    toast.success('프로젝트가 추가되었습니다');
    navigate('/portfolio');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="프로젝트 추가" onBack={() => navigate('/portfolio')} />

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
                setFormData({ ...formData, name: value });
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
                setFormData({ ...formData, techStack: value });
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
                  {formData.architecture.name}
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
                setFormData({ ...formData, description: value });
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

        {/* 추가하기 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50"
        >
          추가하기
        </Button>
      </div>

      {/* 제출 전 경고 모달 */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              프로젝트 제출 시 개인 정보가 포함된 내용은 반드시 제외해주세요!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              제출하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default ProjectAdd;
