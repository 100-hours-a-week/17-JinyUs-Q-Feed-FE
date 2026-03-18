import { useCallback, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Clock, MessageSquare, Star, Award, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/app/components/AppHeader';
import { formatRelativeTime } from '@/app/utils/notificationTime';
import { useNotificationsInfinite } from '@/app/hooks/useNotificationsInfinite';
import { useUnreadNotification } from '@/context/UnreadNotificationContext';

// notificationType 코드 → 아이콘 매핑
const TYPE_ICON = {
    FEEDBACK: <MessageSquare size={18} />,
    ACHIEVEMENT: <Award size={18} />,
    RECOMMENDATION: <Star size={18} />,
    SYSTEM: <Info size={18} />,
    ANSWER_FEEDBACK: <MessageSquare size={18} />,
    REVISIT: <BellRing size={18} />,
    NOTICE: <Info size={18} />,
    PROJECT_REMINDER: <Clock size={18} />,
};

const getTypeIcon = (type) => TYPE_ICON[type] ?? <Bell size={18} />;

const NotificationItem = ({ notification, onRead }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        const { deeplink, read, id } = notification

        if (deeplink) {
            // 내부 경로만 허용 — '/'로 시작하지 않으면 차단
            // http://, https://, javascript: 등 외부/위험 스킴 방지
            if (!deeplink.startsWith('/')) {
                toast.error('유효하지 않은 이동 경로')
                return
            }
            // 읽음 처리(fire and forget) — 실패해도 이동 수행
            if (!read) onRead(id)
            navigate(deeplink)
            return
        }

        // deeplink 없으면 읽음 처리만
        if (!read) onRead(id)
    };

    return (
        <button
            className={`w-full text-left flex items-start gap-3 px-4 py-4 transition-colors ${
                notification.read ? 'bg-white' : 'bg-pink-50'
            } hover:bg-gray-50 active:bg-gray-100`}
            onClick={handleClick}
        >
            {/* 타입 아이콘 */}
            <span
                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full ${
                    notification.read
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-pink-100 text-pink-500'
                }`}
            >
                {getTypeIcon(notification.notificationType)}
            </span>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${notification.read ? 'font-normal text-gray-800' : 'font-semibold text-gray-900'}`}>
                        {notification.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                        {formatRelativeTime(notification.createdAt)}
                    </span>
                </div>
                {notification.body && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notification.body}</p>
                )}
                {notification.notificationTypeDescription && (
                    <span className="mt-1 inline-block text-xs text-pink-400">
                        {notification.notificationTypeDescription}
                    </span>
                )}
            </div>

            {/* 읽지 않음 점 */}
            {!notification.read && (
                <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-pink-500" />
            )}
        </button>
    );
};

const NotificationMain = () => {
    const { clearUnread } = useUnreadNotification()
    const {
        notifications,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error,
        readOne,
        readAll,
    } = useNotificationsInfinite();

    const observerRef = useRef(null);

    const debouncedFetchNext = useMemo(
        () => debounce(() => fetchNextPage(), 300),
        [fetchNextPage]
    );

    useEffect(() => () => debouncedFetchNext.cancel(), [debouncedFetchNext]);

    const observerCallback = useCallback(
        (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                debouncedFetchNext();
            }
        },
        [hasNextPage, isFetchingNextPage, debouncedFetchNext]
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

    const hasUnread = notifications.some((n) => !n.read);

    const headerRight = hasUnread ? (
        <button
            onClick={() => readAll(undefined, { onSuccess: clearUnread })}
            className="text-xs font-medium text-pink-500 hover:text-pink-600 px-2 py-1"
        >
            모두 읽기
        </button>
    ) : null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto">
            <AppHeader
                title="알림"
                showBack
                rightContent={headerRight}
            />

            <main className="flex-1">
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Bell className="w-10 h-10 text-gray-300" />
                        <p className="text-sm text-gray-400">알림을 불러오지 못했습니다.</p>
                    </div>
                )}

                {!isLoading && !error && notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Bell className="w-10 h-10 text-gray-300" />
                        <p className="text-sm text-gray-400">새로운 알림이 없습니다.</p>
                    </div>
                )}

                {notifications.length > 0 && (
                    <div className="divide-y divide-gray-100 bg-white">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={readOne}
                            />
                        ))}
                    </div>
                )}

                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
                    </div>
                )}

                {!hasNextPage && notifications.length > 0 && (
                    <p className="text-center text-xs text-gray-400 py-6">
                        모든 알림을 불러왔습니다.
                    </p>
                )}

                <div ref={observerRef} className="h-1" />
            </main>
        </div>
    );
};

export default NotificationMain;
