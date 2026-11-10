# Zo werk je met Codex aan de website

Voor Bacha (en Tom). Je kunt Codex vragen om **alles** aan de website te doen: teksten, vacatures, foto's en video's,
het ontwerp, nieuwe pagina's, het contactformulier. Er is geen goedkeuring nodig, ook niet van Tom: Codex past aan, zet
het online en kijkt of het klopt. Gaat er iets mis, dan draaien we het gewoon terug. Op de site staat geen gevoelige
data. Codex leest zelf de regels in `AGENTS.md`; jij hoeft die niet te kennen.

## 1. Wat je kunt vragen

- "Pas op de homepage de tekst onder *Wat we doen* aan naar: '…' (Nederlands) en '…' (Engels)."
- "Voeg op de vacaturepagina een rol **Social Media Lead** toe, met deze taken: …"
- "Maak de DJ-pagina openbaar en zet een link naar die pagina onder *Wat we doen*."
- "Zet deze foto bij DJ Anna op de DJ-pagina."
- "Maak de knoppen groter" of "zet de achtergrond wat warmer". Ontwerp mag ook.
- "Wat staat er nu op de pagina over live bands?"

**Tips voor een goede opdracht**
- Zeg **welke pagina** en geef de **exacte tekst**, het liefst in Nederlands én Engels. Anders schrijft Codex de andere taal zelf en zegt het dat erbij.
- **Eén ding per keer.** Dat maakt het makkelijk om te controleren.
- **Codex verzint niets.** Geen klanten, citaten, prijzen of cijfers die jij niet gaf. Ontbreekt iets, dan komt er *Setting the stage* te staan.

## 2. Zo komt iets op de site

1. Codex maakt je wijziging, controleert hem en zet hem **meteen online**. Na ongeveer **2 minuten** staat het op www.makeitlive.agency.
2. Codex kijkt daarna zelf of het goed staat en meldt het je. Kan dat niet, dan zegt het: "Kijk over 2 minuten op de site."
3. **Wil je het eerst zien voordat het online gaat?** Zeg dan: *"Zet dit eerst op een voorbeeld, zodat ik het kan bekijken."* Codex maakt dan een voorstel met een voorbeeldlink. Tevreden? Klik op **Merge pull request** en daarna **Confirm merge**.
4. Dat voorbeeld is optioneel. Ook grote wijzigingen mogen rechtstreeks, want terugdraaien kan altijd.

## 3. Wat Codex niet kan

Dingen die buiten de code gebeuren, doe je zelf (of Tom) in de betreffende dienst:
- **Instellingen en sleutels** in Cloudflare, Resend, Notion, Google en de domeinnaam (DNS).
- **Wachtwoorden of sleutels deel je nooit in een chat met Codex.** De website-code staat openbaar op GitHub, dus daar mag nooit een sleutel in. Sleutels staan in Cloudflare als *Secret*.

Zeg het gerust als je iets aan zo'n dienst wilt veranderen: Codex zegt dan precies wat jij moet klikken of invullen.

## 4. Foto's en video's

- Zet **originele bestanden niet rechtstreeks** op de site: te groot en voor altijd in de geschiedenis. Zet ze in de map `media-inbox/` en vraag Codex: "Maak deze foto's klaar voor de site." Het maakt ze klein en haalt locatiegegevens eruit.
- **Lange films** (aftermovies) en volledige DJ-sets staan beter op YouTube, Vimeo of SoundCloud. Codex kan ze insluiten en past dan de privacytekst aan.
- Staan er herkenbare gasten of artiesten op? Zorg dat zij hiermee akkoord zijn.

## 5. Echte informatie

- **Klantenlogo's en referenties** (zoals Tomorrowland of DDMC): pas tonen als jij bevestigt dat ze echt zijn en dat we ze mogen tonen.
- **Testimonials**: alleen een echt citaat, met naam en functie, waarvoor die persoon toestemming gaf.

## 6. Iets misgegaan?

- **Staat het fout online?** Zeg meteen tegen Codex: *"Draai de laatste wijziging terug."* Dat staat ook binnen ongeveer 2 minuten online. Er gaat niets verloren.
- **Het voorbeeld (preview) klopt niet?** Dan is er nog niets online gekomen: klik op *Close pull request* of vraag Codex om het aan te passen.
