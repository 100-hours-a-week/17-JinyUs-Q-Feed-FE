import { useNavigate } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import BottomNav from '@/app/components/BottomNav';
import { Settings, ChevronRight, Calendar, Target, Award } from 'lucide-react';
import { storage } from '@/utils/storage';

import { AppHeader } from '@/app/components/AppHeader';

const ProfileMain = () => {
    const navigate = useNavigate();
    const nickname = storage.getNickname();

    const recentActivities = [
        {
            id: 1,
            type: '연습',
            title: '프로세스와 스레드의 차이점',
            date: '2024-01-18',
            score: 85,
        },
        {
            id: 2,
            type: '연습',
            title: 'HTTP와 HTTPS의 차이',
            date: '2024-01-17',
            score: 92,
        },
        {
            id: 3,
            type: '연습',
            title: 'RESTful API의 특징',
            date: '2024-01-16',
            score: 78,
        },
    ];

    const stats = [
        { icon: Calendar, label: '총 학습일', value: '12일' },
        { icon: Target, label: '연습 횟수', value: '24회' },
        { icon: Award, label: '평균 점수', value: '85점' },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <AppHeader title="프로필" showBack={false} onNotification={() => navigate('/settings')} />

            <div className="bg-gradient-to-br from-rose-400 to-pink-500 text-white max-w-lg mx-auto w-full">
                <div className="p-6 max-w-lg mx-auto">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20 border-4 border-white/30">
                            <AvatarFallback className="text-2xl bg-white text-pink-600">
                                {nickname[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <h2 className="text-xl mb-1">{nickname}</h2>
                            <Badge className="bg-white/20 text-white border-white/30">
                                면접 준비 중
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-6">
                {/* Stats */}
                <section>
                    <div className="grid grid-cols-3 gap-3">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={index} className="p-4 text-center">
                                    <Icon className="w-6 h-6 mx-auto mb-2 text-pink-600" />
                                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                    <p className="font-semibold">{stat.value}</p>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* Portfolio Management */}
                <Card className="p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="mb-1">포트폴리오 관리</h3>
                            <p className="text-sm text-muted-foreground">개인화된 질문을 받아보세요</p>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </Card>

                {/* Recent Activities */}
                <section>
                    <h2 className="text-lg mb-3">최근 학습 기록</h2>

                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <Card key={activity.id} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                                        {activity.type}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">{activity.date}</span>
                                </div>

                                <h4 className="mb-2 text-sm">{activity.title}</h4>

                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                                            style={{ width: `${activity.score}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-pink-600">
                                        {activity.score}점
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            <BottomNav />
        </div>
    );
};

export default ProfileMain;
