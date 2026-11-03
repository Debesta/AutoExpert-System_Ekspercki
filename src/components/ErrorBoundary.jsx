import React from 'react'

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error) {
		// Aktualizuje stan, aby następny render pokazał zastępcze UI.
		return { hasError: true, error }
	}

	componentDidCatch(error, errorInfo) {
		// Tutaj możesz wysłać błąd do zewnętrznego serwisu logowania
		console.error('Błąd przechwycony przez Error Boundary:', error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className='flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center text-slate-800'>
					<h2 className='text-2xl font-bold mb-4 text-red-600'>Wystąpił nieoczekiwany błąd</h2>
					<p className='mb-6'>Część aplikacji napotkała problem z renderowaniem danych.</p>
					<button
						onClick={() => window.location.reload()}
						className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'>
						Odśwież aplikację
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary
