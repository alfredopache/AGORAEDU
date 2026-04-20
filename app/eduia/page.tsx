import { Metadata } from "next"
import { EduIAMainLayout } from "./components/main-layout"

export const metadata: Metadata = {
  title: "Acceso IA - Asistente para Pruebas de Acceso a Grado Medio",
  description: "Plataforma educativa con IA especializada en preparación para pruebas de acceso a ciclos formativos de grado medio. Incluye chatbot inteligente, exámenes de práctica y análisis de rendimiento.",
  keywords: ["educación", "IA", "chatbot", "grado medio", "formación profesional", "España", "pruebas de acceso", "exámenes"],
}

export default function EduIAPage() {
  return <EduIAMainLayout />
}
