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

export const getWeightLabel = value => {
	const num = Number(value) || 0
	if (num === 0) return { text: 'Pominięte', color: 'bg-slate-200 text-slate-500' }
	if (num <= 2) return { text: 'Znikome znaczenie', color: 'bg-gray-100 text-gray-600' }
	if (num <= 4) return { text: 'Mało ważne', color: 'bg-blue-100 text-blue-700' }
	if (num <= 6) return { text: 'Średnio ważne', color: 'bg-yellow-100 text-yellow-700' }
	if (num <= 8) return { text: 'Ważne', color: 'bg-orange-100 text-orange-700' }
	return { text: 'Priorytet', color: 'bg-red-100 text-red-700' }
}
