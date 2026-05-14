export type OfficialAccessResourceKind = "exam" | "guide" | "priority" | "info" | "summary"

export type OfficialAccessResource = {
  title: string
  url: string
  source: string
  verified: boolean
  kind: OfficialAccessResourceKind
  yearLabel?: string
}

export type OfficialAccessTimelineEntry = {
  year: number
  gm: OfficialAccessResource[]
  gs: OfficialAccessResource[]
  general?: OfficialAccessResource[]
}

const CEICE_SOURCE = "ceice.gva.es"
const PORTAL_SOURCE = "portal.edu.gva.es"

function resource(
  title: string,
  url: string,
  source: string,
  kind: OfficialAccessResourceKind,
  verified = true,
  yearLabel?: string,
): OfficialAccessResource {
  return { title, url, source, verified, kind, yearLabel }
}

export const OFFICIAL_ACCESS_TIMELINE: OfficialAccessTimelineEntry[] = [
  {
    year: 2017,
    gm: [resource("GM 2017 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2017.pdf", CEICE_SOURCE, "exam")],
    gs: [resource("GS 2017 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2017.pdf", CEICE_SOURCE, "exam")],
  },
  {
    year: 2018,
    gm: [resource("GM 2018 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2018.pdf", CEICE_SOURCE, "exam")],
    gs: [],
  },
  {
    year: 2019,
    gm: [resource("GM 2019 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2019.pdf", CEICE_SOURCE, "exam")],
    gs: [resource("GS 2019 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2019.pdf", CEICE_SOURCE, "exam")],
  },
  {
    year: 2020,
    gm: [resource("GM 2020 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2020.pdf", CEICE_SOURCE, "exam")],
    gs: [resource("GS 2020 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2020.pdf", CEICE_SOURCE, "exam")],
  },
  {
    year: 2021,
    gm: [resource("GM 2021 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2021.pdf", CEICE_SOURCE, "exam")],
    gs: [resource("GS 2021 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2021.pdf", CEICE_SOURCE, "exam")],
  },
  {
    year: 2022,
    gm: [resource("GM 2022 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2022.pdf", CEICE_SOURCE, "exam")],
    gs: [resource("GS 2022 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2022.pdf", CEICE_SOURCE, "exam")],
  },
  {
    year: 2023,
    gm: [resource("GM 2023 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2023.pdf", CEICE_SOURCE, "exam")],
    gs: [resource("GS 2023 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2023.pdf", CEICE_SOURCE, "exam")],
  },
  {
    year: 2024,
    gm: [
      resource("GM 2024 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038839/GM_2024.pdf", CEICE_SOURCE, "exam"),
      resource("Criterios de Prioridad en la Admisión - CFGM", "https://ceice.gva.es/documents/388109149/392974777/Prioridades_GM.pdf", CEICE_SOURCE, "priority"),
      resource("Informació PAC CFGM 2024 (IES Benissa)", "https://portal.edu.gva.es/iesbenissa/wp-content/uploads/sites/309/2024/02/InformacioPAC_CFGM_24.pdf", PORTAL_SOURCE, "info"),
      resource("Prova d'accés Cicle Mitjà 2024 (IES La Valldigna)", "https://portal.edu.gva.es/ieslavalldigna/wp-content/uploads/sites/512/2024/02/Prova-acces-cicle-mitja.pdf", PORTAL_SOURCE, "info"),
    ],
    gs: [resource("GS 2024 — Prueba de Acceso", "https://ceice.gva.es/documents/388109149/391038844/GS_2024.pdf", CEICE_SOURCE, "exam")],
    general: [
      resource("Orientaciones Admisión GM/GS 2024-25 (valencià)", "https://ceice.gva.es/documents/388109149/392974777/OrientacionesGMGS_va.pdf", CEICE_SOURCE, "guide", true, "2024-25"),
      resource("Orientaciones Admisión GM/GS 2024-25 (español)", "https://ceice.gva.es/documents/388109149/392974777/OrientacionesGMGS_es.pdf", CEICE_SOURCE, "guide", true, "2024-25"),
      resource("Proves d'accés a Cicles — recopilación 2024", "https://portal.edu.gva.es/46020480/wp-content/uploads/sites/468/2024/02/Proves-dacces-cicles.pdf", PORTAL_SOURCE, "summary", false),
    ],
  },
  {
    year: 2025,
    gm: [
      resource("GM 2025 — Prueba de Acceso / documentación oficial", "https://ceice.gva.es/documents/388109149/0/JUNTOS+GM+2025.pdf/eaff2543-5199-f592-6af1-aa689a78ea67", CEICE_SOURCE, "exam"),
      resource("Prova Accés Grau Mitjà 2025 (IES Alcasser)", "https://portal.edu.gva.es/iesalcasser/wp-content/uploads/sites/303/2025/02/PROVA-ACCES-GRAU-MITJA.pdf", PORTAL_SOURCE, "info"),
      resource("Proves d'accés CFGM 2025 - Informació (IES Abastos)", "https://portal.edu.gva.es/iesabastos/wp-content/uploads/sites/617/2025/03/25PACFGM-v-Informacio-proves-dacces-de-grau-mitja.pdf", PORTAL_SOURCE, "info"),
    ],
    gs: [resource("GS 2025 — Prueba de Acceso / documentación oficial", "https://ceice.gva.es/documents/388109149/0/JUNTOS+GS+2025.pdf/5ea55736-65de-bb7b-f6be-3fd240962af0", CEICE_SOURCE, "exam")],
    general: [
      resource("Proves d'accés FP 2025 — recopilación (Portal Educatiu)", "https://portal.edu.gva.es/46020480/wp-content/uploads/sites/468/2025/03/Proves-dacces-FP-2025.pdf", PORTAL_SOURCE, "summary"),
      resource("Proves d'accés Cicles Formatius 2025 (IES Isabel Clara Simó)", "https://portal.edu.gva.es/iesisabel-clarasimo/wp-content/uploads/sites/1636/2025/02/Proves-acces-CF2025.pdf", PORTAL_SOURCE, "summary"),
    ],
  },
].sort((left, right) => left.year - right.year)

function buildExamPdfMap(grade: "gm" | "gs") {
  return OFFICIAL_ACCESS_TIMELINE.reduce<Record<string, string>>((accumulator, entry) => {
    const examResource = entry[grade].find((item) => item.kind === "exam")
    if (examResource) {
      accumulator[String(entry.year)] = examResource.url
    }
    return accumulator
  }, {})
}

export const GM_PDFS_BY_YEAR = buildExamPdfMap("gm")
export const GS_PDFS_BY_YEAR = buildExamPdfMap("gs")