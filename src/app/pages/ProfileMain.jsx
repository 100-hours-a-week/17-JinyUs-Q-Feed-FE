import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import BottomNav from '@/app/components/BottomNav';
import { ChevronRight, Calendar, Target, Award, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/app/components/AppHeader';
import { useAnswersInfinite } from '@/app/hooks/useAnswersInfinite';

const ANSWER_TYPE_LABELS = {
    PRACTICE_INTERVIEW: '연습',
    REAL_INTERVIEW: '실전',
    PORTFOLIO_INTERVIEW: '포트폴리오',
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '-').replace('.', '');
};

const ProfileMain = () => {
    const navigate = useNavigate();
    const { nickname } = useAuth();
    const observerRef = useRef(null);

    const {
        data,
        isLoading,
        isFetchingNextPage,
        error,
        hasNextPage,
        fetchNextPage,
    } = useAnswersInfinite({ type: 'PRACTICE_INTERVIEW', expand: 'question,feedback' });

    const recentActivities = useMemo(
        () => data?.pages?.flatMap((p) => p.records) ?? [],
        [data]
    );

    const loading = isLoading || isFetchingNextPage;

    // IntersectionObserver for infinite scroll
    const observerCallback = useCallback(
        (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    useEffect(() => {
        const node = observerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(observerCallback, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        });

        observer.observe(node);
        return () => observer.disconnect();
    }, [observerCallback]);

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

                    {error && (
                        <Card className="p-4 text-center text-red-500">
                            데이터를 불러오는데 실패했습니다.
                        </Card>
                    )}

                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <Card key={activity.answerId} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                                        {ANSWER_TYPE_LABELS[activity.type] || activity.type}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(activity.answeredAt)}
                                    </span>
                                </div>

                                <h4 className="mb-2 text-sm">
                                    {activity.question?.content || '질문 정보 없음'}
                                </h4>

                                {activity.feedback?.feedbackAvailable && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                                                style={{ width: `${activity.feedback?.score || 0}%` }}
                                            />
                                        </div>
                                        {activity.feedback?.score !== undefined && (
                                            <span className="text-sm font-semibold text-pink-600">
                                                {activity.feedback.score}점
                                            </span>
                                        )}
                                    </div>
                                )}

                                {!activity.feedback?.feedbackAvailable && (
                                    <p className="text-xs text-muted-foreground">
                                        피드백 대기 중
                                    </p>
                                )}
                            </Card>
                        ))}

                        {loading && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                            </div>
                        )}

                        {!loading && !error && recentActivities.length === 0 && (
                            <Card className="p-8 text-center text-muted-foreground">
                                아직 학습 기록이 없습니다.
                            </Card>
                        )}

                        {!hasNextPage && recentActivities.length > 0 && (
                            <p className="text-center text-sm text-muted-foreground py-2">
                                모든 학습 기록을 불러왔습니다.
                            </p>
                        )}

                        <div ref={observerRef} className="h-1" />
                    </div>
                </section>
            </div>

            <BottomNav />
        </div>
    );
};

export default ProfileMain;
