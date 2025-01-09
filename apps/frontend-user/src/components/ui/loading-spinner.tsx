export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9A84]"></div>
      <span className="ml-2 text-[#4C9A84]">読み込み中...</span>
    </div>
  )
} 