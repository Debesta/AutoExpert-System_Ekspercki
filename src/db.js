// Konfiguracja bazy danych
const DB_NAME = 'AutoExpertDB'
const DB_VERSION = 1
const STORE_NAME = 'cars'

// 1. Otwarcie połączenia z IndexedDB
export function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		// Uruchamia się tylko przy pierwszym tworzeniu bazy lub przy podbiciu DB_VERSION.
		// Służy do zdefiniowania schematu bazy (tabel i indeksów).
		request.onupgradeneeded = event => {
			const db = event.target.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				// Tworzymy tabelę "cars" z unikalnym kluczem "id", który automatycznie inkrementuje (auto-rośnie)
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
				// Tworzenie indeksów, by ułatwić ewentualne przyszłe szybkie wyszukiwanie po tych polach
				store.createIndex('brand', 'brand', { unique: false })
				store.createIndex('price', 'price', { unique: false })
				store.createIndex('fuel', 'fuel', { unique: false })
			}
		}

		request.onsuccess = event => resolve(event.target.result)
		request.onerror = event => reject('Błąd otwarcia IndexedDB: ' + event.target.errorCode)
	})
}

// 2. Inicjalizacja i asynchroniczne pobranie danych z /cars.json przy pierwszym uruchomieniu
// (Tzw. mechanizm Seeding-u bazy wiedzy)
export async function initAndSeedDB() {
	const db = await openDB()

	// Sprawdzanie, ile rekordów jest obecnie w bazie
	const count = await new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly')
		const store = transaction.objectStore(STORE_NAME)
		const req = store.count()
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})

	// Jeśli baza jest pusta (count === 0), ładujemy dane początkowe z pliku konfiguracyjnego
	if (count === 0) {
		try {
			const response = await fetch('/cars.json')
			const initialCars = await response.json()

			// Transakcja zapisu wielu rekordów naraz
			await new Promise((resolve, reject) => {
				const transaction = db.transaction([STORE_NAME], 'readwrite')
				const store = transaction.objectStore(STORE_NAME)
				initialCars.forEach(car => store.put(car))
				transaction.oncomplete = () => resolve()
				transaction.onerror = () => reject(transaction.error)
			})
		} catch (err) {
			console.error('Błąd zasilania bazy z /cars.json:', err)
		}
	}
	return db
}

// 3. Pobranie wszystkich pojazdów (READ)
export async function getAllCars() {
	// Kluczowy moment: Pobieranie wymusza sprawdzenie, czy baza nie jest pusta (initAndSeedDB).
	// Zapobiega to sytuacji, gdzie użytkownik widzi 0 aut przy pierwszym odpaleniu aplikacji.
	const db = await initAndSeedDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.getAll()
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

// 4. Dodanie nowego pojazdu (CREATE)
export async function addCarToDB(carData) {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite')
		const store = transaction.objectStore(STORE_NAME)
		const request = store.add(carData)
		request.onsuccess = () => resolve(request.result) // result zwraca nowe wygenerowane ID
		request.onerror = () => reject(request.error)
	})
}

// 5. Aktualizacja pojazdu (UPDATE)
export async function updateCarInDB(carData) {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite')
		const store = transaction.objectStore(STORE_NAME)
		// Użyto put() - nadpisze rekord, jeśli carData zawiera istniejące id
		const request = store.put(carData)
		request.onsuccess = () => resolve()
		request.onerror = () => reject(request.error)
	})
}

// 6. Usunięcie pojazdu z bazy (DELETE)
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
