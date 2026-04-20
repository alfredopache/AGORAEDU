"use client"
import { PortableText } from "@portabletext/react"

const components = {
  list: {
    bullet: ({ children }: any) => <ul className="list-disc ml-6 my-6 space-y-3 text-slate-600 dark:text-white/70">{children}</ul>,
    // ... el resto de tus componentes que tenías en la página
  },
  block: {
    h3: ({ children }: any) => <h3 className="text-xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">{children}</h3>,
    normal: ({ children }: any) => <p className="mb-4 leading-relaxed">{children}</p>,
  }
}

export function PortableTextContent({ value }: { value: any }) {
  return <PortableText value={value} components={components} />
}