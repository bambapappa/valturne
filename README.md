# Valturné 🗳️

Ett partipolitiskt neutralt webb- och mobilanpassat strategispel inför riksdagsvalet 2026. Spelet är en fristående Single Page Application (SPA) som drivs av öppna data från granskningssajten [utlovat.se](https://utlovat.se).

Licensierat under [Apache-2.0](LICENSE).

---

## Spelkoncept & Mekanik

Spelaren axlar rollen som kampanjledare under de sista **30 dagarna** inför riksdagsvalet:

1. **Res mellan 5 regioner:** Norrland, Mellansverige, Stockholm, Västsverige och Sydsverige på en interaktiv Sverigekarta.
2. **Hantera kampanjens resurser:**
   - **Dagar kvar:** 30 turer/dagar fram till valdagen.
   - **Kampanjbudget:** SEK för resor, kampanjmöten och förankringsarbete.
   - **Förtroendekapital:** 0–100 % trovärdighet som påverkas av konsekvens och löftesdisciplin.
   - **Regionalt väljarstöd:** Dynamisk opinionsandel per region baserad på prioriteringar.
3. **Fatta strategiska beslut vid sakfrågedilemman:**
   - *Alternativ A: Ge ett skarpt vallöfte* (Ökar lokalt stöd kortsiktigt, men skapar risk för framtida granskningar och budgetpress).
   - *Alternativ B: Nyansera och förankra* (Kostar tid och budget, men bygger stabilt förtroendekapital).
   - *Alternativ C: Fokusera på facit & granskning* (Jämför mot verkligt utfall via utlovat.se, ger donationer och stärker trovärdigheten).
4. **Faktagranskning & debriefing:** Ta del av verkliga citat, kostnadskalkyler och underlag från utlovat.se efter varje kampanjstopp.
5. **Valdagen:** Simulering av riksdagsvalets utfall i procent och mandat (av 349 mandat), inklusive betyg och löftesdisciplinrapport.

---

## Politiskt Neutralitetskontrakt

Spelet är **100 % partipolitiskt och ideologiskt neutralt**:
* **Ingen ideologisk värdering:** Varken vänster-, höger-, liberala, konservativa eller gröna sakfrågor/beslut är i sig "rätt" eller "fel".
* **Kärnmekanik:** Spelet mäter spelarens **konsekvens**, **trovärdighet (förtroendekapital)**, **resurshantering** och förmåga att matcha löften mot faktiska resultat – inte vilka specifika politiska åsikter som framförs.
* **Symmetrisk representation:** Alla riksdagspartier (S, M, SD, C, V, KD, L, MP) representeras symmetriskt med samma speltekniska logik.
* **Automatiserad neutralitetsgranskning:** Testsviten [`tests/neutrality.test.ts`](tests/neutrality.test.ts) genomför 10 000 simulerade drag för att verifiera att inget parti eller politisk åsikt ges speltekniska fördelar.

---

## Datakälla & Kreditering

All data om partiernas vallöften, kostnadsberäkningar och riksdagsfacit konsumeras från API:et på [utlovat.se](https://utlovat.se) under licensen **Creative Commons Attribution 4.0 International ([CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/))**.

Valturné är ett oberoende projekt utan partipolitisk koppling.

---

## Utveckling & Kommandon

```bash
# Installera beroenden
pnpm install

# Starta lokal utvecklingsserver
pnpm dev

# Kör automatiserade enhets- och neutralitetstester
pnpm test

# Kör TypeScript-typkontroll
pnpm typecheck

# Bygg produktionspaket
pnpm build

# Förhandsgranska produktionsbygge
pnpm preview
```

---

## Licens

Källkoden är öppen källkod licensierad under [Apache License 2.0](LICENSE).
