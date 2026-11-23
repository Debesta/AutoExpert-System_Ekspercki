import { useState, useEffect, lazy, Suspense } from 'react'
import { getAllCars } from './db'
import { calculateTopsis } from './topsis'
import { filterCars } from './utils/filterCars'
import { useRadarData } from './hooks/useRadarData'
import FilterForm from './components/FilterForm'
import ResultCard from './components/ResultCard'
import ErrorBoundary from './components/ErrorBoundary'

const AdminPanel = lazy(() => import('./components/AdminPanel'))
const RadarSection = lazy(() => import('./components/RadarSection'))

const DEFAULT_DB_ERROR =
	'Wystąpił problem z dostępem do lokalnej bazy danych. Sprawdź, czy przeglądarka nie blokuje IndexedDB.'

const INITIAL_FILTERS = {
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
}

const INITIAL_PREFS = {
	price: 5,
	consumption: 5,
	safety: 5,
	reliability: 5,
	performance: 5,
	trunk: 5,
	maintenance: 5,
	comfort: 5,
}

export default function App() {
	const [view, setView] = useState('user')
	const [cars, setCars] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [dbError, setDbError] = useState('')

	const [hardFilters, setHardFilters] = useState(INITIAL_FILTERS)
	const [topsisPrefs, setTopsisPrefs] = useState(INITIAL_PREFS)
	const [results, setResults] = useState([])
	const [hasSearched, setHasSearched] = useState(false)

	useEffect(() => {
		let cancelled = false

		getAllCars()
			.then(dbCars => {
				if (!cancelled) setCars(dbCars)
			})
			.catch(err => {
				if (!cancelled) setDbError(err?.message || DEFAULT_DB_ERROR)
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [])

	const handleRetry = async () => {
		setIsLoading(true)
		setDbError('')
		try {
			const dbCars = await getAllCars()
			setCars(dbCars)
		} catch (err) {
			setDbError(err?.message || DEFAULT_DB_ERROR)
		} finally {
			setIsLoading(false)
		}
	}

	const handleHardFilterChange = e => setHardFilters(f => ({ ...f, [e.target.name]: e.target.value }))
	const handleTopsisChange = e => setTopsisPrefs(p => ({ ...p, [e.target.name]: parseInt(e.target.value, 10) }))

	const handleSearch = e => {
		e.preventDefault()
		const filtered = filterCars(cars, hardFilters)
		const allScored = calculateTopsis(filtered, topsisPrefs)
		setResults(allScored.slice(0, 5))
		setHasSearched(true)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const radarData = useRadarData(results)

	if (isLoading) {
		return (
			<div className='min-h-screen bg-slate-100 flex flex-col justify-center items-center'>
				<div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4'></div>
				<p className='text-slate-600 font-bold'>Ładowanie bazy pojazdów (IndexedDB)...</p>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-slate-100 font-sans text-slate-800 print:bg-white'>
			<nav className='bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm sticky top-0 z-50 print:hidden'>
				<div className='font-extrabold text-xl text-blue-600 flex items-center gap-2'>
					<svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
						<path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
						<path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-2h3.05a2.5 2.5 0 014.9 0H21a1 1 0 001-1v-5a3 3 0 00-3-3h-4V5a1 1 0 00-1-1H3z' />
					</svg>
					AutoExpert
				</div>
				<div className='flex gap-2 bg-slate-100 p-1 rounded-lg'>
					<button
						type='button'
						onClick={() => setView('user')}
						className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'user' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
						Algorytm decyzyjny
					</button>
					<button
						type='button'
						onClick={() => setView('admin')}
						className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'admin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
						Panel Admina ({cars.length})
					</button>
				</div>
			</nav>

			<div className='p-4 md:p-6 max-w-7xl mx-auto print:max-w-full print:p-0'>
				{dbError && (
					<div
						role='alert'
						className='mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden'>
						<span className='font-semibold text-sm'>{dbError}</span>
						<button
							type='button'
							onClick={handleRetry}
							className='bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shrink-0'>
							Spróbuj ponownie
						</button>
					</div>
				)}

				{view === 'admin' ? (
					<Suspense
						fallback={
							<div className='flex flex-col justify-center items-center min-h-[400px]'>
								<div className='w-10 h-10 border-4 border-slate-400 border-t-transparent rounded-full animate-spin mb-4'></div>
								<p className='text-slate-500 font-bold'>Ładowanie panelu administratora...</p>
							</div>
						}>
						<AdminPanel cars={cars} setCars={setCars} />
					</Suspense>
				) : (
					<>
						{hasSearched && results.length >= 1 && (
							<ErrorBoundary>
								<Suspense
									fallback={
										<div className='bg-white p-8 rounded-3xl border shadow-sm mb-8 text-center text-slate-500 font-bold print:hidden'>
											Ładowanie wykresów porównawczych...
										</div>
									}>
									<RadarSection results={results} radarData={radarData} />
								</Suspense>
							</ErrorBoundary>
						)}

						<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 print:block'>
							<section className='lg:col-span-4 print:hidden'>
								<FilterForm
									hardFilters={hardFilters}
									topsisPrefs={topsisPrefs}
									onHardFilterChange={handleHardFilterChange}
									onTopsisChange={handleTopsisChange}
									onSubmit={handleSearch}
								/>
							</section>

							<section className='lg:col-span-8 print:w-full print:break-before-page'>
								{!hasSearched ? (
									<div className='text-center text-slate-400 mt-20 flex flex-col items-center bg-white p-12 rounded-3xl border border-dashed border-slate-300 print:hidden'>
										<svg
											className='w-20 h-20 mb-6 text-slate-300'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={1}
												d='M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l-2-1v-2.5'
											/>
										</svg>
										<p className='font-medium text-xl text-slate-600 mb-2'>System gotowy ({cars.length} aut w bazie)</p>
										<p className='text-sm'>Skonfiguruj filtry po lewej stronie i kliknij przycisk Przelicz.</p>
									</div>
								) : results.length === 0 ? (
									<div className='text-center font-bold text-xl mt-10 text-slate-600 bg-white p-10 rounded-3xl shadow-sm border print:hidden'>
										Brak pojazdów spełniających nałożone filtry podstawowe.
									</div>
								) : (
									<div className='space-y-6 print:space-y-4'>
										<h3 className='hidden print:block text-2xl font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4'>
											Szczegółowa specyfikacja (TOP 3)
										</h3>

										{results.length === 1 && (
											<div className='bg-amber-100 text-amber-800 p-4 rounded-xl font-bold text-sm print:hidden'>
												Znaleziono tylko 1 pojazd spełniający filtry podstawowe.
											</div>
										)}

										{results.map((car, index) => (
											<ResultCard key={car.id} car={car} index={index} isSingleResult={results.length === 1} />
										))}
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
