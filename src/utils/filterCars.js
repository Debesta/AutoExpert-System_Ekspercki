export function filterCars(cars, hardFilters) {
	return cars.filter(car => {
		if (hardFilters.condition && car.condition !== hardFilters.condition) return false
		if (hardFilters.bodyType && car.bodyType !== hardFilters.bodyType) return false
		if (hardFilters.fuel && car.fuel !== hardFilters.fuel) return false
		if (hardFilters.transmission && car.transmission !== hardFilters.transmission) return false
		if (hardFilters.drive && car.drive !== hardFilters.drive) return false

		if (hardFilters.maxPrice && car.price > Number(hardFilters.maxPrice)) return false
		if (hardFilters.seats && car.seats < Number(hardFilters.seats)) return false
		if (hardFilters.minPower && car.power < Number(hardFilters.minPower)) return false
		if (hardFilters.maxPower && car.power > Number(hardFilters.maxPower)) return false

		const cYearFrom = car.yearFrom
		const cYearTo = car.yearTo || new Date().getFullYear()

		if (hardFilters.minYear && cYearTo < Number(hardFilters.minYear)) return false
		if (hardFilters.maxYear && cYearFrom > Number(hardFilters.maxYear)) return false

		return true
	})
}
