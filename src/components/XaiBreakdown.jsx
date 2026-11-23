export default function XaiBreakdown({ xai = [], isSingleResult = false }) {
	if (!xai.length) return null

	if (isSingleResult) {
		return (
			<div className='mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500'>
				<span className='font-bold text-slate-700'>Wyjaśnienie wyniku (XAI):</span> Brak innych pojazdów spełniających
				filtry — nie można wyznaczyć względnego wpływu kryteriów.
			</div>
		)
	}

	const normalizedXai = xai.map(item => ({
		...item,
		netImpact: Number(item.netImpact) || 0,
		weightShare: Number(item.weightShare) || 0,
	}))

	const maxAbsImpact = Math.max(...normalizedXai.map(item => Math.abs(item.netImpact)), 1)

	return (
		<div className='col-span-full w-full mt-4 pt-4 border-t border-slate-200'>
			<div className='flex flex-wrap justify-between items-center gap-2 mb-3'>
				<h4 className='text-xs uppercase tracking-wider font-extrabold text-slate-700'>Co zadecydowało o wyniku?</h4>
				<div className='flex items-center gap-3 text-[11px] font-semibold text-slate-500'>
					<span className='flex items-center gap-1'>
						<span
							className='inline-block rounded-sm'
							style={{
								width: '10px',
								height: '10px',
								backgroundColor: '#10b981',
								WebkitPrintColorAdjust: 'exact',
								printColorAdjust: 'exact',
							}}
						/>
						Atut (bliżej ideału)
					</span>
					<span className='flex items-center gap-1'>
						<span
							className='inline-block rounded-sm'
							style={{
								width: '10px',
								height: '10px',
								backgroundColor: '#fb7185',
								WebkitPrintColorAdjust: 'exact',
								printColorAdjust: 'exact',
							}}
						/>
						Strata (dalej od ideału)
					</span>
				</div>
			</div>

			<div className='space-y-2'>
				{normalizedXai.map(item => {
					const isDisabled = item.weightShare === 0
					const isPositive = item.netImpact >= 0
					const hasImpact = !isDisabled && item.netImpact !== 0
					const barWidth = hasImpact ? Math.max(4, Math.min(100, (Math.abs(item.netImpact) / maxAbsImpact) * 100)) : 0

					return (
						<div
							key={item.key}
							title={`Waga: ${item.weightShare}% | Udział w przewadze (d⁻): ${item.dMinusShare}% | Udział w stracie (d⁺): ${item.dPlusShare}%`}
							className={`grid grid-cols-12 items-center gap-2 text-xs ${isDisabled ? 'opacity-45' : ''}`}>
							{/* Etykieta kryterium + waga (4/12 szerokości, bez ucinania) */}
							<div className='col-span-5 sm:col-span-4 print:col-span-4 leading-tight font-semibold text-slate-700'>
								<span>{item.label}</span>{' '}
								<span className='text-[11px] font-normal text-slate-400 whitespace-nowrap'>({item.weightShare}%)</span>
							</div>

							{/* Wykres słupkowy na sztywnym CSS Grid 2-kolumnowym (7/12 szerokości) */}
							<div
								className='col-span-5 sm:col-span-7 print:col-span-7 grid grid-cols-2 items-center rounded-sm h-4 px-0.5'
								style={{
									backgroundColor: '#f1f5f9',
									WebkitPrintColorAdjust: 'exact',
									printColorAdjust: 'exact',
								}}>
								{/* Lewa strona osi (wpływ ujemny) */}
								<div className='h-full flex justify-end items-center pr-1 border-r-2 border-slate-300 overflow-hidden'>
									{hasImpact && !isPositive && (
										<div
											className='rounded-l-sm transition-all duration-300'
											style={{
												width: `${barWidth}%`,
												height: '10px',
												flexShrink: 0,
												backgroundColor: '#fb7185',
												WebkitPrintColorAdjust: 'exact',
												printColorAdjust: 'exact',
											}}
										/>
									)}
								</div>

								{/* Prawa strona osi (wpływ dodatni) */}
								<div className='h-full flex justify-start items-center pl-1 overflow-hidden'>
									{hasImpact && isPositive && (
										<div
											className='rounded-r-sm transition-all duration-300'
											style={{
												width: `${barWidth}%`,
												height: '10px',
												flexShrink: 0,
												backgroundColor: '#10b981',
												WebkitPrintColorAdjust: 'exact',
												printColorAdjust: 'exact',
											}}
										/>
									)}
								</div>
							</div>

							{/* Wartość liczbowa (1/12 szerokości) */}
							<div
								className={`col-span-2 sm:col-span-1 print:col-span-1 text-right font-mono font-bold text-[11px] whitespace-nowrap ${
									!hasImpact ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'
								}`}>
								{isDisabled ? 'wył.' : `${item.netImpact > 0 ? '+' : ''}${item.netImpact.toFixed(1)}`}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
