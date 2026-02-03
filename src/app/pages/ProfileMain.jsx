import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import BottomNav from '@/app/components/BottomNav';
import { ChevronDown, ChevronRight, Calendar, Target, Award, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/app/components/AppHeader';
import { useAnswersInfinite } from '@/app/hooks/useAnswersInfinite';
import { useUserStats } from '@/app/hooks/useUserStats.js';
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories';

const SHOW_PORTFOLIO_INTERVIEW = import.meta.env.VITE_SHOW_PORTFOLIO_INTERVIEW === 'true';

const ANSWER_TYPE_LABELS = {
    PRACTICE_INTERVIEW: '연습',
    REAL_INTERVIEW: '실전',
    PORTFOLIO_INTERVIEW: '포트폴리오',
};

const MODE_OPTIONS = [{ value: 'PRACTICE_INTERVIEW', label: '연습' }];

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
    const today = new Date();
    const from = new Date(today);
    from.setMonth(from.getMonth() - 1);
    return {
        dateFrom: toDateInputValue(from),
        dateTo: toDateInputValue(today),
    };
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const match = dateString.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date
        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\. /g, '-')
        .replace('.', '');
};

const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const match = dateString.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0].replace(/-/g, '.');
    return dateString;
};

const ProfileMain = () => {
    const navigate = useNavigate();
    const { nickname } = useAuth();
    const { data: categoryMap = {} } = useQuestionCategories();

    const observerRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const scrollPositionRef = useRef(0);
    const shouldRestoreScrollRef = useRef(false);

    const [{ dateFrom, dateTo }] = useState(() => getDefaultDateRange());
    const [dateFromFilter, setDateFromFilter] = useState(dateFrom);
    const [dateToFilter, setDateToFilter] = useState(dateTo);
    const [debouncedDateRange, setDebouncedDateRange] = useState({
        dateFrom,
        dateTo,
    });
    const modeFilter = MODE_OPTIONS[0].value;
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const categoryValue = categoryFilter === 'ALL' ? undefined : categoryFilter;

    const categoryOptions = useMemo(
        () => [
            { value: 'ALL', label: '전체' },
            ...Object.entries(categoryMap).map(([value, label]) => ({ value, label })),
        ],
        [categoryMap]
    );

    const requestScrollRestore = () => {
        scrollPositionRef.current = window.scrollY;
        shouldRestoreScrollRef.current = true;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!categoryDropdownRef.current) return;
            if (!categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleDateFromChange = (value) => {
        requestScrollRestore();
        setDateFromFilter(value);
        if (dateToFilter && value && value > dateToFilter) {
            setDateToFilter(value);
        }
    };

    const handleDateToChange = (value) => {
        requestScrollRestore();
        setDateToFilter(value);
        if (dateFromFilter && value && value < dateFromFilter) {
            setDateFromFilter(value);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedDateRange({
                dateFrom: dateFromFilter,
                dateTo: dateToFilter,
            });
        }, 700);

        return () => clearTimeout(timer);
    }, [dateFromFilter, dateToFilter]);

    const {
        data,
        isLoading,
        isFetchingNextPage,
        error,
        hasNextPage,
        fetchNextPage
    } =
    useAnswersInfinite({
        type: modeFilter,
        category: categoryValue,
        dateFrom: debouncedDateRange.dateFrom,
        dateTo: debouncedDateRange.dateTo,
    });

    const recentActivities = useMemo(
        () => data?.pages?.flatMap((p) => p.records) ?? [],
        [data]
    );

    const loading = isLoading || isFetchingNextPage;

    useLayoutEffect(() => {
        if (!shouldRestoreScrollRef.current) return;
        if (isLoading || isFetchingNextPage) return;

        window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
        shouldRestoreScrollRef.current = false;
    }, [isLoading, isFetchingNextPage, data]);

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

    const { data: statsData } = useUserStats();
    const userStats = statsData?.data;

    const stats = [
        { icon: Calendar, label: '총 학습일', value: `${userStats?.distinct_days ?? '-'}일` },
        { icon: Target, label: '연습 횟수', value: `${userStats?.practice_mode_count ?? '-'}회` },
        { icon: Award, label: '총 답변 수', value: `${userStats?.total_questions_answered ?? '-'}개` },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <AppHeader
                title="프로필"
                showBack={false}
                showSettings
                onSetting={() => navigate('/settings')}
                showNotifications={false}
            />

            <div className="bg-gradient-to-br from-rose-400 to-pink-500 text-white max-w-lg mx-auto w-full">
                <div className="p-6 max-w-lg mx-auto">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20 border-4 border-white/30">
                            <AvatarFallback className="text-2xl bg-white text-pink-600">
                                {nickname?.[0]}
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
                {SHOW_PORTFOLIO_INTERVIEW && (
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
                )}

                {/* Recent Activities */}
                <section>
                    <h2 className="text-lg mb-3">최근 학습 기록</h2>

                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">모드</p>
                                <div className="relative">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between bg-input-background text-foreground"
                                        disabled
                                    >
                                        {MODE_OPTIONS.find((option) => option.value === modeFilter)?.label ??
                                            '연습'}
                                        <ChevronDown className="opacity-60" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">질문 카테고리</p>
                                <div className="relative" ref={categoryDropdownRef}>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between bg-input-background text-foreground"
                                        onClick={() => setIsCategoryOpen((prev) => !prev)}
                                        aria-haspopup="listbox"
                                        aria-expanded={isCategoryOpen}
                                    >
                                        {categoryOptions.find((option) => option.value === categoryFilter)
                                            ?.label ?? '전체'}
                                        <ChevronDown
                                            className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
                                        />
                                    </Button>

                                    {isCategoryOpen && (
                                        <Card className="absolute z-30 mt-2 w-full gap-0 p-1 shadow-lg">
                                            {categoryOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    className="w-full rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-rose-50"
                                                    onClick={() => {
                                                        requestScrollRestore();
                                                        setCategoryFilter(option.value);
                                                        setIsCategoryOpen(false);
                                                    }}
                                                    role="option"
                                                    aria-selected={option.value === categoryFilter}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">기간</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={formatDateDisplay(dateFromFilter)}
                                        readOnly
                                        className="text-[13px] pr-9 pointer-events-none"
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={dateFromFilter}
                                        onChange={(event) => handleDateFromChange(event.target.value)}
                                        onClick={(event) => event.currentTarget.showPicker?.()}
                                        min=""
                                        max={dateToFilter}
                                        className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
                                        aria-label="시작일"
                                    />
                                </div>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={formatDateDisplay(dateToFilter)}
                                        readOnly
                                        className="text-[13px] pr-9 pointer-events-none"
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={dateToFilter}
                                        onChange={(event) => handleDateToChange(event.target.value)}
                                        onClick={(event) => event.currentTarget.showPicker?.()}
                                        min={dateFromFilter}
                                        className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
                                        aria-label="종료일"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Card className="p-4 text-center text-red-500">
                            데이터를 불러오는데 실패했습니다.
                        </Card>
                    )}

                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <Card key={activity.answerId} className="p-2.5 overflow-x-hidden flex flex-col min-h-[88px]">
                                <div className="flex items-start justify-between gap-2 mb-0 shrink-0">
                                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 w-fit">
                                        {ANSWER_TYPE_LABELS[activity.type] || activity.type}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        {activity.question?.category && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-rose-50 text-rose-600 w-fit text-[11px]"
                                            >
                                                {categoryMap[activity.question.category] ||
                                                    activity.question.category}
                                            </Badge>
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(activity.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-1 items-center">
                                    <h4
                                        className="text-[15px] truncate pr-6"
                                        title={activity.question?.content || ''}
                                    >
                                        {activity.question?.content || '질문 정보 없음'}
                                    </h4>
                                </div>


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
