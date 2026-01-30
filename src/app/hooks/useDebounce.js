import { useState, useEffect } from 'react'

/**
 * Debounce hook
 * 값 변경을 지연시켜 불필요한 API 호출을 방지합니다.
 *
 * @param {any} value - debounce할 값
 * @param {number} delay - 지연 시간 (ms)
 * @returns {any} debounced 값
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // delay 후에 값을 업데이트
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 값이 변경되면 이전 타이머를 정리
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
