export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function validateImage(file: Pick<File, 'type' | 'size'>): { valid: boolean; warning?: string; error?: string } {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) return { valid: false, error: 'PNG、JPEG、WebPのみ使用できます。' }
  if (file.size > MAX_IMAGE_SIZE) return { valid: true, warning: '画像が5MBを超えています。端末の保存容量に注意してください。' }
  return { valid: true }
}
