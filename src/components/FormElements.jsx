export const FormInput = ({ label, ...props }) => (
	<div>
		<label className='block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider'>{label}</label>
		<input
			className='w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
			{...props}
		/>
	</div>
)

export const FormSelect = ({ label, options, placeholder, ...props }) => (
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
