import { Suspense } from "react"
import ForumPageClient from "@/components/forum-page-client"

export default function Page() {
  return (
    <Suspense fallback={<div />}> 
      <ForumPageClient />
    </Suspense>
  )
}