import { useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/app/components/ui/utils'
import { Sparkles, X } from 'lucide-react'

const GUIDE_PAGES = [
  {
    title: '좋은 설명은 질문을 더 정확하게 만듭니다',
    content: (
      <div className="space-y-3">
        <section className="rounded-[20px] border border-[#F4E9DD] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-semibold tracking-[0.01em] text-primary-600">
            AI 질문의 출발점
          </p>
          <p className="mt-2 text-sm leading-6 text-[#424242]">
            프로젝트 설명은 단순 소개문이 아니라, AI 면접 질문의 기반이 되는 정보예요.
            무엇을 만들었는지, 어떤 문제를 해결했는지, 어떤 방식으로 개선했는지,
            결과가 무엇이었는지가 보여야 질문도 더 정확하고 깊어집니다.
          </p>
        </section>

        <section className="rounded-[20px] border border-[#F4E9DD] bg-[#FFF7F4] p-4">
          <p className="text-sm font-semibold tracking-[0.01em] text-[#C25A74]">
            면접관이 빠르게 읽을 수 있어야 해요
          </p>
          <p className="mt-2 text-sm leading-6 text-[#424242]">
            Jakob Nielsen과 John Morkes의 가독성 연구에 따르면 사람들은 화면의 긴 설명을 처음부터 끝까지 읽기보다 먼저 훑으면서
            핵심을 찾는 경향이 있어요. 길게 쓰기보다, 구조가 보이게 쓰는 편이 훨씬 유리해요.
          </p>
        </section>

        <section className="rounded-[20px] border border-[#F4E9DD] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-semibold tracking-[0.01em] text-[#7A5C3D]">
            이렇게 정리해보세요
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['무엇을 만들었는지', '문제', '해결 방법', '결과'].map((label) => (
              <span
                key={label}
                className="rounded-full bg-[#F7F2EB] px-3 py-1 text-xs font-medium text-[#5F5A52]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-[#FFF1F4] px-4 py-3 text-sm leading-6 text-[#5B4B50]">
            권장 글자 수는 <span className="font-semibold text-[#D25574]">350~600자</span>
            예요. 한 줄 소개로 시작한 뒤, <span className="font-semibold">문제 → 해결 방법 → 결과</span>
            순서로 쓰면 읽는 사람이 훨씬 빠르게 이해할 수 있습니다.
          </div>
        </section>
      </div>
    ),
  },
  {
    title: '실제 예시',
    content: (
      <div className="space-y-4">
        <section className="rounded-[22px] border border-[#F4E9DD] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-semibold tracking-[0.01em] text-primary-600">
            예시 본문
          </p>
          <p className="mt-3 text-sm leading-7 text-[#424242]">
            팀 프로젝트로 개발한 실시간 코드 리뷰 협업 플랫폼입니다. 기존에는 리뷰 요청이
            슬랙, 문서, 깃허브 코멘트로 흩어져 있어 피드백 누락이 자주 발생했고, 리뷰
            대기 시간이 길어져 배포 일정이 밀리는 문제가 있었습니다. 저는 프론트엔드와
            일부 백엔드 API 설계를 맡아 PR 상태, 리뷰 우선순위, 미응답 시간을 한 화면에서
            볼 수 있는 대시보드를 구현했고, 웹소켓 알림과 자동 리마인드 기능을 추가했습니다.
            또 리뷰 목록 조회 API를 캐시 가능한 구조로 바꾸고 첫 화면 번들 크기를 줄여 초기
            로딩 시간을 3.8초에서 1.6초로 개선했습니다. 그 결과 주간 평균 리뷰 완료 시간이
            32% 단축됐고, 누락된 리뷰 건수도 크게 줄어 팀 내부에서 실제 운영 도구로 계속
            사용하게 됐습니다.
          </p>
        </section>

        <section className="rounded-[22px] border border-[#F4E9DD] bg-[#FFF7F4] p-4">
          <p className="text-sm font-semibold tracking-[0.01em] text-[#C25A74]">
            포인트 요약
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A8F82]">
                무엇을 만들었는지
              </p>
              <p className="mt-1 text-sm leading-6 text-[#424242]">
                실시간 코드 리뷰 협업 플랫폼
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A8F82]">
                문제
              </p>
              <p className="mt-1 text-sm leading-6 text-[#424242]">
                리뷰 요청이 분산돼 피드백 누락과 일정 지연이 발생함
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A8F82]">
                해결 방법
              </p>
              <p className="mt-1 text-sm leading-6 text-[#424242]">
                대시보드, 웹소켓 알림, 자동 리마인드, 조회 성능 개선
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A8F82]">
                결과
              </p>
              <p className="mt-1 text-sm leading-6 text-[#424242]">
                초기 로딩 3.8초 → 1.6초, 리뷰 완료 시간 32% 단축
              </p>
            </div>
          </div>
        </section>
      </div>
    ),
  },
]

