import { Home, BookOpen, Target, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: '홈' },
        { path: '/practice', icon: BookOpen, label: '연습' },
        { path: '/real-interview', icon: Target, label: '실전' },
        { path: '/profile', icon: User, label: '프로필' },
    ];

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-area-bottom max-w-lg mx-auto">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? 'text-primary' : 'text-muted-foreground'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
