import { Home, BookOpen, Target, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SHOW_REAL_INTERVIEW = import.meta.env.VITE_SHOW_REAL_INTERVIEW === 'true';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: '홈' },
        { path: '/practice', icon: BookOpen, label: '연습' },
        ...(SHOW_REAL_INTERVIEW ? [{ path: '/real-interview', icon: Target, label: '실전' }] : []),
        { path: '/profile', icon: User, label: '프로필' },
    ];

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`nav-item ${active ? 'active' : ''}`}
                    >
                        <Icon className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} strokeWidth={1.5} />
                        <span className="nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
