import { describe, it, expect } from 'vitest'
import { filterCars } from './filterCars'

describe('Funkcja filterCars', () => {
	const cars = [
		{ id: 1, fuel: 'Benzyna', year: 2010, price: 20000 },
		{ id: 2, fuel: 'Diesel', year: 2020, price: 50000 },
	]

	it('filtruje po paliwie', () => {
		const res = filterCars(cars, { fuel: 'Diesel' })
		expect(res.length).toBe(1)
		expect(res[0].id).toBe(2)
	})

	it('filtruje po cenie i roczniku', () => {
		const res = filterCars(cars, { maxPrice: 30000, minYear: 2000 })
		expect(res.length).toBe(1)
		expect(res[0].id).toBe(1)
	})
})
