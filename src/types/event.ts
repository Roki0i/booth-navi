import type { Booth, ImageReference } from './booth'

export const EVENT_SCHEMA_VERSION = 1

export type FontStyle = 'sans' | 'serif' | 'rounded'
export type MapStyle = 'light' | 'dark' | 'image'

export interface EventAssets {
  logoImage?: ImageReference
  heroImage?: ImageReference
  pageBackgroundImage?: ImageReference
  mapImage?: ImageReference
}

export interface EventTheme {
  primaryColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedTextColor: string
  mapBackgroundColor: string
  mapSurfaceColor: string
  mapTextColor: string
  mapStyle: MapStyle
  fontStyle: FontStyle
}

export interface EventMap {
  width: number
  height: number
  backgroundImage?: ImageReference
  gridSize: number
  showGrid: boolean
}

export interface EventProject {
  schemaVersion: number
  id: string
  name: string
  shortName: string
  date: string
  venue: string
  description: string
  assets: EventAssets
  theme: EventTheme
  map: EventMap
  booths: Booth[]
  createdAt: string
  updatedAt: string
}
