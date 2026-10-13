import { CRITERIA } from './constants'

export function calculateTopsis(cars, weights, limit = 5) {
	// Zabezpieczenia: brak pojazdów zwraca pustą tablicę, jeden pojazd to automatyczny zwycięzca (100% dopasowania)
	if (cars.length === 0) return []
	if (cars.length === 1) return [{ ...cars[0], topsisScore: 1 }]

	// KROK 1: Normalizacja wag (jeśli nie zostały znormalizowane wcześniej, zapobiega to błędom)
	const totalWeight = CRITERIA.reduce((s, c) => s + weights[c.weight], 0) || 1

	// KROK 2: Budowa znormalizowanej macierzy decyzyjnej
	const columns = CRITERIA.map(c => {
		// Obliczenie mianownika do normalizacji wektorowej (pierwiastek z sumy kwadratów danej cechy)
		const norm = Math.sqrt(cars.reduce((s, car) => s + car[c.key] ** 2, 0)) || 1
		const w = weights[c.weight] / totalWeight

		// Mapowanie każdej wartości na jej odpowiednik w znormalizowanej i zważonej macierzy
		return cars.map(car => (car[c.key] / norm) * w)
	})

	// KROK 3: Wyznaczenie rozwiązania idealnego (ideal) oraz antyidealnego (anti)
	// Jeśli cecha to korzyść (benefit: true), ideałem jest wartość maksymalna, a antyideałem minimalna. Dla kosztów - odwrotnie.
	const ideal = columns.map((col, j) => (CRITERIA[j].benefit ? Math.max(...col) : Math.min(...col)))
	const anti = columns.map((col, j) => (CRITERIA[j].benefit ? Math.min(...col) : Math.max(...col)))

	// KROK 4: Obliczanie odległości euklidesowej od rozwiązań idealnych i ustalenie rankingu
	return (
		cars
			.map((car, i) => {
				let dPlus = 0, // Odległość od ideału
					dMinus = 0 // Odległość od antyideału

				columns.forEach((col, j) => {
					dPlus += (col[i] - ideal[j]) ** 2
					dMinus += (col[i] - anti[j]) ** 2
				})

				dPlus = Math.sqrt(dPlus)
				dMinus = Math.sqrt(dMinus)

				// Wzór końcowy TOPSIS: dMinus / (dPlus + dMinus)
				return { ...car, topsisScore: dPlus + dMinus === 0 ? 1 : dMinus / (dPlus + dMinus) }
			})
			// Sortowanie malejące (najlepsze wyniki na górze)
			.sort((a, b) => b.topsisScore - a.topsisScore)
			// Ucięcie tablicy do zadanego limitu (domyślnie top 5)
			.slice(0, limit)
	)
}
