import { useCallback, useState } from 'react';
import {
  abortMultipartUpload,
  completeMultipartUpload,
  confirmFileUpload,
  getMultipartPartPresignedUrl,
  getPresignedUrl,
  uploadPartToS3,
  uploadToS3,
} from '@/api/fileApi';
import { requestSTT } from '@/api/sttApi';

const STT_PIPELINE_STAGE = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  STT: 'stt',
  SUCCESS: 'success',
  ERROR: 'error',
};

const UPLOAD_FAILED_MESSAGE = '업로드에 실패했습니다';
const STT_FAILED_MESSAGE = '음성 변환에 실패했습니다';
const VIDEO_UPLOAD_FAILED_MESSAGE = '영상 업로드에 실패했습니다';
const DEFAULT_VIDEO_PART_SIZE = 8 * 1024 * 1024;

const toTrimmedString = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed || '';
};

const toError = (error, fallbackMessage) => {
  if (error instanceof Error) return error;
  return new Error(error?.message || fallbackMessage);
};

const resolveAudioMeta = (rawType = '') => {
  const normalized = toTrimmedString(rawType).toLowerCase();

  if (normalized.includes('wav')) {
    return { extension: 'wav', mimeType: 'audio/wav' };
  }
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) {
    return { extension: 'm4a', mimeType: 'audio/mp4' };
  }
  if (normalized.includes('mpeg') || normalized.includes('mp3')) {
    return { extension: 'mp3', mimeType: 'audio/mpeg' };
  }
  if (normalized.includes('ogg')) {
    return { extension: 'ogg', mimeType: 'audio/ogg' };
  }
  if (normalized.includes('webm')) {
    return { extension: 'webm', mimeType: 'audio/webm' };
  }

  return { extension: 'webm', mimeType: 'audio/webm' };
};

const resolveVideoMeta = (rawType = '') => {
  const normalized = toTrimmedString(rawType).toLowerCase();

  if (normalized.includes('mp4')) {
    return { extension: 'mp4', mimeType: 'video/mp4' };
  }
  if (normalized.includes('webm')) {
    return { extension: 'webm', mimeType: 'video/webm' };
  }

  return { extension: 'webm', mimeType: 'video/webm' };
};

const formatTimestampPrefix = (date = new Date()) => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
};

const normalizeModeToken = (mode) => {
  const normalized = toTrimmedString(mode).toUpperCase();

  if (normalized === 'REAL' || normalized === 'REAL_INTERVIEW') {
    return 'REAL';
  }
  if (normalized === 'PRACTICE' || normalized === 'PRACTICE_INTERVIEW') {
    return 'PRACTICE';
  }
  return 'UNKNOWN';
};

const createUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export function useAudioSttPipeline(options = {}) {
  const { category = 'AUDIO' } = options;
  const [stage, setStage] = useState(STT_PIPELINE_STAGE.IDLE);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStage(STT_PIPELINE_STAGE.IDLE);
    setError(null);
  }, []);

  const uploadAudioBlob = useCallback(async ({
    audioBlob,
    mode = 'UNKNOWN',
  }) => {
    if (!audioBlob || typeof audioBlob.size !== 'number' || audioBlob.size <= 0) {
      const invalidAudioError = new Error('녹음된 음성이 없습니다.');
      setError(invalidAudioError);
      setStage(STT_PIPELINE_STAGE.ERROR);
      throw invalidAudioError;
    }

    const { extension, mimeType } = resolveAudioMeta(audioBlob.type);

    setError(null);
    setStage(STT_PIPELINE_STAGE.UPLOADING);

    try {
      const uploadBlob = audioBlob.type === mimeType
        ? audioBlob
        : new Blob([audioBlob], { type: mimeType });
      const timestampPrefix = formatTimestampPrefix();
      const modeToken = normalizeModeToken(mode);
      const uuid = createUuid();
      const presignedResult = await getPresignedUrl({
        fileName: `${timestampPrefix}_${modeToken}_STT_${uuid}.${extension}`,
        fileSize: uploadBlob.size,
        mimeType,
        category,
        method: 'PUT',
      });
      const presignedPayload = presignedResult?.data ?? {};
      const fileId = presignedPayload.fileId ?? presignedPayload.file_id;
      const presignedUrl = presignedPayload.presignedUrl ?? presignedPayload.presigned_url;

      if (!fileId || !presignedUrl) {
        throw new Error('업로드 URL을 받지 못했습니다.');
      }

      await uploadToS3(presignedUrl, uploadBlob, mimeType);
      const confirmResult = await confirmFileUpload(fileId);
      const confirmPayload = confirmResult?.data ?? {};
      const audioUrl = confirmPayload.fileUrl ?? confirmPayload.file_url;

      if (!audioUrl) {
        throw new Error('업로드 확인 URL을 받지 못했습니다.');
      }

      setStage(STT_PIPELINE_STAGE.SUCCESS);
      return {
        audioUrl,
        fileId,
        mimeType,
        extension,
      };
    } catch (uploadError) {
      const normalizedError = toError(uploadError, UPLOAD_FAILED_MESSAGE);
      setError(normalizedError);
      setStage(STT_PIPELINE_STAGE.ERROR);
      throw normalizedError;
    }
  }, [category]);

  const uploadVideoBlobMultipart = useCallback(async ({
    videoBlob,
  }) => {
    if (!videoBlob || typeof videoBlob.size !== 'number' || videoBlob.size <= 0) {
      const invalidVideoError = new Error('녹화된 영상이 없습니다.');
      setError(invalidVideoError);
      setStage(STT_PIPELINE_STAGE.ERROR);
      throw invalidVideoError;
    }

    const { extension, mimeType } = resolveVideoMeta(videoBlob.type);
    const uploadBlob = videoBlob.type === mimeType
      ? videoBlob
      : new Blob([videoBlob], { type: mimeType });

    setError(null);
    setStage(STT_PIPELINE_STAGE.UPLOADING);

    let multipartFileId = null;
    try {
      const timestampPrefix = formatTimestampPrefix();
      const uuid = createUuid();
      const initResult = await getPresignedUrl({
        fileName: `${timestampPrefix}_REAL_VIDEO_${uuid}.${extension}`,
        fileSize: uploadBlob.size,
        mimeType,
        category: 'VIDEO',
        method: 'PUT',
      });

      const initPayload = initResult?.data ?? {};
      const fileId = initPayload.fileId ?? initPayload.file_id;
      if (!fileId) {
        throw new Error('영상 업로드 초기화에 실패했습니다.');
      }
      multipartFileId = fileId;
      const uploadMode = toTrimmedString(
        initPayload.uploadMode ?? initPayload.upload_mode
      ).toUpperCase();
      if (uploadMode && uploadMode !== 'MULTIPART') {
        throw new Error('영상 업로드 모드가 올바르지 않습니다.');
      }

      const rawPartSize = Number(initPayload.partSize ?? initPayload.part_size);
      const partSize =
        Number.isFinite(rawPartSize) && rawPartSize > 0
          ? Math.trunc(rawPartSize)
          : DEFAULT_VIDEO_PART_SIZE;

      const uploadedParts = [];
      let partNumber = 1;
      for (let start = 0; start < uploadBlob.size; start += partSize) {
        const end = Math.min(start + partSize, uploadBlob.size);
        const partBlob = uploadBlob.slice(start, end);

        const partUrlResult = await getMultipartPartPresignedUrl(fileId, partNumber);
        const partPayload = partUrlResult?.data ?? {};
        const presignedUrl = partPayload.presignedUrl ?? partPayload.presigned_url;

        if (!presignedUrl) {
          throw new Error('영상 파트 업로드 URL을 받지 못했습니다.');
        }

        const etag = await uploadPartToS3(presignedUrl, partBlob);
        uploadedParts.push({
          part_number: partNumber,
          etag,
        });
        partNumber += 1;
      }

      await completeMultipartUpload(fileId, { parts: uploadedParts });

      setStage(STT_PIPELINE_STAGE.SUCCESS);
      return {
        fileId,
        mimeType,
        extension,
      };
    } catch (videoUploadError) {
      if (multipartFileId) {
        try {
          await abortMultipartUpload(multipartFileId);
        } catch {
          // abort는 실패해도 원래 에러를 유지한다.
        }
      }
      const normalizedError = toError(videoUploadError, VIDEO_UPLOAD_FAILED_MESSAGE);
      setError(normalizedError);
      setStage(STT_PIPELINE_STAGE.ERROR);
      throw normalizedError;
    }
  }, []);

  const transcribeAudioUrl = useCallback(async ({ userId, sessionId, audioUrl }) => {
    const normalizedAudioUrl = toTrimmedString(audioUrl);
    if (!normalizedAudioUrl) {
      const missingAudioUrlError = new Error('음성 파일 URL이 없습니다.');
      setError(missingAudioUrlError);
      setStage(STT_PIPELINE_STAGE.ERROR);
      throw missingAudioUrlError;
    }

    setError(null);
    setStage(STT_PIPELINE_STAGE.STT);

    try {
      const sttResult = await requestSTT({
        userId,
        sessionId,
        audioUrl: normalizedAudioUrl,
      });

      const sttPayload = sttResult?.data ?? sttResult ?? {};
      const text = toTrimmedString(
        sttPayload.text ?? sttPayload.answer_text ?? sttPayload.transcript
      );

      setStage(STT_PIPELINE_STAGE.SUCCESS);
      return {
        text,
        raw: sttResult,
      };
    } catch (sttError) {
      const normalizedError = toError(sttError, STT_FAILED_MESSAGE);
      setError(normalizedError);
      setStage(STT_PIPELINE_STAGE.ERROR);
      throw normalizedError;
    }
  }, []);

  const uploadAndTranscribe = useCallback(async ({
    audioBlob,
    userId,
    sessionId,
    mode = 'UNKNOWN',
  }) => {
    const uploadResult = await uploadAudioBlob({
      audioBlob,
      mode,
    });
    const transcribeResult = await transcribeAudioUrl({
      userId,
      sessionId,
      audioUrl: uploadResult.audioUrl,
    });

    return {
      ...uploadResult,
      ...transcribeResult,
    };
  }, [transcribeAudioUrl, uploadAudioBlob]);

  return {
    stage,
    error,
    reset,
    uploadAudioBlob,
    uploadVideoBlobMultipart,
    transcribeAudioUrl,
    uploadAndTranscribe,
    STT_PIPELINE_STAGE,
  };
}
