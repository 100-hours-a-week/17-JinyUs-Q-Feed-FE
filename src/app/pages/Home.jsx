import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import BottomNav from '@/app/components/BottomNav';
import { QUESTIONS } from '@/data/questions';
import { Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { storage } from '@/utils/storage';

import { AppHeader } from '@/app/components/AppHeader';

const Home = () => {
    const navigate = useNavigate();
    const nickname = storage.getNickname();

    // 랜덤 추천 질문
    const todayQuestion = useMemo(() => {
        return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    }, []);

    // 이번 주 학습 기록 (더미 데이터)
    const weeklyData = useMemo(() => {
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        return days.map((day, index) => ({
            day,
            count: Math.floor(Math.random() * 5),
            isToday: index === new Date().getDay() - 1,
        }));
    }, []);

    const handleStartPractice = () => {
        navigate(`/practice/answer/${todayQuestion.id}`);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <AppHeader title="Q-Feed" showBack={false} />

            <div className="bg-gradient-to-br from-rose-400 to-pink-500 text-white max-w-lg mx-auto w-full">
                <div className="p-6 max-w-lg mx-auto">
                    <h1 className="text-2xl mb-1">안녕하세요, {nickname}님!</h1>
                    <p className="text-rose-100 text-sm">오늘도 면접 준비를 시작해볼까요?</p>
                </div>
            </div>

            <div className="p-6 space-y-6 max-w-lg mx-auto">
                {/* 오늘의 추천 질문 */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                        <h2 className="text-lg">오늘의 추천 질문</h2>
                    </div>

                    <Card className="p-5 border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white">
                        <div className="flex items-start justify-between mb-3">
                            <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                                {todayQuestion.category}
                            </Badge>
                            <Badge variant="outline">{todayQuestion.difficulty}</Badge>
                        </div>

                        <h3 className="mb-2">{todayQuestion.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {todayQuestion.description}
                        </p>

                        <Button
                            onClick={handleStartPractice}
                            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                        >
                            지금 연습하기
                        </Button>
                    </Card>
                </section>

                {/* 이번 주 학습 기록 */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg">이번 주 학습 기록</h2>
                    </div>

                    <Card className="p-5">
                        <div className="flex justify-between items-end gap-2 h-32">
                            {weeklyData.map((data, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2">
                                    <div
                                        className={`w-full rounded-t-lg transition-all ${data.isToday
                                                ? 'bg-gradient-to-t from-pink-500 to-rose-400'
                                                : 'bg-gradient-to-t from-gray-300 to-gray-200'
                                            }`}
                                        style={{ height: `${Math.max(data.count * 20, 8)}%` }}
                                    />
                                    <span className={`text-xs ${data.isToday ? 'text-pink-600 font-semibold' : 'text-muted-foreground'}`}>
                                        {data.day}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                            <span className="text-muted-foreground">이번 주 총</span>
                            <span className="font-semibold text-pink-600">
                                {weeklyData.reduce((acc, d) => acc + d.count, 0)}번 연습
                            </span>
                        </div>
                    </Card>
                </section>

                {/* 빠른 메뉴 */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg">빠른 메뉴</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 rounded-xl"
                            onClick={() => navigate('/practice')}
                        >
                            <span className="text-2xl">📚</span>
                            <span className="text-sm">연습 모드</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 rounded-xl"
                            onClick={() => navigate('/real-interview')}
                        >
                            <span className="text-2xl">🎯</span>
                            <span className="text-sm">실전 모드</span>
                        </Button>
                    </div>
                </section>
            </div>

            <BottomNav />
        </div>
    );
};

export default Home;
