import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

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
		expect(screen.getByText(/AutoExpert AI/i)).toBeInTheDocument()
	})
})
