import { CRITERIA, calculateEnergyCostPer100km } from './constants'

function getCriterionValue(car, criterion) {
	if (typeof criterion.getValue === 'function') {
		return criterion.getValue(car)
	}
	return Number(car[criterion.key]) || 0
}

export function normalizeWeights(rawWeights = {}) {
	const cleaned = {}
	let total = 0

	for (const c of CRITERIA) {
		const val = Math.max(0, Number(rawWeights[c.weight]) || 0)
		cleaned[c.weight] = val
		total += val
	}

	const normalized = {}
	if (total > 0) {
		for (const c of CRITERIA) {
			normalized[c.weight] = cleaned[c.weight] / total
		}
	} else {
		// Przypadek brzegowy: wszystkie wagi ustawione na 0 -> równe traktowanie kryteriów
		const equalWeight = 1 / CRITERIA.length
		for (const c of CRITERIA) {
			normalized[c.weight] = equalWeight
		}
	}

	return normalized
}

export function calculateTopsis(cars, rawWeights = {}) {
	if (!Array.isArray(cars) || cars.length === 0) return []

	const weights = normalizeWeights(rawWeights)

	// Wzbogacenie rekordów o ujednolicony koszt energii (PLN / 100 km)
	const enrichedCars = cars.map(car => ({
		...car,
		energyCost: calculateEnergyCostPer100km(car),
	}))

	// Przypadek brzegowy: 1 pojazd w zestawie (brak bazy porównawczej)
	if (enrichedCars.length === 1) {
		return [
			{
				...enrichedCars[0],
				topsisScore: 1,
				dPlus: 0,
				dMinus: 0,
				xai: CRITERIA.map(c => ({
					key: c.key,
					weightKey: c.weight,
					label: c.label,
					weightShare: Number((weights[c.weight] * 100).toFixed(1)),
					dPlusShare: 0,
					dMinusShare: 0,
					netImpact: 0,
				})),
			},
		]
	}

	// 1. Mianowniki normalizacji wektorowej dla każdego kryterium
	const norms = {}
	for (const c of CRITERIA) {
		const sumSq = enrichedCars.reduce((sum, car) => {
			const val = getCriterionValue(car, c)
			return sum + val * val
		}, 0)
		norms[c.key] = Math.sqrt(sumSq)
	}

	// 2. Macierz znormalizowana i ważona (v_ij = w_j * r_ij)
	const weightedMatrix = enrichedCars.map(car => {
		const row = {}
		for (const c of CRITERIA) {
			const val = getCriterionValue(car, c)
			const r = norms[c.key] === 0 ? 0 : val / norms[c.key]
			row[c.key] = r * weights[c.weight]
		}
		return row
	})

	// 3. Rozwiązanie idealne (v+) i antyidealne (v-)
	const ideal = {}
	const antiIdeal = {}
	for (const c of CRITERIA) {
		const colValues = weightedMatrix.map(row => row[c.key])
		const maxVal = Math.max(...colValues)
		const minVal = Math.min(...colValues)
		ideal[c.key] = c.benefit ? maxVal : minVal
		antiIdeal[c.key] = c.benefit ? minVal : maxVal
	}

	// 4. Odległości euklidesowe d+, d-, indeks TOPSIS oraz dekompozycja XAI
	const scoredCars = enrichedCars.map((car, idx) => {
		const row = weightedMatrix[idx]
		let dPlusSq = 0
		let dMinusSq = 0

		const rawContributions = CRITERIA.map(c => {
			const diffPlus = row[c.key] - ideal[c.key]
			const diffMinus = row[c.key] - antiIdeal[c.key]
			const deltaPlusSq = diffPlus * diffPlus
			const deltaMinusSq = diffMinus * diffMinus

			dPlusSq += deltaPlusSq
			dMinusSq += deltaMinusSq

			return {
				key: c.key,
				weightKey: c.weight,
				label: c.label,
				weightShare: Number((weights[c.weight] * 100).toFixed(1)),
				deltaPlusSq,
				deltaMinusSq,
			}
		})

		const dPlus = Math.sqrt(dPlusSq)
		const dMinus = Math.sqrt(dMinusSq)
		const totalSq = dPlusSq + dMinusSq

		// Jeśli wszystkie auta w zestawie są identyczne (d+ = d- = 0), przyjmujemy neutralny wynik 1
		const topsisScore = dPlus + dMinus === 0 ? 1 : dMinus / (dPlus + dMinus)

		const xai = rawContributions
			.map(item => ({
				key: item.key,
				weightKey: item.weightKey,
				label: item.label,
				weightShare: item.weightShare,
				// % udziału kryterium w oddalaniu się od ideału (co obniżyło wynik)
				dPlusShare: dPlusSq > 0 ? Number(((item.deltaPlusSq / dPlusSq) * 100).toFixed(1)) : 0,
				// % udziału kryterium w oddalaniu się od antyideału (co podniosło wynik)
				dMinusShare: dMinusSq > 0 ? Number(((item.deltaMinusSq / dMinusSq) * 100).toFixed(1)) : 0,
				// Wypadkowy wpływ kryterium [-100, +100] proporcjonalny do (deltaMinus^2 - deltaPlus^2) / (d-^2 + d+^2)
				netImpact: totalSq > 0 ? Number((((item.deltaMinusSq - item.deltaPlusSq) / totalSq) * 100).toFixed(1)) : 0,
			}))
			.sort((a, b) => Math.abs(b.netImpact) - Math.abs(a.netImpact))

		return {
			...car,
			topsisScore,
			dPlus: Number(dPlus.toFixed(4)),
			dMinus: Number(dMinus.toFixed(4)),
			xai,
		}
	})

	// 5. Sortowanie malejące — zwracamy cały ranking bez obcinania
	return scoredCars.sort((a, b) => b.topsisScore - a.topsisScore)
}
