import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
}

Object.defineProperty(window, 'scrollTo', {
	value: vi.fn(),
	writable: true,
})