const LAST_PAGE_INDEX = GUIDE_PAGES.length - 1
const SWIPE_THRESHOLD = 56

function ProjectDescriptionGuideDialog() {
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const touchStartXRef = useRef(null)

  const goToPage = (pageIndex) => {
    const nextPage = Math.max(0, Math.min(pageIndex, LAST_PAGE_INDEX))
    setCurrentPage(nextPage)
  }

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen)

    if (nextOpen) {
      setCurrentPage(0)
    }
  }

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current
    touchStartXRef.current = null

    if (startX == null) return

    const endX = event.changedTouches?.[0]?.clientX ?? startX
    const deltaX = endX - startX

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

    if (deltaX < 0) {
      goToPage(currentPage + 1)
      return
    }

    goToPage(currentPage - 1)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 text-xs font-medium text-primary-700 transition-colors hover:border-primary-200 hover:bg-primary-100"
        >
          <Sparkles className="h-3.5 w-3.5" />
          작성 가이드 보기
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[220] bg-black/55 backdrop-blur-[2px]" />

        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[221] flex h-[min(42rem,calc(100dvh-48px))] max-h-[calc(100dvh-48px)] w-[calc(100%-32px)] max-w-[29rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#EFE5D9] bg-[#FFFDF8] shadow-[0_20px_60px_rgba(0,0,0,0.18)] outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-6 data-[state=closed]:slide-out-to-bottom-4 duration-300'
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            프로젝트 설명 작성 가이드
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            프로젝트 설명을 문제, 해결 방법, 결과 구조로 정리하는 2페이지 가이드
          </DialogPrimitive.Description>

          <div className="border-b border-[#F3EDE3] bg-[linear-gradient(180deg,#FFF7F2_0%,#FFFDF8_100%)] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F9DCE5] bg-white/90 px-3 py-1 text-xs font-medium text-[#D25574]">
                  <Sparkles className="h-3.5 w-3.5" />
                  작성 가이드
                </div>
                <p className="mt-3 text-[20px] font-semibold leading-snug text-[#212121]">
                  면접관이 쉽게 읽을 수 있는 설명 구조
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[#616161]">
                  AI가 질문을 만들고, 면접관이 빠르게 이해할 수 있도록 핵심만 구조적으로
                  정리해보세요.
                </p>
              </div>

              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#EFE8DC] bg-white text-[#757575] transition-colors hover:bg-[#FAF7F2]"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {GUIDE_PAGES.map((page, pageIndex) => (
                  <button
                    key={page.title}
                    type="button"
                    onClick={() => goToPage(pageIndex)}
                    className={cn(
                      'h-2.5 rounded-full transition-all',
                      pageIndex === currentPage
                        ? 'w-6 bg-primary-500'
                        : 'w-2.5 bg-[#E4DBCF] hover:bg-[#D5C8B6]'
                    )}
                    aria-label={`${pageIndex + 1}페이지로 이동`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage === 0 ? 1 : 0)}
                  className="rounded-full border border-[#EFE8DC] bg-white px-3 py-1.5 text-xs font-medium text-[#616161] transition-colors hover:bg-[#FAF7F2]"
                >
                  {currentPage === 0 ? '예시 보기' : '원칙 보기'}
                </button>
                <div className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[#757575]">
                  {currentPage + 1}/{GUIDE_PAGES.length}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {GUIDE_PAGES.map((page) => (
                <div
                  key={page.title}
                  className="min-h-0 h-full max-h-full w-full shrink-0 overflow-y-auto touch-pan-y overscroll-contain px-5 pb-6 pt-5 [-webkit-overflow-scrolling:touch] sm:px-6 sm:pb-6"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <p className="text-lg font-semibold leading-snug text-[#212121]">
                    {page.title}
                  </p>
                  <div className="mt-4">{page.content}</div>
                </div>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default ProjectDescriptionGuideDialog
