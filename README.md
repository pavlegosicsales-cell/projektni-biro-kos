# Projektni biro Koš

Sajt za Projektni biro Koš, građevinsku firmu iz Srbobrana koja radi u Novom
Sadu i okolini. Gradnja kuća po sistemu ključ u ruke, adaptacije, enterijer i
projektovanje. Firma posluje od 1994. godine.

## Struktura

| Fajl | Šta je |
|---|---|
| `index.html` | Početna strana |
| `contact.html` | Kontakt sa upitnikom u šest koraka |
| `privacy.html` | Politika privatnosti |
| `styles.css` | Kompletan stil, sve brend boje su tokeni u `:root` |
| `main.js` | Navigacija, reveal animacije, FAQ, upitnik |
| `lenis.min.js` | Lenis 1.3.26, glatki skrol (MIT licenca) |
| `images/` | Fotografije i logotip |
| `context.md` | Podaci o klijentu prikupljeni u koraku 1 |

## Pokretanje

Statičan sajt, bez build koraka:

```
python -m http.server 8771
```

Pa otvoriti `http://localhost:8771`.

## Boje

Sve boje su tokeni na vrhu `styles.css`. Izvedene su iz logotipa.

| Token | Vrednost | Uloga |
|---|---|---|
| `--deep` | `#1B2A4E` | Teget, tamne sekcije |
| `--accent` | `#2C4272` | Teget, hover stanje dugmadi |
| `--btn` | `#B25A18` | Narandžasta, dugmad u mirovanju |
| `--flame` | `#E89355` | Svetla narandžasta, samo na tamnom |
| `--wash` | `#F0F2F7` | Bleda podloga sekcije |

## Nerešeno pre objave

1. **Pravni podaci.** PIB 101425001 i matični broj 51455550 u podnožju su iz
   APR zapisa za entitet „Jovan Tutorov preduzetnik", koji je u privremenom
   prekidu od 03.11.2025. Potvrditi tačan pravni naziv i PIB sa klijentom.
2. **Logotip** postoji samo u 150x150 sa Instagrama. Treba vektor.
3. **Recenzije.** Klijent nema Google recenzije. Sekcija „Sa gradilišta"
   trenutno prenosi njihove sopstvene objave sa Instagrama, uz stvaran broj
   pratilaca. Zameniti kada stignu prave recenzije kupaca.
4. **Obrazac** još nije povezan. `ENDPOINT` u `main.js` je prazan, čeka
   Apps Script iz trećeg koraka.
