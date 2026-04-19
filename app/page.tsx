import { Button } from "@/components/ui/button"

export default function Page() {
  // md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
  return (
    <div className="flex  p-6">
      <button className="fixed bottom-20 left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 
      
      ">
        🔍
      </button>
    </div>
  )
}
