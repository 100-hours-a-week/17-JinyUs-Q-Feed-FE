import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/app/components/ui/sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PracticeQuestionProvider } from '@/context/practiceQuestionContext.jsx';
import { queryClient } from '@/lib/queryClient';
import { sendPageView } from '@/utils/analytics';

// Pages
import Splash from '@/app/pages/Splash';
import AuthLogin from '@/app/pages/AuthLogin';
import Home from '@/app/pages/Home';
import PracticeMain from '@/app/pages/PracticeMain';
import PracticeAnswer from '@/app/pages/PracticeAnswer';
import PracticeAnswerVoice from '@/app/pages/PracticeAnswerVoice';
import PracticeSTT from '@/app/pages/PracticeSTT';
import PracticeAnswerEdit from '@/app/pages/PracticeAnswerEdit';
import PracticeAnswerText from '@/app/pages/PracticeAnswerText';
import PracticeResultKeyword from '@/app/pages/PracticeResultKeyword';
import PracticeResultAI from '@/app/pages/PracticeResultAI';
import ProfileMain from '@/app/pages/ProfileMain';
import LearningRecordDetail from '@/app/pages/LearningRecordDetail';
import SettingMain from '@/app/pages/SettingMain';
import RealInterview from '@/app/pages/RealInterview';
import RealInterviewSession from '@/app/pages/RealInterviewSession';
import RealInterviewResultAI from '@/app/pages/RealInterviewResultAI';
import OAuthCallback from '@/app/pages/OAuthCallback';

const SPLASH_SHOWN_KEY = 'qfeed_splash_shown';

function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        sendPageView(location.pathname);
    }, [location.pathname]);

    if (isLoading) return null;

    // 앱 실행 시(루트 또는 로그인 화면 진입 시) 스플래시를 한 번 보여준다.
    const shouldShowSplash = (location.pathname === '/' || location.pathname === '/login')
        && typeof sessionStorage !== 'undefined'
        && !sessionStorage.getItem(SPLASH_SHOWN_KEY);
    if (shouldShowSplash) {
        return <Navigate to="/splash" replace />;
    }

    const SHOW_REAL_INTERVIEW = import.meta.env.VITE_SHOW_REAL_INTERVIEW === 'true';

    return (
        <>
            <Routes>
                {/* Auth */}
                <Route path="/splash" element={<Splash />} />
                <Route path="/login" element={<AuthLogin />} />
                <Route path="/oauth/redirect" element={<OAuthCallback />} />

                {/* Protected Routes */}
                {isAuthenticated ? (
                    <>
                        <Route path="/" element={<Home />} />

                        {/* Practice Mode */}
                        <Route path="/practice" element={<PracticeMain />} />
                        <Route path="/practice/answer/:questionId" element={<PracticeAnswer />} />
                        <Route path="/practice/answer-voice/:questionId" element={<PracticeAnswerVoice />} />
                        <Route path="/practice/stt/:questionId" element={<PracticeSTT />} />
                        <Route path="/practice/answer-edit/:questionId" element={<PracticeAnswerEdit />} />
                        <Route path="/practice/answer-text/:questionId" element={<PracticeAnswerText />} />
                        <Route path="/practice/result-keyword/:questionId" element={<PracticeResultKeyword />} />
                        <Route path="/practice/result-ai/:questionId" element={<PracticeResultAI />} />

                        {/* Real Interview */}
                        {(SHOW_REAL_INTERVIEW &&
                            <>
                                <Route path="/real-interview" element={<RealInterview />} />
                                <Route path="/real-interview/session" element={<RealInterviewSession />} />
                                <Route path="/real-interview/result-ai" element={<RealInterviewResultAI />} />
                            </>
                        )}

                        {/* Profile */}
                        <Route path="/profile" element={<ProfileMain />} />
                        <Route path="/profile/records/:answerId" element={<LearningRecordDetail />} />
                        <Route path="/settings" element={<SettingMain />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                ) : (
                    <Route path="*" element={<Navigate to="/login" replace />} />
                )}
            </Routes>
            <Toaster />
        </>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <PracticeQuestionProvider>
                        <AppRoutes />
                    </PracticeQuestionProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
