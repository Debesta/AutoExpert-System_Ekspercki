import { describe, it, expect } from 'vitest'
import { filterCars } from './filterCars'

describe('Funkcja filterCars', () => {
	// Poprawiona struktura mockowanych danych, aby zgadzała się z logiką funkcji (yearFrom, yearTo)
	const cars = [
		{ id: 1, fuel: 'Benzyna', yearFrom: 2010, yearTo: 2015, price: 20000 },
		{ id: 2, fuel: 'Diesel', yearFrom: 2020, yearTo: 2024, price: 50000 },
	]

	it('filtruje po paliwie', () => {
		const res = filterCars(cars, { fuel: 'Diesel' })
		expect(res.length).toBe(1)
		expect(res[0].id).toBe(2)
	})

	it('filtruje po cenie i roczniku (minYear)', () => {
		// Auto nr 1 było produkowane do 2015, więc jeśli wymagamy minYear: 2000,
		// to 2015 < 2000 jest false, zatem auto przechodzi.
		// Ale w połączeniu z maxPrice 30000, Diesel za 50000 zostaje odrzucony.
		const res = filterCars(cars, { maxPrice: 30000, minYear: 2000 })
		expect(res.length).toBe(1)
		expect(res[0].id).toBe(1)
	})

	// Dodany nowy test weryfikujący poprawność odrzucania ze względu na nowy system roczników
	it('odrzuca auto poprawnie na podstawie rocznika (minYear > yearTo)', () => {
		// Oczekujemy auta produkowanego od lub w okolicach minimum 2018 roku.
		// Auto id: 1 miało koniec produkcji w 2015. Zostanie odrzucone (2015 < 2018 to true dla odrzucenia).
		const res = filterCars(cars, { minYear: 2018 })
		expect(res.length).toBe(1)
		expect(res[0].id).toBe(2)
	})
})
