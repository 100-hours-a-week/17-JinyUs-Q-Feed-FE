import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 녹음기 상태 enum
 * @typedef {'idle' | 'recording' | 'paused' | 'permission_error' | 'device_error'} RecorderState
 */

/**
 * 오디오 녹음 커스텀 훅
 * @returns {Object} { recorderState, isRecording, audioBlob, audioLevel, startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording, error, resetAudioBlob }
 */
export function useAudioRecorder() {
  const [recorderState, setRecorderState] = useState('idle')
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioBands, setAudioBands] = useState(() => Array(12).fill(0))
  const [error, setError] = useState(null)

  const BAND_COUNT = 12

  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const animationFrameRef = useRef(null)

  // isRecording은 recorderState 기반으로 계산
  const isRecording = recorderState === 'recording' || recorderState === 'paused'

  const updateAudioLevelRef = useRef(null)

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    setAudioLevel(average / 255)

    // 주파수 대역별 값 (0~1) - 비주얼라이저 막대 높이에 사용, 민감도 향상(gain 1.8)
    const len = dataArray.length
    const bandSize = Math.floor(len / BAND_COUNT)
    const gain = 1.8
    const bands = []
    for (let i = 0; i < BAND_COUNT; i++) {
      const start = i * bandSize
      const end = i === BAND_COUNT - 1 ? len : start + bandSize
      let sum = 0
      for (let j = start; j < end; j++) sum += dataArray[j]
      const raw = (sum / (end - start)) / 255
      bands.push(Math.min(raw * gain, 1))
    }
    setAudioBands(bands)

    if (updateAudioLevelRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevelRef.current)
    }
  }, [])

  useEffect(() => {
    updateAudioLevelRef.current = updateAudioLevel
  }, [updateAudioLevel])

  const cleanupAudioContext = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
  }, [])

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 오디오 레벨 분석 설정
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.2
      source.connect(analyserRef.current)

      // MediaRecorder 설정 (mp4 우선 - Safari AAC/m4a 호환)
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      const options = mimeType ? { mimeType } : {}
      mediaRecorderRef.current = new MediaRecorder(stream, options)

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeTypeUsed = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeTypeUsed })
        setAudioBlob(blob)
        cleanupStream()
        cleanupAudioContext()
      }

      mediaRecorderRef.current.start(100) // 100ms마다 데이터 수집
      setRecorderState('recording')
      updateAudioLevel()
    } catch (err) {
      cleanupStream()
      cleanupAudioContext()

      // 에러 유형에 따라 상태 구분
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecorderState('permission_error')
        setError('마이크 권한을 허용해주세요.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setRecorderState('device_error')
        setError('마이크를 확인해주세요.')
      } else {
        setRecorderState('device_error')
        setError(err.message || '마이크 접근에 실패했습니다.')
      }
    }
  }, [updateAudioLevel, cleanupStream, cleanupAudioContext])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setRecorderState('idle')
      setAudioLevel(0)
      setAudioBands(Array(BAND_COUNT).fill(0))
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setRecorderState('paused')
      // 일시정지 시 오디오 레벨 업데이트 중지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setAudioLevel(0)
      setAudioBands(Array(BAND_COUNT).fill(0))
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setRecorderState('recording')
      // 오디오 레벨 업데이트 재개
      updateAudioLevel()
    }
  }, [updateAudioLevel])

  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // onstop 이벤트 제거하여 블롭 생성 방지
      mediaRecorderRef.current.onstop = null
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
    cleanupStream()
    cleanupAudioContext()
    setRecorderState('idle')
    setAudioBlob(null)
    setAudioLevel(0)
    setAudioBands(Array(BAND_COUNT).fill(0))
    chunksRef.current = []
  }, [cleanupStream, cleanupAudioContext])

  const resetAudioBlob = useCallback(() => {
    setAudioBlob(null)
  }, [])

  const resetError = useCallback(() => {
    setError(null)
    if (recorderState === 'permission_error' || recorderState === 'device_error') {
      setRecorderState('idle')
    }
  }, [recorderState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      }
      cleanupStream()
      cleanupAudioContext()
    }
  }, [cleanupStream, cleanupAudioContext])

  return {
    recorderState,
    isRecording,
    audioBlob,
    audioLevel,
    audioBands,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    error,
    resetAudioBlob,
    resetError,
  }
}
