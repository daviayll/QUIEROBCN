import { describe, it, expect } from 'vitest'
import { REQUIRED_DOCS, DOC_LABELS } from './index'

describe('REQUIRED_DOCS', () => {
  it('empleado has correct docs', () => {
    expect(REQUIRED_DOCS.empleado).toEqual(
      expect.arrayContaining(['dni', 'contrato', 'nomina_1', 'nomina_2', 'nomina_3', 'vida_laboral'])
    )
    expect(REQUIRED_DOCS.empleado).toHaveLength(6)
  })

  it('estudiante includes matricula and ahorros', () => {
    expect(REQUIRED_DOCS.estudiante).toContain('matricula')
    expect(REQUIRED_DOCS.estudiante).toContain('ahorros')
  })

  it('autonomo has exactly 6 docs', () => {
    expect(REQUIRED_DOCS.autonomo).toHaveLength(6)
    expect(REQUIRED_DOCS.autonomo).toContain('renta')
    expect(REQUIRED_DOCS.autonomo).toContain('extracto_bancario')
  })

  it('otro starts with pasaporte', () => {
    expect(REQUIRED_DOCS.otro[0]).toBe('pasaporte')
  })

  it('all doc types have a DOC_LABELS entry', () => {
    const allDocTypes = Object.values(REQUIRED_DOCS).flat()
    const uniqueTypes = [...new Set(allDocTypes)]
    uniqueTypes.forEach(type => {
      expect(DOC_LABELS[type], `Missing DOC_LABELS entry for: ${type}`).toBeTruthy()
    })
  })

  it('all DOC_LABELS values are non-empty strings', () => {
    Object.entries(DOC_LABELS).forEach(([key, value]) => {
      expect(typeof value).toBe('string')
      expect(value.length, `Empty label for: ${key}`).toBeGreaterThan(0)
    })
  })
})
