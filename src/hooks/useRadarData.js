import { useMemo } from 'react'
import { CRITERIA } from '../constants'

export function useRadarData(results) {
	return useMemo(() => {
		if (!Array.isArray(results) || results.length === 0) return []
		const top3 = results.slice(0, 3)

		const getDynamicBounds = (key, minMargin, minFloor = 0) => {
			const values = results.map(car => car[key])
			const rawMin = Math.min(...values)
			const rawMax = Math.max(...values)
			const spread = rawMax - rawMin
			const margin = Math.max(minMargin, spread * 0.15)

			return {
				min: Math.max(minFloor, rawMin - margin),
				max: rawMax + margin,
			}
		}

		const BOUNDS = {
			price: getDynamicBounds('price', 15000, 5000),
			trunkSize: getDynamicBounds('trunkSize', 80, 100),
			energyCost: getDynamicBounds('energyCost', 10, 0),
			acceleration: getDynamicBounds('acceleration', 1.5, 1.5),
			maintenanceCost: { min: 1, max: 10 },
			comfort: { min: 1, max: 10 },
			safety: { min: 1, max: 10 },
			reliability: { min: 1, max: 10 },
		}

		const normalize = (key, val, invert = false) => {
			const b = BOUNDS[key] || { min: 0, max: Math.max(val, 1) }
			const range = b.max - b.min === 0 ? 1 : b.max - b.min
			const clampedVal = Math.max(b.min, Math.min(b.max, val))
			const score = ((clampedVal - b.min) / range) * 10
			const finalScore = invert ? 10 - score : score
			return Math.max(1, Math.min(10, finalScore))
		}

		const metrics = CRITERIA.map(c => ({ subject: c.label, key: c.key, invert: !c.benefit }))

		return top3.map(car =>
			metrics.map(m => ({
				subject: m.subject,
				value: Number(normalize(m.key, car[m.key], m.invert).toFixed(1)),
				carName: `${car.brand} ${car.model}`,
			})),
		)
	}, [results])
}
