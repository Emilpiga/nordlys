/**
 * Hand-rewritten catalog copy from the local Storefront snapshot.
 * Swedish is the shop source; nb/da/fi are native localizations of the same facts.
 *
 * Tuple order everywhere: [sv, nb, da, fi]
 */

const L = ["sv", "nb", "da", "fi"];

function t(sv, nb, da, fi) {
  return { sv, nb, da, fi };
}

function pack(base) {
  const out = { handle: base.handle };
  for (const locale of L) {
    out[locale] = {
      title: base.title[locale],
      body_html: base.body[locale],
      meta_title: base.metaTitle[locale],
      meta_description: base.metaDescription[locale],
      options: (base.options ?? []).map((option) => ({
        sourceName: option.sourceName,
        name: option.name[locale],
        values: Object.fromEntries(
          Object.entries(option.values).map(([source, loc]) => [
            source,
            loc[locale],
          ]),
        ),
      })),
    };
  }
  return out;
}

const COLOR = t("Färg", "Farge", "Farve", "Väri");
const SIZE = t("Storlek", "Størrelse", "Størrelse", "Koko");
const STYLE = t("Utförande", "Utførelse", "Udførelse", "Toteutus");

const ANIMAL = {
  "Corgi sit down": t("Corgi, sittande", "Corgi, sittende", "Corgi, siddende", "Corgi, istuva"),
  Crab: t("Krabba", "Krabbe", "Krabbe", "Rapu"),
  Giraffe: t("Giraff", "Sjiraff", "Giraf", "Kirahvi"),
  Leopard: t("Leopard", "Leopard", "Leopard", "Leopardi"),
  "Magic Cat": t("Katt", "Katt", "Kat", "Kissa"),
  "Magic Cock": t("Tupp", "Hane", "Hane", "Kukko"),
  "Magic Dolphin": t("Delfin", "Delfin", "Delfin", "Delfiini"),
  "Magic Elephant": t("Elefant", "Elefant", "Elefant", "Norsu"),
  "Magic Flying Dragon": t("Drake", "Drage", "Drage", "Lohikäärme"),
  "Magic Horse Head": t("Häst", "Hest", "Hest", "Hevonen"),
  "Magic Lion": t("Lejon", "Løve", "Løve", "Leijona"),
  "Magic Mermaid": t("Sjöjungfru", "Havfrue", "Havfrue", "Merenneito"),
  "Magic Owl": t("Uggla", "Ugle", "Ugle", "Pöllö"),
  "Magic Owl22": t("Uggla 2", "Ugle 2", "Ugle 2", "Pöllö 2"),
  "Magic Turtle": t("Sköldpadda", "Skilpadde", "Skildpadde", "Kilpikonna"),
  "Magic Wolf Head": t("Varg", "Ulv", "Ulv", "Susi"),
  Malzis: t("Malteser", "Malteser", "Malteser", "Maltankoira"),
  Mermaid: t("Sjöjungfru 2", "Havfrue 2", "Havfrue 2", "Merenneito 2"),
  Pig: t("Gris", "Gris", "Gris", "Sika"),
  Rabbit: t("Kanin", "Kanin", "Kanin", "Kani"),
  Raccoon: t("Tvättbjörn", "Vaskebjørn", "Vaskebjørn", "Pesukarhu"),
  Sheep: t("Får", "Sau", "Får", "Lammas"),
  Unicorn: t("Enhörning", "Enhjørning", "Enhjørning", "Yksisarvinen"),
  Chicken: t("Höna", "Høne", "Høne", "Kana"),
};

const ANIMAL_SIZE = {
  "17cm": t("17 cm", "17 cm", "17 cm", "17 cm"),
  "Large 22cm": t("22 cm", "22 cm", "22 cm", "22 cm"),
  USB: t("USB", "USB", "USB", "USB"),
  "6x9.5x15cm": t("6 × 9,5 × 15 cm", "6 × 9,5 × 15 cm", "6 × 9,5 × 15 cm", "6 × 9,5 × 15 cm"),
  "Small Size 15cm": t("15 cm", "15 cm", "15 cm", "15 cm"),
};

