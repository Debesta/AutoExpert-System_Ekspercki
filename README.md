# AutoExpert — System Wspomagania Decyzji (TOPSIS + XAI)

Projekt inżynierski stanowiący hybrydowy system wspomagania decyzji (DSS) służący do wielokryterialnego doboru samochodów osobowych. Aplikacja łączy twardą filtrację wymagań brzegowych z metodą **TOPSIS** (_Technique for Order of Preference by Similarity to Ideal Solution_) oraz modułem wyjaśnialności **XAI** (_Explainable AI_), który dekomponuje wpływ poszczególnych kryteriów na wynik końcowy.

## Wersja live (Demo)

Aplikacja online: [Uruchom AutoExpert](https://autoexpert-systemekspercki.netlify.app)

---

## Główne funkcjonalności

- **Dwuetapowy dobór pojazdu:** twarde filtry brzegowe (stan, nadwozie w tym Coupe i Liftback, paliwo, skrzynia, napęd, minimalna liczba miejsc, moc, maksymalny budżet oraz nakładanie się okresów produkcji) + wielokryterialny ranking TOPSIS.
- **Ujednolicone kryterium kosztów jazdy (PLN / 100 km):** porównywanie pojazdów spalinowych, hybrydowych, LPG i elektrycznych w jednej, wspólnej jednostce finansowej zamiast mieszania `l/100km` i `kWh/100km`.
- **Wyłączanie kryteriów:** suwaki wag w skali `0–10` pozwalają całkowicie wyłączyć dowolne kryterium (`0`), z bezpieczną obsługą przypadku brzegowego (wszystkie wagi równe `0` → wagi równe).
- **Moduł XAI (dekompozycja decyzji):** dwukierunkowy wykres słupkowy przy każdej karcie pojazdu prezentujący wkład kryteriów w odległości $d^+$ i $d^-$, uzupełniony o leniwie ładowany wykres radarowy profilu technicznego TOP 3.
- **Lokalna baza wiedzy (IndexedDB) + Panel Administratora:** 1000 unikalnych konfiguracji pojazdów, operacje CRUD z walidacją (`yearTo >= yearFrom`) i paginacją, eksport/import JSON oraz przycisk przywracania bazy domyślnej.
- **Raport do druku / PDF:** dedykowany widok wydruku (`@media print`) obejmujący analizę TOP 3 pojazdów.

---

## Metodologia

### 1. Algorytm TOPSIS

Dla zbioru $m$ pojazdów spełniających filtry brzegowe oraz $n = 8$ kryteriów decyzyjnych (`src/constants.js`, `src/topsis.js`):

1. **Normalizacja wag:** surowe wagi użytkownika z zakresu $[0, 10]$ są normalizowane w jednym miejscu (`normalizeWeights` w `src/topsis.js`), tak aby $\sum_{j=1}^{n} w_j = 1$.
2. **Normalizacja wektorowa (euklidesowa):**
   $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^{m} x_{kj}^2}}$$
3. **Macierz ważona:** $v_{ij} = w_j \cdot r_{ij}$.
4. **Rozwiązanie idealne ($v^+$) i antyidealne ($v^-$):** wyznaczane osobno dla kryteriów zysku (`benefit: true`: bezpieczeństwo, niezawodność, bagażnik, komfort) oraz kosztu (`benefit: false`: cena, koszt jazdy na 100 km, przyspieszenie 0–100 km/h, koszty serwisu).
5. **Odległości euklidesowe i indeks dopasowania:**
   $$d_i^+ = \sqrt{\sum_{j=1}^{n}(v_{ij} - v_j^+)^2}, \qquad d_i^- = \sqrt{\sum_{j=1}^{n}(v_{ij} - v_j^-)^2}, \qquad C_i = \frac{d_i^-}{d_i^+ + d_i^-}$$

