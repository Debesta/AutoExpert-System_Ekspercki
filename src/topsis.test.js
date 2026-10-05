import { describe, it, expect } from 'vitest'
import { calculateTopsis } from './topsis'

const mockCars = [
	{
		id: 1,
		brand: 'Tanie',
		price: 10000,
		consumption: 4,
		maintenanceCost: 2,
		comfort: 5,
		safety: 5,
		reliability: 5,
		acceleration: 12,
		trunkSize: 300,
	},
	{
		id: 2,
		brand: 'Szybkie',
		price: 150000,
		consumption: 12,
		maintenanceCost: 8,
		comfort: 7,
		safety: 8,
		reliability: 7,
		acceleration: 4,
		trunkSize: 200,
	},
	{
		id: 3,
		brand: 'Luksus',
		price: 200000,
		consumption: 7,
		maintenanceCost: 9,
		comfort: 10,
		safety: 10,
		reliability: 9,
		acceleration: 6,
		trunkSize: 600,
	},
]

const weights = {
	price: 3,
	consumption: 3,
	maintenance: 3,
	comfort: 3,
	safety: 3,
	reliability: 3,
	performance: 3,
	trunk: 3,
}

describe('Algorytm TOPSIS', () => {
	it('gdy jest 1 auto, zwraca wynik 100% (topsisScore = 1)', () => {
		const result = calculateTopsis([mockCars[0]], weights)
		expect(result[0].topsisScore).toBe(1)
	})

	it('wynik jest niezmienniczy względem skali wag (x2)', () => {
		const w1 = { ...weights }
		const w2 = Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v * 2]))

		const res1 = calculateTopsis(mockCars, w1)
		const res2 = calculateTopsis(mockCars, w2)
		expect(res1[0].id).toBe(res2[0].id)
	})

	it('zwraca maksymalnie limit elementów (domyślnie 5)', () => {
		const manyCars = Array.from({ length: 10 }, (_, i) => ({ ...mockCars[0], id: i }))
		const result = calculateTopsis(manyCars, weights)
		expect(result.length).toBe(5)
	})
})
