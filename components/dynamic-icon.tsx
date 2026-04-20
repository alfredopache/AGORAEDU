import { 
  Users, 
  User, 
  GraduationCap, 
  Book, 
  Presentation, 
  FileText, 
  Code, 
  Monitor, 
  Database, 
  Key, 
  Lightbulb, 
  Target, 
  BarChart3, 
  LineChart, 
  Briefcase, 
  Calculator, 
  Clock, 
  Calendar, 
  Zap, 
  Map, 
  Settings,
  HelpCircle 
} from 'lucide-react';

// Definimos los iconos disponibles
// Los nombres de la izquierda deben coincidir con el "value" que pusimos en Sanity
const iconMap = {
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
};

interface DynamicIconProps {
  name: string;
  className?: string;
}

export const DynamicIcon = ({ name, className }: DynamicIconProps) => {
  // Buscamos el icono en el mapa, si no existe usamos HelpCircle por defecto
  const IconComponent = iconMap[name as keyof typeof iconMap] || HelpCircle;

  return <IconComponent className={className} strokeWidth={1.5} />;
};