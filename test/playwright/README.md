# Automatische Test
Om de webformulieren te testen is er een automatische test gemaakt in Playwright. 

## Installeren
Het kan zijn dat Playwright eerst geïnstalleerd moet worden. Dit kan met 
yarn create playwright

## Tests lokaal draaien
Je kunt de tests op meerdere manieren lokaal draaien.

### Headless
In de terminal kun je via *npx* de tests draaien. De tests moeten gedraaid worden op hetzelfde niveau als de `playwright.config` staat.

Het commando om alle tests te draaien is `npx playwright test`

Als je een specifieke file wilt draaien kan je dat doen door bijvoorbeeld het volgende commando in de terminal te gebruiken: `npx playwright test tests/aanvragen-bijzondere-bijstand.spec.ts`

Na het headless draaien krijg je een HTML report te zijn met alle geslaagde en gefaalde tests.

### Browser
Als je wilt dat er een browser opent waar de tests in afdraaien gebruik je --headed na het commando: `npx playwright test --headed`

### UI
Playwright heeft ook een testrunner. Dit is een browser waarin je ook gelijk de stappen van de tests ziet. Om deze te openen gebruik je --ui: `npx playwright test --ui`

Voor meer commando's, kijk op: _https://playwright.dev/docs/test-cli_

### Scripts
Je kunt ook scripts aanmaken in de *package.json* zodat je makkelijker bepaalde tests of sets van tests kan aanroepen.

## Plugins 
De belangrijkste plugin voor Playwright is *Playwright Test for VSCode*. 
Deze plugin is gemaakt door Microsoft zelf en werkt heel goed voor het draaien als debuggen van tests.
_https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright_

# Tips and tricks
UI-tests hebben vaak de neiging flaky te zijn en vaak om te vallen. Om dit enigszins te voorkomen.

## Unit tests
Probeer altijd tests op een zo'n laag mogelijk niveau te automatiseren. Bedenk bij alle testscenario's die je wilt automatiseren wat het laagste niveau is waarop je iets kunt checken. Vaak betekent het dat je dingen op unit-test-niveau al kunt dekken.

## Locators
Je kunt met behulp van de testrunner van Playwright makkelijk locators selecteren.
_https://playwright.dev/docs/codegen#generating-locators_
Het is alleen niet verstandig dit altijd te doen, omdat er soms minder robuuste locators worden gekozen.
Bijvoorbeeld bij _aanmelden sportactiviteit_ heb je bij het vragen om toestemmingen locators waar dynamische waarden voor staan: `locator('#e4i1g5c-geeftUToestemmingDatUwKindMagMeedoenAanDeSportactiviteitenEnMogenWijDaaroverMetUContactOpnemen').getByText('ja')`. Op dit soort momenten is het handig om over te gaan op ID's om een locator samen te stellen. Nog beter is wanneer je een *test id* gebruikt. Die moeten dan wel zelf toegevoegd worden. _https://playwright.dev/docs/locators#locate-by-test-id_

De beste locators zijn zo duidelijk en onveranderlijk mogelijk. Dus niet nth-item bijvoorbeeld, want dit kan veranderen. Een goed voorbeeld is `getByRole('button', { name: 'Volgende' })` omdat deze zowel de rol pakt (button), maar ook de tekst (volgende) er op. Waardoor hij heel specifiek de juiste knop pakt.


## POM
POM (Page Object Model) is de basis waarin deze tests zijn gemaakt. Het idee is dat je zoveel mogelijk locators en functies abstraheert zodat je zo min mogelijk dubbel gaat definiëren.

### Pages
Hier staan de pagina's, locators die op die pagina te vinden zijn en functies die die locators gebruiken.
Bijvoorbeeld url's, knoppen, klikken op die knoppen etc.

### Tests
Hierin staan de tests. Er staat altijd een `beforeAll`. Dit stuk draait af voor alle tests in de file.

### Fixtures
Hier staan normaliter files in die als databronnen fungeren voor tests. Ook kunnen hier files in staan die data genereren. In het geval van deze tests staat er alleen een document in dat gebruikt wordt om te uploaden in een test.

## Overig
- Gebruik zo min mogelijk harde `wait` maar kijk of je een `timeout` aan een functie kan toevoegen.
Bijvoorbeeld `closeButtonForSavedModal.click({ timeout: 5000 })` zorgt er voor dat de test 5 seconden de tijd heeft om te klikken. Als de knop eerder wordt gevonden blijft de test niet wachten en gaat hij door.

- Probeer tests zo klein mogelijk te maken en los van elkaar zodat ze niet van elkaar afhangen.
- Probeer altijd te beginnen van een schone lei, of begin je test met het opruimen van vorige testdata.
- De base url staat samen met andere settings in `playwright.config.ts`. Dit zorgt ervoor dat je niet de gehele url hoeft mee te geven in tests.


_Voor meer informatie is er een hoop terug te vinden in de docs van Playwright: https://playwright.dev/docs/intro_