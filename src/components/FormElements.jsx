import { useId } from 'react'

export const FormInput = ({ label, id, ...props }) => {
	const generatedId = useId()
	const inputId = id || generatedId

	return (
		<div>
			<label
				htmlFor={inputId}
				className='block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider'>
				{label}
			</label>
			<input
				id={inputId}
				className='w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
				{...props}
			/>
		</div>
	)
}

export const FormSelect = ({ label, options, placeholder, id, ...props }) => {
	const generatedId = useId()
	const selectId = id || generatedId

	return (
		<div>
			<label
				htmlFor={selectId}
				className='block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider'>
				{label}
			</label>
			<select
				id={selectId}
				className='w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
				{...props}>
				{placeholder && <option value=''>{placeholder}</option>}
				{options.map(opt => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
		</div>
	)
}
