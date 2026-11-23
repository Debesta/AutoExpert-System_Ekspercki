import { describe, it, expect } from 'vitest'
import { filterCars } from './filterCars'

describe('Funkcja filterCars', () => {
	const cars = [
		{
			id: 1,
			condition: 'Używany',
			bodyType: 'Hatchback',
			fuel: 'Benzyna',
			transmission: 'Manualna',
			drive: 'FWD',
			seats: 5,
			power: 95,
			yearFrom: 2010,
			yearTo: 2015,
			price: 25000,
		},
		{
			id: 2,
			condition: 'Nowy',
			bodyType: 'SUV',
			fuel: 'Diesel',
			transmission: 'Automatyczna',
			drive: 'AWD',
			seats: 7,
			power: 193,
			yearFrom: 2024,
			yearTo: null,
			price: 224900,
		},
		{
			id: 3,
			condition: 'Nowy',
			bodyType: 'Coupe',
			fuel: 'Benzyna',
			transmission: 'Manualna',
			drive: 'RWD',
			seats: 2,
			power: 132,
			yearFrom: 2024,
			yearTo: null,
			price: 148900,
		},
	]

	it('filtruje po paliwie i nadwoziu (w tym Coupe)', () => {
		expect(filterCars(cars, { fuel: 'Diesel' }).map(c => c.id)).toEqual([2])
		expect(filterCars(cars, { bodyType: 'Coupe' }).map(c => c.id)).toEqual([3])
	})

	it('filtruje po minimalnej liczbie miejsc (np. auta 7-osobowe)', () => {
		const res = filterCars(cars, { seats: '7' })
		expect(res).toHaveLength(1)
		expect(res[0].id).toBe(2)
	})

	it('filtruje po cenie, mocy i nakładających się zakresach lat produkcji', () => {
		expect(filterCars(cars, { maxPrice: '30000', minYear: '2012' }).map(c => c.id)).toEqual([1])
		expect(filterCars(cars, { minPower: '120', maxPower: '150' }).map(c => c.id)).toEqual([3])
	})

	it('odrzuca auta spoza zakresu roczników i obsługuje yearTo: null jako produkcję trwającą', () => {
		// Auto 1 zakończyło produkcję w 2015 -> odrzucone przy minYear: 2018
		expect(filterCars(cars, { minYear: '2018' }).map(c => c.id)).toEqual([2, 3])
		// Auta 2 i 3 produkowane od 2024 -> odrzucone przy maxYear: 2020
		expect(filterCars(cars, { maxYear: '2020' }).map(c => c.id)).toEqual([1])
	})
})
