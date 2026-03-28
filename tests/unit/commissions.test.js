import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularComisiones, ajustarComisionesPorDiscrepancia } from '../../lib/commissions.js'

describe('calcularComisiones', () => {
  it('calcula correctamente sin agencia', () => {
    const r = calcularComisiones(100, { percPlataforma: 20, percReferidor: 50 })
    assert.equal(r.comLugar, 20)       // 100 * 20%
    assert.equal(r.comReferidor, 10)   // 20 * 50%
    assert.equal(r.comAgencia, 0)
  })

  it('calcula correctamente con agencia', () => {
    const r = calcularComisiones(200, { percPlataforma: 20, percReferidor: 50, percAgencia: 30 })
    assert.equal(r.comLugar, 40)       // 200 * 20%
    assert.equal(r.comReferidor, 20)   // 40 * 50%
    assert.equal(r.comAgencia, 12)     // 40 * 30%
  })

  it('normaliza si referidor + agencia > 100%', () => {
    const r = calcularComisiones(100, { percPlataforma: 20, percReferidor: 70, percAgencia: 60 })
    // comLugar = 20, referidor quiere 14 + agencia quiere 12 = 26 > 20
    // Normaliza: ref = 20*(70/130), ag = 20*(60/130)
    assert.ok(r.comReferidor + r.comAgencia <= r.comLugar + 0.01)
    assert.ok(r.comReferidor > 0)
    assert.ok(r.comAgencia > 0)
  })

  it('maneja gasto cero', () => {
    const r = calcularComisiones(0, { percPlataforma: 20, percReferidor: 50 })
    assert.equal(r.comLugar, 0)
    assert.equal(r.comReferidor, 0)
    assert.equal(r.comAgencia, 0)
  })

  it('usa defaults correctos', () => {
    const r = calcularComisiones(100, {})
    assert.equal(r.comLugar, 20)       // default 20%
    assert.equal(r.comReferidor, 10)   // default 50% of 20
  })

  it('maneja gasto grande', () => {
    const r = calcularComisiones(50000, { percPlataforma: 15, percReferidor: 40 })
    assert.equal(r.comLugar, 7500)     // 50000 * 15%
    assert.equal(r.comReferidor, 3000) // 7500 * 40%
  })

  it('redondea a 2 decimales', () => {
    const r = calcularComisiones(33.33, { percPlataforma: 20, percReferidor: 50 })
    assert.equal(r.comLugar, 6.67)     // rounded
    assert.equal(r.comReferidor, 3.33) // rounded
  })
})

describe('ajustarComisionesPorDiscrepancia', () => {
  const comisiones = { comLugar: 20, comReferidor: 10, comAgencia: 4 }

  it('ajusta proporcionalmente cuando cliente reporta menos', () => {
    const r = ajustarComisionesPorDiscrepancia(comisiones, 50, 100)
    // ratio = 0.5
    assert.equal(r.comision_lugar, 10)
    assert.equal(r.comision_referidor, 5)
    assert.equal(r.comision_agencia, 2)
  })

  it('retorna null si cliente reporta igual o más', () => {
    assert.equal(ajustarComisionesPorDiscrepancia(comisiones, 100, 100), null)
    assert.equal(ajustarComisionesPorDiscrepancia(comisiones, 120, 100), null)
  })

  it('retorna null si gasto confirmado es 0', () => {
    assert.equal(ajustarComisionesPorDiscrepancia(comisiones, 0, 0), null)
  })

  it('maneja discrepancia parcial', () => {
    const r = ajustarComisionesPorDiscrepancia(comisiones, 80, 100)
    // ratio = 0.8
    assert.equal(r.comision_lugar, 16)
    assert.equal(r.comision_referidor, 8)
    assert.equal(r.comision_agencia, 3.2)
  })

  it('maneja discrepancia extrema (cliente dice 1€)', () => {
    const r = ajustarComisionesPorDiscrepancia(comisiones, 1, 100)
    // ratio = 0.01
    assert.equal(r.comision_lugar, 0.2)
    assert.equal(r.comision_referidor, 0.1)
    assert.equal(r.comision_agencia, 0.04)
  })
})
