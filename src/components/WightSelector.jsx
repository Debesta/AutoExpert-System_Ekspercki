import React, { useState, useEffect } from 'react'
// Import funkcji pomocniczych do obsługi etykiet i normalizacji wag (np. sprowadzania ich do sumy równej 1)
import { getWeightLabel, normalizeWeights } from '../utils/topsisUtils'

// Domyślna lista kryteriów branych pod uwagę w algorytmie TOPSIS
const DEFAULT_CRITERIA = [
	{ key: 'price', label: 'Cena' },
	{ key: 'year', label: 'Rocznik' },
	{ key: 'mileage', label: 'Przebieg' },
	{ key: 'power', label: 'Moc silnika (KM)' },
	{ key: 'fuelConsumption', label: 'Spalanie (l/100km)' },
]

export default function WeightSelector({ criteria = DEFAULT_CRITERIA, onWeightsChange }) {
	// Inicjalizacja stanu wag: dla każdego kryterium ustawiamy domyślnie wartość 5 (środek skali 1-10).
	// Użyto funkcji strzałkowej, aby reduce wykonało się tylko raz przy montowaniu komponentu (tzw. lazy initialization).
	const [rawWeights, setRawWeights] = useState(() => criteria.reduce((acc, item) => ({ ...acc, [item.key]: 5 }), {}))

	// Efekt uboczny: za każdym razem, gdy użytkownik zmieni wagi na suwaku,
	// normalizujemy je i przekazujemy wyżej (do komponentu rodzica) za pomocą callbacku.
	useEffect(() => {
		if (onWeightsChange) {
			onWeightsChange(normalizeWeights(rawWeights))
		}
	}, [rawWeights, onWeightsChange])

	// Handler aktualizujący stan konkretnego kryterium po ruszeniu suwakiem
	const handleSliderChange = (key, value) => {
		setRawWeights(prev => ({
			...prev,
			[key]: Number(value), // Zapewnienie, że wartość z suwaka jest liczbą, a nie stringiem
		}))
	}

	return (
		<div className='w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200'>
			{/* Nagłówek sekcji */}
			<div className='flex justify-between items-center mb-6 border-b pb-3'>
				<h3 className='text-lg font-bold text-gray-800'>Wagi kryteriów porównawczych</h3>
				<span className='text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md'>Skala 1 – 10</span>
			</div>

			<div className='space-y-6'>
				{/* Iteracja po wszystkich kryteriach w celu wygenerowania suwaków */}
				{criteria.map(({ key, label }) => {
					const val = rawWeights[key] ?? 5 // Zabezpieczenie: jeśli wagi brakuje, przypisz 5
					const { text, color } = getWeightLabel(val) // Pobranie dynamicznej etykiety słownej i jej koloru

					return (
						<div key={key} className='flex flex-col space-y-2'>
							{/* Etykiety nad suwakiem: Nazwa kryterium, słowna waga i wartość liczbowa */}
							<div className='flex justify-between items-center'>
								<span className='font-medium text-gray-700 text-sm'>{label}</span>
								<div className='flex items-center space-x-2'>
									<span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>{text}</span>
									<span className='font-bold text-gray-900 w-6 text-right text-sm'>{val}</span>
								</div>
							</div>

							{/* Właściwy suwak (input range) w skali 1-10 */}
							<input
								type='range'
								min={1}
								max={10}
								step={1}
								value={val}
								onChange={e => handleSliderChange(key, e.target.value)}
								className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none'
							/>
							{/* Wskaźniki pomocnicze pod suwakiem */}
							<div className='flex justify-between text-[10px] text-gray-400 px-0.5'>
								<span>1 (Min)</span>
								<span>5 (Średnio)</span>
								<span>10 (Max)</span>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
