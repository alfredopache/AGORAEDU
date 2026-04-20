import { client } from "@/sanity/lib/client"

// Definimos la estructura de lo que viene de Sanity
export interface AboutSettings {
  stats: Array<{
    label: string;
    value: string;
    icon: string;
  }>;
  socialLinks: Array<{
    name: string;
    url: string;
  }>;
}

export const getAboutSettings = async (): Promise<AboutSettings | null> => {
  const query = `*[_type == "aboutSettings" && _id == "aboutSettings"][0] {
    stats[] {
      label,
      value,
      icon
    },
    socialLinks[] {
      name,
      url
    }
  }`
  
  return await client.fetch(query)
}