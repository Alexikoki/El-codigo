import { NextResponse } from 'next/server'

export const IMAGE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VALID_TYPES: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic'
  }
}

/**
 * Valida un archivo de imagen subido.
 * @param {File} file
 * @returns {{ valid: true, ext: string } | { valid: false, response: NextResponse }}
 */
export function validarImagen(file) {
  if (!file || file.size === 0) {
    return { valid: true, ext: null } // No hay archivo, ok
  }

  if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'Imagen demasiado grande (máx 5MB)' }, { status: 400 })
    }
  }

  const ext = IMAGE_CONSTRAINTS.VALID_TYPES[file.type]
  if (!ext) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'Formato de imagen no válido' }, { status: 400 })
    }
  }

  return { valid: true, ext }
}
