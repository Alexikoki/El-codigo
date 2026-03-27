/**
 * Calcula las comisiones a repartir dado un gasto confirmado.
 *
 * @param {number} gastoConfirmado - Gasto total del cliente
 * @param {object} params
 * @param {number} params.percPlataforma - % que el local paga a la plataforma (default 20)
 * @param {number} params.percReferidor - % split del referidor sobre com_lugar (default 50)
 * @param {number|null} params.percAgencia - % split de la agencia sobre com_lugar (null si no hay agencia)
 * @returns {{ comLugar: number, comReferidor: number, comAgencia: number }}
 */
export function calcularComisiones(gastoConfirmado, { percPlataforma = 20, percReferidor = 50, percAgencia = null }) {
  const comLugar = gastoConfirmado * (percPlataforma / 100)
  let comReferidor = 0
  let comAgencia = 0

  if (percAgencia != null) {
    // Con agencia: cada uno se lleva su % de com_lugar
    comReferidor = comLugar * (percReferidor / 100)
    comAgencia = comLugar * (percAgencia / 100)

    // Si superan el 100% de com_lugar, normalizar proporcionalmente
    if (comReferidor + comAgencia > comLugar) {
      const total = percReferidor + percAgencia
      comReferidor = comLugar * (percReferidor / total)
      comAgencia = comLugar * (percAgencia / total)
    }
  } else {
    // Sin agencia: referidor se lleva su % directo
    comReferidor = comLugar * (percReferidor / 100)
  }

  return {
    comLugar: parseFloat(comLugar.toFixed(2)),
    comReferidor: parseFloat(comReferidor.toFixed(2)),
    comAgencia: parseFloat(comAgencia.toFixed(2))
  }
}

/**
 * Ajusta comisiones proporcionalmente cuando el cliente reporta un gasto menor.
 *
 * @param {{ comLugar: number, comAgencia: number, comReferidor: number }} comisiones
 * @param {number} gastoCliente - Lo que el cliente dice que pagó
 * @param {number} gastoConfirmado - Lo que el staff registró
 * @returns {{ comision_lugar: number, comision_agencia: number, comision_referidor: number } | null}
 */
export function ajustarComisionesPorDiscrepancia(comisiones, gastoCliente, gastoConfirmado) {
  if (gastoCliente >= gastoConfirmado || gastoConfirmado <= 0) return null

  const ratio = gastoCliente / gastoConfirmado
  return {
    comision_lugar: parseFloat((comisiones.comLugar * ratio).toFixed(2)),
    comision_agencia: parseFloat((comisiones.comAgencia * ratio).toFixed(2)),
    comision_referidor: parseFloat((comisiones.comReferidor * ratio).toFixed(2))
  }
}
