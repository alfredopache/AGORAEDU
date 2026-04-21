"use client"

import React from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export default function GoogleSignIn() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <button className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-sm" disabled>
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
          className="ml-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="px-3 py-2 rounded-md bg-gradient-to-r from-blue-500 to-sky-500 text-white text-sm"
    >
      Iniciar con Google
    </button>
  )
}
