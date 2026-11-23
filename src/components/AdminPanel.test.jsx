import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPanel from './AdminPanel'
import { addCarToDB, updateCarInDB, deleteCarFromDB, resetDBToDefault } from '../db'

vi.mock('../db', () => ({
	addCarToDB: vi.fn(),
	updateCarInDB: vi.fn(),
	deleteCarFromDB: vi.fn(),
	resetDBToDefault: vi.fn(),
	replaceAllCarsInDB: vi.fn(),
}))

const sampleCars = [
	{
		id: 1,
		brand: 'Skoda',
		model: 'Octavia IV (1.5 TSI)',
		condition: 'Nowy',
		bodyType: 'Liftback',
		seats: 5,
		fuel: 'Benzyna',
		power: 150,
		capacity: 1.5,
		yearFrom: 2024,
		yearTo: null,
		drive: 'FWD',
		transmission: 'Manualna',
		trunkSize: 600,
		consumption: 5.4,
		maintenanceCost: 4,
		comfort: 7,
		price: 127900,
		safety: 9,
		reliability: 8,
		acceleration: 8.5,
	},
]

describe('Komponent AdminPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('blokuje zapis i wyświetla alert, gdy rok zakończenia produkcji < roku rozpoczęcia', async () => {
		const setCars = vi.fn()
		const { container } = render(<AdminPanel cars={sampleCars} setCars={setCars} />)

		fireEvent.change(screen.getByLabelText(/Marka pojazdu/i), { target: { value: 'Toyota' } })
		fireEvent.change(screen.getByLabelText(/Model pojazdu/i), { target: { value: 'Corolla' } })
		fireEvent.change(screen.getByLabelText(/Cena bazowa/i), { target: { value: '120000' } })
		fireEvent.change(screen.getByLabelText(/Produkcja Od/i), { target: { value: '2024' } })
		fireEvent.change(screen.getByLabelText(/Produkcja Do/i), { target: { value: '2020' } })
		fireEvent.change(screen.getByLabelText(/Pojemność/i), { target: { value: '1.8' } })
		fireEvent.change(screen.getByLabelText(/Moc silnika/i), { target: { value: '140' } })
		fireEvent.change(screen.getByLabelText(/Przyspieszenie/i), { target: { value: '9.2' } })
		fireEvent.change(screen.getByLabelText(/Zużycie/i), { target: { value: '4.6' } })
		fireEvent.change(screen.getByLabelText(/Bagażnik/i), { target: { value: '596' } })

		fireEvent.submit(container.querySelector('form'))

		expect(await screen.findByRole('alert')).toHaveTextContent(/nie może być wcześniejszy/i)
		expect(addCarToDB).not.toHaveBeenCalled()
	})

	it('dodaje nowy pojazd do bazy i wyświetla komunikat sukcesu', async () => {
		addCarToDB.mockResolvedValueOnce(42)
		const setCars = vi.fn()

		const { container } = render(<AdminPanel cars={sampleCars} setCars={setCars} />)

		fireEvent.change(screen.getByLabelText(/Marka pojazdu/i), { target: { value: 'BYD' } })
		fireEvent.change(screen.getByLabelText(/Model pojazdu/i), { target: { value: 'Seal' } })
		fireEvent.change(screen.getByLabelText(/Cena bazowa/i), { target: { value: '207000' } })
		fireEvent.change(screen.getByLabelText(/Produkcja Od/i), { target: { value: '2024' } })
		fireEvent.change(screen.getByLabelText(/Pojemność/i), { target: { value: '0' } })
		fireEvent.change(screen.getByLabelText(/Moc silnika/i), { target: { value: '313' } })
		fireEvent.change(screen.getByLabelText(/Przyspieszenie/i), { target: { value: '5.9' } })
		fireEvent.change(screen.getByLabelText(/Zużycie/i), { target: { value: '16.6' } })
		fireEvent.change(screen.getByLabelText(/Bagażnik/i), { target: { value: '400' } })

		fireEvent.submit(container.querySelector('form'))

		await waitFor(() => {
			expect(addCarToDB).toHaveBeenCalledWith(
				expect.objectContaining({
					brand: 'BYD',
					model: 'Seal',
					price: 207000,
				}),
			)
		})
		expect(setCars).toHaveBeenCalledTimes(1)
		expect(await screen.findByRole('status')).toHaveTextContent(/Dodano pojazd: BYD Seal/i)
	})

	it('edytuje i usuwa istniejący pojazd oraz przywraca bazę domyślną', async () => {
		updateCarInDB.mockResolvedValueOnce()
		deleteCarFromDB.mockResolvedValueOnce()
		vi.spyOn(window, 'confirm').mockReturnValue(true)

		const setCars = vi.fn()
		const { container } = render(<AdminPanel cars={sampleCars} setCars={setCars} />)

		// Edycja
		fireEvent.click(screen.getByRole('button', { name: /Edytuj/i }))
		fireEvent.change(screen.getByLabelText(/Cena bazowa/i), { target: { value: '130000' } })
		fireEvent.submit(container.querySelector('form'))

		await waitFor(() => {
			expect(updateCarInDB).toHaveBeenCalledWith(expect.objectContaining({ id: 1, price: 130000 }))
		})

		// Usuwanie
		fireEvent.click(screen.getByRole('button', { name: /Usuń/i }))
		await waitFor(() => {
			expect(deleteCarFromDB).toHaveBeenCalledWith(1)
		})

		// Przywracanie bazy domyślnej
		resetDBToDefault.mockResolvedValueOnce(sampleCars)
		fireEvent.click(screen.getByRole('button', { name: /Przywróć dane domyślne/i }))
		await waitFor(() => {
			expect(resetDBToDefault).toHaveBeenCalledTimes(1)
		})
	})

	it('wyświetla komunikat błędu UI, gdy zapis do IndexedDB zawiedzie', async () => {
		addCarToDB.mockRejectedValueOnce(new Error('QuotaExceededError'))
		const setCars = vi.fn()
		const { container } = render(<AdminPanel cars={sampleCars} setCars={setCars} />)

		fireEvent.change(screen.getByLabelText(/Marka pojazdu/i), { target: { value: 'MG' } })
		fireEvent.change(screen.getByLabelText(/Model pojazdu/i), { target: { value: '4' } })
		fireEvent.change(screen.getByLabelText(/Cena bazowa/i), { target: { value: '125000' } })
		fireEvent.change(screen.getByLabelText(/Produkcja Od/i), { target: { value: '2024' } })
		fireEvent.change(screen.getByLabelText(/Pojemność/i), { target: { value: '0' } })
		fireEvent.change(screen.getByLabelText(/Moc silnika/i), { target: { value: '170' } })
		fireEvent.change(screen.getByLabelText(/Przyspieszenie/i), { target: { value: '7.7' } })
		fireEvent.change(screen.getByLabelText(/Zużycie/i), { target: { value: '16.5' } })
		fireEvent.change(screen.getByLabelText(/Bagażnik/i), { target: { value: '363' } })

		fireEvent.submit(container.querySelector('form'))

		expect(await screen.findByRole('alert')).toHaveTextContent(/QuotaExceededError/i)
	})
})
