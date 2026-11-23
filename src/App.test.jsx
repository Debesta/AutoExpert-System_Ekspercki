import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { getAllCars } from './db'

vi.mock('./db', () => ({
	getAllCars: vi.fn(),
	addCarToDB: vi.fn(),
	updateCarInDB: vi.fn(),
	deleteCarFromDB: vi.fn(),
	resetDBToDefault: vi.fn(),
	replaceAllCarsInDB: vi.fn(),
}))

const mockCars = [
	{
		id: 1,
		brand: 'Toyota',
		model: 'Corolla (1.8 Hybrid)',
		condition: 'Nowy',
		bodyType: 'Kombi',
		seats: 5,
		fuel: 'Hybryda',
		power: 140,
		capacity: 1.8,
		yearFrom: 2024,
		yearTo: null,
		drive: 'FWD',
		transmission: 'Automatyczna',
		trunkSize: 596,
		consumption: 4.6,
		maintenanceCost: 4,
		comfort: 7,
		price: 134900,
		safety: 9,
		reliability: 10,
		acceleration: 9.2,
	},
	{
		id: 2,
		brand: 'BYD',
		model: 'Seal (EV 313 KM)',
		condition: 'Nowy',
		bodyType: 'Sedan',
		seats: 5,
		fuel: 'Elektryk',
		power: 313,
		capacity: 0,
		yearFrom: 2024,
		yearTo: null,
		drive: 'RWD',
		transmission: 'Automatyczna',
		trunkSize: 400,
		consumption: 16.6,
		maintenanceCost: 5,
		comfort: 9,
		price: 207000,
		safety: 10,
		reliability: 8,
		acceleration: 5.9,
	},
]

describe('Komponent App (testy integracyjne)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('ładuje bazę, uruchamia ranking TOPSIS i wyświetla wynik wraz z modułem XAI', async () => {
		getAllCars.mockResolvedValueOnce(mockCars)
		render(<App />)

		expect(await screen.findByText(/AutoExpert/i)).toBeInTheDocument()
		expect(screen.getByText(/System gotowy \(2 aut w bazie\)/i)).toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: /Przelicz/i }))

		const scoreLabels = await screen.findAllByText(/Indeks w tym zestawie:/i)
		expect(scoreLabels).toHaveLength(2)
		expect(screen.getAllByText(/Co zadecydowało o wyniku\?/i)).toHaveLength(2)
		expect(screen.getByText(/kWh\/100km/i)).toBeInTheDocument()
	})

	it('pozwala przełączyć widok na leniwie ładowany Panel Admina', async () => {
		getAllCars.mockResolvedValueOnce(mockCars)
		render(<App />)

		fireEvent.click(await screen.findByRole('button', { name: /Panel Admina \(2\)/i }))
		expect(await screen.findByRole('button', { name: /Przywróć dane domyślne/i })).toBeInTheDocument()
	})

	it('wyświetla baner błędu przy problemie z bazą i pozwala ponowić próbę', async () => {
		getAllCars.mockRejectedValueOnce(new Error('IndexedDB zablokowane')).mockResolvedValueOnce(mockCars)
		render(<App />)

		expect(await screen.findByRole('alert')).toHaveTextContent(/IndexedDB zablokowane/i)

		fireEvent.click(screen.getByRole('button', { name: /Spróbuj ponownie/i }))
		expect(await screen.findByText(/System gotowy \(2 aut w bazie\)/i)).toBeInTheDocument()
	})
})
