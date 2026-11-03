import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { getAllCars } from './db'
import { calculateTopsis } from './topsis'
import { filterCars } from './utils/filterCars'
import { BODY_TYPES, FUELS, TRANSMISSIONS, DRIVES, CONDITIONS, CRITERIA } from './constants'
import { FormInput, FormSelect } from './components/FormElements'
import WeightSelector from './components/WeightSelector'
import { formatPrice, renderYear, getMaintenanceText } from './utils/formatters'
import ErrorBoundary from './components/ErrorBoundary'
import {
	Radar,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
} from 'recharts'

// 1. Asynchroniczne ładowanie komponentu (Lazy Loading) - oszczędza transfer i przyspiesza aplikację
const AdminPanel = lazy(() => import('./components/AdminPanel'))

export default function App() {
	const [view, setView] = useState('user')
	const [cars, setCars] = useState([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		async function loadData() {
			try {
				const dbCars = await getAllCars()
				setCars(dbCars)
			} catch {
				// Zastąpiono surowe console.error komunikatem UI
				alert(
					'Wystąpił problem z dostępem do lokalnej bazy danych. Sprawdź, czy przeglądarka nie blokuje IndexedDB (np. w trybie Incognito).',
				)
			} finally {
				setIsLoading(false)
			}
		}
		loadData()
	}, [])

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

	const handleSearch = e => {
		e.preventDefault()
		const totalWeight = Object.values(topsisPrefs).reduce((sum, w) => sum + w, 0)
		const normalizedPrefs = {}
		if (totalWeight > 0) {
			Object.keys(topsisPrefs).forEach(key => {
				normalizedPrefs[key] = topsisPrefs[key] / totalWeight
			})
		} else {
			Object.keys(topsisPrefs).forEach(key => {
				normalizedPrefs[key] = 1 / Object.keys(topsisPrefs).length
			})
		}
		const filtered = filterCars(cars, hardFilters)
		const allScoredCars = calculateTopsis(filtered, normalizedPrefs)
		setResults(allScoredCars.slice(0, 5))
		setHasSearched(true)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const radarData = useMemo(() => {
		if (results.length === 0) return []
		const top3 = results.slice(0, 3)

		const getDynamicBounds = (key, minMargin, minFloor = 0) => {
			const values = results.map(car => car[key])
			const rawMin = Math.min(...values)
			const rawMax = Math.max(...values)
			const spread = rawMax - rawMin

			const margin = Math.max(minMargin, spread * 0.15)

			return {
				min: Math.max(minFloor, rawMin - margin),
				max: rawMax + margin,
			}
		}

		const BOUNDS = {
			price: getDynamicBounds('price', 15000, 5000),
			trunkSize: getDynamicBounds('trunkSize', 80, 100),
			consumption: getDynamicBounds('consumption', 1.5, 0),
			acceleration: getDynamicBounds('acceleration', 1.5, 1.5),
			maintenanceCost: { min: 1, max: 10 },
			comfort: { min: 1, max: 10 },
			safety: { min: 1, max: 10 },
			reliability: { min: 1, max: 10 },
		}

		const normalize = (key, val, invert = false) => {
			const b = BOUNDS[key] || { min: 0, max: Math.max(val, 1) }
			const range = b.max - b.min === 0 ? 1 : b.max - b.min
			const clampedVal = Math.max(b.min, Math.min(b.max, val))
			const score = ((clampedVal - b.min) / range) * 10
			const finalScore = invert ? 10 - score : score
			return Math.max(1, Math.min(10, finalScore))
		}

		const metrics = CRITERIA.map(c => ({ subject: c.label, key: c.key, invert: !c.benefit }))

		return top3.map(car => {
			return metrics.map(m => ({
				subject: m.subject,
				value: Number(normalize(m.key, car[m.key], m.invert).toFixed(1)),
				carName: `${car.brand} ${car.model}`,
			}))
		})
	}, [results])

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
			<div className='p-4 md:p-6 max-w-7xl mx-auto print:max-w-full print:p-0'>
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
								<section className='w-full bg-white p-6 md:p-8 rounded-3xl border shadow-sm mb-8 animate-[fadeIn_0.5s_ease-out] print:border-none print:shadow-none print:p-0 print:m-0'>
									<div className='hidden print:block text-center mb-3 pb-2 border-b-2 border-slate-800'>
										<h1 className='text-2xl font-black text-slate-900 tracking-tight uppercase'>Raport AutoExpert</h1>
										<p className='text-slate-600 font-medium text-xs'>
											Spersonalizowane zestawienie i analiza TOP 3 pojazdów (metoda TOPSIS)
										</p>
									</div>

									<div className='flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-8 print:hidden'>
										<h2 className='text-2xl font-bold text-slate-800 flex items-center gap-3'>
											<svg className='w-8 h-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth='2'
													d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'></path>
											</svg>
											Porównanie parametrów (Top {Math.min(3, results.length)})
										</h2>
										<button
											onClick={() => window.print()}
											className='mt-4 md:mt-0 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all'>
											<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth='2'
													d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'></path>
											</svg>
											Generuj Raport PDF
										</button>
									</div>

									<div className='grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1 print:gap-2.5 print:mb-0'>
										{results.slice(0, 3).map((car, i) => (
											<div
												key={`chart-${car.id}`}
												className='flex flex-col items-center bg-slate-50 pt-6 pb-4 px-4 rounded-3xl border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-2 duration-300 print:bg-white print:border print:border-slate-300 print:rounded-xl print:shadow-none print:break-inside-avoid print:py-2 print:px-4 print:w-full'>
												<div className='flex flex-col items-center print:flex-row print:justify-between print:w-full print:border-b print:border-slate-100 print:pb-1 print:mb-1'>
													<span className='text-xl leading-tight font-extrabold text-slate-800 mb-2 text-center print:mb-0 print:text-sm'>
														{car.brand} {car.model}
													</span>
													<span
														className={`text-[11px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-full mb-6 print:mb-0 print:py-0.5 print:px-2.5 print:text-[10px] print:border-slate-800 print:text-slate-800 ${i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>
														{i === 0 ? '🏆 Najlepszy wybór' : `Miejsce ${i + 1}`}
													</span>
												</div>
												<div className='w-full max-w-[380px] mx-auto h-[340px] print:h-[253px] flex justify-center items-center [&_.recharts-wrapper]:!mx-auto'>
													<ResponsiveContainer width='100%' height='100%'>
														<RadarChart
															cx='50%'
															cy='50%'
															outerRadius='60%'
															margin={{ top: 15, right: 45, bottom: 15, left: 45 }}
															data={radarData[i]}>
															<PolarGrid stroke='#cbd5e1' />
															<PolarAngleAxis
																dataKey='subject'
																tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
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
																strokeWidth={2.5}
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
							</ErrorBoundary>
						)}

						<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 print:block'>
							<section className='lg:col-span-4 print:hidden'>
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
												<WeightSelector
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
												d='M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5'
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
										{/* Tytuł sekcji specyfikacji widoczny w druku na 2. stronie */}
										<h3 className='hidden print:block text-2xl font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4'>
											Szczegółowa specyfikacja (TOP 3)
										</h3>

										{results.length === 1 && (
											<div className='bg-amber-100 text-amber-800 p-4 rounded-xl font-bold text-sm print:hidden'>
												Zaleziono tylko 1 pojazd spełniający filtry podstawowe.
											</div>
										)}

										{results.map((car, index) => {
											const isWinner = index === 0
											return (
												<div
													key={car.id}
													className={`bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md print:break-inside-avoid print:shadow-none print:border-2 print:border-slate-300 print:p-4 print:rounded-2xl ${isWinner ? 'border-amber-300 ring-4 ring-amber-50 print:ring-0' : ''} ${index >= 3 ? 'print:hidden' : ''}`}>
													{isWinner && (
														<div className='absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-6 py-1.5 rounded-bl-xl shadow-md print:border-b-2 print:border-l-2 print:border-amber-500 print:text-amber-700 print:bg-none print:shadow-none'>
															🏆 Najlepszy Wybór
														</div>
													)}
													<div className='flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 print:flex-row print:mb-4'>
														<div>
															<div className='flex items-center gap-3 mb-1'>
																<span
																	className={`w-8 h-8 rounded-full flex items-center justify-center font-bold print:border print:border-slate-300 ${isWinner ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
																	#{index + 1}
																</span>
																<h2 className='text-2xl font-bold print:text-xl'>
																	{car.brand} {car.model}
																</h2>
															</div>
															<div className='text-sm text-slate-500 ml-11 font-medium'>
																{renderYear(car)} • {car.condition} • {car.transmission}
															</div>
														</div>
														<div className='w-full sm:w-auto text-right bg-slate-50 p-3 rounded-xl border border-slate-100 print:w-auto print:bg-white print:border-slate-300 print:p-2'>
															<div className='text-[10px] uppercase tracking-wider font-bold text-slate-400'>
																Cena rynkowa
															</div>
															<div
																className={`text-2xl font-black print:text-xl ${isWinner ? 'text-amber-600' : 'text-emerald-600'}`}>
																{formatPrice(car.price)}
															</div>
															<div className='text-xs text-slate-500 font-mono mt-1 font-semibold'>
																{(car.topsisScore * 100).toFixed(1)}% trafności
															</div>
														</div>
													</div>
													<div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 print:grid-cols-4 print:bg-white print:border-slate-300'>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Silnik</div>
															<div className='font-bold text-slate-800'>
																{car.capacity > 0 ? `${car.capacity.toFixed(1)} L` : '-'} {car.fuel}
															</div>
														</div>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Moc / 0-100</div>
															<div className='font-bold text-slate-800'>
																{car.power} KM / {car.acceleration}s
															</div>
														</div>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0'>
															<div className='text-[10px] uppercase font-bold text-slate-400'>Spalanie</div>
															<div className='font-bold text-slate-800'>
																{car.consumption > 0 ? `${car.consumption} l/100km` : '-'}
															</div>
														</div>
														<div className='bg-white p-2 rounded-lg shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0'>
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