Wskaźnik $C_i \in [0, 1]$ (prezentowany jako _„Indeks w tym zestawie: 0–100”_) ma charakter **względny** — określa pozycję pojazdu wyłącznie względem aktualnie przefiltrowanego podzbioru aut.

### 2. Sprowadzenie zużycia energii do wspólnej jednostki

Aby uniknąć porównywania niejednorodnych jednostek (`l/100km` vs `kWh/100km`), kryterium ekonomii jazdy przeliczane jest na szacunkowy koszt przejechania 100 km w PLN (`calculateEnergyCostPer100km` w `src/constants.js`) według referencyjnych stawek rynkowych:

- Benzyna / Hybryda: `6,20 zł/l`
- Diesel: `6,30 zł/l`
- LPG: `2,90 zł/l`
- Elektryk (EV): `1,15 zł/kWh` (uśredniony koszt ładowania domowego i publicznego)

### 3. Wyjaśnialność (XAI)

Dla każdego pojazdu algorytm zwraca dekompozycję wkładu poszczególnych kryteriów w kwadraty odległości od ideału $\delta_{ij}^+ = (v_{ij} - v_j^+)^2$ i antyideału $\delta_{ij}^- = (v_{ij} - v_j^-)^2$. Wypadkowy wpływ kryterium obliczany jest jako:
$$S_{ij} = \frac{\delta_{ij}^- - \delta_{ij}^+}{(d_i^-)^2 + (d_i^+)^2} \cdot 100 \in [-100, +100]$$
Wartości dodatnie oznaczają kryteria działające na korzyść pojazdu (atuty zbliżające do ideału), wartości ujemne wskazują główne źródła straty, a kryteria wyłączone ($w_j = 0$) otrzymują wkład dokładnie `0`. Wykres radarowy pełni rolę pomocniczą i obrazuje przeskalowany profil techniczny aut TOP 3.

---

## Pochodzenie i struktura danych (`public/cars.json`)

> **Uwaga dotycząca danych:** Zbiór danych ma charakter **syntetyczno-katalogowy** przygotowany na potrzeby projektu inżynierskiego. Nie jest połączony w czasie rzeczywistym z zewnętrznymi portalami ogłoszeniowymi ani API producentów.

- **Liczebność i unikalność:** `1000` unikalnych konfiguracji (para `marka + model/generacja/silnik`, `0` duplikatów) z `86` marek (w tym `28` marek chińskich obecnych lub debiutujących na rynku europejskim).
- **Rozdział stanu pojazdu:** `564` konfiguracje _Nowy_ (aktualne generacje salonowe `2024–2025`, `yearTo: null`) oraz `436` konfiguracji _Używany_ (starsze generacje z zamkniętym okresem produkcji `yearTo >= yearFrom`, roczniki `2010–2024`). Żadna konfiguracja nie dubluje się między stanami.
- **Różnorodność segmentów:** wszystkie typy nadwozi ze słownika (`SUV`: 492, `Hatchback`: 169, `Kombi`: 124, `Sedan`: 93, `Coupe`: 76, `Liftback`: 46) oraz liczby miejsc (`2`: 25, `4`: 92, `5`: 765, `7`: 118).
- **Parametry techniczne** (moc, pojemność, przyspieszenie, bagażnik, katalogowe/urealnione zużycie) opracowano na podstawie specyfikacji katalogowych i orientacyjnych przedziałów cenowych rynku polskiego.
- **Oceny eksperckie (skala 1–10)** przypisano deterministycznie w oparciu o:
  - _Bezpieczeństwo (`safety`):_ wyniki i rocznik procedury testowej Euro NCAP,
  - _Niezawodność (`reliability`):_ trendy awaryjności marek i jednostek napędowych wg raportów TÜV / ADAC (korelacja z ceną wynosi `-0.17`, co przeciwdziała automatycznemu faworyzowaniu segmentu premium),
  - _Komfort (`comfort`):_ klasa/segment nadwozia, wyciszenie i charakterystyka zawieszenia,
  - _Koszty serwisu (`maintenanceCost`):_ klasa cenowa części i złożoność układu napędowego.

