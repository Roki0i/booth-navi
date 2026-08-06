import type { WorkCategory } from '../types/booth'
import { workCategoryLabel } from '../utils/boothMetadata'

interface Props {
  category: WorkCategory
  compact?: boolean
}

export function WorkCategoryBadge({ category, compact = false }: Props) {
  return (
    <span
      className={`work-category-badge work-category-${category}${compact ? ' is-compact' : ''}`}
      data-work-category={category}
    >
      {workCategoryLabel(category)}
    </span>
  )
}
