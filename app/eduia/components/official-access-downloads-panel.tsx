import { cn } from "@/lib/utils"
import {
  OFFICIAL_ACCESS_TIMELINE,
  type OfficialAccessResource,
  type OfficialAccessTimelineEntry,
} from "@/lib/official-access-resources"

type OfficialAccessDownloadsPanelProps = {
  title: string
  description: string
  mode?: "exam-only" | "full"
  className?: string
}

const GRADE_STYLES = {
  gm: {
    label: "Grado Medio",
    badgeClassName: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200",
    linkClassName: "hover:border-purple-300 hover:bg-purple-50 dark:hover:border-purple-500 dark:hover:bg-purple-900/20",
  },
  gs: {
    label: "Grado Superior",
    badgeClassName: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-200",
    linkClassName: "hover:border-pink-300 hover:bg-pink-50 dark:hover:border-pink-500 dark:hover:bg-pink-900/20",
  },
} as const

function filterTimeline(mode: "exam-only" | "full") {
  return OFFICIAL_ACCESS_TIMELINE
    .map<OfficialAccessTimelineEntry>((entry) => ({
      ...entry,
      gm: mode === "exam-only" ? entry.gm.filter((item) => item.kind === "exam") : entry.gm,
      gs: mode === "exam-only" ? entry.gs.filter((item) => item.kind === "exam") : entry.gs,
      general: mode === "exam-only" ? [] : entry.general,
    }))
    .filter((entry) => entry.gm.length > 0 || entry.gs.length > 0 || (entry.general?.length ?? 0) > 0)
}

function renderMeta(item: OfficialAccessResource, year: number) {
  const yearLabel = item.yearLabel ?? String(year)
  return `${item.source} · ${yearLabel} · ${item.verified ? "PDF verificado" : "enlace no verificado"}`
}

function ResourceList({ items, year, tone }: { items: OfficialAccessResource[]; year: number; tone: "gm" | "gs" }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">Sin recursos verificados en este año.</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <a
          key={`${year}-${tone}-${item.url}`}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs transition dark:border-slate-700 dark:bg-slate-900/60",
            GRADE_STYLES[tone].linkClassName,
          )}
        >
          <span className="block font-medium text-slate-800 dark:text-slate-100">{item.title}</span>
          <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{renderMeta(item, year)}</span>
        </a>
      ))}
    </div>
  )
}

export function OfficialAccessDownloadsPanel({
  title,
  description,
  mode = "full",
  className,
}: OfficialAccessDownloadsPanelProps) {
  const timeline = filterTimeline(mode)

  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800", className)}>
      <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{description}</p>

      <div className="space-y-4">
        {timeline.map((entry) => (
          <div key={entry.year} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
                {entry.year}
              </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {(["gm", "gs"] as const).map((grade) => (
                <div key={`${entry.year}-${grade}`} className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", GRADE_STYLES[grade].badgeClassName)}>
                      {GRADE_STYLES[grade].label}
                    </span>
                  </div>
                  <ResourceList items={entry[grade]} year={entry.year} tone={grade} />
                </div>
              ))}
            </div>

            {entry.general && entry.general.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recursos generales</p>
                <div className="space-y-2">
                  {entry.general.map((item) => (
                    <a
                      key={`${entry.year}-general-${item.url}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                    >
                      <span className="block font-medium text-slate-800 dark:text-slate-100">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{renderMeta(item, entry.year)}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}