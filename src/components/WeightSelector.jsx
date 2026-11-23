import { getWeightLabel } from '../utils/formatters'

export default function WeightSelector({ label, name, value, onChange }) {
	const config = getWeightLabel(value)

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
				min='0'
				max='10'
				value={value}
				onChange={onChange}
				className='w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600'
			/>
			<div className='flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider'>
				<span>0 (Wył.)</span>
				<span>10 (Max)</span>
			</div>
		</div>
	)
}
