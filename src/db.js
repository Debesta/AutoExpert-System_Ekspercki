const DB_NAME = 'AutoExpertDB'
const DB_VERSION = 1
const STORE_NAME = 'cars'

let dbPromise = null

function getSeedUrl() {
	const base = import.meta.env?.BASE_URL || '/'
	return `${base.endsWith('/') ? base : `${base}/`}cars.json`
}

// 1. Otwarcie (lub reużycie) współdzielonego połączenia z IndexedDB
export function openDB() {
	if (dbPromise) return dbPromise

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onupgradeneeded = event => {
			const db = event.target.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
				store.createIndex('brand', 'brand', { unique: false })
				store.createIndex('price', 'price', { unique: false })
				store.createIndex('fuel', 'fuel', { unique: false })
			}
		}

		request.onsuccess = event => {
			const db = event.target.result
			db.onversionchange = () => {
				db.close()
				dbPromise = null
			}
			db.onclose = () => {
				dbPromise = null
			}
			resolve(db)
		}

		request.onerror = event => {
			dbPromise = null
			reject(new Error(`Błąd otwarcia IndexedDB: ${event.target.error?.message || event.target.errorCode}`))
		}
	})

	return dbPromise
}

export async function closeDB() {
	if (!dbPromise) return
	try {
		const db = await dbPromise
		db.close()
	} finally {
		dbPromise = null
	}
}

async function fetchDefaultCars() {
	const url = getSeedUrl()
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Nie udało się pobrać pliku ${url} (HTTP ${response.status})`)
	}
	const data = await response.json()
	if (!Array.isArray(data)) {
		throw new Error('Plik cars.json ma nieprawidłowy format (oczekiwano tablicy pojazdów).')
	}
	return data
}

// 2. Nadpisanie całej zawartości bazy nową listą pojazdów (używane przez seed, reset i import JSON)
export async function replaceAllCarsInDB(carsList) {
	const db = await openDB()
	await new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite')
		const store = transaction.objectStore(STORE_NAME)
		store.clear()
		carsList.forEach(car => store.put(car))
		transaction.oncomplete = () => resolve()
		transaction.onerror = () => reject(transaction.error || new Error('Błąd zapisu transakcji IndexedDB'))
	})

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.getAll()
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

// 3. Inicjalizacja i zasilenie bazy z cars.json przy pierwszym uruchomieniu
export async function initAndSeedDB() {
	const db = await openDB()

	const count = await new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly')
		const store = transaction.objectStore(STORE_NAME)
		const req = store.count()
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})

	if (count === 0) {
		const initialCars = await fetchDefaultCars()
		await new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_NAME], 'readwrite')
			const store = transaction.objectStore(STORE_NAME)
			initialCars.forEach(car => store.put(car))
			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error || new Error('Błąd zasilania bazy IndexedDB'))
		})
	}

	return db
}

// 4. Przywrócenie danych domyślnych z cars.json
export async function resetDBToDefault() {
	const initialCars = await fetchDefaultCars()
	return replaceAllCarsInDB(initialCars)
}

// 5. Pobranie wszystkich pojazdów (READ)
export async function getAllCars() {
	const db = await initAndSeedDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.getAll()
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

// 6. Dodanie nowego pojazdu (CREATE)
export async function addCarToDB(carData) {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.add(carData)
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

// 7. Aktualizacja pojazdu (UPDATE)
export async function updateCarInDB(carData) {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.put(carData)
		request.onsuccess = () => resolve()
		request.onerror = () => reject(request.error)
	})
}

// 8. Usunięcie pojazdu z bazy (DELETE)
export async function deleteCarFromDB(id) {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.delete(id)
		request.onsuccess = () => resolve()
		request.onerror = () => reject(request.error)
	})
}