const DOG = {
  "Basset Hound": t("Basset hound", "Basset hound", "Basset hound", "Basset hound"),
  "Beagle Dogs": t("Beagle", "Beagle", "Beagle", "Beagle"),
  "Border collie": t("Border collie", "Border collie", "Border collie", "Border collie"),
  "Boxing Dog": t("Boxer", "Boxer", "Boxer", "Boxer"),
  "Bulldog 2": t("Bulldogg 2", "Bulldog 2", "Bulldog 2", "Bulldoggi 2"),
  "Bulldog Sitting Posture": t("Bulldogg, sittande", "Bulldog, sittende", "Bulldog, siddende", "Bulldoggi, istuva"),
  "Bulldog Standing Posture": t("Bulldogg, stående", "Bulldog, stående", "Bulldog, stående", "Bulldoggi, seisova"),
  Bulldog: t("Bulldogg", "Bulldog", "Bulldog", "Bulldoggi"),
  "Cat Type A": t("Katt A", "Katt A", "Kat A", "Kissa A"),
  "Cat Type B": t("Katt B", "Katt B", "Kat B", "Kissa B"),
  "Chihuahua Sitting Position": t("Chihuahua, sittande", "Chihuahua, sittende", "Chihuahua, siddende", "Chihuahua, istuva"),
  "Chihuahua Standing": t("Chihuahua, stående", "Chihuahua, stående", "Chihuahua, stående", "Chihuahua, seisova"),
  Chihuahua: t("Chihuahua", "Chihuahua", "Chihuahua", "Chihuahua"),
  Dachshund: t("Tax", "Dachs", "Gravhund", "Mäyräkoira"),
  "Golden Retriever": t("Golden retriever", "Golden retriever", "Golden retriever", "Golden retriever"),
  "Husky standing posture": t("Husky, stående", "Husky, stående", "Husky, stående", "Husky, seisova"),
  Husky: t("Husky", "Husky", "Husky", "Husky"),
  "Magic Dog G Model": t("Hund G", "Hund G", "Hund G", "Koira G"),
  Marzus: t("Malteser", "Malteser", "Malteser", "Maltankoira"),
  Uggla: t("Uggla", "Ugle", "Ugle", "Pöllö"),
  Pomeranian: t("Pomeranian", "Pomeranian", "Pomeranian", "Pomeranian"),
  Pudel: t("Pudel", "Puddel", "Puddel", "Villakoira"),
  "Pug Dog": t("Mops", "Mops", "Mops", "Mopsi"),
  Schnauzer: t("Schnauzer", "Schnauzer", "Schnauzer", "Snautseri"),
  "Shepherd Dog": t("Schäfer", "Schäfer", "Schæferhund", "Saksanpaimenkoira"),
  "Shih Tzu": t("Shih tzu", "Shih tzu", "Shih tzu", "Shih tzu"),
  "Sideheaded Golden Retriever": t(
    "Golden retriever, profil",
    "Golden retriever, profil",
    "Golden retriever, profil",
    "Golden retriever, profiili",
  ),
  "Sitting Posture Corgi": t("Corgi, sittande", "Corgi, sittende", "Corgi, siddende", "Corgi, istuva"),
  "Standing Posture Corgi": t("Corgi, stående", "Corgi, stående", "Corgi, stående", "Corgi, seisova"),
  Teddy: t("Teddy", "Teddy", "Teddy", "Teddy"),
  "Labrador Retriever": t("Labrador", "Labrador", "Labrador", "Labrador"),
  Sköldpadda: t("Sköldpadda", "Skilpadde", "Skildpadde", "Kilpikonna"),
  "West Highland Dog": t("West highland", "West highland", "West highland", "West highland"),
  "Yorkshire Terrier A": t("Yorkshireterrier A", "Yorkshireterrier A", "Yorkshireterrier A", "Yorkshireterrieri A"),
  "Yorkshire Terrier B": t("Yorkshireterrier B", "Yorkshireterrier B", "Yorkshireterrier B", "Yorkshireterrieri B"),
  "Baji Crossing": t("Baji", "Baji", "Baji", "Baji"),
};

const BOARD_SIZE = {
  "150x250x2cm": t("15 × 25 cm, 2 mm", "15 × 25 cm, 2 mm", "15 × 25 cm, 2 mm", "15 × 25 cm, 2 mm"),
  "200x290x2cm": t("20 × 29 cm, 2 mm", "20 × 29 cm, 2 mm", "20 × 29 cm, 2 mm", "20 × 29 cm, 2 mm"),
  "20X30cmXthickness 2mm": t("20 × 30 cm, 2 mm", "20 × 30 cm, 2 mm", "20 × 30 cm, 2 mm", "20 × 30 cm, 2 mm"),
  "250x360x2cm": t("25 × 36 cm, 2 mm", "25 × 36 cm, 2 mm", "25 × 36 cm, 2 mm", "25 × 36 cm, 2 mm"),
  "29X39cmXthickness 2mm": t("29 × 39 cm, 2 mm", "29 × 39 cm, 2 mm", "29 × 39 cm, 2 mm", "29 × 39 cm, 2 mm"),
  "300x460x2cm": t("30 × 46 cm, 2 mm", "30 × 46 cm, 2 mm", "30 × 46 cm, 2 mm", "30 × 46 cm, 2 mm"),
  "46X30cmXthickness2mm": t("46 × 30 cm, 2 mm", "46 × 30 cm, 2 mm", "46 × 30 cm, 2 mm", "46 × 30 cm, 2 mm"),
  Set: t("Set", "Sett", "Sæt", "Setti"),
  Set1: t("Set 2", "Sett 2", "Sæt 2", "Setti 2"),
  "150X250X1.5 Small": t("15 × 25 cm, 1,5 mm", "15 × 25 cm, 1,5 mm", "15 × 25 cm, 1,5 mm", "15 × 25 cm, 1,5 mm"),
};

