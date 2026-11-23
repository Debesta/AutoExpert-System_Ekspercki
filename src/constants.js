export const BODY_TYPES = ['Sedan', 'Kombi', 'SUV', 'Hatchback', 'Coupe', 'Liftback']
export const FUELS = ['Benzyna', 'Diesel', 'Hybryda', 'Elektryk', 'LPG']
export const TRANSMISSIONS = ['Manualna', 'Automatyczna']
export const DRIVES = ['FWD', 'RWD', 'AWD']
export const CONDITIONS = ['Nowy', 'Używany']
export const ENERGY_PRICES = {
	Benzyna: 6.2, // PLN / l
	Hybryda: 6.2, // PLN / l
	Diesel: 7.5, // PLN / l
	LPG: 2.9, // PLN / l
	Elektryk: 1.15, // PLN / kWh
}

export function calculateEnergyCostPer100km(car) {
	const consumption = Number(car.consumption) || 0
	const unitPrice = ENERGY_PRICES[car.fuel] ?? ENERGY_PRICES.Benzyna
	return Number((consumption * unitPrice).toFixed(2))
}

export function getConsumptionUnit(fuel) {
	return fuel === 'Elektryk' ? 'kWh/100km' : 'l/100km'
}

export const CRITERIA = [
	{ key: 'price', weight: 'price', label: 'Cena', benefit: false },
	{
		key: 'energyCost',
		weight: 'consumption',
		label: 'Koszt jazdy (100 km)',
		benefit: false,
		getValue: calculateEnergyCostPer100km,
	},
	{ key: 'safety', weight: 'safety', label: 'Bezpieczeństwo', benefit: true },
	{ key: 'reliability', weight: 'reliability', label: 'Niezawodność', benefit: true },
	{ key: 'acceleration', weight: 'performance', label: 'Przyspieszenie', benefit: false },
	{ key: 'trunkSize', weight: 'trunk', label: 'Bagażnik', benefit: true },
	{ key: 'maintenanceCost', weight: 'maintenance', label: 'Koszty serwisu', benefit: false },
	{ key: 'comfort', weight: 'comfort', label: 'Komfort', benefit: true },
]
