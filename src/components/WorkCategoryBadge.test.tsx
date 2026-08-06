import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { WorkCategoryBadge } from './WorkCategoryBadge'

describe('WorkCategoryBadge', () => {
  it.each([
    ['original', 'オリジナル'],
    ['derivative', '二次創作'],
    ['review', '評論・情報'],
    ['other', 'その他'],
  ] as const)('%sを共通の作品区分クラスで表示する', (category, label) => {
    const html = renderToStaticMarkup(<WorkCategoryBadge category={category} />)
    expect(html).toContain('work-category-badge')
    expect(html).toContain(`work-category-${category}`)
    expect(html).toContain(label)
  })
})
