import { getConsumptionUnit } from '../constants'
import { formatPrice, renderYear, getMaintenanceText } from '../utils/formatters'
import XaiBreakdown from './XaiBreakdown'

export default function ResultCard({ car, index, isSingleResult }) {
	const isWinner = index === 0

	return (
		<div
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
					<div className='text-[10px] uppercase tracking-wider font-bold text-slate-400'>Cena rynkowa</div>
					<div className={`text-2xl font-black print:text-xl ${isWinner ? 'text-amber-600' : 'text-emerald-600'}`}>
						{formatPrice(car.price)}
					</div>
					<div
						title='Wskaźnik względny TOPSIS (0–100) liczony wyłącznie wobec aut spełniających bieżące filtry. Zmiana filtrów zmienia wartość wskaźnika.'
						className='text-xs text-slate-500 font-mono mt-1 font-semibold cursor-help'>
						Indeks w tym zestawie: {(car.topsisScore * 100).toFixed(1)}/100
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
					<div className='text-[10px] uppercase font-bold text-slate-400'>Zużycie / Koszt 100 km</div>
					<div className='font-bold text-slate-800'>
						{car.consumption > 0 ? `${car.consumption} ${getConsumptionUnit(car.fuel)}` : '-'}
						{car.energyCost > 0 && (
							<span className='block text-[11px] font-semibold text-blue-600'>
								~{car.energyCost.toFixed(0)} zł / 100 km
							</span>
						)}
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

			<XaiBreakdown xai={car.xai} isSingleResult={isSingleResult} />
		</div>
	)
}
