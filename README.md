# AutoExpert - System Wspomagania Decyzji (TOPSIS)

Projekt inżynierski stanowiący hybrydowy system decyzyjny służący do rekomendacji pojazdów na podstawie algorytmu TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution). Aplikacja uwzględnia zarówno "twarde" ograniczenia brzegowe (np. maksymalny budżet, liczba miejsc, rocznik), jak i oceny subiektywne użytkownika w skali 1-10.

## Wersja live (Demo)

🌍 Aplikacja jest dostępna online: [Uruchom AutoExpert](https://autoexpert-systemekspercki.netlify.app)

## Funkcjonalności

- **Algorytm TOPSIS:** Obliczenia na macierzach decyzyjnych wykorzystujące Euclidean Normalization dla maksymalnej precyzji obliczeń.
- **XAI (Explainable AI):** Wyjaśnianie wyników algorytmu na znormalizowanych wykresach radarowych.
- **Dynamiczna baza wiedzy:** Moduł administratora (CRUD) operujący na 1000 bazowych pojazdów w przeglądarce. Paginacja rekordów zapewnia optymalizację wyświetlania dużych zbiorów danych.
- **Inteligentne filtrowanie:** Zaawansowana filtracja roczników uwzględniająca nachodzenie okresów produkcji.

## Architektura i technologie

- **Frontend:** React (Vite) + Tailwind CSS v4
- **Wizualizacja:** Recharts
- **Baza danych (Klient):** IndexedDB (Lokalna, asynchroniczna baza wiedzy)
- **Testy:** Vitest + React Testing Library

## Uruchomienie lokalne

1. Instalacja zależności: `npm install`
2. Serwer developerski: `npm run dev`
3. Uruchomienie testów (Unit + UI): `npm run test`
