/**
 * 알림 상대 시간 포맷
 * @param {string} isoString - ISO 8601 날짜 문자열
 * @returns {string} 상대 시간 문자열
 */
export function formatRelativeTime(isoString) {
    const ts = new Date(isoString).getTime();
    if (!isoString || isNaN(ts)) return '오래 전';

    const diff = Date.now() - ts;
    if (diff < 0) return '방금 전';

    const minutes = diff / 60_000;

    if (minutes <= 10) return '방금 전';
    if (minutes < 60) return `${Math.floor(minutes / 10) * 10}분 전`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;

    const days = Math.floor(diff / 86_400_000);
    if (days < 7) return `${days}일 전`;
    if (days < 14) return '1주 전';
    if (days < 21) return '2주 전';
    if (days < 28) return '3주 전';
    return '오래 전';
}
