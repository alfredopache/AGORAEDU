import { Metadata } from "next"
import { EduIAMainLayout } from "./components/main-layout"

export const metadata: Metadata = {
  title: "Acceso IA - Tutoría educativa para FP, Grado Básico y ESO",
  description: "Plataforma educativa con IA para preparar pruebas de acceso a FP, reforzar Grado Básico y apoyar contenidos de ESO. Incluye tutor personalizado, práctica y simulacros adaptados.",
  keywords: ["educación", "IA", "chatbot", "FP", "ESO", "Grado Básico", "pruebas de acceso", "formación profesional", "estudios"],
}

export default function EduIAPage() {
  return <EduIAMainLayout />
}
