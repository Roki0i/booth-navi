import { booths } from './booths'
import { EVENT_SCHEMA_VERSION, type EventProject } from '../types/event'

export const SAMPLE_EVENT_ID = 'sample-doujin-event-2026'

export function createSampleEvent(id = SAMPLE_EVENT_ID): EventProject {
  const now = new Date().toISOString()
  return {
    schemaVersion: EVENT_SCHEMA_VERSION,
    id,
    name: 'Sample Doujin Event 2026',
    shortName: 'SDE 2026',
    date: '2026-08-08',
    venue: 'サンプル展示ホール',
    description: '24組の架空サークルが参加する、Booth Naviのデモイベントです。',
    assets: {},
    theme: {
      primaryColor: '#6554c0',
      backgroundColor: '#f7f5ef',
      surfaceColor: '#fffefa',
      textColor: '#22232a',
      mutedTextColor: '#6b6b73',
      mapBackgroundColor: '#ece9df',
      mapSurfaceColor: '#f8f6ef',
      mapTextColor: '#25252a',
      mapStyle: 'light',
      fontStyle: 'sans',
    },
    map: { width: 900, height: 700, gridSize: 2, showGrid: false },
    booths: structuredClone(booths),
    createdAt: now,
    updatedAt: now,
  }
}

export const sampleEvents: EventProject[] = [createSampleEvent()]
