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