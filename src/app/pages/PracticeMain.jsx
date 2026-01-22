import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import BottomNav from '@/app/components/BottomNav';
import { QUESTIONS } from '@/data/questions';
import { Search, ArrowLeft, Filter } from 'lucide-react';

import { AppHeader } from '@/app/components/AppHeader';

const PracticeMain = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');

    const categories = ['전체', 'CS기초', '시스템디자인'];

    const filteredQuestions = QUESTIONS.filter((q) => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === '전체' || q.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
                        {categories.map((category) => (
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
            </div>

            {/* Question List */}
            <div className="p-4 space-y-3 max-w-lg mx-auto">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>검색 결과가 없습니다</p>
                    </div>
                ) : (
                    filteredQuestions.map((question) => (
                        <Card
                            key={question.id}
                            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/practice/answer/${question.id}`)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                                    {question.category}
                                </Badge>
                                <Badge variant="outline">{question.difficulty}</Badge>
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
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default PracticeMain;
