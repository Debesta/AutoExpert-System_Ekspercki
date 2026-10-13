// --- 1. Funkcja wizualna ---
// Zwraca odpowiedni tekst i kolor dla wybranej wagi w skali 1-10 (dla UI)
export const getWeightLabel = value => {
	if (value <= 2) return { text: 'Znikome znaczenie', color: 'bg-gray-100 text-gray-600' }
	if (value <= 4) return { text: 'Mało ważne', color: 'bg-blue-50 text-blue-700' }
	if (value <= 6) return { text: 'Średnio ważne', color: 'bg-yellow-50 text-yellow-700' }
	if (value <= 8) return { text: 'Ważne', color: 'bg-orange-50 text-orange-700' }
	return { text: 'Priorytet kluczowy', color: 'bg-red-50 text-red-700' }
}

// --- 2. Funkcja matematyczna ---
// Przelicza wagi z suwaków (np. 5, 8, 2) na ułamki, których suma wynosi 1 (np. 0.33, 0.53, 0.13)
// Jest to konieczne dla poprawnego działania wzorów matematycznych metody TOPSIS
export const normalizeWeights = rawWeights => {
	// Obliczenie sumy wszystkich przypisanych wag
	const totalSum = Object.values(rawWeights).reduce((sum, val) => sum + val, 0)

	// Zabezpieczenie przed dzieleniem przez zero (jeśli wszystko byłoby na 0)
	if (totalSum === 0) return rawWeights

	// Transformacja obiektu - każda waga dzielona jest przez sumę całkowitą
	return Object.keys(rawWeights).reduce((acc, key) => {
		// toFixed(4) zaokrągla, a Number() zamienia z powrotem na liczbę zmiennoprzecinkową
		acc[key] = Number((rawWeights[key] / totalSum).toFixed(4))
		return acc
	}, {})
}
