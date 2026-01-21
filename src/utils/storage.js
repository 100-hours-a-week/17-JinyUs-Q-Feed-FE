// LocalStorage utilities for managing app state

const STORAGE_KEYS = {
    IS_LOGGED_IN: 'qfeed_is_logged_in',
    USER_NICKNAME: 'qfeed_user_nickname',
    LEARNING_RECORDS: 'qfeed_learning_records',
    PRACTICE_ANSWERS: 'qfeed_practice_answers',
    INTERVIEW_SESSIONS: 'qfeed_interview_sessions',
};

export const storage = {
    // Auth
    setLoggedIn: (value) => {
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(value));
    },
    isLoggedIn: () => {
        const value = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
        return value === 'true';
    },

    // User
    setNickname: (nickname) => {
        localStorage.setItem(STORAGE_KEYS.USER_NICKNAME, nickname);
    },
    getNickname: () => {
        return localStorage.getItem(STORAGE_KEYS.USER_NICKNAME) || '사용자';
    },

    // Learning Records
    addLearningRecord: (record) => {
        const records = storage.getLearningRecords();
        const existingIndex = records.findIndex((r) => r.date === record.date);

        if (existingIndex >= 0) {
            records[existingIndex].count += record.count;
        } else {
            records.push(record);
        }

        localStorage.setItem(STORAGE_KEYS.LEARNING_RECORDS, JSON.stringify(records));
    },
    getLearningRecords: () => {
        const value = localStorage.getItem(STORAGE_KEYS.LEARNING_RECORDS);
        return value ? JSON.parse(value) : [];
    },

    // Clear all
    clear: () => {
        Object.values(STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key);
        });
    },
};
