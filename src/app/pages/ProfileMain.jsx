import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BottomNav from '@/app/components/BottomNav';
import { Settings, Calendar, Target, MessageSquare, Filter, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAnswersInfinite } from '@/app/hooks/useAnswersInfinite';
import { useUserStats } from '@/app/hooks/useUserStats.js';
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories';
import { useWeeklyStats } from '@/app/hooks/useWeeklyStats';
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

const SHOW_PORTFOLIO_INTERVIEW = import.meta.env.VITE_SHOW_PORTFOLIO_INTERVIEW === 'true';

const ANSWER_TYPE_LABELS = {
    PRACTICE_INTERVIEW: '연습',
    REAL_INTERVIEW: '실전',
    PORTFOLIO_INTERVIEW: '포트폴리오',
};

const FEEDBACK_FORM_URL = 'https://forms.gle/nraq9VyYzQogYgFSA';
const MODE_OPTIONS = [{ value: 'PRACTICE_INTERVIEW', label: '연습' }];
const SERVICE_LAUNCH_DATE = '2026-02-04';
const TEXT_FEEDBACK_CONFIRM_TITLE = 'Q-Feed v1.0.0 사용 후기 설문';
const TEXT_FEEDBACK_CONFIRM_DESC = [
    'Q-Feed 사용해 주셔서 감사합니다! 🎙️',
    '베타 단계라 의견을 빠르게 반영하고 있어요.',
];
const TEXT_FEEDBACK_CONFIRM_POINTS = [
    '👍 좋았던 점',
    '🛠️ 불편했던 점',
    '🌱 바라는 점',
];
const TEXT_FEEDBACK_CONFIRM_FOOTER = '총 5문항 · 약 1분. 버튼을 누르면 새 창에서 구글폼이 열립니다.';
const TEXT_FEEDBACK_CONFIRM_ACTION = '예, 피드백 남길래요';
const TEXT_FEEDBACK_CONFIRM_CANCEL = '나중에 할게요';

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDefaultDateRange = (todayDate) => {
    const today = new Date(`${todayDate}T00:00:00`);
    const from = new Date(today);
    from.setMonth(from.getMonth() - 1);
    let dateFrom = toDateInputValue(from);
    if (dateFrom < SERVICE_LAUNCH_DATE) {
        dateFrom = SERVICE_LAUNCH_DATE;
    }

    if (dateFrom > todayDate) {
        dateFrom = todayDate;
    }

    return {
        dateFrom,
        dateTo: todayDate,
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

const formatCount = (value) => {
    if (value === null || value === undefined) return '-';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return '-';
    if (numericValue < 1000) return String(numericValue);

    const units = ['K', 'M', 'B', 'T'];
    let unitIndex = -1;
    let scaled = numericValue;

    while (scaled >= 1000 && unitIndex < units.length - 1) {
        scaled /= 1000;
        unitIndex += 1;
    }

    const precision = scaled >= 10 ? 0 : 1;
    const display = scaled.toFixed(precision).replace(/\.0$/, '');
    return `${display}${units[unitIndex]}`;
};

// 통계 카드 컴포넌트
const StatCard = ({ icon, label, value, unit }) => {
    const displayValue = formatCount(value);
    const showUnit = displayValue !== '-' && unit;

    return (
        <div className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
                <span className="stat-value">
                    {displayValue}{showUnit && <span className="stat-unit">{unit}</span>}
                </span>
                <span className="stat-label">{label}</span>
            </div>
        </div>
    );
};

// 학습 기록 아이템 컴포넌트
const HistoryItem = ({
    mode,
    category,
    categoryColor,
    title,
    date,
    feedbackAvailable,
    onClick,
}) => (
    <div
        className="history-item"
        onClick={onClick}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
            }
        }}
        role="button"
        tabIndex={0}
    >
        <div className="history-header">
            <span className="history-mode">{mode}</span>
            <div className="history-meta">
                {category && (
                    <span className="history-category" style={{ backgroundColor: categoryColor?.bg, color: categoryColor?.text }}>
                        {category}
                    </span>
                )}
                <span className="history-date">{date}</span>
            </div>
        </div>
        <p className="history-title">{title}</p>
        {!feedbackAvailable && (
            <p className="history-status">피드백 대기 중</p>
        )}
    </div>
);

