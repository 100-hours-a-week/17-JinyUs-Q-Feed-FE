import { useNavigate } from 'react-router-dom';
import { Badge } from '@/app/components/ui/badge';
import BottomNav from '@/app/components/BottomNav';
import { Sparkles, TrendingUp, BookOpen, History, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRecommendedQuestion } from '@/app/hooks/useRecommendedQuestion';
import { useWeeklyStats } from '@/app/hooks/useWeeklyStats';
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories';

const TEXT_RECOMMENDATION_LOADING = '추천 질문을 불러오는 중...';
const TEXT_RECOMMENDATION_ERROR = '추천 질문을 불러오지 못했습니다.';
const TEXT_RECOMMENDATION_EMPTY = '오늘의 추천 질문이 없습니다';
const SHOW_REAL_INTERVIEW = import.meta.env.VITE_SHOW_REAL_INTERVIEW === 'true';

// 시간대별 인사말
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
};

// 요일 학습 기록 컴포넌트
const WeeklyChart = ({ data, maxValue, totalThisWeek }) => {
    const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;

    // 주간 기간 계산 (월요일 기준)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일을 0으로
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diff);
    
    const month = startOfWeek.getMonth() + 1;
    // 해당 월의 첫 번째 월요일 찾기
    const firstDayOfMonth = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 1);
    const firstMonday = new Date(firstDayOfMonth);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysToAdd = firstDayOfWeek === 0 ? 1 : 8 - firstDayOfWeek;
    firstMonday.setDate(1 + daysToAdd);
    
    // 현재 주가 몇 번째 주인지 계산
    const daysDiff = Math.floor((startOfWeek - firstMonday) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;

    // 데이터를 요일 순서대로 정렬
    const sortedData = DAYS.map((day, index) => {
        const dayData = data.find(d => d.day === day) || { count: 0, isToday: false };
        return {
            day,
            count: dayData.count,
            isToday: dayData.isToday || index === todayIndex,
        };
    });

    return (
        <div className="weekly-card">
            <div className="weekly-header">
                <span className="weekly-period">{month}월 {weekNumber}주차</span>
                <span className="weekly-stat">
                    <span className="weekly-count">{totalThisWeek}회</span> 완료
                </span>
            </div>
            <div className="weekly-chart">
                {sortedData.map((dayData, index) => {
                    const height = dayData.count > 0 
                        ? `${Math.min((dayData.count / maxValue) * 100, 100)}%` 
                        : '6px';

                    return (
                        <div key={dayData.day} className={`day-column ${dayData.isToday ? 'today' : ''}`}>
                            <div className="day-bar-container">
                                <div
                                    className={`day-bar ${dayData.count > 0 ? 'filled' : 'empty'}`}
                                    style={{ height }}
                                >
                                    {dayData.count > 0 && (
                                        <span className="bar-count">{dayData.count}</span>
                                    )}
                                </div>
                            </div>
                            <span className="day-label">{dayData.day}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 퀵 액션 버튼 컴포넌트
const QuickAction = ({ icon, label, description, color = 'var(--primary-500)', onClick }) => (
    <button className="quick-action" onClick={onClick} style={{ '--action-color': color }}>
        <div className="action-icon">{icon}</div>
        <div className="action-content">
            <span className="action-label">{label}</span>
            <span className="action-desc">{description}</span>
        </div>
        <ArrowRight className="action-arrow" />
    </button>
);

const Home = () => {
    const navigate = useNavigate();
    const { nickname } = useAuth();

    const { data: weeklyStatsData } = useWeeklyStats();
    const { data: categoryMap = {} } = useQuestionCategories();

    const today = new Date().toISOString().slice(0, 10);
    const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
    const EMPTY_WEEKLY = DAYS.map((day) => ({ day, count: 0, isToday: false }));

    const maxValue = weeklyStatsData?.max_value_for_chart ?? 3;
    const totalThisWeek = weeklyStatsData?.total_this_week ?? 0;

    const weeklyData = weeklyStatsData?.daily_stats
        ? weeklyStatsData.daily_stats.map((stat) => ({
              day: stat.day_of_week,
              count: stat.real_count,
              isToday: stat.date === today,
          }))
        : EMPTY_WEEKLY;

    const {
        data: todayQuestion,
        isLoading: isLoadingQuestion,
        error: questionError,
    } = useRecommendedQuestion();

    const handleStartPractice = () => {
        if (!todayQuestion?.id) return;
        navigate(`/practice/answer/${todayQuestion.id}`);
    };

    // 난이도 계산 (임시로 키워드 개수 기반)
    const difficulty = todayQuestion?.keywords?.length || 0;
    const difficultyLevel = difficulty <= 2 ? 1 : difficulty <= 4 ? 2 : 3;
    const difficultyText = difficultyLevel === 1 ? '초급' : difficultyLevel === 2 ? '중급' : '고급';

    return (
        <div className="home-container">
            {/* 인사 섹션 */}
            <section className="greeting-section">
                <div className="greeting-decoration" />
                <div className="greeting-content">
                    <h1 className="greeting-text">
                        {getGreeting()},<br />
                        {nickname}님
                    </h1>
                    <p className="greeting-sub">오늘도 한 걸음 더 성장해볼까요?</p>
                </div>
            </section>

            <div className="home-content">
                {/* 오늘의 추천 질문 */}
                <section className="section">
                    <div className="section-header">
                        <Sparkles className="section-icon" size={18} />
                        <h3 className="section-title">오늘의 추천 질문</h3>
                    </div>

                    <div className="question-card">
                        {isLoadingQuestion ? (
                            <div className="question-loading">
                                {TEXT_RECOMMENDATION_LOADING}
                            </div>
                        ) : questionError ? (
                            <div className="question-error">
                                {questionError?.message || TEXT_RECOMMENDATION_ERROR}
                            </div>
                        ) : !todayQuestion ? (
                            <div className="question-empty">
                                {TEXT_RECOMMENDATION_EMPTY}
                            </div>
                        ) : (
                            <>
                                <Badge 
                                    variant="default" 
                                    className="question-category"
                                >
                                    {categoryMap[todayQuestion?.category] || todayQuestion?.category || '추천'}
                                </Badge>
                                <p className="question-text">{todayQuestion?.title}</p>
                                <div className="question-footer">
                                    <div className="question-difficulty">
                                        <div className="difficulty-dots">
                                            {[1, 2, 3].map((level) => (
                                                <span
                                                    key={level}
                                                    className={`difficulty-dot ${level <= difficultyLevel ? 'active' : ''}`}
                                                />
                                            ))}
                                        </div>
                                        {difficultyText}
                                    </div>
                                    <button
                                        onClick={handleStartPractice}
                                        className="start-btn"
                                    >
                                        <Play size={16} />
                                        연습 시작
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* 이번 주 학습 기록 */}
                <section className="section">
                    <div className="section-header">
                        <TrendingUp className="section-icon" size={18} />
                        <h3 className="section-title">이번 주 학습</h3>
                    </div>

                    <div className="weekly-card-wrapper">
                        <WeeklyChart 
                            data={weeklyData} 
                            maxValue={maxValue}
                            totalThisWeek={totalThisWeek}
                        />
                    </div>
                </section>

                {/* 빠른 메뉴 */}
                <section className="section">
                    <div className="section-header">
                        <h3 className="section-title">바로가기</h3>
                    </div>

                    <div className="quick-actions">
                        <QuickAction
                            icon={<BookOpen size={22} />}
                            label="연습 모드"
                            description="카테고리별 면접 질문 연습"
                            color="var(--primary-500)"
                            onClick={() => navigate('/practice')}
                        />
                        <QuickAction
                            icon={<History size={22} />}
                            label="학습 히스토리"
                            description="지난 연습 기록 확인"
                            color="var(--accent-400)"
                            onClick={() => navigate('/profile')}
                        />
                    </div>
                </section>

                <div className="scroll-padding" />
            </div>

            <BottomNav />
        </div>
    );
};

export default Home;