export const catalogCopy = [
  pack({
    handle: "304-stainless-steel-cutting-board",
    title: t(
      "Skärbräda i 304-rostfritt stål",
      "Skjærebrett i 304-rustfritt stål",
      "Skærebræt i 304-rustfrit stål",
      "304-teräksinen leikkuulauta",
    ),
    metaTitle: t(
      "Skärbräda i 304-stål",
      "Skjærebrett i 304-stål",
      "Skærebræt i 304-stål",
      "Leikkuulauta 304-teräs",
    ),
    metaDescription: t(
      "Skärbräda i 304-rostfritt stål. Slät yta som är lätt att torka av. Välj storlek ovan.",
      "Skjærebrett i 304-rustfritt stål. Glatt flate som er lett å tørke av. Velg størrelse over.",
      "Skærebræt i 304-rustfrit stål. Glat flade, nem at tørre af. Vælg størrelse ovenfor.",
      "Leikkuulauta 304-ruostumattomasta teräksestä. Sileä pinta, helppo pyyhkiä. Valitse koko yllä.",
    ),
    body: t(
      "<p>En slät skärbräda i 304-rostfritt stål — den tar inte smak och är lätt att torka av efter matlagning.</p><ul><li><strong>Hygienisk yta.</strong> Stål suger inte i sig vätska som trä.</li><li><strong>Vardagstålig.</strong> Tål kniv utan att splintra.</li><li><strong>Flera mått.</strong> Välj storlek ovan så den passar bänken.</li></ul><p>Material: 304-rostfritt stål. Tjocklek enligt vald variant, oftast 1,5–2 mm.</p>",
      "<p>Et glatt skjærebrett i 304-rustfritt stål — det tar ikke smak og er lett å tørke av etter matlaging.</p><ul><li><strong>Hygienisk flate.</strong> Stål suger ikke til seg væske slik tre gjør.</li><li><strong>Tåler hverdagen.</strong> Tåler kniv uten å flise opp.</li><li><strong>Flere mål.</strong> Velg størrelse over så det passer benken.</li></ul><p>Materiale: 304-rustfritt stål. Tykkelse etter valgt variant, som regel 1,5–2 mm.</p>",
      "<p>Et glat skærebræt i 304-rustfrit stål — det tager ikke smag og er nemt at tørre af efter madlavning.</p><ul><li><strong>Hygiejnisk flade.</strong> Stål suger ikke væske som træ.</li><li><strong>Til hverdagen.</strong> Tåler kniv uden at flække.</li><li><strong>Flere mål.</strong> Vælg størrelse ovenfor, så det passer til bordet.</li></ul><p>Materiale: 304-rustfrit stål. Tykkelse efter valgt variant, typisk 1,5–2 mm.</p>",
      "<p>Sileä leikkuulauta 304-ruostumattomasta teräksestä — se ei ime makuja ja on helppo pyyhkiä ruoanlaiton jälkeen.</p><ul><li><strong>Hygieeninen pinta.</strong> Teräs ei ime nestettä kuten puu.</li><li><strong>Arjen kestävä.</strong> Kestää veistä halkeilematta.</li><li><strong>Useita kokoja.</strong> Valitse mitta yllä, jotta lauta sopii tasolle.</li></ul><p>Materiaali: 304-ruostumaton teräs. Paksuus valitun variantin mukaan, yleensä 1,5–2 mm.</p>",
    ),
    options: [{ sourceName: "Size", name: SIZE, values: BOARD_SIZE }],
  }),

  pack({
    handle: "36-piece-stainless-steel-tableware-wooden-box-gift-box-set",
    title: t(
      "Bestickset 36 delar i trälåda",
      "Bestikksett 36 deler i trelasse",
      "Bestiksæt 36 dele i trækasse",
      "36-osainen aterinsetti puulaatikossa",
    ),
    metaTitle: t(
      "Bestickset 36 delar",
      "Bestikksett 36 deler",
      "Bestiksæt 36 dele",
      "36-osainen aterinsetti",
    ),
    metaDescription: t(
      "36-delars bestickset i 410-stål med spegelblank yta, i trälåda. 9 av varje: kniv, gaffel, sked och tesked.",
      "36-delers bestikksett i 410-stål med speilblank flate, i trelasse. 9 av hver: kniv, gaffel, skje og teske.",
      "36-deles bestiksæt i 410-stål med spejlblank flade, i trækasse. 9 af hver: kniv, gaffel, ske og teske.",
      "36-osainen aterinsetti 410-terästä, peilikiilto, puulaatikossa. 9 kutakin: veitsi, haarukka, lusikka ja teelusikka.",
    ),
    body: t(
      "<p>Ett 36-delars bestickset i trälåda — redo att duka med eller ge bort. Spegelblank 410-stål.</p><ul><li><strong>Komplett kuvert.</strong> 9 knivar, 9 gafflar, 9 skedar och 9 teskedar.</li><li><strong>Blank yta.</strong> Dukad look utan extra puts varje dag.</li><li><strong>Välj finish.</strong> Silver, guld, roséguld, svart eller flerfärgad ovan.</li></ul><p>Material: 410-rostfritt stål. Levereras i trälåda.</p>",
      "<p>Et 36-delers bestikksett i trelasse — klart til å dekke med eller gi bort. Speilblankt 410-stål.</p><ul><li><strong>Komplett kuvert.</strong> 9 kniver, 9 gafler, 9 skjeer og 9 teskjeer.</li><li><strong>Blank flate.</strong> Dekket uttrykk uten ekstra puss hver dag.</li><li><strong>Velg finish.</strong> Sølv, gull, roségull, svart eller flerfarget over.</li></ul><p>Materiale: 410-rustfritt stål. Leveres i trelasse.</p>",
      "<p>Et 36-deles bestiksæt i trækasse — klar til at dække med eller give væk. Spejlblankt 410-stål.</p><ul><li><strong>Komplet kuvert.</strong> 9 knive, 9 gafler, 9 skeer og 9 teskeer.</li><li><strong>Blank flade.</strong> Dækket look uden ekstra pudsning hver dag.</li><li><strong>Vælg finish.</strong> Sølv, guld, roséguld, sort eller flerfarvet ovenfor.</li></ul><p>Materiale: 410-rustfrit stål. Leveres i trækasse.</p>",
      "<p>36-osainen aterinsetti puulaatikossa — valmis kattaukseen tai lahjaksi. Peilikiiltävä 410-teräs.</p><ul><li><strong>Koko setti.</strong> 9 veistä, 9 haarukkaa, 9 lusikkaa ja 9 teelusikkaa.</li><li><strong>Kiiltävä pinta.</strong> Kattauksen ilme ilman päivittäistä kiillotusta.</li><li><strong>Valitse pinta.</strong> Hopea, kulta, ruusukulta, musta tai monivärinen yllä.</li></ul><p>Materiaali: 410-ruostumaton teräs. Toimitetaan puulaatikossa.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Gold: t("Guld", "Gull", "Guld", "Kulta"),
          "Rose Gold": t("Roséguld", "Roségull", "Roséguld", "Ruusukulta"),
          Silver: t("Silver", "Sølv", "Sølv", "Hopea"),
          colorful: t("Flerfärgad", "Flerfarget", "Flerfarvet", "Monivärinen"),
          Black: t("Svart", "Svart", "Sort", "Musta"),
        },
      },
    ],
  }),

  pack({
    handle:
      "3d-colored-animal-light-desk-lamp-animal-series-decorative-night-light-animal-elephant-owl-cat-vintage-table-lamp-home-decoration",
    title: t(
      "3D-djurampa till nattduksbordet",
      "3D-dyrelampe til nattbordet",
      "3D-dyrelampe til natbordet",
      "3D-eläinvalaisin yöpöydälle",
    ),
    metaTitle: t(
      "3D-djurampa i resin",
      "3D-dyrelampe i resin",
      "3D-dyrelampe i resin",
      "3D-eläinvalaisin",
    ),
    metaDescription: t(
      "Liten djurampa i resin till nattduksbordet. Välj djur och storlek — mjukt ljus på kvällen, skulptur på dagen.",
      "Liten dyrelampe i resin til nattbordet. Velg dyr og størrelse — mykt lys om kvelden, skulptur om dagen.",
      "Lille dyrelampe i resin til natbordet. Vælg dyr og størrelse — blødt lys om aftenen, skulptur om dagen.",
      "Pieni eläinvalaisin resinistä yöpöydälle. Valitse eläin ja koko — pehmeä valo illalla, veistos päivällä.",
    ),
    body: t(
      "<p>En liten djurfigur i resin som också är en lampa — den tar lite plats på nattduksbordet och ger ett mjukt sken på kvällen.</p><ul><li><strong>Två uttryck.</strong> Skulptur på dagen, nattlampa när du tänder.</li><li><strong>Många djur.</strong> Välj figur ovan, från katt och uggla till enhörning.</li><li><strong>Enkel present.</strong> Liten att slå in, tydlig att förstå.</li></ul><p>Material: resin. Höjd enligt vald storlek, oftast 15–22 cm. Figuren är handgjord, så färg och detaljer kan skilja sig något från bilden.</p>",
      "<p>En liten dyrefigur i resin som også er en lampe — den tar lite plass på nattbordet og gir et mykt skjær om kvelden.</p><ul><li><strong>To uttrykk.</strong> Skulptur om dagen, nattlampe når du tenner.</li><li><strong>Mange dyr.</strong> Velg figur over, fra katt og ugle til enhjørning.</li><li><strong>Enkel gave.</strong> Liten å pakke inn, lett å forstå.</li></ul><p>Materiale: resin. Høyde etter valgt størrelse, som regel 15–22 cm. Figuren er håndlaget, så farge og detaljer kan avvike litt fra bildet.</p>",
      "<p>En lille dyrefigur i resin, som også er en lampe — den fylder lidt på natbordet og giver et blødt skær om aftenen.</p><ul><li><strong>To udtryk.</strong> Skulptur om dagen, natlampe når du tænder.</li><li><strong>Mange dyr.</strong> Vælg figur ovenfor, fra kat og ugle til enhjørning.</li><li><strong>Enkel gave.</strong> Lille at pakke ind, nem at forstå.</li></ul><p>Materiale: resin. Højde efter valgt størrelse, typisk 15–22 cm. Figuren er håndlavet, så farve og detaljer kan afvige lidt fra billedet.</p>",
      "<p>Pieni eläinhahmo resinistä, joka on myös valaisin — se vie vähän tilaa yöpöydällä ja antaa pehmeän valon illalla.</p><ul><li><strong>Kaksi ilmettä.</strong> Veistos päivällä, yövalo kun sytytät.</li><li><strong>Monta eläintä.</strong> Valitse hahmo yllä, kissasta pöllöön ja yksisarviseen.</li><li><strong>Helppo lahja.</strong> Pieni pakata, helppo ymmärtää.</li></ul><p>Materiaali: resin. Korkeus valitun koon mukaan, yleensä 15–22 cm. Hahmo on käsin tehty, joten väri ja yksityiskohdat voivat poiketa kuvasta.</p>",
    ),
    options: [
      { sourceName: "Color", name: COLOR, values: ANIMAL },
      { sourceName: "Size", name: SIZE, values: ANIMAL_SIZE },
    ],
  }),

  pack({
    handle:
      "7-pcs-stainless-steel-silicone-kitchen-utensil-slotted-spatula-turner-ladle-serving-spoon-pasta-server-cooking-set",
    title: t(
      "Köksredskap 7 delar i stål och silikon",
      "Kjøkkenredskaper 7 deler i stål og silikon",
      "Køkkenredskaber 7 dele i stål og silikone",
      "7-osaiset keittiövälineet terästä ja silikonia",
    ),
    metaTitle: t(
      "Köksredskap 7 delar",
      "Kjøkkenredskaper 7 deler",
      "Køkkenredskaber 7 dele",
      "Keittiövälineet 7 osaa",
    ),
    metaDescription: t(
      "Sjustegs köksset i 304-stål med silikon. Slev, stekspade och mer — ett set att laga med varje dag.",
      "Sjudels kjøkkensett i 304-stål med silikon. Øse, stekespade og mer — et sett til hverdagsmatlaging.",
      "Syvdeles køkkensæt i 304-stål med silikone. Øseske, stegespade og mere — et sæt til hverdagens madlavning.",
      "7-osainen keittiösetti 304-terästä ja silikonia. Kauha, lasta ja muuta — setti arjen ruoanlaittoon.",
    ),
    body: t(
      "<p>Ett sjudelars köksset att ha framme vid spisen — slev, stekspade och övriga redskap i samma linje.</p><ul><li><strong>304-stål.</strong> Stabila skaft som tål vardagen vid spisen.</li><li><strong>Silikon mot pannan.</strong> Mjukare mot belagda ytor än bara metall.</li><li><strong>Ett set.</strong> Du slipper köpa redskapen var för sig.</li></ul><p>Material: 304-rostfritt stål och silikon. Sju delar i setet.</p>",
      "<p>Et sjudels kjøkkensett å ha fremme ved komfyren — øse, stekespade og resten av redskapene i samme linje.</p><ul><li><strong>304-stål.</strong> Stabile skaft som tåler hverdagen ved komfyren.</li><li><strong>Silikon mot pannen.</strong> Mykere mot belagte flater enn bare metall.</li><li><strong>Ett sett.</strong> Du slipper å kjøpe redskapene hver for seg.</li></ul><p>Materiale: 304-rustfritt stål og silikon. Sju deler i settet.</p>",
      "<p>Et syvdeles køkkensæt til at have fremme ved komfuret — øseske, stegespade og resten af redskaberne i samme linje.</p><ul><li><strong>304-stål.</strong> Stabile skafter, der tåler hverdagen ved komfuret.</li><li><strong>Silikone mod panden.</strong> Blødere mod belagte overflader end rent metal.</li><li><strong>Ét sæt.</strong> Du slipper for at købe redskaberne enkeltvis.</li></ul><p>Materiale: 304-rustfrit stål og silikone. Syv dele i sættet.</p>",
      "<p>7-osainen keittiösetti lieden viereen — kauha, paistinlasta ja muut välineet samaa linjaa.</p><ul><li><strong>304-teräs.</strong> Vakaat varret arjen käyttöön lieden ääressä.</li><li><strong>Silikoni pannaa vasten.</strong> Pehmeämpi pinnoitetuille pinnoille kuin pelkkä metalli.</li><li><strong>Yksi setti.</strong> Välineitä ei tarvitse ostaa yksitellen.</li></ul><p>Materiaali: 304-ruostumaton teräs ja silikoni. Seitsemän osaa.</p>",
    ),
    options: [
      {
        sourceName: "style",
        name: STYLE,
        values: {
          "7piece kitchen spatula": t(
            "7-delarsset",
            "7-delerssett",
            "7-delessæt",
            "7-osainen setti",
          ),
        },
      },
    ],
  }),

  pack({
    handle: "colorful-strange-dog-lamp-resin-decorations",
    title: t(
      "Hundlampa i resin",
      "Hundelampe i resin",
      "Hundelampe i resin",
      "Koira-valaisin resinistä",
    ),
    metaTitle: t(
      "Hundlampa i resin",
      "Hundelampe i resin",
      "Hundelampe i resin",
      "Koira-valaisin resinistä",
    ),
    metaDescription: t(
      "Dekorativ hundlampa i resin. Välj ras och USB eller knappbatteri — mjukt ljus till hyllan eller byrån.",
      "Dekorativ hundelampe i resin. Velg rase og USB eller knappbatteri — mykt lys til hyllen eller kommoden.",
      "Dekorativ hundelampe i resin. Vælg race og USB eller knapbatteri — blødt lys til hylden eller kommoden.",
      "Koristeellinen koiravalaisin resinistä. Valitse rotu ja USB tai nappiparisto — pehmeä valo hyllylle tai lipastoon.",
    ),
    body: t(
      "<p>En färgglad hundfigur i resin med inbyggt ljus — den hör hemma på en hylla, byrå eller nattduksbord.</p><ul><li><strong>Många raser.</strong> Välj modell ovan, från mops och tax till husky.</li><li><strong>Två sätt att tända.</strong> USB eller knappbatteri, beroende på var den ska stå.</li><li><strong>Liten skulptur.</strong> Fungerar som dekoration även släckt.</li></ul><p>Material: resin. Välj utförande ovan.</p>",
      "<p>En fargerik hundefigur i resin med innebygd lys — den hører hjemme på en hylle, kommode eller nattbord.</p><ul><li><strong>Mange raser.</strong> Velg modell over, fra mops og dachs til husky.</li><li><strong>To måter å tenne på.</strong> USB eller knappbatteri, avhengig av hvor den skal stå.</li><li><strong>Liten skulptur.</strong> Fungerer som dekor også slukket.</li></ul><p>Materiale: resin. Velg utførelse over.</p>",
      "<p>En farverig hundefigur i resin med indbygget lys — den hører til på en hylde, kommode eller natbord.</p><ul><li><strong>Mange racer.</strong> Vælg model ovenfor, fra mops og gravhund til husky.</li><li><strong>To måder at tænde på.</strong> USB eller knapbatteri, alt efter hvor den skal stå.</li><li><strong>Lille skulptur.</strong> Virker som dekoration også slukket.</li></ul><p>Materiale: resin. Vælg udførelse ovenfor.</p>",
      "<p>Värikäs koirahahmo resinistä, jossa on valo — se sopii hyllylle, lipastoon tai yöpöydälle.</p><ul><li><strong>Monta rotua.</strong> Valitse malli yllä, mopsista mäyräkoiraan ja huskyyn.</li><li><strong>Kaksi tapaa sytyttää.</strong> USB tai nappiparisto, sen mukaan mihin se tulee.</li><li><strong>Pieni veistos.</strong> Toimii koristeena myös sammutettuna.</li></ul><p>Materiaali: resin. Valitse toteutus yllä.</p>",
    ),
    options: [
      { sourceName: "Color", name: COLOR, values: DOG },
      {
        sourceName: "Style",
        name: STYLE,
        values: {
          "USB plug": t("USB", "USB", "USB", "USB"),
          "Knapp Batteri": t("Knappbatteri", "Knappbatteri", "Knapbatteri", "Nappiparisto"),
        },
      },
    ],
  }),

  pack({
    handle: "led-simulation-flame-atmosphere-flame-candle-light",
    title: t(
      "LED-ljus med fladdrande låga",
      "LED-lys med flakkende flamme",
      "LED-lys med flakkende flamme",
      "LED-kynttilä liekillä",
    ),
    metaTitle: t(
      "LED-ljus med låga",
      "LED-lys med flamme",
      "LED-lys med flamme",
      "LED-kynttilä liekillä",
    ),
    metaDescription: t(
      "Litet USB-drivet LED-ljus med fladdrande låga. Välj frostat eller transparent — 5 V, ca 22 × 64 mm.",
      "Lite USB-drevet LED-lys med flakkende flamme. Velg frostet eller gjennomsiktig — 5 V, ca. 22 × 64 mm.",
      "Lille USB-drevet LED-lys med flakkende flamme. Vælg mat eller gennemsigtig — 5 V, ca. 22 × 64 mm.",
      "Pieni USB-käyttöinen LED-kynttilä liekillä. Valitse himmeä tai kirkas — 5 V, n. 22 × 64 mm.",
    ),
    body: t(
      "<p>Ett litet LED-ljus med rörlig låga — stämning på fönsterbrädan utan öppen eld.</p><ul><li><strong>Fladdrande sken.</strong> Lågan rör sig, inte bara en stilla punkt.</li><li><strong>USB, 5 V.</strong> Koppla in och tänd, utan stearin.</li><li><strong>Två glas.</strong> Frostad eller transparent, välj ovan.</li></ul><p>Spänning: 5 V USB. Mått ca 22 × 64 mm.</p>",
      "<p>Et lite LED-lys med bevegelig flamme — stemning på vinduskarmen uten åpen ild.</p><ul><li><strong>Flakkende skjær.</strong> Flammen beveger seg, ikke bare et stille punkt.</li><li><strong>USB, 5 V.</strong> Koble til og tenn, uten stearin.</li><li><strong>To glass.</strong> Frostet eller gjennomsiktig, velg over.</li></ul><p>Spenning: 5 V USB. Mål ca. 22 × 64 mm.</p>",
      "<p>Et lille LED-lys med bevægelig flamme — stemning i vindueskarmen uden åben ild.</p><ul><li><strong>Flakkende skær.</strong> Flammen bevæger sig, ikke kun et stille punkt.</li><li><strong>USB, 5 V.</strong> Sæt til og tænd, uden stearin.</li><li><strong>To glas.</strong> Mat eller gennemsigtig, vælg ovenfor.</li></ul><p>Spænding: 5 V USB. Mål ca. 22 × 64 mm.</p>",
      "<p>Pieni LED-kynttilä liikkuvalla liekillä — tunnelmaa ikkunalaudalle ilman avotulta.</p><ul><li><strong>Elävä valo.</strong> Liekki liikkuu, ei ole vain paikallaan.</li><li><strong>USB, 5 V.</strong> Kytke ja sytytä, ilman steariinia.</li><li><strong>Kaksi lasia.</strong> Himmeä tai kirkas, valitse yllä.</li></ul><p>Jännite: 5 V USB. Mitat n. 22 × 64 mm.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Transparent: t("Transparent", "Gjennomsiktig", "Gennemsigtig", "Kirkas"),
          "Frosted Style": t("Frostad", "Frostet", "Mat", "Himmeä"),
        },
      },
    ],
  }),

  pack({
    handle: "led-tablet-reading-light-rechargeable",
    title: t(
      "Uppladdningsbar läslampa för surfplatta",
      "Oppladbar leselampe til nettbrett",
      "Opladelig læselampe til tablet",
      "Ladattava lukulamppu tabletille",
    ),
    metaTitle: t(
      "Läslampa för surfplatta",
      "Leselampe til nettbrett",
      "Læselampe til tablet",
      "Lukulamppu tabletille",
    ),
    metaDescription: t(
      "Uppladdningsbar LED-läslampa till surfplattan. 1200 mAh, tre färgtemperaturer, dimbar, med timer. Rosa, vit eller svart.",
      "Oppladbar LED-leselampe til nettbrettet. 1200 mAh, tre fargetemperaturer, dimbar, med timer. Rosa, hvit eller svart.",
      "Opladelig LED-læselampe til tabletten. 1200 mAh, tre farvetemperaturer, dæmpbar, med timer. Rosa, hvid eller sort.",
      "Ladattava LED-lukulamppu tabletille. 1200 mAh, kolme värilämpötilaa, himmennettävä, ajastin. Pinkki, valkoinen tai musta.",
    ),
    body: t(
      "<p>En klämbar LED-läslampa till surfplattan — ljus på sidan utan att lysa upp hela rummet.</p><ul><li><strong>Tre färgtemperaturer.</strong> Varmare eller kallare ljus, plus ljusstyrka.</li><li><strong>Timer.</strong> Lampan kan släckas av sig själv.</li><li><strong>Uppladdningsbar.</strong> Inbyggt 1200 mAh-batteri, utan extra sladd vid läsning.</li></ul><p>Inbyggt litiumbatteri 1200 mAh. Finns i rosa, vit och svart.</p>",
      "<p>En klemmbar LED-leselampe til nettbrettet — lys på siden uten å lyse opp hele rommet.</p><ul><li><strong>Tre fargetemperaturer.</strong> Varmere eller kaldere lys, pluss lysstyrke.</li><li><strong>Timer.</strong> Lampen kan slukke av seg selv.</li><li><strong>Oppladbar.</strong> Innebygd 1200 mAh-batteri, uten ekstra ledning mens du leser.</li></ul><p>Innebygd litiumbatteri 1200 mAh. Finnes i rosa, hvit og svart.</p>",
      "<p>En klembar LED-læselampe til tabletten — lys ved siden uden at lyse hele rummet op.</p><ul><li><strong>Tre farvetemperaturer.</strong> Varmere eller koldere lys, plus lysstyrke.</li><li><strong>Timer.</strong> Lampen kan slukke af sig selv.</li><li><strong>Opladelig.</strong> Indbygget 1200 mAh-batteri, uden ekstra ledning mens du læser.</li></ul><p>Indbygget lithiumbatteri 1200 mAh. Fås i rosa, hvid og sort.</p>",
      "<p>Kiinnitettävä LED-lukulamppu tabletille — valo sivulle ilman että koko huone valaistuu.</p><ul><li><strong>Kolme värilämpötilaa.</strong> Lämpimämpi tai kylmempi valo, plus kirkkaus.</li><li><strong>Ajastin.</strong> Lamppu voi sammuttaa itsensä.</li><li><strong>Ladattava.</strong> Sisäänrakennettu 1200 mAh-akku, ilman johtoa lukemisen ajaksi.</li></ul><p>Sisäänrakennettu litiumakku 1200 mAh. Pinkki, valkoinen tai musta.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Pink: t("Rosa", "Rosa", "Rosa", "Pinkki"),
          White: t("Vit", "Hvit", "Hvid", "Valkoinen"),
          Black: t("Svart", "Svart", "Sort", "Musta"),
        },
      },
    ],
  }),

  pack({
    handle: "resin-statue-led-light-ornaments",
    title: t(
      "LED-figur i resin",
      "LED-figur i resin",
      "LED-figur i resin",
      "LED-hahmo resinistä",
    ),
    metaTitle: t(
      "LED-figur i resin",
      "LED-figur i resin",
      "LED-figur i resin",
      "LED-hahmo resinistä",
    ),
    metaDescription: t(
      "Liten djurfigur i resin med LED. Katt eller tvättbjörn — USB med strömbrytare, eller knappbatteri.",
      "Liten dyrefigur i resin med LED. Katt eller vaskebjørn — USB med strømbryter, eller knappbatteri.",
      "Lille dyrefigur i resin med LED. Kat eller vaskebjørn — USB med kontakt, eller knapbatteri.",
      "Pieni eläinhahmo resinistä LED-valolla. Kissa tai pesukarhu — USB kytkimellä tai nappiparisto.",
    ),
    body: t(
      "<p>En liten djurfigur i resin med LED — nattlampa och prydnad i samma sak, till hyllan eller nattduksbordet.</p><ul><li><strong>Två djur.</strong> Katt eller tvättbjörn, välj ovan.</li><li><strong>Två utföranden.</strong> USB med separat strömbrytare, eller knappbatteri.</li><li><strong>Mjukt sken.</strong> Tänd när rummet ska vara stilla, inte upplyst.</li></ul><p>Material: resin. Välj djur och utförande ovan.</p>",
      "<p>En liten dyrefigur i resin med LED — nattlampe og pynt i ett, til hyllen eller nattbordet.</p><ul><li><strong>To dyr.</strong> Katt eller vaskebjørn, velg over.</li><li><strong>To utførelser.</strong> USB med egen strømbryter, eller knappbatteri.</li><li><strong>Mykt skjær.</strong> Tenn når rommet skal være stille, ikke opplyst.</li></ul><p>Materiale: resin. Velg dyr og utførelse over.</p>",
      "<p>En lille dyrefigur i resin med LED — natlampe og pynt i ét, til hylden eller natbordet.</p><ul><li><strong>To dyr.</strong> Kat eller vaskebjørn, vælg ovenfor.</li><li><strong>To udførelser.</strong> USB med separat kontakt, eller knapbatteri.</li><li><strong>Blødt skær.</strong> Tænd når rummet skal være stille, ikke oplyst.</li></ul><p>Materiale: resin. Vælg dyr og udførelse ovenfor.</p>",
      "<p>Pieni eläinhahmo resinistä LED-valolla — yövalo ja koriste samassa, hyllylle tai yöpöydälle.</p><ul><li><strong>Kaksi eläintä.</strong> Kissa tai pesukarhu, valitse yllä.</li><li><strong>Kaksi toteutusta.</strong> USB erillisellä kytkimellä, tai nappiparisto.</li><li><strong>Pehmeä valo.</strong> Sytytä kun huoneen pitää olla rauhallinen, ei kirkas.</li></ul><p>Materiaali: resin. Valitse eläin ja toteutus yllä.</p>",
    ),
    options: [
      {
        sourceName: "Färg",
        name: COLOR,
        values: {
          Tvättbjörn: t("Tvättbjörn", "Vaskebjørn", "Vaskebjørn", "Pesukarhu"),
          Katt: t("Katt", "Katt", "Kat", "Kissa"),
        },
      },
      {
        sourceName: "Storlek",
        name: t("Utförande", "Utførelse", "Udførelse", "Toteutus"),
        values: {
          "USB-modell med separat strömbrytare": t(
            "USB, separat strömbrytare",
            "USB, egen strømbryter",
            "USB, separat kontakt",
            "USB, erillinen kytkin",
          ),
          "Knapp Stil": t("Knappbatteri", "Knappbatteri", "Knapbatteri", "Nappiparisto"),
        },
      },
    ],
  }),
];

export const catalogCopyByHandle = new Map(
  catalogCopy.map((product) => [product.handle, product]),
);
