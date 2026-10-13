import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Zmockowanie ResizeObserver, który jest wykorzystywany pod spodem przez bibliotekę Recharts.
// Niestety, w środowisku JSDOM (którego używa Vitest) to API nie występuje domyślnie,
// więc bez tego mocka testy rzucałyby wyjątek.
beforeAll(() => {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
})

describe('Komponent App', () => {
	it('renderuje poprawnie nagłówek', () => {
		render(<App />)
		// Użyto wyrażenia regularnego /AutoExpert AI/i (wielkość liter nie ma znaczenia)
		expect(screen.getByText(/AutoExpert AI/i)).toBeInTheDocument()
	})
})
