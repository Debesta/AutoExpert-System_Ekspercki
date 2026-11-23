import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
	getAllCars,
	addCarToDB,
	updateCarInDB,
	deleteCarFromDB,
	resetDBToDefault,
	replaceAllCarsInDB,
	closeDB,
} from './db'

const SEED_CARS = [
	{
		id: 1,
		brand: 'Toyota',
		model: 'Corolla (1.8 Hybrid)',
		condition: 'Nowy',
		bodyType: 'Kombi',
		seats: 5,
		fuel: 'Hybryda',
		power: 140,
		capacity: 1.8,
		yearFrom: 2024,
		yearTo: null,
		drive: 'FWD',
		transmission: 'Automatyczna',
		trunkSize: 596,
		consumption: 4.6,
		maintenanceCost: 4,
		comfort: 7,
		price: 134900,
		safety: 9,
		reliability: 10,
		acceleration: 9.2,
	},
	{
		id: 2,
		brand: 'Mazda',
		model: 'MX-5 (1.5 132 KM)',
		condition: 'Nowy',
		bodyType: 'Coupe',
		seats: 2,
		fuel: 'Benzyna',
		power: 132,
		capacity: 1.5,
		yearFrom: 2024,
		yearTo: null,
		drive: 'RWD',
		transmission: 'Manualna',
		trunkSize: 130,
		consumption: 6.3,
		maintenanceCost: 4,
		comfort: 5,
		price: 148900,
		safety: 7,
		reliability: 9,
		acceleration: 8.3,
	},
]

async function wipeDatabase() {
	await closeDB()
	await new Promise((resolve, reject) => {
		const req = indexedDB.deleteDatabase('AutoExpertDB')
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
		req.onblocked = () => resolve()
	})
}

describe('Warstwa bazy danych IndexedDB (db.js)', () => {
	beforeEach(async () => {
		await wipeDatabase()
		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => SEED_CARS,
		})
	})

	afterEach(async () => {
		vi.restoreAllMocks()
		await wipeDatabase()
	})

	it('zasila pustą bazę danymi z cars.json przy pierwszym getAllCars()', async () => {
		const cars = await getAllCars()
		expect(cars).toHaveLength(2)
		expect(cars[0].brand).toBe('Toyota')
		expect(globalThis.fetch).toHaveBeenCalledTimes(1)

		// Drugie wywołanie korzysta już z zapisanych danych bez ponownego fetch
		const cached = await getAllCars()
		expect(cached).toHaveLength(2)
		expect(globalThis.fetch).toHaveBeenCalledTimes(1)
	})

	it('rzuca błąd, gdy fetch pliku cars.json zwróci niepoprawny status HTTP', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => [],
		})

		await expect(getAllCars()).rejects.toThrow(/HTTP 500/)
	})

	it('obsługuje pełny cykl CRUD: dodawanie, edycję i usuwanie rekordu', async () => {
		await getAllCars()

		const newId = await addCarToDB({
			brand: 'BYD',
			model: 'Seal (EV 313 KM)',
			price: 207000,
			fuel: 'Elektryk',
		})
		expect(newId).toBeGreaterThan(2)

		await updateCarInDB({
			id: newId,
			brand: 'BYD',
			model: 'Seal Design (EV 313 KM)',
			price: 199000,
			fuel: 'Elektryk',
		})

		let all = await getAllCars()
		expect(all).toHaveLength(3)
		expect(all.find(c => c.id === newId)?.price).toBe(199000)

		await deleteCarFromDB(newId)
		all = await getAllCars()
		expect(all).toHaveLength(2)
		expect(all.find(c => c.id === newId)).toBeUndefined()
	})

	it('obsługuje replaceAllCarsInDB (import) oraz resetDBToDefault (przywracanie)', async () => {
		await getAllCars()

		const replaced = await replaceAllCarsInDB([{ id: 99, brand: 'Volvo', model: 'XC60', price: 250000 }])
		expect(replaced).toHaveLength(1)
		expect(replaced[0].brand).toBe('Volvo')

		const restored = await resetDBToDefault()
		expect(restored).toHaveLength(2)
		expect(restored.map(c => c.brand)).toEqual(['Toyota', 'Mazda'])
	})
})
