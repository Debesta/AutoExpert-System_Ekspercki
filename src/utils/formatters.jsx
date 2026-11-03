export const getMaintenanceText = score => {
	if (score <= 4) return <span className='text-emerald-600 font-bold'>Niskie (Tanie części)</span>
	if (score <= 7) return <span className='text-yellow-600 font-bold'>Umiarkowane</span>
	return <span className='text-red-500 font-bold'>Wysokie (Premium)</span>
}

export const formatPrice = price =>
	new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price)

export const renderYear = car => {
	return car.yearTo ? `${car.yearFrom} - ${car.yearTo}` : `${car.yearFrom} - obecnie`
}
