import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import BottomNav from '@/app/components/BottomNav';
import { Search, Filter } from 'lucide-react';
import { fetchQuestions, searchQuestions } from '@/api/questionApi';
import debounce from 'lodash/debounce';
import { useInfiniteScroll } from '@/app/hooks/useInfiniteScroll';
import { usePracticeQuestion } from '@/app/contexts/practiceQuestionContext.jsx';

import { AppHeader } from '@/app/components/AppHeader';

const INITIAL_SEARCH_QUERY = '';
const INITIAL_CATEGORY = '전체';
const INITIAL_SUB_CATEGORY = '전체';
const CATEGORY_OPTIONS = ['전체', 'CS기초', '시스템디자인'];
const CS_SUB_CATEGORY_OPTIONS = ['전체', '운영체제', '네트워크', '데이터베이스', '컴퓨터 구조', '자료구조', '알고리즘'];
const CS_CATEGORY_MAP = {
    운영체제: 'OS',
    네트워크: 'NETWORK',
    데이터베이스: 'DB',
    '컴퓨터 구조': 'COMPUTER_ARCHITECTURE',
    자료구조: 'DATA_STRUCTURE',
    알고리즘: 'ALGORITHM',
};
const CATEGORY_LABEL_MAP = {
    OS: '운영체제',
    NETWORK: '네트워크',
    DB: '데이터베이스',
    COMPUTER_ARCHITECTURE: '컴퓨터 구조',
    DATA_STRUCTURE: '자료구조',
    ALGORITHM: '알고리즘',
};
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 2;
const PAGE_SIZE = 10;
const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_LOADING_MORE = '더 불러오는 중...';
const TEXT_EMPTY = '검색 결과가 없습니다';
const TEXT_ERROR_FALLBACK = '질문 목록을 불러오지 못했습니다.';

const PracticeMain = () => {
    const navigate = useNavigate();
    const { setSelectedQuestion } = usePracticeQuestion();
    const [searchQuery, setSearchQuery] = useState(INITIAL_SEARCH_QUERY);
    const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORY);
    const [selectedSubCategory, setSelectedSubCategory] = useState(INITIAL_SUB_CATEGORY);
    const filtersRef = useRef({ query: '', type: undefined, category: undefined });
    const isFirstFilterLoad = useRef(true);

    useEffect(() => {
        setSelectedSubCategory(INITIAL_SUB_CATEGORY);
    }, [selectedCategory]);

    const fetchQuestionPage = useCallback(async ({ cursor = null, limit = PAGE_SIZE } = {}) => {
        const { query, type, category } = filtersRef.current;
        const response =
            query.length >= SEARCH_MIN_LENGTH
                ? await searchQuestions({ q: query, type, category, cursor, size: limit })
                : await fetchQuestions({ type, category, cursor, size: limit });

        const items = response?.data?.questions ?? [];
        const pagination = response?.data?.pagination ?? {};
        const records = items.map((question) => ({
            id: question.questionId ?? question.id,
            title: question.content ?? question.title ?? '',
            description: question.content ?? '',
            category: question.category ?? '',
            keywords: Array.isArray(question.keywords) ? question.keywords : [],
        }));

        return { data: { records, pagination } };
    }, []);

    const {
        data: questions,
        loading: isLoading,
        error,
        hasMore,
        observerRef,
        reset,
        refetch,
    } = useInfiniteScroll(fetchQuestionPage, { limit: PAGE_SIZE, enabled: true });
    const isLoadingMore = isLoading && questions.length > 0;

    useEffect(() => {
        const type =
            selectedCategory === 'CS기초'
                ? 'CS'
                : selectedCategory === '시스템디자인'
                    ? 'SYSTEM_DESIGN'
                    : undefined;
        const category =
            selectedCategory === 'CS기초' && selectedSubCategory !== INITIAL_SUB_CATEGORY
                ? CS_CATEGORY_MAP[selectedSubCategory]
                : undefined;
        filtersRef.current = { query: searchQuery.trim(), type, category };
    }, [searchQuery, selectedCategory, selectedSubCategory]);

    const debouncedReload = useMemo(
        () =>
            debounce(() => {
                reset();
                refetch();
            }, SEARCH_DEBOUNCE_MS),
        [reset, refetch]
    );

    useEffect(() => {
        if (isFirstFilterLoad.current) {
            isFirstFilterLoad.current = false;
            return () => debouncedReload.cancel();
        }

        debouncedReload();
        return () => debouncedReload.cancel();
    }, [searchQuery, selectedCategory, selectedSubCategory]);

    const errorMessage = error?.message || TEXT_ERROR_FALLBACK;

    const handleSelectQuestion = (question) => {
        setSelectedQuestion(question);
        navigate(`/practice/answer/${question.id}`);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <AppHeader title="연습 모드" onBack={() => navigate('/')} />

            <div className="bg-white sticky top-[56px] z-10 border-b">
                {/* Search */}
                <div className="px-4 py-4 max-w-lg mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="질문 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl bg-gray-50"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="px-4 pb-3 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {CATEGORY_OPTIONS.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                                className="rounded-full whitespace-nowrap"
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </div>
                {selectedCategory === 'CS기초' && (
                    <div className="px-4 pb-4 max-w-lg mx-auto">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {CS_SUB_CATEGORY_OPTIONS.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedSubCategory === category ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedSubCategory(category)}
                                    className="rounded-full whitespace-nowrap"
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Question List */}
            <div className="p-4 space-y-3 max-w-lg mx-auto">
                {isLoading && questions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>{TEXT_LOADING}</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-rose-500">
                        <p>{errorMessage}</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>{TEXT_EMPTY}</p>
                    </div>
                ) : (
                    <>
                        {questions.map((question) => (
                            <Card
                                key={question.id}
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleSelectQuestion(question)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                                        {CATEGORY_LABEL_MAP[question.category] || question.category}
                                    </Badge>
                                </div>

                                <h3 className="mb-2">{question.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {question.description}
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {question.keywords.slice(0, 3).map((keyword, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs px-2 py-1 bg-rose-50 text-rose-700 rounded-full"
                                        >
                                            #{keyword}
                                        </span>
                                    ))}
                                    {question.keywords.length > 3 && (
                                        <span className="text-xs px-2 py-1 text-gray-500">
                                            +{question.keywords.length - 3}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        ))}
                        {isLoadingMore && (
                            <div className="text-center py-6 text-muted-foreground">
                                <p>{TEXT_LOADING_MORE}</p>
                            </div>
                        )}
                        {hasMore && <div ref={observerRef} />}
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default PracticeMain;
