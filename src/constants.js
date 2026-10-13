// --- 1. Słowniki danych dla formularzy filtrowania i dodawania pojazdów ---
export const BODY_TYPES = ['Sedan', 'Kombi', 'SUV', 'Hatchback', 'Coupe']
export const FUELS = ['Benzyna', 'Diesel', 'Hybryda', 'Elektryk', 'LPG']
export const TRANSMISSIONS = ['Manualna', 'Automatyczna']
export const DRIVES = ['FWD', 'RWD', 'AWD']
export const CONDITIONS = ['Nowy', 'Używany']

// --- 2. Konfiguracja algorytmu decyzyjnego TOPSIS ---
// Definiuje, z jakimi kluczami (obiektu auta i obiektu preferencji) powiązane jest dane kryterium,
// jak się nazywa (label) oraz jaki ma charakter (benefit).
export const CRITERIA = [
	// benefit: true -> im więcej, tym lepiej (cecha pozytywna, np. bagażnik, komfort)
	{ key: 'trunkSize', weight: 'trunk', benefit: true, label: 'Wielkość bagażnika' },
	// benefit: false -> im mniej, tym lepiej (cecha negatywna, tzw. kosztowa, np. spalanie, cena)
	{ key: 'consumption', weight: 'consumption', benefit: false, label: 'Spalanie paliwa' },
	{ key: 'maintenanceCost', weight: 'maintenance', benefit: false, label: 'Niskie koszty napraw' },
	{ key: 'comfort', weight: 'comfort', benefit: true, label: 'Komfort' },
	{ key: 'price', weight: 'price', benefit: false, label: 'Niska cena' },
	{ key: 'safety', weight: 'safety', benefit: true, label: 'Bezpieczeństwo' },
	{ key: 'reliability', weight: 'reliability', benefit: true, label: 'Niezawodność' },
	{ key: 'acceleration', weight: 'performance', benefit: false, label: 'Osiągi' }, // Czas 0-100: im mniej s, tym lepiej
]
