import { BODY_TYPES, FUELS, TRANSMISSIONS, DRIVES, CONDITIONS, CRITERIA } from '../constants'
import { FormInput, FormSelect } from './FormElements'
import WeightSelector from './WeightSelector'

export default function FilterForm({ hardFilters, topsisPrefs, onHardFilterChange, onTopsisChange, onSubmit }) {
	return (
		<form onSubmit={onSubmit} className='space-y-6'>
			<div className='bg-white p-6 rounded-3xl shadow-sm border'>
				<h2 className='text-lg font-bold mb-5 text-slate-800'>Filtry podstawowe</h2>
				<div className='grid grid-cols-2 gap-3'>
					<FormSelect
						label='Stan'
						name='condition'
						options={CONDITIONS}
						placeholder='Dowolny'
						value={hardFilters.condition}
						onChange={onHardFilterChange}
					/>
					<FormSelect
						label='Nadwozie'
						name='bodyType'
						options={BODY_TYPES}
						placeholder='Dowolne'
						value={hardFilters.bodyType}
						onChange={onHardFilterChange}
					/>
					<FormSelect
						label='Paliwo'
						name='fuel'
						options={FUELS}
						placeholder='Dowolne'
						value={hardFilters.fuel}
						onChange={onHardFilterChange}
					/>
					<FormSelect
						label='Skrzynia'
						name='transmission'
						options={TRANSMISSIONS}
						placeholder='Dowolna'
						value={hardFilters.transmission}
						onChange={onHardFilterChange}
					/>
					<FormSelect
						label='Napęd'
						name='drive'
						options={DRIVES}
						placeholder='Dowolny'
						value={hardFilters.drive}
						onChange={onHardFilterChange}
					/>
					<FormInput
						label='Miejsca (Min)'
						type='number'
						min='1'
						name='seats'
						value={hardFilters.seats}
						placeholder='np. 5'
						onChange={onHardFilterChange}
					/>
					<FormInput
						label='Rocznik Od'
						type='number'
						min='1950'
						name='minYear'
						value={hardFilters.minYear}
						placeholder='np. 2010'
						onChange={onHardFilterChange}
					/>
					<FormInput
						label='Rocznik Do'
						type='number'
						min='1950'
						name='maxYear'
						value={hardFilters.maxYear}
						placeholder='np. 2025'
						onChange={onHardFilterChange}
					/>
					<FormInput
						label='Moc od (KM)'
						type='number'
						min='0'
						name='minPower'
						value={hardFilters.minPower}
						placeholder='np. 100'
						onChange={onHardFilterChange}
					/>
					<FormInput
						label='Moc do (KM)'
						type='number'
						min='0'
						name='maxPower'
						value={hardFilters.maxPower}
						placeholder='np. 300'
						onChange={onHardFilterChange}
					/>
				</div>
				<div className='mt-4'>
					<FormInput
						label='Maksymalny budżet (PLN)'
						type='number'
						min='0'
						name='maxPrice'
						value={hardFilters.maxPrice}
						placeholder='np. 150000'
						onChange={onHardFilterChange}
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
							onChange={onTopsisChange}
						/>
					))}
				</div>
			</div>

			<button
				type='submit'
				className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200 active:scale-95 shadow-md flex justify-center items-center gap-2 text-lg uppercase tracking-wide'>
				<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z'></path>
				</svg>
				Przelicz
			</button>
		</form>
	)
}
