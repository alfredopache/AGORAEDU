"use client"

import React from "react"
import { signIn, signOut, useSession } from "next-auth/react"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="9" cy="9" r="9" fill="#FFFFFF" />
      <text x="9" y="12" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4285F4">G</text>
    </svg>
  )
}

export default function GoogleSignIn() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <button className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 dark:bg-slate-800 border text-sm" disabled>
        Cargando...
      </button>
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={session.user.name || "avatar"} className="w-8 h-8 rounded-full" />
        )}
        <span className="hidden md:inline text-sm">{session.user.name}</span>
        <button
          onClick={() => signOut()}
          className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 border text-sm shadow-sm hover:shadow-md transition"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("google")}
      aria-label="Iniciar sesión con Google"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white text-slate-800 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-transform active:scale-95 text-sm font-medium"
    >
      <GoogleIcon />
      <span className="hidden sm:inline">Iniciar con Google</span>
      <span className="sm:hidden">Google</span>
    </button>
  )
}
