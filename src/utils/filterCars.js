export function filterCars(cars, hardFilters) {
	return cars.filter(car => {
		// --- 1. Filtrowanie dokładnego dopasowania (ciągi znaków) ---
		// Jeśli filtr jest ustawiony, odrzucamy auta, które go nie spełniają
		if (hardFilters.condition && car.condition !== hardFilters.condition) return false
		if (hardFilters.bodyType && car.bodyType !== hardFilters.bodyType) return false
		if (hardFilters.fuel && car.fuel !== hardFilters.fuel) return false
		if (hardFilters.transmission && car.transmission !== hardFilters.transmission) return false
		if (hardFilters.drive && car.drive !== hardFilters.drive) return false

		// --- 2. Filtrowanie wartości liczbowych (progi minimalne i maksymalne) ---
		if (hardFilters.maxPrice && car.price > Number(hardFilters.maxPrice)) return false
		if (hardFilters.seats && car.seats < Number(hardFilters.seats)) return false
		if (hardFilters.minPower && car.power < Number(hardFilters.minPower)) return false
		if (hardFilters.maxPower && car.power > Number(hardFilters.maxPower)) return false

		// --- 3. Filtrowanie po zakresie lat produkcji ---
		const cYearFrom = car.yearFrom
		// Jeśli auto nadal jest produkowane (brak yearTo), traktujemy obecny rok jako koniec
		const cYearTo = car.yearTo || new Date().getFullYear()

		// Odrzucamy auto, jeśli jego CAŁY okres produkcji skończył się przed wymaganym rokiem minimum
		if (hardFilters.minYear && cYearTo < Number(hardFilters.minYear)) return false

		// Odrzucamy auto, jeśli jego CAŁY okres produkcji zaczął się po wymaganym roku maksimum
		if (hardFilters.maxYear && cYearFrom > Number(hardFilters.maxYear)) return false

		// Jeśli auto przeszło wszystkie powyższe testy, zostaje w tablicy wynikowej
		return true
	})
}
