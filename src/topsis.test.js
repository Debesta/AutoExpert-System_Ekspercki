import { describe, it, expect } from 'vitest'
import { calculateTopsis, normalizeWeights } from './topsis'

const baseCar = {
	fuel: 'Benzyna',
	consumption: 6,
	maintenanceCost: 5,
	comfort: 5,
	safety: 5,
	reliability: 5,
	acceleration: 10,
	trunkSize: 400,
	price: 80000,
}

const zeroWeights = {
	price: 0,
	consumption: 0,
	maintenance: 0,
	comfort: 0,
	safety: 0,
	reliability: 0,
	performance: 0,
	trunk: 0,
}

describe('Algorytm TOPSIS i moduł XAI', () => {
	it('zwraca wyniki zgodne z ręcznie policzonym przykładem (3 auta × 2 kryteria)', () => {
		// Celowo dobrane wartości dające całkowite normy wektorowe:
		// ||cena||     = sqrt(30000^2 + 40000^2 + 120000^2) = 130000
		// ||bagażnik|| = sqrt(200^2 + 300^2 + 600^2)        = 700
		// Aktywne wagi: cena = 6 (0.6, koszt), bagażnik = 4 (0.4, zysk), pozostałe = 0
		const cars = [
			{ ...baseCar, id: 1, brand: 'Auto A', price: 30000, trunkSize: 200 },
			{ ...baseCar, id: 2, brand: 'Auto B', price: 40000, trunkSize: 300 },
			{ ...baseCar, id: 3, brand: 'Auto C', price: 120000, trunkSize: 600 },
		]

		const weights = { ...zeroWeights, price: 6, trunk: 4 }
		const result = calculateTopsis(cars, weights)

		// Oczekiwana kolejność: B (kompromis: 0.6779) > A (najtańsze: 0.6451) > C (największy bagażnik: 0.3549)
		expect(result.map(c => c.id)).toEqual([2, 1, 3])

		// Weryfikacja dokładnych wartości d+, d- oraz indeksu TOPSIS (4 miejsca po przecinku)
		expect(result[0].dPlus).toBeCloseTo(0.1775, 4)
		expect(result[0].dMinus).toBeCloseTo(0.3736, 4)
		expect(result[0].topsisScore).toBeCloseTo(0.6779, 4)

		expect(result[1].dPlus).toBeCloseTo(0.2286, 4)
		expect(result[1].dMinus).toBeCloseTo(0.4154, 4)
		expect(result[1].topsisScore).toBeCloseTo(0.6451, 4)

		expect(result[2].dPlus).toBeCloseTo(0.4154, 4)
		expect(result[2].dMinus).toBeCloseTo(0.2286, 4)
		expect(result[2].topsisScore).toBeCloseTo(0.3549, 4)

		// Weryfikacja dekompozycji XAI: dla Auta A cena działa na plus (+76.8), bagażnik na minus (-23.2),
		// a wyłączone kryteria (waga 0) mają wpływ dokładnie 0
		const carAXai = Object.fromEntries(result[1].xai.map(item => [item.key, item]))
		expect(carAXai.price.netImpact).toBeCloseTo(76.8, 1)
		expect(carAXai.trunkSize.netImpact).toBeCloseTo(-23.2, 1)
		expect(carAXai.safety.weightShare).toBe(0)
		expect(carAXai.safety.netImpact).toBe(0)
	})

	it('respektuje kierunek kryterium kosztowego: tańsze auto wygrywa przy dominującej wadze ceny', () => {
		const cars = [
			{ ...baseCar, id: 1, price: 180000, safety: 10, comfort: 10, trunkSize: 700 },
			{ ...baseCar, id: 2, price: 45000, safety: 5, comfort: 4, trunkSize: 280 },
			{ ...baseCar, id: 3, price: 95000, safety: 8, comfort: 7, trunkSize: 500 },
		]

		const result = calculateTopsis(cars, { ...zeroWeights, price: 10 })
		expect(result[0].id).toBe(2)
		expect(result[0].topsisScore).toBeCloseTo(1, 4)
		expect(result[2].id).toBe(1)
		expect(result[2].topsisScore).toBeCloseTo(0, 4)
	})

	it('respektuje kierunek kryterium zyskowego: najbezpieczniejsze auto wygrywa przy dominującej wadze bezpieczeństwa', () => {
		const cars = [
			{ ...baseCar, id: 1, price: 40000, safety: 5 },
			{ ...baseCar, id: 2, price: 250000, safety: 10 },
			{ ...baseCar, id: 3, price: 100000, safety: 8 },
		]

		const result = calculateTopsis(cars, { ...zeroWeights, safety: 10 })
		expect(result[0].id).toBe(2)
		expect(result[2].id).toBe(1)
	})

	it('respektuje kierunek przyspieszenia (koszt: im mniej sekund do 100 km/h, tym lepiej)', () => {
		const cars = [
			{ ...baseCar, id: 1, acceleration: 12.5 },
			{ ...baseCar, id: 2, acceleration: 4.8 },
			{ ...baseCar, id: 3, acceleration: 8.4 },
		]

		const result = calculateTopsis(cars, { ...zeroWeights, performance: 10 })
		expect(result[0].id).toBe(2)
		expect(result[2].id).toBe(1)
	})

	it('ujednolica jednostki energii (PLN/100 km): elektryk 16 kWh/100km wygrywa z benzyną 7 l/100km', () => {
		// EV: 16 * 1.15 = 18.40 PLN/100km
		// Benzyna: 7 * 6.20 = 43.40 PLN/100km
		const cars = [
			{ ...baseCar, id: 1, fuel: 'Benzyna', consumption: 7.0 },
			{ ...baseCar, id: 2, fuel: 'Elektryk', consumption: 16.0 },
		]

		const result = calculateTopsis(cars, { ...zeroWeights, consumption: 10 })
		expect(result[0].id).toBe(2)
		expect(result[0].energyCost).toBeCloseTo(18.4, 2)
		expect(result[1].energyCost).toBeCloseTo(43.4, 2)
	})

	it('obsługuje przypadki brzegowe: pusta lista, 1 auto, identyczne auta oraz zerową sumę wag', () => {
		// 1. Pusta tablica
		expect(calculateTopsis([], zeroWeights)).toEqual([])

		// 2. Pojedynczy pojazd
		const single = calculateTopsis([{ ...baseCar, id: 1 }], { ...zeroWeights, price: 5 })
		expect(single).toHaveLength(1)
		expect(single[0].topsisScore).toBe(1)
		expect(single[0].dPlus).toBe(0)
		expect(single[0].dMinus).toBe(0)

		// 3. Identyczne pojazdy (brak dzielenia przez zero / NaN)
		const identical = [
			{ ...baseCar, id: 1 },
			{ ...baseCar, id: 2 },
			{ ...baseCar, id: 3 },
		]
		const identicalRes = calculateTopsis(identical, { ...zeroWeights, price: 5, safety: 5 })
		expect(identicalRes).toHaveLength(3)
		identicalRes.forEach(car => {
			expect(Number.isNaN(car.topsisScore)).toBe(false)
			expect(car.topsisScore).toBe(1)
		})

		// 4. Wszystkie wagi równe 0 -> fallback do wag równych (1/8)
		const equalWeights = normalizeWeights(zeroWeights)
		Object.values(equalWeights).forEach(w => expect(w).toBeCloseTo(0.125, 4))

		const zeroWeightRes = calculateTopsis(
			[
				{ ...baseCar, id: 1, price: 50000 },
				{ ...baseCar, id: 2, price: 150000 },
			],
			zeroWeights,
		)
		expect(zeroWeightRes[0].id).toBe(1)
		expect(Number.isNaN(zeroWeightRes[0].topsisScore)).toBe(false)
	})

	it('zwraca pełny posortowany ranking bez ucinania do 5 wyników', () => {
		const manyCars = Array.from({ length: 8 }, (_, idx) => ({
			...baseCar,
			id: idx + 1,
			price: 50000 + idx * 10000,
		}))

		const result = calculateTopsis(manyCars, { ...zeroWeights, price: 10 })
		expect(result).toHaveLength(8)
		expect(result[0].id).toBe(1)
		expect(result[7].id).toBe(8)
	})
})
