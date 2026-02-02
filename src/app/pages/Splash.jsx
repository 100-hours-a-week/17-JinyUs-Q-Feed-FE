import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/app/components/AppHeader';

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/' : '/login', { replace: true });
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col">
      <AppHeader title="Q-Feed" showBack={false} showNotifications={false} />

      <div className="flex-1 flex items-center justify-center p-4">
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-lg"
        >
          <Motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">Q-Feed</h1>
            <p className="text-muted-foreground text-base">
              Debug Your Answers.<br />
              Refactor Your Interview Skills.
            </p>
          </Motion.div>
        </Motion.div>
      </div>
    </div>
  );
};

export default Splash;
