export const BODY_TYPES = ['Sedan', 'Kombi', 'SUV', 'Hatchback', 'Coupe']
export const FUELS = ['Benzyna', 'Diesel', 'Hybryda', 'Elektryk', 'LPG']
export const TRANSMISSIONS = ['Manualna', 'Automatyczna']
export const DRIVES = ['FWD', 'RWD', 'AWD']
export const CONDITIONS = ['Nowy', 'Używany']

export const CRITERIA = [
	{ key: 'trunkSize', weight: 'trunk', benefit: true, label: 'Wielkość bagażnika' },
	{ key: 'consumption', weight: 'consumption', benefit: false, label: 'Spalanie paliwa' },
	{ key: 'maintenanceCost', weight: 'maintenance', benefit: false, label: 'Koszty napraw' },
	{ key: 'comfort', weight: 'comfort', benefit: true, label: 'Komfort' },
	{ key: 'price', weight: 'price', benefit: false, label: 'Niska cena' },
	{ key: 'safety', weight: 'safety', benefit: true, label: 'Bezpieczeństwo' },
	{ key: 'reliability', weight: 'reliability', benefit: true, label: 'Niezawodność' },
	{ key: 'acceleration', weight: 'performance', benefit: false, label: 'Osiągi' },
]