---

## Ograniczenia modelu

1. **Skale porządkowe traktowane jak kardynalne:** oceny eksperckie `1–10` (komfort, bezpieczeństwo, niezawodność, koszty serwisu) mają w istocie charakter porządkowy, natomiast klasyczny TOPSIS wykonuje na nich operacje arytmetyczne (norma euklidesowa), zakładając równe odstępy między kolejnymi stopniami skali.
2. **Częściowa korelacja kryteriów:** w naturalny sposób na rynku motoryzacyjnym cena wykazuje dodatnią korelację z komfortem (`+0.54`), bezpieczeństwem (`+0.54`) oraz kosztami serwisu (`+0.68`). Choć niezawodność została odseparowana (`-0.17` względem ceny), jednoczesne przypisanie wysokich wag skorelowanym cechom może wzmacniać ich łączny wpływ na ranking.
3. **Względność wyniku i zjawisko odwrócenia rankingu (_rank reversal_):** wynik TOPSIS zależy od zbioru alternatyw, które przeszły filtry twarde — dodanie lub usunięcie pojazdu (bądź zmiana filtrów) zmienia normy wektorowe oraz punkty $v^+$ i $v^-$, co może zmieniać zarówno wartości indeksu, jak i kolejność zbliżonych aut.
4. **Statyczne ceny paliw i brak danych konkretnego egzemplarza:** przelicznik `PLN/100 km` bazuje na stałych stawkach referencyjnych w `constants.js`, a dla pojazdów używanych baza reprezentuje uśredniony profil generacji/silnika (bez przebiegu i historii konkretnego ogłoszenia).

---

## Architektura projektu

```text
src/
├── components/
│   ├── AdminPanel.jsx       # Panel CRUD (lazy), walidacja, eksport/import JSON, reset bazy
│   ├── ErrorBoundary.jsx    # Izolacja błędów renderowania sekcji wykresów
│   ├── FilterForm.jsx       # Formularz filtrów twardych i suwaków wag
│   ├── FormElements.jsx     # Dostępne (a11y) pola formularzy z useId()
│   ├── RadarSection.jsx     # Wykresy radarowe Recharts (lazy) + widok druku PDF
│   ├── ResultCard.jsx       # Karta rekomendacji pojazdu
│   ├── WeightSelector.jsx   # Suwak wagi kryterium (0–10)
│   └── XaiBreakdown.jsx     # Wykres słupkowy XAI (wkład kryteriów w d+ / d-)
├── hooks/
│   └── useRadarData.js      # Dynamiczne skalowanie danych dla wykresów radarowych
├── utils/
│   ├── filterCars.js        # Logika twardego filtrowania (z nakładaniem roczników)
│   └── formatters.jsx       # Formatowanie cen, roczników, kosztów serwisu i etykiet wag
├── constants.js             # Słowniki, stawki energii i deklaratywna definicja CRITERIA
├── db.js                    # Warstwa IndexedDB (współdzielone połączenie, seed, CRUD, reset)
├── topsis.js                # Rdzeń TOPSIS, normalizacja wag i obliczenia XAI
└── App.jsx                  # Główny widok aplikacji i zarządzanie stanem
```

**Technologie:** React 19, Vite, Tailwind CSS v4, Recharts (ładowany leniwie), IndexedDB, Vitest, React Testing Library, `fake-indexeddb`, ESLint.

---

## Uruchomienie i testy

Wymagany Node.js w wersji `20+`.

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie środowiska deweloperskiego
npm run dev

# 3. Uruchomienie testów automatycznych (5 plików, 22 testy)
npm run test:run

# 4. Weryfikacja jakości kodu (ESLint)
npm run lint

# 5. Budowanie wersji produkcyjnej
npm run build
```

## Licencja

Projekt udostępniany na licencji **MIT** — szczegóły w pliku [LICENSE](./LICENSE).
