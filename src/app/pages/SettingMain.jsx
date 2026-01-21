import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
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
import { ArrowLeft, Bell, HelpCircle, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import { useState } from 'react';

import { AppHeader } from '@/app/components/AppHeader';

const SettingMain = () => {
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        storage.clear();
        toast.success('로그아웃되었습니다');
        navigate('/login', { replace: true });
    };

    const handleDeleteAccount = () => {
        storage.clear();
        toast.success('계정이 삭제되었습니다');
        navigate('/login', { replace: true });
    };

    const settingGroups = [
        {
            title: '알림',
            items: [
                {
                    icon: Bell,
                    label: '푸시 알림',
                    action: (
                        <Switch
                            checked={notifications}
                            onCheckedChange={setNotifications}
                        />
                    ),
                },
            ],
        },
        {
            title: '고객센터',
            items: [
                {
                    icon: HelpCircle,
                    label: '자주 묻는 질문',
                    action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
                    onClick: () => toast.info('FAQ 페이지로 이동합니다'),
                },
                {
                    icon: HelpCircle,
                    label: '문의하기',
                    action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
                    onClick: () => toast.info('문의 페이지로 이동합니다'),
                },
            ],
        },
        {
            title: '기타',
            items: [
                {
                    icon: LogOut,
                    label: '로그아웃',
                    onClick: () => setShowLogoutDialog(true),
                    textColor: 'text-foreground',
                },
                {
                    icon: Trash2,
                    label: '회원 탈퇴',
                    onClick: () => setShowDeleteDialog(true),
                    textColor: 'text-destructive',
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-12">
            <AppHeader title="설정" onBack={() => navigate('/profile')} />

            <div className="p-6 max-w-lg mx-auto space-y-6">
                {settingGroups.map((group, groupIndex) => (
                    <section key={groupIndex}>
                        <h2 className="text-sm text-muted-foreground mb-3 px-2">{group.title}</h2>

                        <Card className="divide-y">
                            {group.items.map((item, itemIndex) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={itemIndex}
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={item.onClick}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 ${item.textColor || 'text-muted-foreground'}`} />
                                            <span className={item.textColor || 'text-foreground'}>{item.label}</span>
                                        </div>
                                        {item.action}
                                    </div>
                                );
                            })}
                        </Card>
                    </section>
                ))}

                <div className="text-center text-sm text-muted-foreground pt-4">
                    <p>Q-Feed v1.0.0</p>
                    <p className="mt-1">© 2024 Q-Feed. All rights reserved.</p>
                </div>
            </div>

            {/* Logout Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            다시 로그인하여 서비스를 이용할 수 있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            모든 학습 기록과 데이터가 삭제되며, 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            탈퇴하기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SettingMain;
