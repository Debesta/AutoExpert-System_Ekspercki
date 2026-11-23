import { useState, useRef } from 'react'
import { addCarToDB, updateCarInDB, deleteCarFromDB, resetDBToDefault, replaceAllCarsInDB } from '../db'
import { BODY_TYPES, FUELS, TRANSMISSIONS, DRIVES, CONDITIONS, getConsumptionUnit } from '../constants'
import { FormInput, FormSelect } from './FormElements'
import { formatPrice, renderYear } from '../utils/formatters'

const ITEMS_PER_PAGE = 50

const REQUIRED_IMPORT_FIELDS = ['brand', 'model', 'price', 'fuel', 'bodyType', 'yearFrom']

export default function AdminPanel({ cars, setCars }) {
	const [uiNotice, setUiNotice] = useState(null) // { type: 'success' | 'error', text: string }
	const [isBusy, setIsBusy] = useState(false)
	const [editingId, setEditingId] = useState(null)
	const [currentPage, setCurrentPage] = useState(1)
	const fileInputRef = useRef(null)

	const initialNewCar = {
		brand: '',
		model: '',
		condition: 'Nowy',
		bodyType: 'Sedan',
		seats: 5,
		fuel: 'Benzyna',
		power: '',
		capacity: '',
		yearFrom: new Date().getFullYear(),
		yearTo: '',
		drive: 'FWD',
		transmission: 'Manualna',
		trunkSize: '',
		consumption: '',
		maintenanceCost: 5,
		comfort: 5,
		price: '',
		safety: 5,
		reliability: 5,
		acceleration: '',
	}
	const [newCar, setNewCar] = useState(initialNewCar)

	const showNotice = (type, text) => {
		setUiNotice({ type, text })
		if (type === 'success') {
			setTimeout(() => setUiNotice(prev => (prev?.text === text ? null : prev)), 4000)
		}
	}

	const handleChange = e => setNewCar(prev => ({ ...prev, [e.target.name]: e.target.value }))

	const handleSubmit = async e => {
		e.preventDefault()

		const yearFrom = Number(newCar.yearFrom)
		const yearTo = newCar.yearTo !== '' && newCar.yearTo !== null ? Number(newCar.yearTo) : null

		if (yearTo !== null && yearTo < yearFrom) {
			showNotice(
				'error',
				`Rok zakończenia produkcji (${yearTo}) nie może być wcześniejszy niż rok rozpoczęcia (${yearFrom}).`,
			)
			return
		}

		const carData = {
			...newCar,
			brand: newCar.brand.trim(),
			model: newCar.model.trim(),
			seats: Number(newCar.seats),
			power: Number(newCar.power),
			capacity: Number(newCar.capacity),
			yearFrom,
			yearTo,
			trunkSize: Number(newCar.trunkSize),
			consumption: Number(newCar.consumption),
			maintenanceCost: Number(newCar.maintenanceCost),
			comfort: Number(newCar.comfort),
			price: Number(newCar.price),
			safety: Number(newCar.safety),
			reliability: Number(newCar.reliability),
			acceleration: Number(newCar.acceleration),
		}

		setIsBusy(true)
		try {
			if (editingId) {
				const updatedCar = { ...carData, id: editingId }
				await updateCarInDB(updatedCar)
				setCars(prev => prev.map(c => (c.id === editingId ? updatedCar : c)))
				showNotice('success', `Zaktualizowano pojazd: ${carData.brand} ${carData.model}`)
			} else {
				const newId = await addCarToDB(carData)
				setCars(prev => [{ ...carData, id: newId }, ...prev])
				showNotice('success', `Dodano pojazd: ${carData.brand} ${carData.model}`)
				setCurrentPage(1)
			}

			setNewCar(initialNewCar)
			setEditingId(null)
		} catch (err) {
			showNotice('error', `Nie udało się zapisać pojazdu w bazie: ${err?.message || 'błąd IndexedDB'}`)
		} finally {
			setIsBusy(false)
		}
	}

	const handleEditClick = car => {
		setNewCar({ ...car, yearTo: car.yearTo ?? '' })
		setEditingId(car.id)
		setUiNotice(null)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleCancelEdit = () => {
		setNewCar(initialNewCar)
		setEditingId(null)
		setUiNotice(null)
	}

	const handleDelete = async id => {
		if (!window.confirm('Czy na pewno chcesz usunąć ten pojazd z bazy?')) return

		setIsBusy(true)
		try {
			await deleteCarFromDB(id)
			setCars(prev => {
				const updatedList = prev.filter(c => c.id !== id)
				const newTotalPages = Math.ceil(updatedList.length / ITEMS_PER_PAGE) || 1
				if (currentPage > newTotalPages) setCurrentPage(newTotalPages)
				return updatedList
			})
			showNotice('success', 'Usunięto pojazd z bazy.')
		} catch (err) {
			showNotice('error', `Nie udało się usunąć pojazdu: ${err?.message || 'błąd IndexedDB'}`)
		} finally {
			setIsBusy(false)
		}
	}

	const handleResetDefaults = async () => {
		if (
			!window.confirm(
				'Czy na pewno chcesz przywrócić domyślną bazę pojazdów z pliku cars.json? Wszystkie własne zmiany zostaną nadpisane.',
			)
		) {
			return
		}

		setIsBusy(true)
		try {
			const freshCars = await resetDBToDefault()
			setCars(freshCars)
			setCurrentPage(1)
			setEditingId(null)
			setNewCar(initialNewCar)
			showNotice('success', `Przywrócono domyślną bazę danych (${freshCars.length} pojazdów).`)
		} catch (err) {
			showNotice('error', `Nie udało się przywrócić bazy domyślnej: ${err?.message || 'błąd pobierania'}`)
		} finally {
			setIsBusy(false)
		}
	}

	const handleExportJson = () => {
		try {
			const blob = new Blob([JSON.stringify(cars, null, 2)], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `autoexpert-baza-${new Date().toISOString().slice(0, 10)}.json`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
			showNotice('success', `Wyeksportowano ${cars.length} pojazdów do pliku JSON.`)
		} catch (err) {
			showNotice('error', `Błąd podczas eksportu JSON: ${err?.message || 'nieznany błąd'}`)
		}
	}

	const handleImportJson = async e => {
		const file = e.target.files?.[0]
		e.target.value = ''
		if (!file) return

		setIsBusy(true)
		try {
			const text = await file.text()
			const parsed = JSON.parse(text)

			if (!Array.isArray(parsed) || parsed.length === 0) {
				throw new Error('Plik musi zawierać niepustą tablicę pojazdów JSON.')
			}

			const isValid = parsed.every(
				item => item && typeof item === 'object' && REQUIRED_IMPORT_FIELDS.every(field => field in item),
			)
			if (!isValid) {
				throw new Error(`Każdy rekord musi posiadać wymagane pola: ${REQUIRED_IMPORT_FIELDS.join(', ')}.`)
			}

			const hasInvalidYears = parsed.some(
				item => item.yearTo !== null && item.yearTo !== undefined && Number(item.yearTo) < Number(item.yearFrom),
			)
			if (hasInvalidYears) {
				throw new Error(
					'Import przerwany: co najmniej jeden rekord ma rok zakończenia produkcji wcześniejszy niż rok rozpoczęcia.',
				)
			}

			const savedCars = await replaceAllCarsInDB(parsed)
			setCars(savedCars)
			setCurrentPage(1)
			setEditingId(null)
			setNewCar(initialNewCar)
			showNotice('success', `Zaimportowano ${savedCars.length} pojazdów do lokalnej bazy danych.`)
		} catch (err) {
			showNotice('error', `Błąd importu JSON: ${err?.message || 'nieprawidłowy plik'}`)
		} finally {
			setIsBusy(false)
		}
	}

	const totalPages = Math.ceil(cars.length / ITEMS_PER_PAGE) || 1
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
	const currentCars = cars.slice(startIndex, startIndex + ITEMS_PER_PAGE)

	const handleNextPage = () => {
		if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
	}
	const handlePrevPage = () => {
		if (currentPage > 1) setCurrentPage(prev => prev - 1)
	}

	return (
		<div className='space-y-6'>
			{uiNotice && (
				<div
					role={uiNotice.type === 'error' ? 'alert' : 'status'}
					className={`p-4 rounded-xl font-bold shadow-sm flex justify-between items-center gap-3 ${
						uiNotice.type === 'error'
							? 'bg-red-50 text-red-700 border border-red-200'
							: 'bg-emerald-100 text-emerald-700'
					}`}>
					<span>{uiNotice.text}</span>
					<button
						type='button'
						onClick={() => setUiNotice(null)}
						className='text-xs underline opacity-75 hover:opacity-100 shrink-0'>
						Zamknij
					</button>
				</div>
			)}

			<div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-200'>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4'>
					<h3 className='text-xl font-bold text-slate-800'>{editingId ? 'Edytuj pojazd' : 'Dodaj pojazd'}</h3>
					<div className='flex flex-wrap gap-2'>
						<button
							type='button'
							disabled={isBusy}
							onClick={handleExportJson}
							className='bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50'>
							Eksportuj JSON
						</button>
						<button
							type='button'
							disabled={isBusy}
							onClick={() => fileInputRef.current?.click()}
							className='bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50'>
							Importuj JSON
						</button>
						<input
							ref={fileInputRef}
							type='file'
							accept='application/json,.json'
							onChange={handleImportJson}
							className='hidden'
							aria-label='Importuj plik JSON'
						/>
						<button
							type='button'
							disabled={isBusy}
							onClick={handleResetDefaults}
							className='bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50'>
							Przywróć dane domyślne
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<h4 className='text-sm font-bold text-blue-600 uppercase tracking-wider mb-4'>1. Dane podstawowe</h4>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100'>
						<FormInput required label='Marka pojazdu' name='brand' value={newCar.brand} onChange={handleChange} />
						<FormInput required label='Model pojazdu' name='model' value={newCar.model} onChange={handleChange} />
						<FormInput
							required
							label='Cena bazowa (PLN)'
							type='number'
							min='0'
							name='price'
							value={newCar.price}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Produkcja Od'
							type='number'
							min='1950'
							name='yearFrom'
							value={newCar.yearFrom}
							onChange={handleChange}
						/>
						<FormInput
							label='Produkcja Do'
							type='number'
							min={newCar.yearFrom || 1950}
							name='yearTo'
							value={newCar.yearTo || ''}
							onChange={handleChange}
						/>
						<FormSelect
							label='Stan domyślny'
							name='condition'
							options={CONDITIONS}
							value={newCar.condition}
							onChange={handleChange}
						/>
						<FormSelect
							label='Nadwozie'
							name='bodyType'
							options={BODY_TYPES}
							value={newCar.bodyType}
							onChange={handleChange}
						/>
						<FormSelect label='Paliwo' name='fuel' options={FUELS} value={newCar.fuel} onChange={handleChange} />
						<FormSelect
							label='Skrzynia biegów'
							name='transmission'
							options={TRANSMISSIONS}
							value={newCar.transmission}
							onChange={handleChange}
						/>
						<FormSelect label='Napęd' name='drive' options={DRIVES} value={newCar.drive} onChange={handleChange} />
						<FormInput
							required
							label='Miejsca'
							type='number'
							min='1'
							name='seats'
							value={newCar.seats}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Pojemność (L)'
							type='number'
							step='0.1'
							min='0'
							name='capacity'
							value={newCar.capacity}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Moc silnika (KM)'
							type='number'
							min='0'
							name='power'
							value={newCar.power}
							onChange={handleChange}
						/>
					</div>

					<h4 className='text-sm font-bold text-blue-600 uppercase tracking-wider mb-4'>2. Pomiary TOPSIS</h4>
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100'>
						<FormInput
							required
							label='Przyspieszenie (s)'
							type='number'
							step='0.1'
							min='0'
							name='acceleration'
							value={newCar.acceleration}
							onChange={handleChange}
						/>
						<FormInput
							required
							label={`Zużycie (${getConsumptionUnit(newCar.fuel)})`}
							type='number'
							step='0.1'
							min='0'
							name='consumption'
							value={newCar.consumption}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Bagażnik (L)'
							type='number'
							min='0'
							name='trunkSize'
							value={newCar.trunkSize}
							onChange={handleChange}
						/>
					</div>

					<h4 className='text-sm font-bold text-blue-600 uppercase tracking-wider mb-4'>3. Oceny eksperckie</h4>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100'>
						<FormInput
							required
							label='Niezawodność (1-10)'
							type='number'
							min='1'
							max='10'
							name='reliability'
							value={newCar.reliability}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Bezpieczeństwo (1-10)'
							type='number'
							min='1'
							max='10'
							name='safety'
							value={newCar.safety}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Komfort (1-10)'
							type='number'
							min='1'
							max='10'
							name='comfort'
							value={newCar.comfort}
							onChange={handleChange}
						/>
						<FormInput
							required
							label='Koszty napraw (10=Najdroższe)'
							type='number'
							min='1'
							max='10'
							name='maintenanceCost'
							value={newCar.maintenanceCost}
							onChange={handleChange}
						/>
					</div>

					<div className='flex flex-col md:flex-row gap-4'>
						<button
							type='submit'
							disabled={isBusy}
							className='flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition shadow-md disabled:opacity-50'>
							{editingId ? 'Zapisz zmiany w bazie' : '+ Dodaj nowy pojazd'}
						</button>
						{editingId && (
							<button
								type='button'
								onClick={handleCancelEdit}
								className='bg-red-50 text-red-600 border border-red-200 px-8 font-bold py-3 rounded-xl hover:bg-red-100 transition'>
								Anuluj
							</button>
						)}
					</div>
				</form>
			</div>

			<div className='bg-white rounded-3xl shadow-sm border p-4'>
				<h3 className='text-lg font-bold mb-4 px-2'>Baza wiedzy ({cars.length} pojazdów)</h3>
				<div className='overflow-x-auto max-h-[600px] overflow-y-auto mb-4'>
					<table className='w-full text-left text-sm whitespace-nowrap'>
						<thead className='sticky top-0 bg-slate-100 z-10'>
							<tr className='border-b text-slate-500'>
								<th className='p-3 font-semibold rounded-tl-xl'>Auto</th>
								<th className='p-3 font-semibold'>Cena rynkowa</th>
								<th className='p-3 font-semibold'>Specyfikacja</th>
								<th className='p-3 font-semibold text-right rounded-tr-xl'>Akcje</th>
							</tr>
						</thead>
						<tbody>
							{currentCars.map(c => (
								<tr key={c.id} className='border-b hover:bg-slate-50 transition-colors'>
									<td className='p-3'>
										<div className='font-bold text-slate-800'>
											{c.brand} {c.model}
										</div>
										<div className='text-xs text-slate-500'>
											{renderYear(c)} • {c.bodyType} • {c.condition} • {c.seats} os.
										</div>
									</td>
									<td className='p-3 font-bold text-emerald-600'>{formatPrice(c.price)}</td>
									<td className='p-3 text-xs text-slate-500'>
										<div>
											Paliwo: {c.fuel} ({c.consumption} {getConsumptionUnit(c.fuel)})
										</div>
										<div>Bagażnik: {c.trunkSize} L</div>
									</td>
									<td className='p-3 text-right'>
										<button
											type='button'
											onClick={() => handleEditClick(c)}
											className='text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg mr-2 font-medium transition'>
											Edytuj
										</button>
										<button
											type='button'
											disabled={isBusy}
											onClick={() => handleDelete(c.id)}
											className='text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50'>
											Usuń
										</button>
									</td>
								</tr>
							))}
							{currentCars.length === 0 && (
								<tr>
									<td colSpan='4' className='p-8 text-center text-slate-500'>
										Brak pojazdów do wyświetlenia na tej stronie.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{totalPages > 1 && (
					<div className='flex flex-col sm:flex-row justify-between items-center px-4 py-2 border-t border-slate-100 mt-2 gap-4'>
						<span className='text-sm font-medium text-slate-500'>
							Strona <span className='text-slate-800 font-bold'>{currentPage}</span> z{' '}
							<span className='text-slate-800 font-bold'>{totalPages}</span>
						</span>
						<div className='flex gap-2'>
							<button
								type='button'
								onClick={handlePrevPage}
								disabled={currentPage === 1}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm'}`}>
								Poprzednia
							</button>
							<button
								type='button'
								onClick={handleNextPage}
								disabled={currentPage === totalPages}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm'}`}>
								Następna
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
