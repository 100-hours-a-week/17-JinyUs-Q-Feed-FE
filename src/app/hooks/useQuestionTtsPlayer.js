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
    onPlaybackEnded,
}) {
    const audioRef = useRef(null);
    const audioUrlRef = useRef('');
    const requestControllerRef = useRef(null);
    const requestSequenceRef = useRef(0);
    const autoPlayedKeyRef = useRef('');

    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(null);

    const isAbortError = useCallback((error) => {
        const name = typeof error?.name === 'string' ? error.name : '';
        const message = typeof error?.message === 'string' ? error.message : '';
        return name === 'AbortError' || /abort/i.test(message);
    }, []);

    const stop = useCallback(() => {
        if (requestControllerRef.current) {
            requestControllerRef.current.abort();
            requestControllerRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.onended = null;
            audioRef.current.onloadedmetadata = null;
            audioRef.current.ontimeupdate = null;
            audioRef.current.onpause = null;
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = '';
        }

        setIsLoading(false);
        setIsPlaying(false);
        setRemainingSeconds(null);
    }, []);

    const updateRemainingSeconds = useCallback((audioElement) => {
        if (!audioElement) {
            setRemainingSeconds(null);
            return;
        }

        const duration = Number.isFinite(audioElement.duration) ? audioElement.duration : 0;
        const currentTime = Number.isFinite(audioElement.currentTime) ? audioElement.currentTime : 0;

        if (duration <= 0) {
            setRemainingSeconds(null);
            return;
        }

        setRemainingSeconds(Math.max(0, Math.ceil(duration - currentTime)));
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

        const requestSequence = requestSequenceRef.current + 1;
        requestSequenceRef.current = requestSequence;

        stop();
        setIsLoading(true);

        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            const response = await requestTTS({
                userId,
                sessionId: normalizedSessionId,
                text: normalizedText,
                signal: controller.signal,
            });
            if (requestSequenceRef.current !== requestSequence) {
                return false;
            }

            if (import.meta.env.DEV) {
                console.info('[TTS] play payload', {
                    blobSize: response?.audioBlob?.size ?? 0,
                    blobType: response?.audioBlob?.type ?? '',
                    silent,
                });
            }

            const objectUrl = URL.createObjectURL(response.audioBlob);
            audioUrlRef.current = objectUrl;

            const audio = new Audio(objectUrl);
            audio.preload = 'auto';
            audioRef.current = audio;
            audio.onloadedmetadata = () => {
                if (requestSequenceRef.current === requestSequence) {
                    updateRemainingSeconds(audio);
                }
            };
            audio.ontimeupdate = () => {
                if (requestSequenceRef.current === requestSequence) {
                    updateRemainingSeconds(audio);
                }
            };
            audio.onended = () => {
                if (requestSequenceRef.current === requestSequence) {
                    setIsPlaying(false);
                    setRemainingSeconds(0);
                    onPlaybackEnded?.({
                        text: normalizedText,
                        sessionId: normalizedSessionId,
                    });
                }
            };
            audio.onpause = () => {
                if (requestSequenceRef.current === requestSequence) {
                    setIsPlaying(false);
                }
            };

            try {
                audio.currentTime = 0;
            } catch {
                // noop
            }

            await audio.play();
            if (requestSequenceRef.current !== requestSequence) {
                audio.pause();
                return false;
            }
            setIsPlaying(true);
            updateRemainingSeconds(audio);
            return true;
        } catch (error) {
            if (isAbortError(error)) {
                return false;
            }
            if (import.meta.env.DEV) {
                console.error('[TTS] play failed', {
                    name: error?.name,
                    message: error?.message,
                    silent,
                });
            }
            stop();
            if (!silent) {
                onError?.(error);
            }
            return false;
        } finally {
            if (requestControllerRef.current === controller) {
                requestControllerRef.current = null;
            }
            if (requestSequenceRef.current === requestSequence) {
                setIsLoading(false);
            }
        }
    }, [
        finishedQuestionText,
        isAbortError,
        noSessionErrorMessage,
        onError,
        onPlaybackEnded,
        sessionId,
        stop,
        userId,
        updateRemainingSeconds,
    ]);

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

        // 자동 재생이 실제로 필요한 경우에만 기존 재생/요청을 정리한다.
        // 그렇지 않으면(예: 마지막 턴 전환) 수동 재생 요청이 abort될 수 있다.
        stop();

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
        remainingSeconds,
        play,
        playText,
        stop,
        toggle,
    };
}
