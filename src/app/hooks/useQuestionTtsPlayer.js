import { useCallback, useEffect, useRef, useState } from 'react';
import { requestTTS } from '@/api/ttsApi';

const toTrimmedString = (value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed || '';
};

export function useQuestionTtsPlayer({
    sessionId,
    userId,
    questionText,
    finishedQuestionText = '',
    autoPlayEnabled = true,
    noSessionErrorMessage = '세션 정보를 찾을 수 없습니다.',
    onError,
}) {
    const audioRef = useRef(null);
    const audioUrlRef = useRef('');
    const autoPlayedKeyRef = useRef('');

    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.onended = null;
            audioRef.current.onpause = null;
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = '';
        }

        setIsPlaying(false);
    }, []);

    const playText = useCallback(async (text, { silent = false, allowFinishedText = false } = {}) => {
        const normalizedText = toTrimmedString(text);
        const normalizedSessionId = toTrimmedString(sessionId);
        const normalizedFinishedText = toTrimmedString(finishedQuestionText);

        if (!normalizedText) {
            return false;
        }
        if (!allowFinishedText && normalizedText === normalizedFinishedText) {
            return false;
        }
        if (!normalizedSessionId) {
            if (!silent) {
                onError?.(new Error(noSessionErrorMessage));
            }
            return false;
        }

        setIsLoading(true);
        try {
            stop();

            const response = await requestTTS({
                userId,
                sessionId: normalizedSessionId,
                text: normalizedText,
            });

            const objectUrl = URL.createObjectURL(response.audioBlob);
            audioUrlRef.current = objectUrl;

            const audio = new Audio(objectUrl);
            audioRef.current = audio;
            audio.onended = () => setIsPlaying(false);
            audio.onpause = () => setIsPlaying(false);

            await audio.play();
            setIsPlaying(true);
            return true;
        } catch (error) {
            stop();
            if (!silent) {
                onError?.(error);
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [finishedQuestionText, noSessionErrorMessage, onError, sessionId, stop, userId]);

    const play = useCallback(async ({ silent = false } = {}) => {
        const normalizedQuestion = toTrimmedString(questionText);
        return playText(normalizedQuestion, { silent });
    }, [playText, questionText]);

    const toggle = useCallback(async () => {
        if (isLoading) return false;
        if (isPlaying) {
            stop();
            return true;
        }
        return play();
    }, [isLoading, isPlaying, play, stop]);

    useEffect(() => {
        stop();

        const normalizedQuestion = toTrimmedString(questionText);
        const normalizedSessionId = toTrimmedString(sessionId);
        const normalizedFinishedText = toTrimmedString(finishedQuestionText);

        const shouldAutoPlay =
            autoPlayEnabled &&
            Boolean(normalizedQuestion) &&
            normalizedQuestion !== normalizedFinishedText &&
            Boolean(normalizedSessionId);

        if (!shouldAutoPlay) {
            return;
        }

        const autoPlayKey = `${normalizedSessionId}:${normalizedQuestion}`;
        if (autoPlayedKeyRef.current === autoPlayKey) {
            return;
        }

        autoPlayedKeyRef.current = autoPlayKey;
        void play({ silent: true });
    }, [autoPlayEnabled, finishedQuestionText, play, questionText, sessionId, stop]);

    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return {
        isLoading,
        isPlaying,
        play,
        playText,
        stop,
        toggle,
    };
}
