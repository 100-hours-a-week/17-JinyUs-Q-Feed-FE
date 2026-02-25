import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BottomNav from '@/app/components/BottomNav';
import { Settings, Calendar, Target, MessageSquare, Filter, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAnswersInfinite } from '@/app/hooks/useAnswersInfinite';
import { useUserStats } from '@/app/hooks/useUserStats.js';
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories';
import { useQuestionTypes } from '@/app/hooks/useQuestionTypes';
import { useWeeklyStats } from '@/app/hooks/useWeeklyStats';
import { useFeedbackFormDialog } from '@/app/hooks/useFeedbackFormDialog';
import {
    getQuestionCategoryColor,
    getQuestionCategoryLabel,
    getQuestionTypeLabel,
} from '@/app/constants/questionCategoryMeta';
import { INTERVIEW_TYPES, INTERVIEW_TYPE_LABELS } from '@/app/constants/interviewTaxonomy';

const ANSWER_TYPE_LABELS = INTERVIEW_TYPE_LABELS;

const ALL_FILTER_VALUE = 'ALL';
const MODE_OPTIONS = [
    { value: ALL_FILTER_VALUE, label: '전체' },
    { value: INTERVIEW_TYPES.PRACTICE, label: INTERVIEW_TYPE_LABELS[INTERVIEW_TYPES.PRACTICE] },
    { value: INTERVIEW_TYPES.REAL, label: INTERVIEW_TYPE_LABELS[INTERVIEW_TYPES.REAL] },
];
const SERVICE_LAUNCH_DATE = '2026-02-04';
const EMPTY_CATEGORY_MAP = Object.freeze({});

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
    const { data: categoryData } = useQuestionCategories();
    const { data: questionTypeMap = {} } = useQuestionTypes();
    const categoryMap = categoryData?.flat ?? EMPTY_CATEGORY_MAP;
    const categoriesByType = categoryData?.byType ?? EMPTY_CATEGORY_MAP;

    const observerRef = useRef(null);
    const modeDropdownRef = useRef(null);
    const typeDropdownRef = useRef(null);
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
    const [modeFilter, setModeFilter] = useState(ALL_FILTER_VALUE);
    const [questionTypeFilter, setQuestionTypeFilter] = useState(ALL_FILTER_VALUE);
    const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER_VALUE);
    const [isModeOpen, setIsModeOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const { open: openFeedbackDialog, dialog: feedbackDialog } = useFeedbackFormDialog();

    const modeValue = modeFilter === ALL_FILTER_VALUE ? undefined : modeFilter;
    const questionTypeValue =
        questionTypeFilter === ALL_FILTER_VALUE ? undefined : questionTypeFilter;
    const categoryValue = categoryFilter === ALL_FILTER_VALUE ? undefined : categoryFilter;

    const questionTypeOptions = useMemo(() => {
        const typeOptions = Object.keys(categoriesByType).map((typeKey) => ({
            value: typeKey,
            label: getQuestionTypeLabel(typeKey, questionTypeMap),
        }));
        return [{ value: ALL_FILTER_VALUE, label: '전체' }, ...typeOptions];
    }, [categoriesByType, questionTypeMap]);

    const categoryOptions = useMemo(() => {
        if (questionTypeFilter === ALL_FILTER_VALUE) {
            return [{ value: ALL_FILTER_VALUE, label: '전체' }];
        }

        const selectedTypeCategories = categoriesByType[questionTypeFilter];
        if (!selectedTypeCategories || typeof selectedTypeCategories !== 'object') {
            return [{ value: ALL_FILTER_VALUE, label: '전체' }];
        }

        return [
            { value: ALL_FILTER_VALUE, label: '전체' },
            ...Object.entries(selectedTypeCategories).map(([value, label]) => ({ value, label })),
        ];
    }, [categoriesByType, questionTypeFilter]);

    const requestScrollRestore = () => {
        scrollPositionRef.current = window.scrollY;
        shouldRestoreScrollRef.current = true;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
                setIsModeOpen(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
                setIsTypeOpen(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
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
        type: modeValue,
        questionType: questionTypeValue,
        category: categoryValue,
        dateFrom: debouncedDateRange.dateFrom,
        dateTo: debouncedDateRange.dateTo,
    });

    const recentActivities = useMemo(
        () => data?.pages?.flatMap((p) => p.records) ?? [],
        [data]
    );
    const visibleActivities = useMemo(
        () => recentActivities.filter((activity) =>
            activity?.type === INTERVIEW_TYPES.PRACTICE || activity?.type === INTERVIEW_TYPES.REAL
        ),
        [recentActivities]
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

    // 주간 목표 계산
    const totalThisWeek = weeklyStats?.total_this_week ?? 0;
    const weeklyGoal = 7; // 목표값
    const weeklyProgress = Math.min((totalThisWeek / weeklyGoal) * 100, 100);
    const remainingCount = Math.max(weeklyGoal - totalThisWeek, 0);

    return (
        <div className="profile-container">
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
                    <div className="profile-card-actions">
                        <button
                            className="settings-btn"
                            aria-label="설정"
                            onClick={() => navigate('/settings')}
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* 피드백 이벤트 광고 배너 (클릭 시 피드백 다이얼로그) */}
            <button
                type="button"
                className="profile-event-banner"
                onClick={openFeedbackDialog}
            >
                <p className="profile-event-banner__text">
                    <span className="profile-event-banner__highlight">피드백을 남긴 분 중 3명을 추첨</span>하여
                    <br />
                    <span className="profile-event-banner__gift">금액권 상품권 5천원권</span>을 지급합니다.
                </p>
            </button>

            {/* 통계 섹션 */}
            <section className="stats-section">
                <div className="stats-grid">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <StatCard
                                key={index}
                                icon={<Icon size={18} />}
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
                                        <div className="relative" ref={modeDropdownRef}>
                                            <button
                                                type="button"
                                                className="filter-select-btn"
                                                onClick={() => {
                                                    setIsTypeOpen(false);
                                                    setIsCategoryOpen(false);
                                                    setIsModeOpen((prev) => !prev);
                                                }}
                                            >
                                                {MODE_OPTIONS.find((option) => option.value === modeFilter)?.label ?? '전체'}
                                                <span className={`filter-arrow ${isModeOpen ? 'open' : ''}`}>▼</span>
                                            </button>

                                            {isModeOpen && (
                                                <div className="filter-dropdown">
                                                    {MODE_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            className={`filter-dropdown-item ${option.value === modeFilter ? 'active' : ''}`}
                                                            onClick={() => {
                                                                requestScrollRestore();
                                                                setModeFilter(option.value);
                                                                setIsModeOpen(false);
                                                            }}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">질문 타입</p>
                                        <div className="relative" ref={typeDropdownRef}>
                                            <button
                                                type="button"
                                                className="filter-select-btn"
                                                onClick={() => {
                                                    setIsModeOpen(false);
                                                    setIsCategoryOpen(false);
                                                    setIsTypeOpen((prev) => !prev);
                                                }}
                                            >
                                                {questionTypeOptions.find((option) => option.value === questionTypeFilter)?.label ?? '전체'}
                                                <span className={`filter-arrow ${isTypeOpen ? 'open' : ''}`}>▼</span>
                                            </button>

                                            {isTypeOpen && (
                                                <div className="filter-dropdown">
                                                    {questionTypeOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            className={`filter-dropdown-item ${option.value === questionTypeFilter ? 'active' : ''}`}
                                                            onClick={() => {
                                                                requestScrollRestore();
                                                                setQuestionTypeFilter(option.value);
                                                                setCategoryFilter(ALL_FILTER_VALUE);
                                                                setIsModeOpen(false);
                                                                setIsTypeOpen(false);
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
                                        <p className="text-xs text-muted-foreground">질문 카테고리</p>
                                        <div className="relative" ref={categoryDropdownRef}>
                                            <button
                                                type="button"
                                                className="filter-select-btn"
                                                onClick={() => {
                                                    if (questionTypeFilter === ALL_FILTER_VALUE) return;
                                                    setIsModeOpen(false);
                                                    setIsTypeOpen(false);
                                                    setIsCategoryOpen((prev) => !prev);
                                                }}
                                                disabled={questionTypeFilter === ALL_FILTER_VALUE}
                                            >
                                                {questionTypeFilter === ALL_FILTER_VALUE
                                                    ? '타입을 선택해주세요'
                                                    : (categoryOptions.find((option) => option.value === categoryFilter)?.label ?? '전체')}
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
                                onClick={() => {
                                    setIsModeOpen(false);
                                    setIsTypeOpen(false);
                                    setIsCategoryOpen(false);
                                    setShowFilterModal(false);
                                }}
                            >
                                적용
                            </button>
                        </div>
                    </div>
                )}

                {/* 필터 칩 */}
                <div className="space-y-2">
                    <div className="filter-chips">
                        {MODE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                className={`filter-chip ${modeFilter === option.value ? 'active' : ''}`}
                                onClick={() => {
                                    requestScrollRestore();
                                    setModeFilter(option.value);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="filter-chips">
                        {questionTypeOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`filter-chip ${questionTypeFilter === option.value ? 'active' : ''}`}
                                onClick={() => {
                                    requestScrollRestore();
                                    setQuestionTypeFilter(option.value);
                                    setCategoryFilter(ALL_FILTER_VALUE);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {questionTypeFilter !== ALL_FILTER_VALUE && (
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
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        데이터를 불러오는데 실패했습니다.
                    </div>
                )}

                {/* 학습 기록 리스트 */}
                <div className="history-list">
                    {visibleActivities.map((activity) => {
                        const categoryKey = activity.question?.category;
                        const categoryLabel = categoryKey
                            ? getQuestionCategoryLabel(categoryKey, categoryMap)
                            : null;
                        const categoryColor = categoryKey
                            ? getQuestionCategoryColor(categoryKey)
                            : null;
                        
                        return (
                            <HistoryItem
                                key={activity.answerId}
                                mode={ANSWER_TYPE_LABELS[activity.type] || activity.type}
                                category={categoryLabel}
                                categoryColor={categoryColor}
                                title={activity.question?.content || '질문 정보 없음'}
                                date={formatDate(activity.createdAt)}
                                feedbackAvailable={activity.feedback?.feedbackAvailable}
                                onClick={() => navigate(
                                    activity.type === INTERVIEW_TYPES.REAL
                                        ? `/profile/records/real/${activity.answerId}`
                                        : `/profile/records/${activity.answerId}`
                                )}
                            />
                        );
                    })}

                    {loading && (
                        <div className="loading-indicator">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        </div>
                    )}

                    {!loading && !error && visibleActivities.length === 0 && (
                        <div className="empty-state">
                            아직 학습 기록이 없습니다.
                        </div>
                    )}

                    {!hasNextPage && visibleActivities.length > 0 && (
                        <p className="end-message">
                            모든 학습 기록을 불러왔습니다.
                        </p>
                    )}

                    <div ref={observerRef} className="observer-target" />
                </div>
            </section>

            <div className="scroll-padding" />

            <BottomNav />

            {feedbackDialog}
        </div>
    );
};

export default ProfileMain;
