import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// 1. Mockowanie biblioteki wykresów (Recharts)
beforeAll(() => {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
})

// 2. Mockowanie funkcji bazy danych (omijamy brak IndexedDB w JSDOM)
vi.mock('./db', () => ({
	// Udajemy, że baza połączona i zwraca na start pustą tablicę pojazdów
	getAllCars: vi.fn(() => Promise.resolve([])),
	addCarToDB: vi.fn(),
	updateCarInDB: vi.fn(),
	deleteCarFromDB: vi.fn(),
}))

describe('Komponent App', () => {
	// Test musi być asynchroniczny (async), bo czekamy na zniknięcie ekranu ładowania
	it('renderuje poprawnie nagłówek po załadowaniu danych', async () => {
		render(<App />)

		// findByText (zamiast getByText) czeka na pojawienie się elementu w DOM.
		// Używamy "AutoExpert" bez przyrostka AI, zgodnie z nową nazwą w aplikacji.
		expect(await screen.findByText(/AutoExpert/i)).toBeInTheDocument()
	})
})
