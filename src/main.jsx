import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Globalne style Tailwind CSS
import App from './App.jsx'

// Znalezienie głównego kontenera w pliku index.html i wyrenderowanie w nim aplikacji
createRoot(document.getElementById('root')).render(
	// StrictMode podwójnie renderuje komponenty w trybie deweloperskim, aby wykryć potencjalne błędy i skutki uboczne
	<StrictMode>
		<App />
	</StrictMode>,
)
