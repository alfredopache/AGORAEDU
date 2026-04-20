import { Instagram, Mail, Youtube, Music } from 'lucide-react'
import Image from 'next/image'

export function BlogFooter() {
  return (
    <footer className="bg-background py-8 botder border-t">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-start sm:gap-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/logo.png"
              alt="AgoraEdu Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <div>
              <a href="/" className="font-serif text-lg font-semibold text-foreground tracking-tight">
                agoraedu.eu
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                made with love by somosagoraedu@gmail.com
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://instagram.com/agoraedu__"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-pink-600 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>

            <a 
              href="https://tiktok.com/@agora.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="TikTok"
            >
              <Music className="w-5 h-5" />
            </a>

            <a 
              href="https://youtube.com/@somosAgoraEdu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-red-600 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>

            <a 
              href="mailto:somosagoraedu@gmail.com"
              className="text-foreground hover:text-blue-600 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            {"© 2026 AgoraEdu. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