const ProfileMain = () => {
    const navigate = useNavigate();
    const { nickname } = useAuth();
    const { data: categoryMap = {} } = useQuestionCategories();

    const observerRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const filterModalContentRef = useRef(null);
    const scrollPositionRef = useRef(0);
    const shouldRestoreScrollRef = useRef(false);

    const [accessDate] = useState(() => toDateInputValue(new Date()));
    const [{ dateFrom, dateTo }] = useState(() => getDefaultDateRange(accessDate));
    const [dateFromFilter, setDateFromFilter] = useState(dateFrom);
    const [dateToFilter, setDateToFilter] = useState(dateTo);
    const [debouncedDateRange, setDebouncedDateRange] = useState({
        dateFrom,
        dateTo,
    });
    const modeFilter = MODE_OPTIONS[0].value;
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showFeedbackConfirm, setShowFeedbackConfirm] = useState(false);

    const categoryValue = categoryFilter === 'ALL' ? undefined : categoryFilter;

    const categoryOptions = useMemo(
        () => [
            { value: 'ALL', label: '전체' },
            ...Object.entries(categoryMap).map(([value, label]) => ({ value, label })),
        ],
        [categoryMap]
    );

    const handleOpenFeedbackForm = () => {
        window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
        setShowFeedbackConfirm(false);
    };

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

    useEffect(() => {
        if (!showFilterModal) return;
        const originalOverflow = document.body.style.overflow;
        const originalTouchAction = document.body.style.touchAction;
        const originalOverscroll = document.body.style.overscrollBehavior;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.body.style.overscrollBehavior = 'none';

        const preventScroll = (event) => {
            const content = filterModalContentRef.current;
            if (content && content.contains(event.target)) return;
            event.preventDefault();
        };

        document.addEventListener('touchmove', preventScroll, { passive: false });
        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = originalTouchAction;
            document.body.style.overscrollBehavior = originalOverscroll;
            document.removeEventListener('touchmove', preventScroll);
        };
    }, [showFilterModal]);

    const handleDateFromChange = (value) => {
        const launchClampedFrom = value < SERVICE_LAUNCH_DATE ? SERVICE_LAUNCH_DATE : value;
        const clampedFrom = launchClampedFrom > accessDate ? accessDate : launchClampedFrom;
        requestScrollRestore();
        setDateFromFilter(clampedFrom);
        if (dateToFilter && clampedFrom && clampedFrom > dateToFilter) {
            setDateToFilter(clampedFrom);
        }
    };

    const handleDateToChange = (value) => {
        const upperCappedTo = value > accessDate ? accessDate : value;
        const cappedTo = upperCappedTo < SERVICE_LAUNCH_DATE ? SERVICE_LAUNCH_DATE : upperCappedTo;
        requestScrollRestore();
        setDateToFilter(cappedTo);
        if (dateFromFilter && cappedTo && cappedTo < dateFromFilter) {
            setDateFromFilter(cappedTo < SERVICE_LAUNCH_DATE ? SERVICE_LAUNCH_DATE : cappedTo);
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
    } = useAnswersInfinite({
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
    const { data: weeklyStatsData } = useWeeklyStats();
    const weeklyStats = weeklyStatsData?.data;

    const stats = [
        { icon: Calendar, label: '총 학습일', value: userStats?.distinct_days, unit: '일' },
        { icon: Target, label: '연습 횟수', value: userStats?.practice_mode_count, unit: '회' },
        { icon: MessageSquare, label: '총 답변 수', value: userStats?.total_questions_answered, unit: '개' },
    ];

    // 카테고리 색상 매핑
    const categoryColors = useMemo(() => {
        const colors = {
            '네트워크': { bg: '#E8F5E9', text: '#2E7D32' },
            '자료구조/알고리즘': { bg: '#E3F2FD', text: '#1565C0' },
            '데이터베이스': { bg: '#FFF3E0', text: '#E65100' },
            '운영체제': { bg: '#F3E5F5', text: '#7B1FA2' },
        };
        
        // categoryMap의 값들을 색상에 매핑
        const result = {};
        Object.values(categoryMap).forEach((label) => {
            result[label] = colors[label] || { bg: '#F5F5F5', text: '#616161' };
        });
        return result;
    }, [categoryMap]);

    // 주간 목표 계산
    const totalThisWeek = weeklyStats?.total_this_week ?? 0;
    const weeklyGoal = 7; // 목표값
    const weeklyProgress = Math.min((totalThisWeek / weeklyGoal) * 100, 100);
    const remainingCount = Math.max(weeklyGoal - totalThisWeek, 0);

    return (
        <div className="profile-container">
            {/* 헤더 */}
            <header className="profile-header">
                <h1 className="header-title">프로필</h1>
                <button 
                    className="settings-btn" 
                    aria-label="설정"
                    onClick={() => navigate('/settings')}
                >
                    <Settings size={20} />
                </button>
            </header>

            {/* 프로필 섹션 */}
            <section className="profile-section">
                <div className="profile-card">
                    <div className="avatar">{nickname?.[0] || 'U'}</div>
                    <div className="profile-info">
                        <h2 className="profile-name">{nickname || '사용자'}</h2>
                        <span className="profile-status">
                            <span className="status-dot"></span>
                            면접 준비 중
                        </span>
                    </div>
                    <button
                        type="button"
                        className="btn-secondary text-xs px-3 py-2"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => setShowFeedbackConfirm(true)}
                    >
                        피드백 남기기
                    </button>
                </div>
            </section>

            {/* 통계 섹션 */}
            <section className="stats-section">
                <div className="stats-grid">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <StatCard
                                key={index}
                                icon={<Icon size={24} />}
                                label={stat.label}
                                value={stat.value}
                                unit={stat.unit}
                            />
                        );
                    })}
                </div>
            </section>

            {/* 성장 지표 */}
            <section className="growth-section">
                <div className="growth-card">
                    <div className="growth-header">
                        <span className="growth-title">이번 주 학습 목표</span>
                        <span className="growth-badge">
                            <TrendingUp size={16} />
                            {Math.round(weeklyProgress)}%
                        </span>
                    </div>
                    <div className="growth-progress">
                        <div 
                            className="growth-fill" 
                            style={{ width: `${weeklyProgress}%` }}
                        ></div>
                    </div>
                    <div className="growth-footer">
                        <span>{weeklyGoal}회 중 {totalThisWeek}회 완료</span>
                        <span>{remainingCount}회 남음</span>
                    </div>
                </div>
            </section>

            {/* 학습 기록 섹션 */}
            <section className="history-section">
                <div className="section-header">
                    <h3 className="section-title">최근 학습 기록</h3>
                    <button 
                        className="filter-btn"
                        onClick={() => setShowFilterModal(!showFilterModal)}
                    >
                        <Filter size={16} />
                        필터
                    </button>
                </div>

                {/* 필터 모달 */}
                {showFilterModal && (
                    <div 
                        className="filter-modal"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowFilterModal(false);
                            }
                        }}
                    >
                        <div
                            className="filter-modal-content"
                            ref={filterModalContentRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-3 mb-4">
                                <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">모드</p>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                className="filter-select-btn"
                                                disabled
                                            >
                                                {MODE_OPTIONS.find((option) => option.value === modeFilter)?.label ?? '연습'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">질문 카테고리</p>
                                        <div className="relative" ref={categoryDropdownRef}>
                                            <button
                                                type="button"
                                                className="filter-select-btn"
                                                onClick={() => setIsCategoryOpen((prev) => !prev)}
                                            >
                                                {categoryOptions.find((option) => option.value === categoryFilter)?.label ?? '전체'}
                                                <span className={`filter-arrow ${isCategoryOpen ? 'open' : ''}`}>▼</span>
                                            </button>

                                            {isCategoryOpen && (
                                                <div className="filter-dropdown">
                                                    {categoryOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            className={`filter-dropdown-item ${option.value === categoryFilter ? 'active' : ''}`}
                                                            onClick={() => {
                                                                requestScrollRestore();
                                                                setCategoryFilter(option.value);
                                                                setIsCategoryOpen(false);
                                                            }}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">기간</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formatDateDisplay(dateFromFilter)}
                                                readOnly
                                                className="filter-date-input"
                                            />
                                            <Calendar className="filter-date-icon" size={16} />
                                            <input
                                                type="date"
                                                value={dateFromFilter}
                                                onChange={(event) => handleDateFromChange(event.target.value)}
                                                onClick={(event) => event.currentTarget.showPicker?.()}
                                                min={SERVICE_LAUNCH_DATE}
                                                max={dateToFilter > accessDate ? accessDate : dateToFilter}
                                                className="filter-date-picker"
                                                aria-label="시작일"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formatDateDisplay(dateToFilter)}
                                                readOnly
                                                className="filter-date-input"
                                            />
                                            <Calendar className="filter-date-icon" size={16} />
                                            <input
                                                type="date"
                                                value={dateToFilter}
                                                onChange={(event) => handleDateToChange(event.target.value)}
                                                onClick={(event) => event.currentTarget.showPicker?.()}
                                                min={dateFromFilter < SERVICE_LAUNCH_DATE ? SERVICE_LAUNCH_DATE : dateFromFilter}
                                                max={accessDate}
                                                className="filter-date-picker"
                                                aria-label="종료일"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="filter-close-btn"
                                onClick={() => setShowFilterModal(false)}
                            >
                                적용
                            </button>
                        </div>
                    </div>
                )}

                {/* 필터 칩 */}
                <div className="filter-chips">
                    {categoryOptions.map((option) => (
                        <button
                            key={option.value}
                            className={`filter-chip ${categoryFilter === option.value ? 'active' : ''}`}
                            onClick={() => {
                                requestScrollRestore();
                                setCategoryFilter(option.value);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="error-message">
                        데이터를 불러오는데 실패했습니다.
                    </div>
                )}

                {/* 학습 기록 리스트 */}
                <div className="history-list">
                    {recentActivities.map((activity) => {
                        const categoryLabel = activity.question?.category 
                            ? (categoryMap[activity.question.category] || activity.question.category)
                            : null;
                        const categoryColor = categoryLabel ? categoryColors[categoryLabel] : null;
                        
                        return (
                            <HistoryItem
                                key={activity.answerId}
                                mode={ANSWER_TYPE_LABELS[activity.type] || activity.type}
                                category={categoryLabel}
                                categoryColor={categoryColor}
                                title={activity.question?.content || '질문 정보 없음'}
                                date={formatDate(activity.createdAt)}
                                feedbackAvailable={activity.feedback?.feedbackAvailable}
                                onClick={() => navigate(`/profile/records/${activity.answerId}`)}
                            />
                        );
                    })}

                    {loading && (
                        <div className="loading-indicator">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        </div>
                    )}

                    {!loading && !error && recentActivities.length === 0 && (
                        <div className="empty-state">
                            아직 학습 기록이 없습니다.
                        </div>
                    )}

                    {!hasNextPage && recentActivities.length > 0 && (
                        <p className="end-message">
                            모든 학습 기록을 불러왔습니다.
                        </p>
                    )}

                    <div ref={observerRef} className="observer-target" />
                </div>
            </section>

            <div className="scroll-padding" />

            <BottomNav />

            <AlertDialog open={showFeedbackConfirm} onOpenChange={setShowFeedbackConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{TEXT_FEEDBACK_CONFIRM_TITLE}</AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] leading-snug">
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    {TEXT_FEEDBACK_CONFIRM_DESC.map((line) => (
                                        <p key={line}>{line}</p>
                                    ))}
                                </div>
                                <ul className="space-y-1">
                                    {TEXT_FEEDBACK_CONFIRM_POINTS.map((point) => (
                                        <li key={point} className="leading-snug">
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-muted-foreground">{TEXT_FEEDBACK_CONFIRM_FOOTER}</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{TEXT_FEEDBACK_CONFIRM_CANCEL}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleOpenFeedbackForm}>
                            {TEXT_FEEDBACK_CONFIRM_ACTION}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProfileMain;
