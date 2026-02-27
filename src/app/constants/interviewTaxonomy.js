export const INTERVIEW_TYPES = Object.freeze({
    PRACTICE: 'PRACTICE_INTERVIEW',
    REAL: 'REAL_INTERVIEW',
    PORTFOLIO: 'PORTFOLIO_INTERVIEW',
});

export const INTERVIEW_TYPE_LABELS = Object.freeze({
    [INTERVIEW_TYPES.PRACTICE]: '연습',
    [INTERVIEW_TYPES.REAL]: '실전',
    [INTERVIEW_TYPES.PORTFOLIO]: '포트폴리오',
});

export const QUESTION_TYPES = Object.freeze({
    CS: 'CS',
    SYSTEM_DESIGN: 'SYSTEM_DESIGN',
    PORTFOLIO: 'PORTFOLIO',
});

export const QUESTION_CATEGORIES = Object.freeze({
    CS: Object.freeze({
        OS: 'OS',
        NETWORK: 'NETWORK',
        DB: 'DB',
        COMPUTER_ARCHITECTURE: 'COMPUTER_ARCHITECTURE',
        DATA_STRUCTURE_ALGORITHM: 'DATA_STRUCTURE_ALGORITHM',
    }),
    SYSTEM_DESIGN: Object.freeze({
        SOCIAL: 'SOCIAL',
        NOTIFICATION: 'NOTIFICATION',
        REALTIME: 'REALTIME',
        SEARCH: 'SEARCH',
        MEDIA: 'MEDIA',
        STORAGE: 'STORAGE',
        PLATFORM: 'PLATFORM',
        TRANSACTION: 'TRANSACTION',
    }),
});

const SYSTEM_DESIGN_CATEGORY_KEYS = new Set(Object.values(QUESTION_CATEGORIES.SYSTEM_DESIGN));

export function isSystemDesignCategoryKey(value) {
    if (typeof value !== 'string') return false;
    return SYSTEM_DESIGN_CATEGORY_KEYS.has(value.trim().toUpperCase());
}
