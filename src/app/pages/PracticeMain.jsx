import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import BottomNav from '@/app/components/BottomNav';
import { Search, Filter } from 'lucide-react';
import debounce from 'lodash/debounce';
import { usePracticeQuestion } from '@/context/practiceQuestionContext.jsx';
import { useQuestionsInfinite } from '@/app/hooks/useQuestionsInfinite';
import { useQuestionCategories } from '@/app/hooks/useQuestionCategories';
import { useQuestionTypes } from '@/app/hooks/useQuestionTypes';
import { getQuestionCategoryLabel, getQuestionTypeLabel } from '@/app/constants/questionCategoryMeta';

import { AppHeader } from '@/app/components/AppHeader';

const INITIAL_SEARCH_QUERY = '';
const ALL_FILTER_VALUE = 'ALL';
const ALL_FILTER_LABEL = '전체';
const SEARCH_DEBOUNCE_MS = 300;
const TEXT_LOADING = '질문을 불러오는 중...';
const TEXT_LOADING_MORE = '더 불러오는 중...';
const TEXT_EMPTY = '검색 결과가 없습니다';
const TEXT_ERROR_FALLBACK = '질문 목록을 불러오지 못했습니다.';
const EMPTY_MAP = Object.freeze({});

const PracticeMain = () => {
    const navigate = useNavigate();
    const { setSelectedQuestion } = usePracticeQuestion();
    const [searchQuery, setSearchQuery] = useState(INITIAL_SEARCH_QUERY);
    const [debouncedQuery, setDebouncedQuery] = useState(INITIAL_SEARCH_QUERY);
    const [selectedType, setSelectedType] = useState(ALL_FILTER_VALUE);
    const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER_VALUE);
    const observerRef = useRef(null);

    useEffect(() => {
        setSelectedQuestion(ALL_FILTER_VALUE);
    }, [setSelectedQuestion]);

    const handleTypeChange = useCallback((nextType) => {
        setSelectedType(nextType);
        setSelectedCategory(ALL_FILTER_VALUE);
    }, []);

    const debouncedSetQuery = useMemo(
        () => debounce((value) => setDebouncedQuery(value.trim()), SEARCH_DEBOUNCE_MS),
        []
    );

    useEffect(() => {
        debouncedSetQuery(searchQuery);
        return () => debouncedSetQuery.cancel();
    }, [searchQuery, debouncedSetQuery]);

    const { data: categoryData } = useQuestionCategories();
    const { data: typeMap = {} } = useQuestionTypes();
    const categoryMap = categoryData?.flat ?? EMPTY_MAP;
    const categoriesByType = categoryData?.byType ?? EMPTY_MAP;

    const typeOptions = Object.keys(categoriesByType).map((typeKey) => ({
        value: typeKey,
        label: getQuestionTypeLabel(typeKey, typeMap),
    }));

    const selectedTypeCategories =
        selectedType === ALL_FILTER_VALUE ? null : categoriesByType[selectedType];

    const categoryOptions =
        selectedTypeCategories && typeof selectedTypeCategories === 'object'
            ? Object.entries(selectedTypeCategories).map(([value, label]) => ({
                  value,
                  label: typeof label === 'string' ? label : value,
              }))
            : [];

    const {
        data,
        isLoading,
        isFetchingNextPage,
        error,
        hasNextPage,
        fetchNextPage,
    } = useQuestionsInfinite({
        query: debouncedQuery,
        type: selectedType === ALL_FILTER_VALUE ? undefined : selectedType,
        category: selectedCategory === ALL_FILTER_VALUE ? undefined : selectedCategory,
    });

    const questions = useMemo(
        () => data?.pages?.flatMap((p) => p.records) ?? [],
        [data]
    );

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

    const errorMessage = error?.message || TEXT_ERROR_FALLBACK;

    const handleSelectQuestion = (question) => {
        setSelectedQuestion(question);
        navigate(`/practice/answer/${question.id}`);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20">

            <div className="bg-white sticky top-[56px] z-10">
                {/* Search */}
                <div className="px-4 py-4 max-w-lg mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="질문 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-lg bg-gray-50"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="px-4 pb-3 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <button
                            type="button"
                            onClick={() => handleTypeChange(ALL_FILTER_VALUE)}
                            className={`filter-chip ${
                                selectedType === ALL_FILTER_VALUE ? 'active' : ''
                            }`}
                        >
                            {ALL_FILTER_LABEL}
                        </button>
                        {typeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleTypeChange(option.value)}
                                className={`filter-chip ${
                                    selectedType === option.value ? 'active' : ''
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                {selectedType !== ALL_FILTER_VALUE && categoryOptions.length > 0 && (
                    <div className="px-4 pb-4 max-w-lg mx-auto">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {categoryOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory((prev) =>
                                            prev === option.value ? ALL_FILTER_VALUE : option.value
                                        )
                                    }
                                    className={`filter-chip ${
                                        selectedCategory === option.value ? 'active' : ''
                                    }`}
                                >
                                    {option.label}
                                </button>
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
                                        {getQuestionCategoryLabel(question.category, categoryMap)}
                                    </Badge>
                                </div>

                                <h3 className="mb-2">{question.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {question.description}
                                </p>
                            </Card>
                        ))}
                        {isFetchingNextPage && (
                            <div className="text-center py-6 text-muted-foreground">
                                <p>{TEXT_LOADING_MORE}</p>
                            </div>
                        )}
                        {hasNextPage && <div ref={observerRef} />}
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default PracticeMain;
