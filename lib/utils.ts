import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getYouTubeThumbnail = (url: string) => {
  if (!url) return "/placeholder.svg";
  
  // Si la URL no contiene youtube o youtu.be, devolvemos el placeholder 
  // (esto evita que la RegExp falle o devuelva cosas raras con archivos locales)
  if (!url.includes('youtube') && !url.includes('youtu.be')) {
    return "/placeholder.svg";
  }

  const regExp = /^.*(embed\/|v\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  
  return videoId 
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
    : "/placeholder.svg";
};

export const MAX_REDACTION_WORDS = 250
export const MAX_REDACTION_LINES = 12

export function getWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function getLineCount(text: string) {
  return text === "" ? 0 : text.split(/\r\n|\r|\n/).length
}

export function clampRedactionText(text: string, maxWords: number, maxLines: number) {
  const lines = text.split(/\r\n|\r|\n/).slice(0, maxLines)
  const joined = lines.join("\n")
  const tokens = joined.trim().split(/\s+/).filter(Boolean)
  if (tokens.length <= maxWords) return joined
  return tokens.slice(0, maxWords).join(" ")
}
