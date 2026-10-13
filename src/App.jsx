import { useState, useMemo, useEffect } from 'react'
import { getAllCars, addCarToDB, updateCarInDB, deleteCarFromDB } from './db'
import { calculateTopsis } from './topsis'
import { filterCars } from './utils/filterCars'
import { BODY_TYPES, FUELS, TRANSMISSIONS, DRIVES, CONDITIONS, CRITERIA } from './constants'
import {
	Radar,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
} from 'recharts'

// --- FUNKCJE POMOCNICZE (Wagi 1-10) ---
// Zwraca obiekt z tekstem i klasami kolorystycznymi dla etykiet suwaków TOPSIS
const getWeightConfig = value => {
	if (value <= 2) return { text: 'Znikome znaczenie', color: 'bg-gray-100 text-gray-600' }
	if (value <= 4) return { text: 'Mało ważne', color: 'bg-blue-100 text-blue-700' }
	if (value <= 6) return { text: 'Średnio ważne', color: 'bg-yellow-100 text-yellow-700' }
	if (value <= 8) return { text: 'Ważne', color: 'bg-orange-100 text-orange-700' }
	return { text: 'Priorytet', color: 'bg-red-100 text-red-700' }
}

// --- KOMPONENTY WIDOKU ---

// Komponent reużywalny: Standardowe pole tekstowe/liczbowe do formularzy z etykietą
const FormInput = ({ label, ...props }) => (
	<div>
		<label className='block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider'>{label}</label>
		<input
			className='w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
			{...props}
		/>
	</div>
)

// Komponent reużywalny: Rozwijana lista (select) generowana na podstawie przekazanej tablicy opcji
const FormSelect = ({ label, options, placeholder, ...props }) => (
	<div>
		<label className='block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider'>{label}</label>
		<select
			className='w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
			{...props}>
			<option value=''>{placeholder}</option>
			{options.map(opt => (
				<option key={opt} value={opt}>
					{opt}
				</option>
			))}
		</select>
	</div>
)

