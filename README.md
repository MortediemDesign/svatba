# Svatebni fotogalerie

Staticka webova aplikace pro svatebni hosty. Host zada sve jmeno, vybere fotky a nahraje je pres Cloudinary Upload Widget do spolecne galerie. Web je pripraveny pro GitHub Pages a nepotrebuje Node.js, npm, backend ani databazi.

Galerie se automaticky obnovuje kazdych 30 sekund a pri vypadku pripojeni zobrazi posledni uspesne nacteny seznam fotek ulozeny v prohlizeci.

## Soubory projektu

```text
/
|-- index.html
|-- style.css
|-- app.js
`-- README.md
```

## 1. Vytvoreni Cloudinary uctu

1. Otevri [cloudinary.com](https://cloudinary.com/).
2. Vytvor bezplatny ucet nebo se prihlas.
3. V Dashboardu si poznamenej hodnotu **Cloud name**.

## 2. Nastaveni unsigned upload presetu

1. V Cloudinary otevri **Settings**.
2. Prejdi na **Upload**.
3. Najdi sekci **Upload presets** a vytvor novy preset.
4. Nastav **Signing Mode** na **Unsigned**.
5. Do pole **Folder** muzes zadat `wedding2026`.
6. Preset uloz a zkopiruj jeho nazev.

Upload Widget v aplikaci navic posila:

- `folder: wedding2026`
- `tags: wedding2026`
- `context.guest_name`: jmeno hosta z formulare

## 3. Vyplneni konstant v app.js

Otevri `app.js` a na zacatku dopln:

```js
const CLOUD_NAME = "tvuj-cloud-name";
const UPLOAD_PRESET = "tvuj-unsigned-upload-preset";
```

Volitelne si uprav:

```js
const COUPLE_NAMES = "Anna & Tomas";
const WEDDING_DATE = "20. cervna 2026";
const GALLERY_TAG = "wedding2026";
const UPLOAD_FOLDER = "wedding2026";
```

## 4. Nacitani galerie z Cloudinary

Aplikace pouziva verejny Cloudinary list endpoint:

```text
https://res.cloudinary.com/<cloud_name>/image/list/wedding2026.json
```

Aby galerie fungovala bez backendu na GitHub Pages, musi Cloudinary vratit verejny JSON seznam pro tag `wedding2026`. Pokud se galerie nenacita, zkontroluj:

1. Fotky se opravdu nahravaji s tagem `wedding2026`.
2. Upload preset je unsigned a dovoluje nahravani z webu.
3. Cloudinary ucet/preset dovoluje client-side listing podle tagu.

Poznamka: Cloudinary Admin API vyzaduje API secret, ktery nesmi byt ve statickem webu. Proto tento projekt nepouziva Admin API primo z prohlizece.

## 5. Zapnuti GitHub Pages

1. Vytvor GitHub repository.
2. Nahraj do nej soubory `index.html`, `style.css`, `app.js` a `README.md`.
3. Na GitHubu otevri **Settings** repository.
4. V menu vyber **Pages**.
5. V casti **Build and deployment** nastav:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/root`
6. Uloz nastaveni.
7. GitHub zobrazi verejnou adresu webu, obvykle ve tvaru `https://uzivatel.github.io/repository/`.

## 6. Sdileni odkazu s hosty

Po zapnuti GitHub Pages otevri verejnou adresu galerie a vyzkousej:

1. Zadat testovaci jmeno.
2. Nahrat jednu fotku.
3. Obnovit galerii.
4. Otevrit stejnou adresu v telefonu.

Na svatbe muzes odkaz sdilet jako QR kod na cedulce, v programu nebo ve skupinove zprave.

## Provoz bez build procesu

Projekt je ciste staticky:

- zadny Node.js
- zadne npm
- zadny build
- zadny server
- zadna databaze

Staci otevrit `index.html` nebo zapnout GitHub Pages.
