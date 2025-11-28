# Summary
**Tytuł:** Koncepcja Aplikacji Finansowej B2B/UoP
**Streszczenie:** Projekt prostej aplikacji przeglądarkowej (PWA) opartej na lokalnej bazie danych, służącej do zarządzania budżetem domowym. System uwzględnia specyfikę rozliczeń B2B i UoP oraz kluczowy mechanizm przenoszenia niewykorzystanych oszczędności na kolejne miesiące.
**Kluczowe Wnioski:**
*   **Architektura PWA:** Aplikacja będzie działać w przeglądarce i korzystać z lokalnego pliku jako bazy danych, eliminując potrzebę przechowywania danych w chmurze.
*   **Obsługa Modeli Dochodowych:** System obsłuży wprowadzanie stałej kwoty netto dla UoP oraz elastyczne wyliczanie dochodu dla B2B (sumowanie faktur lub iloczyn stawki godzinowej i liczby godzin).
*   **Kalkulacja "Realnego Netto":** Dla B2B aplikacja automatycznie odejmie koszty stałe (np. ZUS) i podatek (np. ryczałt 12%), aby pokazać faktyczną kwotę dostępną do wydania.
*   **Zarządzanie Zobowiązaniami:** Przewidziano dedykowaną zakładkę dla wydatków stałych (leasingi, abonamenty) z możliwością ustawienia daty końcowej płatności.
*   **Mechanizm Rollover:** Najważniejszą funkcją jest automatyczne przenoszenie nadwyżki budżetowej z bieżącego miesiąca na kolejny, co pozwala na kumulowanie oszczędności.
**Zadania:**
*   `[ ] Zaprojektować strukturę lokalnej bazy danych dla aplikacji.`
*   `[ ] Zaimplementować logikę obliczania dochodu netto dla B2B (uwzględniając ZUS i podatek).`
*   `[ ] Stworzyć moduł do zarządzania wydatkami stałymi z datami końcowymi.`
*   `[ ] Opracować algorytm przenoszenia salda (nadwyżki budżetowej) na następne miesiące.`
**Sugerowane Tagi:**
`#AplikacjaFinansowa`, `#B2B`, `#UoP`, `#PWA`, `#BudżetDomowy`, `#Rollover