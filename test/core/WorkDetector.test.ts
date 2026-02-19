// tests/core/WorkDetector.test.ts
import { describe, it, expect } from 'vitest'
import { WorkDetector } from '../../src/core/WorkDetector'

const WORK_SELECTOR = '0x6191c782'
const JOB_ADDRESS = '0x238b4E35dAed6100C6162fAE4510261f88996EC9'
const whitelist = new Set([JOB_ADDRESS.toLowerCase()])

describe('WorkDetector', () => {

  it('debería retornar isMatch: true cuando la dirección y el selector coinciden', () => {
    const tx = {
      to: JOB_ADDRESS,
      data: WORK_SELECTOR + '00000000000000000000000'
    }

    const result = WorkDetector.detect(tx, whitelist, WORK_SELECTOR)

    expect(result.isMatch).toBe(true)
    expect(result.jobAddress).toBe(JOB_ADDRESS.toLowerCase())
  })

  it('debería ser insensible a mayúsculas en la dirección de la transacción', () => {
    const tx = {
      to: JOB_ADDRESS.toUpperCase(),
      data: WORK_SELECTOR
    }

    const result = WorkDetector.detect(tx, whitelist, WORK_SELECTOR)

    expect(result.isMatch).toBe(true)
    expect(result.jobAddress).toBe(JOB_ADDRESS.toLowerCase())
  })

  it('debería retornar isMatch: false si la dirección no está en la whitelist', () => {
    const tx = {
      to: '0x000000000000000000000000000000000000dead',
      data: WORK_SELECTOR
    }

    const result = WorkDetector.detect(tx, whitelist, WORK_SELECTOR)

    expect(result.isMatch).toBe(false)
    expect(result.jobAddress).toBeUndefined()
  })

  it('debería retornar isMatch: false si el selector no coincide', () => {
    const tx = {
      to: JOB_ADDRESS,
      data: '0xa9059cbb'
    }

    const result = WorkDetector.detect(tx, whitelist, WORK_SELECTOR)

    expect(result.isMatch).toBe(false)
  })

  it('debería manejar transacciones de creación de contrato (to: null)', () => {
    const tx = {
      to: null,
      data: '0x60806040...'
    }

    const result = WorkDetector.detect(tx, whitelist, WORK_SELECTOR)

    expect(result.isMatch).toBe(false)
  })

  it('debería fallar si el data es más corto que el selector', () => {
    const tx = {
      to: JOB_ADDRESS,
      data: '0x12'
    }

    const result = WorkDetector.detect(tx, whitelist, WORK_SELECTOR)

    expect(result.isMatch).toBe(false)
  })
})