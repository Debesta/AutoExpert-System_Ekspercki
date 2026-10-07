import { CRITERIA } from './constants'

export function calculateTopsis(cars, weights, limit = 5) {
	if (cars.length === 0) return []
	if (cars.length === 1) return [{ ...cars[0], topsisScore: 1 }]

	const totalWeight = CRITERIA.reduce((s, c) => s + weights[c.weight], 0) || 1

	const columns = CRITERIA.map(c => {
		const norm = Math.sqrt(cars.reduce((s, car) => s + car[c.key] ** 2, 0)) || 1
		const w = weights[c.weight] / totalWeight
		return cars.map(car => (car[c.key] / norm) * w)
	})

	const ideal = columns.map((col, j) => (CRITERIA[j].benefit ? Math.max(...col) : Math.min(...col)))
	const anti = columns.map((col, j) => (CRITERIA[j].benefit ? Math.min(...col) : Math.max(...col)))

	return cars
		.map((car, i) => {
			let dPlus = 0,
				dMinus = 0
			columns.forEach((col, j) => {
				dPlus += (col[i] - ideal[j]) ** 2
				dMinus += (col[i] - anti[j]) ** 2
			})
			dPlus = Math.sqrt(dPlus)
			dMinus = Math.sqrt(dMinus)
			return { ...car, topsisScore: dPlus + dMinus === 0 ? 1 : dMinus / (dPlus + dMinus) }
		})
		.sort((a, b) => b.topsisScore - a.topsisScore)
		.slice(0, limit)
}
