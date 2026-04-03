
import type { MetadataRoute } from 'next'

/**
 * @fileOverview Gerador de Manifesto PWA para o Aura System.
 * Define como o app se comporta ao ser instalado no celular.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aura System AI - Solo Leveling Edition',
    short_name: 'Aura System',
    description: 'Plataforma fitness imersiva inspirada no universo de Solo Leveling.',
    start_url: '/',
    display: 'standalone',
    background_color: '#030406',
    theme_color: '#00BFFF',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: 'https://placehold.co/192x192/030406/00BFFF/png?text=AURA',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://placehold.co/512x512/030406/00BFFF/png?text=AURA',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://placehold.co/512x512/030406/00BFFF/png?text=AURA',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  }
}
