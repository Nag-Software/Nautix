import { SignupForm } from "@/components/signup-form"
import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm sm:max-w-sm">
        <Image
          src="/trans.png"
          alt="Nautix logo"
          width={120}
          height={100}
          className="mx-auto mb-6"
        />
        <SignupForm />
      </div>
    </div>
  )
}
