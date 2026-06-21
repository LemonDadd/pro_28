import { FileItem } from '../types'
import exifr from 'exifr'

export const EXIF_AVAILABLE_FIELDS = [
  { key: 'DateTimeOriginal', label: '拍摄日期时间', category: 'Date' },
  { key: 'CreateDate', label: '创建日期', category: 'Date' },
  { key: 'ModifyDate', label: '修改日期', category: 'Date' },
  { key: 'Make', label: '相机制造商', category: 'Camera' },
  { key: 'Model', label: '相机型号', category: 'Camera' },
  { key: 'LensModel', label: '镜头型号', category: 'Camera' },
  { key: 'FocalLength', label: '焦距', category: 'Photo' },
  { key: 'FNumber', label: '光圈', category: 'Photo' },
  { key: 'ExposureTime', label: '曝光时间', category: 'Photo' },
  { key: 'ISO', label: 'ISO', category: 'Photo' },
  { key: 'GPSLatitude', label: 'GPS纬度', category: 'GPS' },
  { key: 'GPSLongitude', label: 'GPS经度', category: 'GPS' },
  { key: 'ImageWidth', label: '图片宽度', category: 'Image' },
  { key: 'ImageHeight', label: '图片高度', category: 'Image' },
  { key: 'Artist', label: '作者', category: 'Meta' },
  { key: 'Copyright', label: '版权', category: 'Meta' }
]

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'tiff', 'tif', 'heic', 'heif', 'webp', 'raw',
  'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'pef'
])

export function isImageFile(file: FileItem): boolean {
  const ext = file.originalExtension.toLowerCase()
  return IMAGE_EXTENSIONS.has(ext)
}

export async function readExifData(filePath: string): Promise<Record<string, any> | null> {
  try {
    const data = await exifr.parse(filePath, {
      translateValues: true,
      pick: EXIF_AVAILABLE_FIELDS.map((f) => f.key)
    })
    return data || null
  } catch (e) {
    console.warn('Failed to read EXIF data:', e)
    return null
  }
}

export async function readExifFromBuffer(buffer: ArrayBuffer): Promise<Record<string, any> | null> {
  try {
    const data = await exifr.parse(buffer, {
      translateValues: true,
      pick: EXIF_AVAILABLE_FIELDS.map((f) => f.key)
    })
    return data || null
  } catch (e) {
    console.warn('Failed to read EXIF from buffer:', e)
    return null
  }
}
