import {
	Radar,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
} from 'recharts'

const RADAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b']

const splitRadarLabel = label => {
	if (label === 'Koszt jazdy (100 km)') return ['Koszt jazdy', '(100 km)']
	if (label.length > 12 && label.includes(' ')) {
		const words = label.split(' ')
		const mid = Math.ceil(words.length / 2)
		return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
	}
	return [label]
}

const renderRadarTick = ({ payload, x, y, cx, cy }) => {
	const dx = x - cx
	const dy = y - cy
	const dist = Math.hypot(dx, dy) || 1
	const offset = 6

	const labelX = x + (dx / dist) * offset
	const labelY = y + (dy / dist) * offset

	const textAnchor = dx > 10 ? 'start' : dx < -10 ? 'end' : 'middle'
	const isTop = dy < -10
	const isBottom = dy > 10
	const dominantBaseline = isTop ? 'auto' : isBottom ? 'hanging' : 'central'

	const lines = splitRadarLabel(payload.value)
	const lineHeight = 12

	return (
		<text
			x={labelX}
			y={labelY}
			textAnchor={textAnchor}
			dominantBaseline={dominantBaseline}
			fill='#475569'
			fontSize={10}
			fontWeight='bold'>
			{lines.map((line, idx) => {
				let lineY = labelY
				if (lines.length > 1) {
					if (isTop) {
						lineY = labelY - (lines.length - 1 - idx) * lineHeight
					} else if (isBottom) {
						lineY = labelY + idx * lineHeight
					} else {
						lineY = labelY + (idx - (lines.length - 1) / 2) * lineHeight
					}
				}
				return (
					<tspan key={line} x={labelX} y={lineY}>
						{line}
					</tspan>
				)
			})}
		</text>
	)
}

export default function RadarSection({ results, radarData }) {
	const top3 = results.slice(0, 3)

	return (
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
					Porównanie profilu technicznego (Top {top3.length})
				</h2>
				<button
					type='button'
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
				{top3.map((car, i) => (
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
						<div className='w-full max-w-[380px] mx-auto h-[320px] print:h-[265px] flex justify-center items-center [&_.recharts-wrapper]:!mx-auto [&_svg]:overflow-visible'>
							<ResponsiveContainer width='100%' height='100%'>
								<RadarChart
									cx='50%'
									cy='50%'
									outerRadius='50%'
									margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
									data={radarData[i]}>
									<PolarGrid stroke='#cbd5e1' />
									<PolarAngleAxis dataKey='subject' tick={renderRadarTick} />
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
										stroke={RADAR_COLORS[i]}
										strokeWidth={2.5}
										fill={RADAR_COLORS[i]}
										fillOpacity={0.4}
									/>
								</RadarChart>
							</ResponsiveContainer>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
