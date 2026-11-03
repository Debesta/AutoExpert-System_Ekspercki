const getWeightConfig = value => {
	if (value <= 2) return { text: 'Znikome znaczenie', color: 'bg-gray-100 text-gray-600' }
	if (value <= 4) return { text: 'Mało ważne', color: 'bg-blue-100 text-blue-700' }
	if (value <= 6) return { text: 'Średnio ważne', color: 'bg-yellow-100 text-yellow-700' }
	if (value <= 8) return { text: 'Ważne', color: 'bg-orange-100 text-orange-700' }
	return { text: 'Priorytet', color: 'bg-red-100 text-red-700' }
}

export default function WeightSelector({ label, name, value, onChange }) {
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
