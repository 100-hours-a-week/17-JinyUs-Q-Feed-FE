import { useRef, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import ProjectDescriptionGuideDialog from '@/app/components/ProjectDescriptionGuideDialog'
import {
  MAX_PROJECT_CONTENT_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  getImageFileName,
} from '@/app/utils/portfolio'
import { Check, Loader2, Search, Upload, X } from 'lucide-react'

function PortfolioProjectFields({
  formData,
  imagePreviewUrl,
  techStacks,
  selectedTechStacks,
  techStackSearch,
  isTechStacksLoading,
  isTechStacksSearching,
  techStacksErrorMessage,
  emptyTechStacksMessage,
  hasNextTechStacks,
  isFetchingNextTechStacks,
  onFieldChange,
  onTechStackSearchChange,
  onTechStackToggle,
  onLoadMoreTechStacks,
  onFileUpload,
  onFileRemove,
}) {
  const techStackFieldRef = useRef(null)
  const [isTechStackDropdownOpen, setIsTechStackDropdownOpen] = useState(false)
  const architectureFileName = getImageFileName(
    formData.architectureImageFile || formData.architectureImageUrl
  )
  const hasTechStackSearch = techStackSearch.trim().length > 0
  const shouldScrollTechStacks = techStacks.length > 5
  const shouldShowTechStackDropdown =
    isTechStackDropdownOpen && (
      hasTechStackSearch || isTechStacksLoading || Boolean(techStacksErrorMessage)
    )

  const handleTechStackFieldBlur = (event) => {
    const nextFocusedElement = event.relatedTarget

    if (techStackFieldRef.current?.contains(nextFocusedElement)) {
      return
    }

    setIsTechStackDropdownOpen(false)
  }

  const handleTechStackSearchInputChange = (event) => {
    setIsTechStackDropdownOpen(true)
    onTechStackSearchChange(event.target.value)
  }

  const handleTechStackSelect = (techStackId) => {
    onTechStackToggle(techStackId)
    setIsTechStackDropdownOpen(false)
  }

  return (
    <div className="space-y-6">
      <section>
        <label className="mb-2 block text-sm text-muted-foreground">
          프로젝트 이름 *
        </label>
        <Input
          placeholder="프로젝트 이름을 작성해주세요."
          value={formData.projectName}
          onChange={(event) => {
            const value = event.target.value
            if (value.length <= MAX_PROJECT_NAME_LENGTH) {
              onFieldChange('projectName', value)
            }
          }}
          maxLength={MAX_PROJECT_NAME_LENGTH}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {formData.projectName.length}/{MAX_PROJECT_NAME_LENGTH}자
        </p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm text-muted-foreground">기술 스택 *</label>
          <span className="text-xs text-muted-foreground">
            {formData.techStackIds.length}개 선택
          </span>
        </div>

        <div
          ref={techStackFieldRef}
          className="relative"
          onBlur={handleTechStackFieldBlur}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {isTechStacksSearching && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <Input
            className={isTechStacksSearching ? 'pl-9 pr-9' : 'pl-9'}
            placeholder="기술 스택 검색"
            value={techStackSearch}
            onFocus={() => setIsTechStackDropdownOpen(true)}
            onChange={handleTechStackSearchInputChange}
          />

          {shouldShowTechStackDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[14px] border border-[#EEEEEE] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
              {techStacksErrorMessage ? (
                <p className="px-4 py-3 text-sm text-destructive">
                  {techStacksErrorMessage}
                </p>
              ) : isTechStacksLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>기술 스택을 불러오는 중입니다.</span>
                </div>
              ) : techStacks.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  검색 결과가 없습니다.
                </p>
              ) : (
                <div
                  className={shouldScrollTechStacks
                    ? 'max-h-[18rem] space-y-1 overflow-y-auto p-2 overscroll-contain'
                    : 'space-y-1 p-2'}
                >
                  {techStacks.map((techStack) => {
                    const isSelected = formData.techStackIds.includes(techStack.techStackId)

                    return (
                      <button
                        key={techStack.techStackId}
                        type="button"
                        onClick={() => handleTechStackSelect(techStack.techStackId)}
                        className={`flex w-full items-start justify-between rounded-[12px] px-3 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-primary-50 text-primary-700'
                            : 'bg-white hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-current">{techStack.name}</p>
                          {techStack.description && (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {techStack.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`ml-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-[#D9D9D9] text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {hasNextTechStacks && !techStacksErrorMessage && techStacks.length > 0 && (
                <div className="border-t border-[#F3F3F3] p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onLoadMoreTechStacks}
                    disabled={isFetchingNextTechStacks}
                    className="h-10 w-full justify-center rounded-[10px] border border-[#F3F3F3] bg-white text-sm text-[#616161] hover:bg-[#FAF7F2]"
                  >
                    {isFetchingNextTechStacks ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        더 불러오는 중...
                      </>
                    ) : (
                      '기술 스택 더 보기'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedTechStacks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTechStacks.map((techStack) => (
              <button
                key={techStack.techStackId}
                type="button"
                onClick={() => onTechStackToggle(techStack.techStackId)}
                className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
              >
                <span>{techStack.name}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {!hasTechStackSearch && selectedTechStacks.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {emptyTechStacksMessage}
          </p>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm text-muted-foreground">
            해결한 문제 / 성과 *
          </label>
          <ProjectDescriptionGuideDialog />
        </div>
        <Textarea
          placeholder="무엇을 만들었고, 어떤 문제를 어떻게 해결해 어떤 결과를 냈는지 적어주세요."
          value={formData.content}
          onChange={(event) => {
            const value = event.target.value
            if (value.length <= MAX_PROJECT_CONTENT_LENGTH) {
              onFieldChange('content', value)
            }
          }}
          maxLength={MAX_PROJECT_CONTENT_LENGTH}
          rows={10}
          className="h-56 min-h-56 max-h-56 overflow-y-auto resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {formData.content.length}/{MAX_PROJECT_CONTENT_LENGTH}자
        </p>
      </section>

      <section>
        <label className="mb-2 block text-sm text-muted-foreground">
          시스템 아키텍처
        </label>
        <Card className="gap-3 p-4">
          {architectureFileName ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {architectureFileName}
                </span>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="mr-1 h-4 w-4" />
                        첨부하기
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={onFileUpload}
                      className="hidden"
                    />
                  </label>
                  <Button variant="outline" size="sm" onClick={onFileRemove}>
                    <X className="mr-1 h-4 w-4" />
                    삭제
                  </Button>
                </div>
              </div>

              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="시스템 아키텍처 미리보기"
                  className="max-h-60 w-full rounded-xl border border-[#F3F3F3] object-contain"
                />
              )}
            </>
          ) : (
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-1 h-4 w-4" />
                  첨부하기
                </span>
              </Button>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                onChange={onFileUpload}
                className="hidden"
              />
            </label>
          )}
        </Card>
      </section>
    </div>
  )
}

export default PortfolioProjectFields
