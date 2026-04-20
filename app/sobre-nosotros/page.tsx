import { 
  Users, User, GraduationCap, Book, Presentation, FileText, 
  Code, Monitor, Database, Key, Lightbulb, Target, 
  BarChart3, LineChart, Briefcase, Calculator, Clock, 
  Calendar, Zap, Map, Settings, Youtube, Instagram, 
  Linkedin, Twitter, Music, MessageCircle, ArrowUpRight,
  BrainCircuit, Rocket, type LucideIcon 
} from "lucide-react"
import Image from "next/image"
import { getTeamMembers } from "@/content/team"
import { getAboutSettings } from "@/content/about"
import { AnimatedSection, AnimatedMember } from "./animations"
import { TeamMemberCard } from "@/components/team-member-card"
import { StatsTicker } from "@/components/stats-ticker"
import SuggestionBox from '@/components/suggestion-box'

export const dynamic = 'force-dynamic'

// 1. Diccionario de iconos para el Ticker (Sincronizado con aboutSettings.ts)
const STAT_ICONS: Record<string, LucideIcon> = {
  'users': Users,
  'user': User,
  'graduation': GraduationCap,
  'book': Book,
  'presentation': Presentation,
  'file': FileText,
  'code': Code,
  'monitor': Monitor,
  'database': Database,
  'key': Key,
  'lightbulb': Lightbulb,
  'target': Target,
  'bar-chart': BarChart3,
  'line-chart': LineChart,
  'briefcase': Briefcase,
  'calculator': Calculator,
  'clock': Clock,
  'calendar': Calendar,
  'zap': Zap,
  'map': Map,
  'settings': Settings,
  'brain': BrainCircuit,
  'rocket': Rocket,
}

// 2. Configuración de Redes Sociales extendida
const SOCIAL_CONFIG: Record<string, { icon: LucideIcon, color: string }> = {
  Youtube: { icon: Youtube, color: "hover:bg-red-600" },
  Instagram: { icon: Instagram, color: "hover:bg-pink-600" },
  Linkedin: { icon: Linkedin, color: "hover:bg-blue-700" },
  X: { icon: Twitter, color: "hover:bg-black" },
  Tiktok: { icon: Music, color: "hover:bg-slate-900" }, // Icono Music es el estándar para TikTok en Lucide
  Whatsapp: { icon: MessageCircle, color: "hover:bg-green-500" },
}

interface Member {
  name: string;
  role: string;
  image: string;
  bio?: string;
  socials?: Array<{
    platform: string;
    url: string;
  }>;
}

export default async function AboutUs() {
  const [team, aboutData] = await Promise.all([
    getTeamMembers(),
    getAboutSettings()
  ]);

  // Mapeo seguro de estadísticas
  const stats = aboutData?.stats?.map((s: any) => ({
    label: s.label,
    value: s.value,
    icon: STAT_ICONS[s.icon] || Zap 
  })) || [];

  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white pt-32 pb-24 overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-32">
          <div className="lg:col-span-8 flex flex-col justify-center space-y-8">
            <AnimatedSection>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mt-6">
                Humanizando <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-400 dark:from-blue-400 dark:to-purple-400">
                  el futuro.
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mt-6">
                En <span className="text-slate-900 dark:text-white font-medium italic">AgoraEdu</span>, transformamos la curiosidad escolar en innovación tangible a través de la inteligencia artificial.
              </p>
            </AnimatedSection>
            
            <AnimatedSection>
              <SuggestionBox />
            </AnimatedSection>
          </div>

          <div className="lg:col-span-4 relative group">
            <AnimatedSection>
              <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl transition-transform duration-500 group-hover:-rotate-1">
                <Image 
                  src="/images/hero.jpeg"
                  alt="Nuestro equipo"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* TICKER DE STATS */}
        {stats.length > 0 && (
          <StatsTicker stats={stats.map(s => ({
            ...s,
            icon: <s.icon className="w-5 h-5" />
          }))} />
        )}
        
        {/* SOCIAL CONNECT DINÁMICO */}
        <AnimatedSection>
          <div className="relative rounded-[3rem] bg-blue-600 dark:bg-blue-700 p-12 overflow-hidden text-white mt-10 shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150 pointer-events-none">
                <Rocket size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Síguenos en nuestra comunidad</h3>
                <p className="text-blue-100/80 max-w-md text-lg">
                  Estamos construyendo en público. Mira nuestros procesos, tutoriales y el día a día del equipo.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-end max-w-xl">
                {aboutData?.socialLinks?.map((social: any) => {
                  const platformKey = social.name.toLowerCase();
                  const config = SOCIAL_CONFIG[platformKey] || { icon: ArrowUpRight, color: "hover:bg-blue-800" };
                  const Icon = config.icon;

                  return (
                    <a 
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-6 py-4 bg-white text-blue-600 rounded-2xl font-bold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${config.color} hover:text-white group`}
                    >
                      <Icon size={20} />
                      <span>{social.name}</span>
                      <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* TEAM SECTION */}
        <section className="mt-20 mb-40">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">El equipo detrás del código</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Una mezcla diversa de mentes jóvenes y mentores apasionados por democratizar la tecnología.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member: Member, i: number) => (
              <AnimatedMember key={member.name} delay={i * 0.1}>
                <TeamMemberCard member={member} />
              </AnimatedMember>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}