// Komponent reużywalny: Suwak wag (skala 1-10) ze zintegrowanymi etykietami dynamicznymi
const PreferenceSlider = ({ label, name, value, onChange }) => {
	const config = getWeightConfig(value)

	return (
		<div className='bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100'>
			<div className='flex justify-between items-end mb-2'>
				<label htmlFor={name} className='font-semibold text-slate-700 text-sm'>
					{label}
				</label>
				<div className='flex items-center gap-2'>
					<span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${config.color}`}>
						{config.text}
					</span>
					<span className='text-[11px] font-black text-slate-700 w-4 text-right'>{value}</span>
				</div>
			</div>
			<input
				id={name}
				name={name}
				type='range'
				min='1'
				max='10'
				value={value}
				onChange={onChange}
				className='w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600'
			/>
			<div className='flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider'>
				<span>1 (Min)</span>
				<span>10 (Max)</span>
			</div>
		</div>
	)
}

// Funkcja wizualna: Zamienia surową ocenę kosztów napraw (1-10) na format przyjazny dla użytkownika
const getMaintenanceText = score => {
	if (score <= 4) return <span className='text-emerald-600 font-bold'>Niskie (Tanie części)</span>
	if (score <= 7) return <span className='text-yellow-600 font-bold'>Umiarkowane</span>
	return <span className='text-red-500 font-bold'>Wysokie (Premium)</span>
}

// Funkcja pomocnicza: Formatuje liczby na polską walutę (np. 50000 -> 50 000 zł)
const formatPrice = price =>
	new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price)

// Funkcja pomocnicza: Wyświetla zakres lat produkcji (obsługuje brak yearTo dla produkowanych wciąż aut)
const renderYear = car => {
	return car.yearTo ? `${car.yearFrom} - ${car.yearTo}` : `${car.yearFrom} - obecnie`
}

// --- KOMPONENT ADMINA ---
const AdminPanel = ({ cars, setCars }) => {
	const [uiMessage, setUiMessage] = useState('')
	const [editingId, setEditingId] = useState(null)

	// Stan paginacji tabeli aut
	const ITEMS_PER_PAGE = 50
	const [currentPage, setCurrentPage] = useState(1)

	// Szablon pustego formularza używany przy resecie po dodaniu nowego auta
	const initialNewCar = {
		brand: '',
		model: '',
		condition: 'Nowy',
		bodyType: 'Sedan',
		seats: 5,
		fuel: 'Benzyna',
		power: '',
		capacity: '',
		yearFrom: new Date().getFullYear(),
		yearTo: '',
		drive: 'FWD',
		transmission: 'Manualna',
		trunkSize: '',
		consumption: '',
		maintenanceCost: 5,
		comfort: 5,
		price: '',
		safety: 5,
		reliability: 5,
		acceleration: '',
	}
	const [newCar, setNewCar] = useState(initialNewCar)

	const handleChange = e => setNewCar(prev => ({ ...prev, [e.target.name]: e.target.value }))

	// Handler obsługujący operacje Create/Update w IndexedDB
	const handleSubmit = async e => {
		e.preventDefault()
		// Rzutowanie wartości pobranych z formularza jako stringi na liczby, niezbędne do obliczeń
		const carData = {
			...newCar,
			seats: Number(newCar.seats),
			power: Number(newCar.power),
			capacity: Number(newCar.capacity),
			yearFrom: Number(newCar.yearFrom),
			yearTo: newCar.yearTo ? Number(newCar.yearTo) : null,
			trunkSize: Number(newCar.trunkSize),
			consumption: Number(newCar.consumption),
			maintenanceCost: Number(newCar.maintenanceCost),
			comfort: Number(newCar.comfort),
			price: Number(newCar.price),
			safety: Number(newCar.safety),
			reliability: Number(newCar.reliability),
			acceleration: Number(newCar.acceleration),
		}

		if (editingId) {
			const updatedCar = { ...carData, id: editingId }
			await updateCarInDB(updatedCar)
			setCars(prev => prev.map(c => (c.id === editingId ? updatedCar : c)))
			setUiMessage(`Zaktualizowano pojazd: ${carData.brand} ${carData.model}`)
		} else {
			const newId = await addCarToDB(carData)
			setCars(prev => [{ ...carData, id: newId }, ...prev])
			setUiMessage(`Dodano pojazd: ${carData.brand} ${carData.model}`)
			setCurrentPage(1) // Wymuszenie widoku pierwszej strony, by upewnić się, że widać nowo dodane auto
		}

		// Reset formularza
		setNewCar(initialNewCar)
		setEditingId(null)
		setTimeout(() => setUiMessage(''), 3000)
	}

	// Przygotowanie formularza do edycji istniejącego auta
	const handleEditClick = car => {
		setNewCar({ ...car, yearTo: car.yearTo || '' })
		setEditingId(car.id)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleCancelEdit = () => {
		setNewCar(initialNewCar)
		setEditingId(null)
	}

	// Handler usuwający auto z bazy IndexedDB
	const handleDelete = async id => {
		if (window.confirm('Czy na pewno chcesz usunąć ten pojazd z bazy?')) {
			await deleteCarFromDB(id)
			setCars(prev => {
				const updatedList = prev.filter(c => c.id !== id)
				// Zapobiega wyświetlaniu pustej strony, jeśli usunęliśmy ostatnie auto na obecnej podstronie paginacji
				const newTotalPages = Math.ceil(updatedList.length / ITEMS_PER_PAGE) || 1
				if (currentPage > newTotalPages) {
					setCurrentPage(newTotalPages)
				}
				return updatedList
			})
			setUiMessage('Usunięto pojazd z bazy.')
			setTimeout(() => setUiMessage(''), 3000)
		}
	}

	// Logika paginacji (wycinanie aut dla bieżącej widocznej strony tabeli)
	const totalPages = Math.ceil(cars.length / ITEMS_PER_PAGE) || 1
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
	const currentCars = cars.slice(startIndex, startIndex + ITEMS_PER_PAGE)

	const handleNextPage = () => {
		if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
	}

	const handlePrevPage = () => {
		if (currentPage > 1) setCurrentPage(prev => prev - 1)
	}

	return (
		<div className='space-y-6'>
			{/* ... Struktura renderowania (bez zmian) ... */}
			{/* W tym miejscu znajduje się JSX odpowiedzialny za wyświetlanie formularzy CRUD 
                oraz tabeli w panelu administratora. */}
			{uiMessage && (
				<div className='bg-emerald-100 text-emerald-700 p-4 rounded-xl font-bold shadow-sm'>{uiMessage}</div>
			)}

			<div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-200'>
				<h3 className='text-xl font-bold mb-6 border-b pb-4 text-slate-800'>
					{editingId ? 'Edytuj pojazd' : 'Dodaj pojazd'}
				</h3>
				<form onSubmit={handleSubmit}>
					<h4 className='text-sm font-bold text-blue-600 uppercase tracking-wider mb-4'>1. Dane podstawowe</h4>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100'>
						<FormInput required label='Marka pojazdu' name='brand' value={newCar.brand} onChange={handleChange} />
						<FormInput required label='Model pojazdu' name='model' value={newCar.model} onChange={handleChange} />
						<FormInput
							required
							label='Cena bazowa (PLN)'
							type='number'
							min='0'
							name='price'
							value={newCar.price}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Produkcja Od'
							type='number'
							min='1950'
							name='yearFrom'
							value={newCar.yearFrom}
							onChange={handleChange}
						/>
						<FormInput
							label='Produkcja Do'
							type='number'
							min='1950'
							name='yearTo'
							value={newCar.yearTo || ''}
							onChange={handleChange}
						/>
						<FormSelect
							label='Stan domyślny'
							name='condition'
							options={CONDITIONS}
							value={newCar.condition}
							onChange={handleChange}
						/>
						<FormSelect
							label='Nadwozie'
							name='bodyType'
							options={BODY_TYPES}
							value={newCar.bodyType}
							onChange={handleChange}
						/>
						<FormSelect label='Paliwo' name='fuel' options={FUELS} value={newCar.fuel} onChange={handleChange} />
						<FormSelect
							label='Skrzynia biegów'
							name='transmission'
							options={TRANSMISSIONS}
							value={newCar.transmission}
							onChange={handleChange}
						/>
						<FormSelect label='Napęd' name='drive' options={DRIVES} value={newCar.drive} onChange={handleChange} />
						<FormInput
							required
							label='Miejsca'
							type='number'
							min='1'
							name='seats'
							value={newCar.seats}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Pojemność (L)'
							type='number'
							step='0.1'
							min='0'
							name='capacity'
							value={newCar.capacity}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Moc silnika (KM)'
							type='number'
							min='0'
							name='power'
							value={newCar.power}
							onChange={handleChange}
						/>
					</div>

					<h4 className='text-sm font-bold text-blue-600 uppercase tracking-wider mb-4'>2. Pomiary TOPSIS</h4>
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100'>
						<FormInput
							required
							label='Przyspieszenie (s)'
							type='number'
							step='0.1'
							min='0'
							name='acceleration'
							value={newCar.acceleration}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Spalanie (l/100km)'
							type='number'
							step='0.1'
							min='0'
							name='consumption'
							value={newCar.consumption}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Bagażnik (L)'
							type='number'
							min='0'
							name='trunkSize'
							value={newCar.trunkSize}
							onChange={handleChange}
						/>
					</div>

					<h4 className='text-sm font-bold text-blue-600 uppercase tracking-wider mb-4'>3. Oceny eksperckie</h4>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100'>
						<FormInput
							required
							label='Niezawodność (1-10)'
							type='number'
							min='1'
							max='10'
							name='reliability'
							value={newCar.reliability}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Bezpieczeństwo (1-10)'
							type='number'
							min='1'
							max='10'
							name='safety'
							value={newCar.safety}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Komfort (1-10)'
							type='number'
							min='1'
							max='10'
							name='comfort'
							value={newCar.comfort}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Koszty napraw (10=Najdroższe)'
							type='number'
							min='1'
							max='10'
							name='maintenanceCost'
							value={newCar.maintenanceCost}
							onChange={handleChange}
						/>
					</div>

					<div className='flex flex-col md:flex-row gap-4'>
						<button
							type='submit'
							className='flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition shadow-md'>
							{editingId ? 'Zapisz zmiany w bazie' : '+ Dodaj nowy pojazd'}
						</button>
						{editingId && (
							<button
								type='button'
								onClick={handleCancelEdit}
								className='bg-red-50 text-red-600 border border-red-200 px-8 font-bold py-3 rounded-xl hover:bg-red-100 transition'>
								Anuluj
							</button>
						)}
					</div>
				</form>
			</div>

			<div className='bg-white rounded-3xl shadow-sm border p-4'>
				<h3 className='text-lg font-bold mb-4 px-2'>Baza wiedzy</h3>
				<div className='overflow-x-auto max-h-[600px] overflow-y-auto mb-4'>
					<table className='w-full text-left text-sm whitespace-nowrap'>
						<thead className='sticky top-0 bg-slate-100 z-10'>
							<tr className='border-b text-slate-500'>
								<th className='p-3 font-semibold rounded-tl-xl'>Auto</th>
								<th className='p-3 font-semibold'>Cena rynkowa</th>
								<th className='p-3 font-semibold'>Specyfikacja</th>
								<th className='p-3 font-semibold text-right rounded-tr-xl'>Akcje</th>
							</tr>
						</thead>
						<tbody>
							{currentCars.map(c => (
								<tr key={c.id} className='border-b hover:bg-slate-50 transition-colors'>
									<td className='p-3'>
										<div className='font-bold text-slate-800'>
											{c.brand} {c.model}
										</div>
										<div className='text-xs text-slate-500'>
											{renderYear(c)} • {c.bodyType} • {c.condition}
										</div>
									</td>
									<td className='p-3 font-bold text-emerald-600'>{formatPrice(c.price)}</td>
									<td className='p-3 text-xs text-slate-500'>
										<div>
											Paliwo: {c.fuel} ({c.consumption} L/100km)
										</div>
										<div>Bagażnik: {c.trunkSize} L</div>
									</td>
									<td className='p-3 text-right'>
										<button
											onClick={() => handleEditClick(c)}
											className='text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg mr-2 font-medium transition'>
											Edytuj
										</button>
										<button
											onClick={() => handleDelete(c.id)}
											className='text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition'>
											Usuń
										</button>
									</td>
								</tr>
							))}
							{currentCars.length === 0 && (
								<tr>
									<td colSpan='4' className='p-8 text-center text-slate-500'>
										Brak pojazdów do wyświetlenia na tej stronie.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{totalPages > 1 && (
					<div className='flex flex-col sm:flex-row justify-between items-center px-4 py-2 border-t border-slate-100 mt-2 gap-4'>
						<span className='text-sm font-medium text-slate-500'>
							Strona <span className='text-slate-800 font-bold'>{currentPage}</span> z{' '}
							<span className='text-slate-800 font-bold'>{totalPages}</span>
						</span>
						<div className='flex gap-2'>
							<button
								onClick={handlePrevPage}
								disabled={currentPage === 1}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
									currentPage === 1
										? 'bg-slate-100 text-slate-400 cursor-not-allowed'
										: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm'
								}`}>
								Poprzednia
							</button>
							<button
								onClick={handleNextPage}
								disabled={currentPage === totalPages}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
									currentPage === totalPages
										? 'bg-slate-100 text-slate-400 cursor-not-allowed'
										: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm'
								}`}>
								Następna
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// --- GŁÓWNA APLIKACJA ---
export default function App() {
	const [view, setView] = useState('user')
	const [cars, setCars] = useState([])
	const [isLoading, setIsLoading] = useState(true)

	// Inicjalizacyjne pobieranie wszystkich pojazdów z IndexedDB po zamontowaniu komponentu
	useEffect(() => {
		async function loadData() {
			try {
				const dbCars = await getAllCars()
				setCars(dbCars)
			} catch (error) {
				console.error('Błąd inicjalizacji IndexedDB:', error)
			} finally {
				setIsLoading(false)
			}
		}
		loadData()
	}, [])

	// Stan przechowujący aktualne wartości surowych filtrów (tzw. hard filters)
	const [hardFilters, setHardFilters] = useState({
		condition: '',
		bodyType: '',
		fuel: '',
		transmission: '',
		maxPrice: '',
		drive: '',
		seats: '',
		minYear: '',
		maxYear: '',
		minPower: '',
		maxPower: '',
	})

	// Stan przechowujący wagę algorytmu (skala 1-10) przypisywaną każdemu z kryteriów TOPSIS
	const [topsisPrefs, setTopsisPrefs] = useState({
		price: 5,
		consumption: 5,
		safety: 5,
		reliability: 5,
		performance: 5,
		trunk: 5,
		maintenance: 5,
		comfort: 5,
	})

	const [results, setResults] = useState([])
	const [hasSearched, setHasSearched] = useState(false)

	const handleHardFilterChange = e => setHardFilters(f => ({ ...f, [e.target.name]: e.target.value }))
	const handleTopsisChange = e => setTopsisPrefs(p => ({ ...p, [e.target.name]: parseInt(e.target.value) }))

	// Wyzwolenie obliczeń algorytmu TOPSIS
	const handleSearch = e => {
		e.preventDefault()

		// --- Normalizacja wag przed przekazaniem do algorytmu ---
		// TOPSIS wymaga wag ułamkowych, których suma to 1 (tzw. znormalizowany wektor wag).
		const totalWeight = Object.values(topsisPrefs).reduce((sum, w) => sum + w, 0)

		const normalizedPrefs = {}
		if (totalWeight > 0) {
			Object.keys(topsisPrefs).forEach(key => {
				normalizedPrefs[key] = topsisPrefs[key] / totalWeight
			})
		} else {
			// Fail-safe na wypadek, gdyby suma wag wynosiła 0 (dzielenie równe)
			Object.keys(topsisPrefs).forEach(key => {
				normalizedPrefs[key] = 1 / Object.keys(topsisPrefs).length
			})
		}

		// Zastosowanie twardych filtrów (odsianie aut, które nie spełniają bazowych kryteriów)
		const filtered = filterCars(cars, hardFilters)

		// Przekazanie wstępnie przefiltrowanej bazy i ZNORMALIZOWANYCH wag do mechanizmu TOPSIS.
		// Trzeci argument to limit wyników zwracanych przez TOPSIS (zwraca top 5 aut).
		const top = calculateTopsis(filtered, normalizedPrefs, 5)
		setResults(top)
		setHasSearched(true)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	// Przygotowanie przetworzonych danych dla biblioteki Recharts generującej wykresy Radarowe.
	// Hook useMemo gwarantuje, że wykresy przeliczą się tylko przy zmianie zawartości tablicy results.
	const radarData = useMemo(() => {
		if (results.length === 0) return []
		const top3 = results.slice(0, 3)

		// Granice wartości min-max potrzebne do poprawnego wyrenderowania wykresu na stałej osi (0-10)
		const BOUNDS = {
			trunkSize: { min: 150, max: 700 },
			consumption: { min: 0, max: 12 },
			maintenanceCost: { min: 1, max: 10 },
			comfort: { min: 1, max: 10 },
			price: { min: 20000, max: 350000 },
			safety: { min: 1, max: 10 },
			reliability: { min: 1, max: 10 },
			acceleration: { min: 2.5, max: 14 },
		}

		// Normalizacja dowolnej surowej wartości atrybutu pojazdu do zunifikowanej skali wykreślnej od 0 do 10
		const normalize = (key, val, invert = false) => {
			const b = BOUNDS[key] || { min: 0, max: Math.max(val, 1) }
			let clampedVal = Math.max(b.min, Math.min(b.max, val))
			let score = ((clampedVal - b.min) / (b.max - b.min)) * 10
			// W przypadku kryteriów "złych" (jak cena czy spalanie - the less the better),
			// odwracamy skale, tak by na wykresie wielokąt był najpełniejszy dla najlepszego wyboru.
			return invert ? 10 - score : score
		}

		const metrics = CRITERIA.map(c => ({
			subject: c.label,
			key: c.key,
			invert: !c.benefit,
		}))

		return top3.map(car => {
			return metrics.map(m => ({
				subject: m.subject,
				value: Number(normalize(m.key, car[m.key], m.invert).toFixed(1)),
				carName: `${car.brand} ${car.model}`,
			}))
		})
	}, [results])

	// Ekran ładowania na czas nawiązania połączenia i ściągania całej bazy aut z IndexedDB
	if (isLoading) {
		return (
			<div className='min-h-screen bg-slate-100 flex flex-col justify-center items-center'>
				<div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4'></div>
				<p className='text-slate-600 font-bold'>
					Ładowanie bazy {cars.length > 0 ? cars.length : '...'} pojazdów (IndexedDB)...
				</p>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-slate-100 font-sans text-slate-800'>
			<nav className='bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm sticky top-0 z-50'>
				<div className='font-extrabold text-xl text-blue-600 flex items-center gap-2'>
					<svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
						<path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
						<path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-2h3.05a2.5 2.5 0 014.9 0H21a1 1 0 001-1v-5a3 3 0 00-3-3h-4V5a1 1 0 00-1-1H3z' />
					</svg>
					AutoExpert
				</div>
				<div className='flex gap-2 bg-slate-100 p-1 rounded-lg'>
					<button
						onClick={() => setView('user')}
						className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'user' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
						Algorytm decyzyjny
					</button>
					<button
						onClick={() => setView('admin')}
						className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'admin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
						Panel Admina ({cars.length})
					</button>
				</div>
			</nav>

			<div className='p-4 md:p-6 max-w-7xl mx-auto'>
				{view === 'admin' ? (
					<AdminPanel cars={cars} setCars={setCars} />
				) : (
					<>
						{hasSearched && results.length >= 1 && (
							<section className='w-full bg-white p-6 md:p-8 rounded-3xl border shadow-sm mb-8 animate-[fadeIn_0.5s_ease-out]'>
								<h2 className='text-2xl font-bold mb-8 text-slate-800 border-b pb-4 flex items-center gap-3'>
									<svg className='w-8 h-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth='2'
											d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'></path>
									</svg>
									Porównanie parametrów (Top {Math.min(3, results.length)})
								</h2>
								<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
									{results.slice(0, 3).map((car, i) => (
										<div
											key={`chart-${car.id}`}
											className='flex flex-col items-center bg-slate-50 pt-6 pb-4 px-4 rounded-3xl border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-2 duration-300'>
											<span className='text-xl leading-tight font-extrabold text-slate-800 mb-2 text-center'>
												{car.brand} {car.model}
											</span>
											<span
												className={`text-[11px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-full mb-6 ${i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>
												{i === 0 ? '🏆 Najlepszy wybór' : `Miejsce ${i + 1}`}
											</span>

											<div className='w-full h-[340px]'>
												<ResponsiveContainer width='100%' height='100%'>
													<RadarChart
														cx='50%'
														cy='50%'
														outerRadius='55%'
														margin={{ top: 25, right: 45, bottom: 25, left: 45 }}
														data={radarData[i]}>
														<PolarGrid stroke='#cbd5e1' />
														<PolarAngleAxis
															dataKey='subject'
															tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
														/>
														<PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
														<RechartsTooltip
															formatter={val => [val, 'Ocena względna (1-10)']}
															contentStyle={{
																borderRadius: '16px',
																fontSize: '13px',
																fontWeight: 'bold',
																border: 'none',
																boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
															}}
														/>
														<Radar
															name={car.model}
															dataKey='value'
															stroke={['#3b82f6', '#10b981', '#f59e0b'][i]}
															strokeWidth={3}
															fill={['#3b82f6', '#10b981', '#f59e0b'][i]}
															fillOpacity={0.4}
														/>
													</RadarChart>
												</ResponsiveContainer>
											</div>
										</div>
									))}
								</div>
							</section>
						)}

						<div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
							<section className='lg:col-span-4'>
								<form onSubmit={handleSearch} className='space-y-6'>
									<div className='bg-white p-6 rounded-3xl shadow-sm border'>
										<h2 className='text-lg font-bold mb-5 text-slate-800'>Filtry podstawowe</h2>
										<div className='grid grid-cols-2 gap-3'>
											<FormSelect
												label='Stan'
												name='condition'
												options={CONDITIONS}
												placeholder='Dowolny'
												value={hardFilters.condition}
												onChange={handleHardFilterChange}
											/>
											<FormSelect
												label='Nadwozie'
												name='bodyType'
												options={BODY_TYPES}
												placeholder='Dowolne'
												value={hardFilters.bodyType}
												onChange={handleHardFilterChange}
											/>
											<FormSelect
												label='Paliwo'
												name='fuel'
												options={FUELS}
												placeholder='Dowolne'
												value={hardFilters.fuel}
												onChange={handleHardFilterChange}
											/>
											<FormSelect
												label='Skrzynia'
												name='transmission'
												options={TRANSMISSIONS}
												placeholder='Dowolna'
												value={hardFilters.transmission}
												onChange={handleHardFilterChange}
											/>
											<FormSelect
												label='Napęd'
												name='drive'
												options={DRIVES}
												placeholder='Dowolny'
												value={hardFilters.drive}
												onChange={handleHardFilterChange}
											/>
											<FormInput
												label='Miejsca (Min)'
												type='number'
												min='1'
												name='seats'
												value={hardFilters.seats}
												placeholder='np. 5'
												onChange={handleHardFilterChange}
											/>
											<FormInput
												label='Rocznik Od'
												type='number'
												min='1950'
												name='minYear'
												value={hardFilters.minYear}
												placeholder='np. 2010'
												onChange={handleHardFilterChange}
											/>
											<FormInput
												label='Rocznik Do'
												type='number'
												min='1950'
												name='maxYear'
												value={hardFilters.maxYear}
												placeholder='np. 2024'
												onChange={handleHardFilterChange}
											/>
											<FormInput
												label='Moc od (KM)'
												type='number'
												min='0'
												name='minPower'
												value={hardFilters.minPower}
												placeholder='np. 100'
												onChange={handleHardFilterChange}
											/>
											<FormInput
												label='Moc do (KM)'
												type='number'
												min='0'
												name='maxPower'
												value={hardFilters.maxPower}
												placeholder='np. 300'
												onChange={handleHardFilterChange}
											/>
										</div>
										<div className='mt-4'>
											<FormInput
												label='Maksymal Budżet (PLN)'
												type='number'
												min='0'
												name='maxPrice'
												value={hardFilters.maxPrice}
												placeholder='np. 50000'
												onChange={handleHardFilterChange}
											/>
										</div>
									</div>

									<div className='bg-white p-6 rounded-3xl shadow-sm border'>
										<h2 className='text-lg font-bold mb-5 text-slate-800'>Twoje priorytety</h2>
										<div className='grid grid-cols-1 gap-3'>
											{CRITERIA.map(c => (
												<PreferenceSlider
													key={c.weight}
													label={c.label}
													name={c.weight}
													value={topsisPrefs[c.weight]}
													onChange={handleTopsisChange}
												/>
											))}
										</div>
									</div>

									<button
										type='submit'
										className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200 active:scale-95 shadow-md flex justify-center items-center gap-2 text-lg uppercase tracking-wide'>
										<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth='2'
												d='M13 10V3L4 14h7v7l9-11h-7z'></path>
										</svg>
										Przelicz
									</button>
								</form>
							</section>

							<section className='lg:col-span-8'>
								{!hasSearched ? (
									<div className='text-center text-slate-400 mt-20 flex flex-col items-center bg-white p-12 rounded-3xl border border-dashed border-slate-300'>
										<svg
											className='w-20 h-20 mb-6 text-slate-300'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={1}
												d='M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5'
											/>
										</svg>
										<p className='font-medium text-xl text-slate-600 mb-2'>System gotowy ({cars.length} aut w bazie)</p>
										<p className='text-sm'>Skonfiguruj filtry po lewej stronie i kliknij przycisk Przelicz.</p>
									</div>
								) : results.length === 0 ? (
									<div className='text-center font-bold text-xl mt-10 text-slate-600 bg-white p-10 rounded-3xl shadow-sm border'>
										Brak pojazdów spełniających nałożone filtry podstawowe.
									</div>
								) : (
									<div className='space-y-6'>
										{results.length === 1 && (
											<div className='bg-amber-100 text-amber-800 p-4 rounded-xl font-bold text-sm'>
												Zaleziono tylko 1 pojazd spełniający filtry podstawowe.
											</div>
										)}

										{results.map((car, index) => {
											const isWinner = index === 0
											return (
												<div
													key={car.id}
													className={`bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${isWinner ? 'border-amber-300 ring-4 ring-amber-50' : ''}`}>
													{isWinner && (
														<div className='absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-6 py-1.5 rounded-bl-xl shadow-md'>
															🏆 Najlepszy Wybór
														</div>
													)}

													<div className='flex flex-col sm:flex-row justify-between items-start mb-6 gap-4'>
														<div>
															<div className='flex items-center gap-3 mb-1'>
																<span
																	className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isWinner ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
																	#{index + 1}
																</span>
																<h2 className='text-2xl font-bold'>
																	{car.brand} {car.model}
																</h2>
															</div>
															<div className='text-sm text-slate-500 ml-11 font-medium'>
																{renderYear(car)} • {car.condition} • {car.transmission}
															</div>
														</div>
														<div className='w-full sm:w-auto text-right bg-slate-50 p-3 rounded-xl border border-slate-100'>
															<div className='text-[10px] uppercase tracking-wider font-bold text-slate-400'>
																Cena rynkowa
															</div>
															<div
																className={`text-2xl font-black ${isWinner ? 'text-amber-600' : 'text-emerald-600'}`}>
																{formatPrice(car.price)}
															</div>
															<div className='text-xs text-slate-500 font-mono mt-1 font-semibold'>
																{(car.topsisScore * 100).toFixed(1)}% trafności
															</div>
														</div>
													</div>

													<div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100'>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Silnik</div>
															<div className='font-bold text-slate-800'>
																{car.capacity > 0 ? `${car.capacity.toFixed(1)} L` : '-'} {car.fuel}
															</div>
														</div>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Moc / 0-100</div>
															<div className='font-bold text-slate-800'>
																{car.power} KM / {car.acceleration}s
															</div>
														</div>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Spalanie</div>
															<div className='font-bold text-slate-800'>
																{car.consumption > 0 ? `${car.consumption} l/100km` : '-'}
															</div>
														</div>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Bagażnik</div>
															<div className='font-bold text-slate-800'>
																{car.trunkSize} L <span className='text-slate-400 font-normal'>({car.seats} os.)</span>
															</div>
														</div>

														<div className='mt-1'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Niezawodność</div>
															<div className='font-bold'>{car.reliability}/10</div>
														</div>
														<div className='mt-1'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Bezpieczeństwo</div>
															<div className='font-bold'>{car.safety}/10</div>
														</div>
														<div className='mt-1'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Komfort</div>
															<div className='font-bold'>{car.comfort}/10</div>
														</div>
														<div className='mt-1'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Koszty napraw</div>
															<div className='font-bold'>{getMaintenanceText(car.maintenanceCost)}</div>
														</div>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</section>
						</div>
					</>
				)}
			</div>
		</div>
	)
}
