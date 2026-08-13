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

  pack({
    handle:
      "stainless-steel-ebony-cutting-board-antibacterial-and-mildewproof-double-sided-cutting-board",
    title: t(
      "Dubbelsidig skärbräda i ebenholts och stål",
      "Dobbeltsidig skjærebrett i ibenholt og stål",
      "Dobbeltsidet skærebræt i ibenholt og stål",
      "Kaksipuolinen leikkuulauta eebenpuuta ja terästä",
    ),
    metaTitle: t(
      "Dubbelsidig skärbräda",
      "Dobbeltsidig skjærebrett",
      "Dobbeltsidet skærebræt",
      "Kaksipuolinen leikkuulauta",
    ),
    metaDescription: t(
      "Kvadratisk skärbräda med ebenholts och stål, ca 47 × 33,5 cm. En sida för vardagen, två ytor att vända.",
      "Kvadratisk skjærebrett med ibenholt og stål, ca. 47 × 33,5 cm. Én side for hverdagen, to flater å snu.",
      "Kvadratisk skærebræt med ibenholt og stål, ca. 47 × 33,5 cm. Én side til hverdagen, to flader at vende.",
      "Neliömäinen leikkuulauta eebenpuuta ja terästä, n. 47 × 33,5 cm. Kaksi puolta käännettäväksi.",
    ),
    body: t(
      "<p>En kvadratisk skärbräda med två sidor — ebenholts mot bänken, stål när du vill torka av snabbt.</p><ul><li><strong>Två ytor.</strong> Vänd brädan efter vad du skär.</li><li><strong>Stor yta.</strong> Extra large, ca 47 × 33,5 cm.</li><li><strong>Till vardagen.</strong> En bräda att ha framme, inte gömd i en låda.</li></ul><p>Material: ebenholts och stål. Form: kvadrat. Extra large.</p>",
      "<p>Et kvadratisk skjærebrett med to sider — ibenholt mot benken, stål når du vil tørke av fort.</p><ul><li><strong>To flater.</strong> Snu brettet etter hva du skjærer.</li><li><strong>Stor flate.</strong> Extra large, ca. 47 × 33,5 cm.</li><li><strong>Til hverdagen.</strong> Et brett å ha fremme, ikke gjemt i en skuff.</li></ul><p>Materiale: ibenholt og stål. Form: kvadrat. Extra large.</p>",
      "<p>Et kvadratisk skærebræt med to sider — ibenholt mod bordet, stål når du vil tørre af hurtigt.</p><ul><li><strong>To flader.</strong> Vend brættet efter det, du skærer.</li><li><strong>Stor flade.</strong> Extra large, ca. 47 × 33,5 cm.</li><li><strong>Til hverdagen.</strong> Et bræt at have fremme, ikke gemt i en skuffe.</li></ul><p>Materiale: ibenholt og stål. Form: kvadrat. Extra large.</p>",
      "<p>Neliömäinen leikkuulauta kahdella puolella — eebenpuu tasoa vasten, teräs kun haluat pyyhkiä nopeasti.</p><ul><li><strong>Kaksi pintaa.</strong> Käännä lauta sen mukaan mitä leikkaat.</li><li><strong>Iso pinta.</strong> Extra large, n. 47 × 33,5 cm.</li><li><strong>Arkeen.</strong> Lauta pidettäväksi esillä, ei piilossa laatikossa.</li></ul><p>Materiaali: eebenpuu ja teräs. Muoto: neliö. Extra large.</p>",
    ),
    options: [
      {
        sourceName: "Specifications",
        name: t("Storlek", "Størrelse", "Størrelse", "Koko"),
        values: {
          "Extra Large": t("Extra large", "Extra large", "Extra large", "Extra large"),
        },
      },
      {
        sourceName: "Shape",
        name: t("Form", "Form", "Form", "Muoto"),
        values: { Square: t("Kvadrat", "Kvadrat", "Kvadrat", "Neliö") },
      },
    ],
  }),

  pack({
    handle: "copper-wine-glass-cocktail-mug-bar-cold-drink-pure-copper-cup",
    title: t(
      "Cocktailmugg i koppar",
      "Cocktailkrus i kobber",
      "Cocktailkrus i kobber",
      "Cocktailmuki kuparista",
    ),
    metaTitle: t(
      "Cocktailmugg i koppar",
      "Cocktailkrus i kobber",
      "Cocktailkrus i kobber",
      "Cocktailmuki kuparista",
    ),
    metaDescription: t(
      "Mugg i ren koppar till drinken. Kall att hålla i, enkel att duka med. Välj 1 eller 2 stycken.",
      "Krus i ren kobber til drinken. Kald å holde i, enkel å dekke med. Velg 1 eller 2 stykker.",
      "Krus i ren kobber til drinken. Kold at holde i, nem at dække med. Vælg 1 eller 2 stykker.",
      "Muki puhdasta kuparia drinkille. Kylmä käteen, helppo kattaa. Valitse 1 tai 2 kpl.",
    ),
    body: t(
      "<p>En mugg i ren koppar till drinken — den känns kall i handen och ser ut som bar, inte piknik.</p><ul><li><strong>Ren koppar.</strong> Materialet leder kyla, utan extra is i glaset.</li><li><strong>Till mixern.</strong> Cocktail, longdrink eller bara kallt vatten.</li><li><strong>Ett eller två.</strong> Välj antal ovan.</li></ul><p>Material: ren koppar. Välj 1 eller 2 st.</p>",
      "<p>Et krus i ren kobber til drinken — det kjennes kaldt i hånden og ser ut som bar, ikke piknik.</p><ul><li><strong>Ren kobber.</strong> Materialet leder kulde, uten ekstra is i glasset.</li><li><strong>Til mixer.</strong> Cocktail, longdrink eller bare kaldt vann.</li><li><strong>Én eller to.</strong> Velg antall over.</li></ul><p>Materiale: ren kobber. Velg 1 eller 2 stk.</p>",
      "<p>Et krus i ren kobber til drinken — det føles koldt i hånden og ser ud som bar, ikke picnic.</p><ul><li><strong>Ren kobber.</strong> Materialet leder kulde, uden ekstra is i glasset.</li><li><strong>Til mixer.</strong> Cocktail, longdrink eller bare koldt vand.</li><li><strong>Én eller to.</strong> Vælg antal ovenfor.</li></ul><p>Materiale: ren kobber. Vælg 1 eller 2 stk.</p>",
      "<p>Muki puhdasta kuparia drinkille — se tuntuu kylmältä kädessä ja näyttää baarilta, ei piknikiltä.</p><ul><li><strong>Puhdasta kuparia.</strong> Materiaali johtaa kylmää ilman lisäjäitä lasissa.</li><li><strong>Drinkkeihin.</strong> Cocktail, long drink tai pelkkä kylmä vesi.</li><li><strong>Yksi tai kaksi.</strong> Valitse määrä yllä.</li></ul><p>Materiaali: puhdas kupari. Valitse 1 tai 2 kpl.</p>",
    ),
    options: [
      {
        sourceName: "style",
        name: STYLE,
        values: { Copper: t("Koppar", "Kobber", "Kobber", "Kupari") },
      },
      {
        sourceName: "quantity",
        name: t("Antal", "Antall", "Antal", "Määrä"),
        values: {
          "1PCS": t("1 st", "1 stk", "1 stk", "1 kpl"),
          "2PCS": t("2 st", "2 stk", "2 stk", "2 kpl"),
        },
      },
    ],
  }),

  pack({
    handle: "metal-flanged-copper-plated-hammered-stainless-steel-mug",
    title: t(
      "Hamrad mugg med kopparfinish",
      "Hamret krus med kobberfinish",
      "Hamret krus med kobberfinish",
      "Taottu muki kuparipinnalla",
    ),
    metaTitle: t(
      "Hamrad mugg i stål",
      "Hamret krus i stål",
      "Hamret krus i stål",
      "Taottu teräsmuki",
    ),
    metaDescription: t(
      "Rostfri mugg med hamrad yta och kopparplätering, ca 401–500 ml. Rullad kant, en i förpackningen.",
      "Rustfritt krus med hamret flate og kobberplettering, ca. 401–500 ml. Rullet kant, én i esken.",
      "Rustfrit krus med hamret flade og kobberplettering, ca. 401–500 ml. Rullet kant, én i æsken.",
      "Ruostumaton muki taotulla pinnalla ja kuparipinnoitteella, n. 401–500 ml. Taitettu reuna, yksi pakkauksessa.",
    ),
    body: t(
      "<p>En rostfri mugg med hamrad yta och kopparplätering — den tar ca 4–5 dl och har rullad kant.</p><ul><li><strong>Hamrad look.</strong> Ojämn yta, inte blank industri.</li><li><strong>Stål under.</strong> Kopparpläterad in- och utvändigt.</li><li><strong>Till drinken.</strong> En mugg, inte ett set.</li></ul><p>Material: rostfritt stål, kopparpläterad. Volym ca 401–500 ml.</p>",
      "<p>Et rustfritt krus med hamret flate og kobberplettering — det tar ca. 4–5 dl og har rullet kant.</p><ul><li><strong>Hamret uttrykk.</strong> Ujevn flate, ikke blank industri.</li><li><strong>Stål under.</strong> Kobberbelagt inn- og utvendig.</li><li><strong>Til drinken.</strong> Ett krus, ikke et sett.</li></ul><p>Materiale: rustfritt stål, kobberbelagt. Volum ca. 401–500 ml.</p>",
      "<p>Et rustfrit krus med hamret flade og kobberplettering — det rummer ca. 4–5 dl og har rullet kant.</p><ul><li><strong>Hamret look.</strong> Ujævn flade, ikke blank industri.</li><li><strong>Stål under.</strong> Kobberbelagt ind- og udvendigt.</li><li><strong>Til drinken.</strong> Ét krus, ikke et sæt.</li></ul><p>Materiale: rustfrit stål, kobberbelagt. Rumfang ca. 401–500 ml.</p>",
      "<p>Ruostumaton muki taotulla pinnalla ja kuparipinnoitteella — tilavuus n. 4–5 dl, taitettu reuna.</p><ul><li><strong>Taottu pinta.</strong> Epätasainen, ei teollisen sileä.</li><li><strong>Terästä alla.</strong> Kuparipinnoite sisällä ja ulkona.</li><li><strong>Drinkille.</strong> Yksi muki, ei setti.</li></ul><p>Materiaali: ruostumaton teräs, kuparipinnoitettu. Tilavuus n. 401–500 ml.</p>",
    ),
    options: [
      {
        sourceName: "Style",
        name: STYLE,
        values: {
          "Crimped Copper Cup": t(
            "Rullad kant, koppar",
            "Rullet kant, kobber",
            "Rullet kant, kobber",
            "Taitettu reuna, kupari",
          ),
        },
      },
    ],
  }),

  pack({
    handle:
      "ice-cubes-set-herbruikbare-chilling-stones-voor-whiskey-cooling-cube-koelen-rots-party-bar-tool",
    title: t(
      "Återanvändbara iskuber i stål",
      "Gjenbrukbare isbiter i stål",
      "Genanvendelige isterninger i stål",
      "Uudelleenkäytettävät teräsjääpalat",
    ),
    metaTitle: t(
      "Iskuber i rostfritt stål",
      "Isbiter i rustfritt stål",
      "Isterninger i rustfrit stål",
      "Jääpalat ruostumatonta terästä",
    ),
    metaDescription: t(
      "Stålkuber som kyler drinken utan att späs ut. Frys in, lägg i glaset. Välj form och antal ovan.",
      "Stålbiter som kjøler drinken uten å tynne den ut. Frys, legg i glasset. Velg form og antall over.",
      "Stålterninger der køler drinken uden at fortynde den. Frys, læg i glasset. Vælg form og antal ovenfor.",
      "Teräskuutiot jäähdyttävät drinkin laimentamatta. Pakasta, laita lasiin. Valitse muoto ja määrä yllä.",
    ),
    body: t(
      "<p>Rostfria kuber att frysa in — de kyler drinken utan att smälta ut i glaset.</p><ul><li><strong>Ingen utspädning.</strong> Till whisky, öl eller saft när is skulle ändra smaken.</li><li><strong>Flera former.</strong> Kub, klot, diamant eller hjärta — välj ovan.</li><li><strong>Återanvänd.</strong> Skölj, frys in igen. Tång följer med vissa set.</li></ul><p>Material: rostfritt stål. Frys minst 4 timmar. Lägg 1–3 kuber i glaset, vänta några minuter. Tugga eller svälj dem inte.</p>",
      "<p>Rustfrie biter å fryse inn — de kjøler drinken uten å smelte ut i glasset.</p><ul><li><strong>Ingen uttynning.</strong> Til whisky, øl eller saft når is ville endret smaken.</li><li><strong>Flere former.</strong> Kube, kule, diamant eller hjerte — velg over.</li><li><strong>Gjenbruk.</strong> Skyll, frys inn igjen. Tang følger med enkelte sett.</li></ul><p>Materiale: rustfritt stål. Frys minst 4 timer. Legg 1–3 biter i glasset, vent noen minutter. Ikke tygg eller svelg dem.</p>",
      "<p>Rustfrie terninger at fryse ned — de køler drinken uden at smelte ud i glasset.</p><ul><li><strong>Ingen fortynding.</strong> Til whisky, øl eller saft, når is ville ændre smagen.</li><li><strong>Flere former.</strong> Terning, kugle, diamant eller hjerte — vælg ovenfor.</li><li><strong>Genbrug.</strong> Skyl, frys igen. Tang følger med visse sæt.</li></ul><p>Materiale: rustfrit stål. Frys mindst 4 timer. Læg 1–3 terninger i glasset, vent et par minutter. Tyg eller slug dem ikke.</p>",
      "<p>Ruostumattomat kuutiot pakastimeen — ne jäähdyttävät drinkin sulamatta lasiin.</p><ul><li><strong>Ei laimennusta.</strong> Viskille, oluelle tai mehulle, kun jää muuttaisi maun.</li><li><strong>Useita muotoja.</strong> Kuutio, pallo, timantti tai sydän — valitse yllä.</li><li><strong>Uudelleen käyttöön.</strong> Huuhtele, pakasta uudelleen. Pihti kuuluu joihinkin setteihin.</li></ul><p>Materiaali: ruostumaton teräs. Pakasta vähintään 4 tuntia. Laita 1–3 kuutiota lasiin, odota muutama minuutti. Älä pureskele tai niele.</p>",
    ),
    options: [
      {
        sourceName: "style",
        name: t("Form", "Form", "Form", "Muoto"),
        values: {
          Circular: t("Cirkel", "Sirkel", "Cirkel", "Ympyrä"),
          Diamonds: t("Diamant", "Diamant", "Diamant", "Timantti"),
          Love: t("Hjärta", "Hjerte", "Hjerte", "Sydän"),
          Round: t("Klot", "Kule", "Kugle", "Pallo"),
          "Silica gel": t("Silikon", "Silikon", "Silikone", "Silikoni"),
          Square: t("Kub", "Kube", "Terning", "Kuutio"),
        },
      },
      {
        sourceName: "quantity",
        name: t("Antal", "Antall", "Antal", "Määrä"),
        values: {
          "8pcs": t("8 st", "8 stk", "8 stk", "8 kpl"),
          "4pcs": t("4 st", "4 stk", "4 stk", "4 kpl"),
          "1PCS": t("1-pack", "1-pack", "1-pakke", "1-pakkaus"),
          "1pcs": t("1 st", "1 stk", "1 stk", "1 kpl"),
          "4pcs with tongs": t("4 st med tång", "4 stk med tang", "4 stk med tang", "4 kpl + pihti"),
          "6pcs": t("6 st", "6 stk", "6 stk", "6 kpl"),
          "6pcs with tongs": t("6 st med tång", "6 stk med tang", "6 stk med tang", "6 kpl + pihti"),
        },
      },
    ],
  }),

  pack({
    handle: "coffee-clip-spoon",
    title: t(
      "Kaffemått med påsklämma",
      "Kaffemål med poseklemme",
      "Kaffemål med poseklemme",
      "Kahvamitta pussiklipillä",
    ),
    metaTitle: t(
      "Kaffemått med klämma",
      "Kaffemål med klemme",
      "Kaffemål med klemme",
      "Kahvamitta klipillä",
    ),
    metaDescription: t(
      "Rostfritt kaffemått som också klämmer igen påsen. Ca 17,5 cm. Välj färg ovan.",
      "Rustfritt kaffemål som også klemmer igjen posen. Ca. 17,5 cm. Velg farge over.",
      "Rustfrit kaffemål, der også klemmer posen. Ca. 17,5 cm. Vælg farve ovenfor.",
      "Ruostumaton kahvamitta, joka myös sulkee pussin. N. 17,5 cm. Valitse väri yllä.",
    ),
    body: t(
      "<p>Ett kaffemått i rostfritt stål med klämma i skaftet — du öser och stänger påsen med samma sak.</p><ul><li><strong>Två jobb.</strong> Mått och påsklämma, utan extra clips i lådan.</li><li><strong>Rostfritt.</strong> Tål disk och vardag vid burken.</li><li><strong>Flera färger.</strong> Stål, svart, guld eller roséguld — eller 2-pack.</li></ul><p>Material: rostfritt stål. Ca 17,5 × 3,5 × 2,5 cm, cirka 41 g.</p>",
      "<p>Et kaffemål i rustfritt stål med klemme i skaftet — du øser og lukker posen med samme ting.</p><ul><li><strong>To jobber.</strong> Mål og poseklemme, uten ekstra clips i skuffen.</li><li><strong>Rustfritt.</strong> Tåler oppvask og hverdag ved boksen.</li><li><strong>Flere farger.</strong> Stål, svart, gull eller roségull — eller 2-pack.</li></ul><p>Materiale: rustfritt stål. Ca. 17,5 × 3,5 × 2,5 cm, rundt 41 g.</p>",
      "<p>Et kaffemål i rustfrit stål med klemme i skaftet — du øser og lukker posen med samme ting.</p><ul><li><strong>To opgaver.</strong> Mål og poseklemme, uden ekstra clips i skuffen.</li><li><strong>Rustfrit.</strong> Tåler opvask og hverdag ved bøtten.</li><li><strong>Flere farver.</strong> Stål, sort, guld eller roséguld — eller 2-pak.</li></ul><p>Materiale: rustfrit stål. Ca. 17,5 × 3,5 × 2,5 cm, omkring 41 g.</p>",
      "<p>Ruostumaton kahvamitta, jonka varressa on klipsi — mittaat ja suljet pussin samalla.</p><ul><li><strong>Kaksi hommaa.</strong> Mitta ja pussiklipsi, ilman erillisiä klipsejä.</li><li><strong>Ruostumaton.</strong> Kestää tiskauksen ja arjen purkin äärellä.</li><li><strong>Useita värejä.</strong> Teräs, musta, kulta tai ruusukulta — tai 2-pack.</li></ul><p>Materiaali: ruostumaton teräs. N. 17,5 × 3,5 × 2,5 cm, noin 41 g.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          "2XStainless steel": t("2-pack, rostfritt", "2-pack, rustfritt", "2-pak, rustfrit", "2-pack, teräs"),
          Black: t("Svart", "Svart", "Sort", "Musta"),
          Gold: t("Guld", "Gull", "Guld", "Kulta"),
          "Rose gold": t("Roséguld", "Roségull", "Roséguld", "Ruusukulta"),
          "Stainless steel": t("Rostfritt stål", "Rustfritt stål", "Rustfrit stål", "Ruostumaton teräs"),
        },
      },
    ],
  }),

  pack({
    handle: "garden-garden-tools-wooden-handle-rake-five-tooth-rake",
    title: t(
      "Trädgårdsredskap med träskeft",
      "Hageredskap med treskaft",
      "Haveredskab med træskaft",
      "Puutarhavälineet puuvarrella",
    ),
    metaTitle: t(
      "Trädgårdsredskap i järn och trä",
      "Hageredskap i jern og tre",
      "Haveredskab i jern og træ",
      "Puutarhavälineet rautaa ja puuta",
    ),
    metaDescription: t(
      "Små redskap i järn med träskeft till balkong och land. Välj kratta, spade, hacka eller 5-delarsset.",
      "Små redskaper i jern med treskaft til balkong og bed. Velg rive, spade, hakke eller 5-delerssett.",
      "Små redskaber i jern med træskaft til altan og bed. Vælg rive, spade, hakke eller 5-delessæt.",
      "Pienet rautaiset välineet puuvarrella parvekkeelle ja maahan. Valitse harava, lapio, kuokka tai 5-osainen setti.",
    ),
    body: t(
      "<p>Små redskap i järn med träskeft — till balkonglådan, odlingslandet eller krukorna.</p><ul><li><strong>Ett i taget eller set.</strong> Kratta, lång spade, kort spade, hacka eller 5-delarsset.</li><li><strong>Trä i handen.</strong> Skaft att greppa, järn i jorden.</li><li><strong>Nära huset.</strong> Inte fullstora redskap till åkern.</li></ul><p>Material: järn och trä. Välj modell ovan.</p>",
      "<p>Små redskaper i jern med treskaft — til balkongkassen, bedet eller krukkene.</p><ul><li><strong>Én og én eller sett.</strong> Rive, lang spade, kort spade, hakke eller 5-delerssett.</li><li><strong>Tre i hånden.</strong> Skaft å gripe, jern i jorda.</li><li><strong>Nært huset.</strong> Ikke fullstore redskaper til åkeren.</li></ul><p>Materiale: jern og tre. Velg modell over.</p>",
      "<p>Små redskaber i jern med træskaft — til altankassen, bedet eller krukkerne.</p><ul><li><strong>Én ad gangen eller sæt.</strong> Rive, lang spade, kort spade, hakke eller 5-delessæt.</li><li><strong>Træ i hånden.</strong> Skaft at gribe, jern i jorden.</li><li><strong>Tæt på huset.</strong> Ikke fuldstore redskaber til marken.</li></ul><p>Materiale: jern og træ. Vælg model ovenfor.</p>",
      "<p>Pienet rautaiset välineet puuvarrella — parvekelaatikkoon, maahan tai ruukkuun.</p><ul><li><strong>Yksi kerrallaan tai setti.</strong> Harava, pitkä lapio, lyhyt lapio, kuokka tai 5-osainen setti.</li><li><strong>Puu kädessä.</strong> Varsi otteeseen, rauta maahan.</li><li><strong>Lähellä taloa.</strong> Ei täysikokoisia peltovälineitä.</li></ul><p>Materiaali: rauta ja puu. Valitse malli yllä.</p>",
    ),
    options: [
      {
        sourceName: "style",
        name: STYLE,
        values: {
          "5piece set": t("5-delarsset", "5-delerssett", "5-delessæt", "5-osainen setti"),
          "Dual purpose hoe": t("Tveegad hacka", "Toegget hakke", "Toægget hakke", "Kaksipuolinen kuokka"),
          Koho: t("Hacka", "Hakke", "Hakke", "Hakku"),
          "Long shovel": t("Lång spade", "Lang spade", "Lang spade", "Pitkä lapio"),
          Rake: t("Kratta", "Rive", "Rive", "Harava"),
          "Short shovel": t("Kort spade", "Kort spade", "Kort spade", "Lyhyt lapio"),
        },
      },
    ],
  }),

  pack({
    handle:
      "anti-puncture-gardening-garden-breathable-wear-resistant-labor-protection-stab-resistant-gloves",
    title: t(
      "Trädgårdshandskar med nitril",
      "Hagehansker med nitril",
      "Havehandsker med nitril",
      "Puutarhahanskat nitriilillä",
    ),
    metaTitle: t(
      "Trädgårdshandskar",
      "Hagehansker",
      "Havehandsker",
      "Puutarhahanskat",
    ),
    metaDescription: t(
      "Nylonhandskar med nitrildoppade handflator till odlingen. Välj färg och storlek XS–M.",
      "Nylonhansker med nitrildyppede håndflater til hagen. Velg farge og størrelse XS–M.",
      "Nylonhandsker med nitrildyppede håndflader til haven. Vælg farve og størrelse XS–M.",
      "Nailonhanskat nitriilipinnoitetulla kämmenellä puutarhaan. Valitse väri ja koko XS–M.",
    ),
    body: t(
      "<p>Tunna trädgårdshandskar med nitril i handflatan — grepp i jorden, lite luft på ryggen.</p><ul><li><strong>Nitril mot fukt.</strong> Doppad handflata, nylon i övrigt.</li><li><strong>Grepp.</strong> Till krukor, ogräs och redskap.</li><li><strong>Tre storlekar.</strong> XS, S eller M. Blå, rosa eller lila.</li></ul><p>Material: nylon med nitrildoppade handflator. Välj färg och storlek ovan.</p>",
      "<p>Tynne hagehansker med nitril i håndflaten — grep i jorda, litt luft på ryggen.</p><ul><li><strong>Nitril mot fukt.</strong> Dyppet håndflate, nylon ellers.</li><li><strong>Grep.</strong> Til krukker, ugress og redskaper.</li><li><strong>Tre størrelser.</strong> XS, S eller M. Blå, rosa eller lilla.</li></ul><p>Materiale: nylon med nitrildyppede håndflater. Velg farge og størrelse over.</p>",
      "<p>Tynde havehandsker med nitril i håndfladen — greb i jorden, lidt luft på ryggen.</p><ul><li><strong>Nitril mod fugt.</strong> Dyppet håndflade, nylon ellers.</li><li><strong>Greb.</strong> Til krukker, ukrudt og redskaber.</li><li><strong>Tre størrelser.</strong> XS, S eller M. Blå, rosa eller lilla.</li></ul><p>Materiale: nylon med nitrildyppede håndflader. Vælg farve og størrelse ovenfor.</p>",
      "<p>Ohuet puutarhahanskat nitriilillä kämmenessä — ote maasta, hieman ilmaa selkäpuolella.</p><ul><li><strong>Nitriili kosteutta vastaan.</strong> Kastettu kämmen, muuten nailon.</li><li><strong>Ote.</strong> Ruukkuun, rikkaruohoon ja välineisiin.</li><li><strong>Kolme kokoa.</strong> XS, S tai M. Sininen, pinkki tai lila.</li></ul><p>Materiaali: nailon, nitriilipinnoitetut kämmenet. Valitse väri ja koko yllä.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Blue: t("Blå", "Blå", "Blå", "Sininen"),
          Pink: t("Rosa", "Rosa", "Rosa", "Pinkki"),
          Purple: t("Lila", "Lilla", "Lilla", "Lila"),
        },
      },
      {
        sourceName: "Size",
        name: SIZE,
        values: {
          M: t("M", "M", "M", "M"),
          S: t("S", "S", "S", "S"),
          XS: t("XS", "XS", "XS", "XS"),
        },
      },
    ],
  }),

  pack({
    handle: "solar-garden-light-garden-garden-grass-layout-plug-in-light-and-shadow-light",
    title: t(
      "Solcellsbelysning till gräsmattan",
      "Solcellelys til plenen",
      "Solcellelys til plænen",
      "Aurinkovalot nurmikolle",
    ),
    metaTitle: t(
      "Solcellsbelysning, droppform",
      "Solcellelys, dråpeform",
      "Solcellelys, dråbeform",
      "Aurinkovalo, pisara",
    ),
    metaDescription: t(
      "LED-lampor med solcell till gräsmattan, droppform i glas och stål. Välj 2 eller 4 stycken.",
      "LED-lamper med solcelle til plenen, dråpeform i glass og stål. Velg 2 eller 4 stykker.",
      "LED-lamper med solcelle til plænen, dråbeform i glas og stål. Vælg 2 eller 4 stykker.",
      "LED-valot aurinkokennolla nurmikolle, pisara lasia ja terästä. Valitse 2 tai 4 kpl.",
    ),
    body: t(
      "<p>Små LED-lampor med solcell att sticka i gräsmattan — droppform i glas och stål, ljus när det mörknar.</p><ul><li><strong>Solcell.</strong> Ingen sladd ut i rabatten.</li><li><strong>Droppform.</strong> Glas och stål, silver.</li><li><strong>2 eller 4.</strong> Välj antal ovan.</li></ul><p>Material: glas och stål. Ljuskälla: LED. Välj 2 eller 4 st.</p>",
      "<p>Små LED-lamper med solcelle å stikke i plenen — dråpeform i glass og stål, lys når det mørkner.</p><ul><li><strong>Solcelle.</strong> Ingen ledning ut i bedet.</li><li><strong>Dråpeform.</strong> Glass og stål, sølv.</li><li><strong>2 eller 4.</strong> Velg antall over.</li></ul><p>Materiale: glass og stål. Lyskilde: LED. Velg 2 eller 4 stk.</p>",
      "<p>Små LED-lamper med solcelle at stikke i plænen — dråbeform i glas og stål, lys når det mørkner.</p><ul><li><strong>Solcelle.</strong> Ingen ledning ud i bedet.</li><li><strong>Dråbeform.</strong> Glas og stål, sølv.</li><li><strong>2 eller 4.</strong> Vælg antal ovenfor.</li></ul><p>Materiale: glas og stål. Lyskilde: LED. Vælg 2 eller 4 stk.</p>",
      "<p>Pienet LED-valot aurinkokennolla nurmikkoon — pisara lasia ja terästä, valo pimennettäessä.</p><ul><li><strong>Aurinkokenno.</strong> Ei johtoa penkkiin.</li><li><strong>Pisara.</strong> Lasi ja teräs, hopea.</li><li><strong>2 tai 4.</strong> Valitse määrä yllä.</li></ul><p>Materiaali: lasi ja teräs. Valonlähde: LED. Valitse 2 tai 4 kpl.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: { Silver: t("Silver", "Sølv", "Sølv", "Hopea") },
      },
      {
        sourceName: "quantity",
        name: t("Antal", "Antall", "Antal", "Määrä"),
        values: {
          "2PCS": t("2 st", "2 stk", "2 stk", "2 kpl"),
          "4PCS": t("4 st", "4 stk", "4 stk", "4 kpl"),
        },
      },
    ],
  }),

  pack({
    handle: "fashion-solar-lawn-light-outdoor-garden",
    title: t(
      "Solcellslampa 40 cm till trädgården",
      "Solcellelampe 40 cm til hagen",
      "Solcellelampe 40 cm til haven",
      "40 cm aurinkovalaisin puutarhaan",
    ),
    metaTitle: t(
      "Solcellslampa 40 cm",
      "Solcellelampe 40 cm",
      "Solcellelampe 40 cm",
      "Aurinkovalaisin 40 cm",
    ),
    metaDescription: t(
      "Utomhuslampa 40 cm med IP65. Välj sockel eller markspett. Enkel, modern form.",
      "Utendørslampe 40 cm med IP65. Velg sokkel eller bakkespett. Enkel, moderne form.",
      "Udendørslampe 40 cm med IP65. Vælg sokkel eller jordspyd. Enkel, moderne form.",
      "Ulkovalaisin 40 cm, IP65. Valitse jalka tai maapiikki. Yksinkertainen, moderni muoto.",
    ),
    body: t(
      "<p>En 40 cm lampa till gräsmattan eller gången — enkel form, tänkt att stå ute.</p><ul><li><strong>IP65.</strong> Skyddad mot regn och damm enligt märkningen.</li><li><strong>Två fästen.</strong> Sockel eller markspett, välj ovan.</li><li><strong>40 cm.</strong> Synlig i rabatten utan att ta över.</li></ul><p>Höjd 40 cm. Skyddsklass IP65. Eluttag enligt vald variant.</p>",
      "<p>En 40 cm lampe til plenen eller gangen — enkel form, tenkt å stå ute.</p><ul><li><strong>IP65.</strong> Beskyttet mot regn og støv ifølge merkingen.</li><li><strong>To fester.</strong> Sokkel eller bakkespett, velg over.</li><li><strong>40 cm.</strong> Synlig i bedet uten å ta over.</li></ul><p>Høyde 40 cm. Beskyttelsesklasse IP65. Stikkontakt etter valgt variant.</p>",
      "<p>En 40 cm lampe til plænen eller gangen — enkel form, tænkt til at stå ude.</p><ul><li><strong>IP65.</strong> Beskyttet mod regn og støv ifølge mærkningen.</li><li><strong>To beslag.</strong> Sokkel eller jordspyd, vælg ovenfor.</li><li><strong>40 cm.</strong> Synlig i bedet uden at fylde.</li></ul><p>Højde 40 cm. Kapslingsklasse IP65. Stik efter valgt variant.</p>",
      "<p>40 cm valaisin nurmikolle tai käytävälle — yksinkertainen muoto, ulos.</p><ul><li><strong>IP65.</strong> Suojattu sateelta ja pölyltä merkinnän mukaan.</li><li><strong>Kaksi kiinnitystä.</strong> Jalka tai maapiikki, valitse yllä.</li><li><strong>40 cm.</strong> Näkyy penkissä ottamatta valtaa.</li></ul><p>Korkeus 40 cm. Suojaluokka IP65. Pistoke valitun variantin mukaan.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: t("Fäste", "Feste", "Beslag", "Kiinnitys"),
        values: {
          "40cm base type": t("40 cm, sockel", "40 cm, sokkel", "40 cm, sokkel", "40 cm, jalka"),
          "40cm ground plug": t("40 cm, markspett", "40 cm, bakkespett", "40 cm, jordspyd", "40 cm, maapiikki"),
        },
      },
      {
        sourceName: "Electrical outlet",
        name: t("Eluttag", "Stikkontakt", "Stik", "Pistoke"),
        values: { "220V US": t("220 V, US", "220 V, US", "220 V, US", "220 V, US") },
      },
    ],
  }),

  pack({
    handle: "stainless-steel-watering-can-watering-can-long-mouth-garden-watering-can",
    title: t(
      "Vattenkanna i stål med lång pip",
      "Vannkanne i stål med lang tut",
      "Vandkande i stål med lang tud",
      "Teräskannu pitkällä tuitilla",
    ),
    metaTitle: t(
      "Vattenkanna 1,5 L i stål",
      "Vannkanne 1,5 L i stål",
      "Vandkande 1,5 L i stål",
      "Kastelukannu 1,5 L terästä",
    ),
    metaDescription: t(
      "Rostfri vattenkanna med lång pip, 1,5 L. Guld eller roséguld — till krukorna inomhus och på balkongen.",
      "Rustfri vannkanne med lang tut, 1,5 L. Gull eller roségull — til krukkene inne og på balkongen.",
      "Rustfri vandkande med lang tud, 1,5 L. Guld eller roséguld — til krukkerne inde og på altanen.",
      "Ruostumaton kastelukannu pitkällä tuitilla, 1,5 L. Kulta tai ruusukulta — ruukkuun sisällä ja parvekkeella.",
    ),
    body: t(
      "<p>En rostfri vattenkanna med lång pip — 1,5 liter, till krukorna utan att spilla över kanten.</p><ul><li><strong>Lång pip.</strong> Riktar vattnet, inte hela jordklumpen på en gång.</li><li><strong>1,5 L.</strong> Lagom till några krukor, inte till hela landet.</li><li><strong>Guld eller roséguld.</strong> Välj färg ovan.</li></ul><p>Material: rostfritt stål. Volym 1500 ml.</p>",
      "<p>En rustfri vannkanne med lang tut — 1,5 liter, til krukkene uten å søle over kanten.</p><ul><li><strong>Lang tut.</strong> Retter vannet, ikke hele jordklumpen på én gang.</li><li><strong>1,5 L.</strong> Passer til noen krukker, ikke til hele bedet.</li><li><strong>Gull eller roségull.</strong> Velg farge over.</li></ul><p>Materiale: rustfritt stål. Volum 1500 ml.</p>",
      "<p>En rustfri vandkande med lang tud — 1,5 liter, til krukkerne uden at spilde over kanten.</p><ul><li><strong>Lang tud.</strong> Retter vandet, ikke hele jordklumpen på én gang.</li><li><strong>1,5 L.</strong> Til nogle krukker, ikke til hele bedet.</li><li><strong>Guld eller roséguld.</strong> Vælg farve ovenfor.</li></ul><p>Materiale: rustfrit stål. Rumfang 1500 ml.</p>",
      "<p>Ruostumaton kastelukannu pitkällä tuitilla — 1,5 litraa, ruukkuun ilman roiskeita reunojen yli.</p><ul><li><strong>Pitkä tuiti.</strong> Ohjaa veden, ei koko paakkua kerralla.</li><li><strong>1,5 L.</strong> Muutamalle ruukulle, ei koko maalle.</li><li><strong>Kulta tai ruusukulta.</strong> Valitse väri yllä.</li></ul><p>Materiaali: ruostumaton teräs. Tilavuus 1500 ml.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Gold: t("Guld", "Gull", "Guld", "Kulta"),
          "Rose Gold": t("Roséguld", "Roségull", "Roséguld", "Ruusukulta"),
        },
      },
      {
        sourceName: "capacity",
        name: t("Volym", "Volum", "Rumfang", "Tilavuus"),
        values: { "1500ML": t("1,5 L", "1,5 L", "1,5 L", "1,5 L") },
      },
    ],
  }),

  pack({
    handle: "bedroom-makeup-mirror",
    title: t(
      "Sminkspegel med järnram",
      "Sminkespeil med jernramme",
      "Makeupspejl med jernramme",
      "Meikkipeili rautakehyksellä",
    ),
    metaTitle: t(
      "Sminkspegel till byrån",
      "Sminkespeil til kommoden",
      "Makeupspejl til kommoden",
      "Meikkipeili lipastoon",
    ),
    metaDescription: t(
      "Klar spegel med järnram till byrån. Välj svart, guld eller rosa — två storlekar.",
      "Klart speil med jernramme til kommoden. Velg svart, gull eller rosa — to størrelser.",
      "Klart spejl med jernramme til kommoden. Vælg sort, guld eller rosa — to størrelser.",
      "Kirkas peili rautakehyksellä lipastoon. Valitse musta, kulta tai pinkki — kaksi kokoa.",
    ),
    body: t(
      "<p>En klar spegel med järnram att ställa på byrån — liten nog för sovrummet, stor nog att se ansiktet.</p><ul><li><strong>Järnram.</strong> Tål fukt bättre än obehandlat trä.</li><li><strong>Tre färger.</strong> Svart, guld eller rosa.</li><li><strong>Två mått.</strong> Ca 18 × 5,5 × 21 cm eller 19 × 10 × 28 cm.</li></ul><p>Material: järnram och klarglas. Välj färg och storlek ovan.</p>",
      "<p>Et klart speil med jernramme å sette på kommoden — lite nok til soverommet, stort nok til å se ansiktet.</p><ul><li><strong>Jernramme.</strong> Tåler fukt bedre enn ubehandlet tre.</li><li><strong>Tre farger.</strong> Svart, gull eller rosa.</li><li><strong>To mål.</strong> Ca. 18 × 5,5 × 21 cm eller 19 × 10 × 28 cm.</li></ul><p>Materiale: jernramme og klart glass. Velg farge og størrelse over.</p>",
      "<p>Et klart spejl med jernramme at stille på kommoden — lille nok til soveværelset, stort nok til at se ansigtet.</p><ul><li><strong>Jernramme.</strong> Tåler fugt bedre end ubehandlet træ.</li><li><strong>Tre farver.</strong> Sort, guld eller rosa.</li><li><strong>To mål.</strong> Ca. 18 × 5,5 × 21 cm eller 19 × 10 × 28 cm.</li></ul><p>Materiale: jernramme og klart glas. Vælg farve og størrelse ovenfor.</p>",
      "<p>Kirkas peili rautakehyksellä lipastoon — tarpeeksi pieni makuuhuoneeseen, tarpeeksi iso kasvoille.</p><ul><li><strong>Rautakehys.</strong> Kestää kosteutta paremmin kuin käsittelemätön puu.</li><li><strong>Kolme väriä.</strong> Musta, kulta tai pinkki.</li><li><strong>Kaksi kokoa.</strong> N. 18 × 5,5 × 21 cm tai 19 × 10 × 28 cm.</li></ul><p>Materiaali: rautakehys ja kirkas lasi. Valitse väri ja koko yllä.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Black: t("Svart", "Svart", "Sort", "Musta"),
          Gold: t("Guld", "Gull", "Guld", "Kulta"),
          Pink: t("Rosa", "Rosa", "Rosa", "Pinkki"),
        },
      },
      {
        sourceName: "Size",
        name: SIZE,
        values: {
          "18x5.5x21cm": t("18 × 5,5 × 21 cm", "18 × 5,5 × 21 cm", "18 × 5,5 × 21 cm", "18 × 5,5 × 21 cm"),
          "19x10x28cm": t("19 × 10 × 28 cm", "19 × 10 × 28 cm", "19 × 10 × 28 cm", "19 × 10 × 28 cm"),
        },
      },
    ],
  }),

  pack({
    handle:
      "laptop-desk-laptop-bed-table-with-foldable-legs-cup-slot-reading-holder-notebook-stand-breakfast-bed-tray-book-holder",
    title: t(
      "Vikbar laptopbricka till sängen",
      "Sammenleggbar laptopbrett til sengen",
      "Sammenklappeligt laptopbakke til sengen",
      "Taitettava teline sänkyyn",
    ),
    metaTitle: t(
      "Laptopbricka med mugghållare",
      "Laptopbrett med koppholder",
      "Laptopbakke med kopholder",
      "Taitettava teline mukipaikalla",
    ),
    metaDescription: t(
      "Vikbar bricka i MDF och aluminium till sängen. Muggfack, kortplats, hopfälld ca 32 × 64 × 25 cm.",
      "Sammenleggbar brett i MDF og aluminium til sengen. Koppfack, kortplass, sammenlagt ca. 32 × 64 × 25 cm.",
      "Sammenklappelig bakke i MDF og aluminium til sengen. Kopholder, kortplads, sammenklappet ca. 32 × 64 × 25 cm.",
      "Taitettava teline MDF:stä ja alumiinista sänkyyn. Mukipaikka, korttipaikka, taitettuna n. 32 × 64 × 25 cm.",
    ),
    body: t(
      "<p>En vikbar bricka till sängen eller soffan — laptop, bok eller frukost, utan att lämna täcket.</p><ul><li><strong>Mugg och kort.</strong> Fack till kopp och telefon eller bok.</li><li><strong>W-ben i aluminium.</strong> Stabila när de är utfällda, platta när du ställer undan.</li><li><strong>MDF-skiva.</strong> Slät yta, hopfälld ca 32 × 64 × 25 cm.</li></ul><p>Skiva i MDF, ben i aluminium. Välj utförande ovan.</p>",
      "<p>Et sammenleggbart brett til sengen eller sofaen — laptop, bok eller frokost, uten å forlate dyna.</p><ul><li><strong>Kopp og kort.</strong> Rom til kopp og telefon eller bok.</li><li><strong>W-bein i aluminium.</strong> Stabile utslått, flate når du setter vekk.</li><li><strong>MDF-plate.</strong> Glatt flate, sammenlagt ca. 32 × 64 × 25 cm.</li></ul><p>Plate i MDF, bein i aluminium. Velg utførelse over.</p>",
      "<p>En sammenklappelig bakke til sengen eller sofaen — laptop, bog eller morgenmad, uden at forlade dynen.</p><ul><li><strong>Kop og kort.</strong> Rum til kop og telefon eller bog.</li><li><strong>W-ben i aluminium.</strong> Stabile slået ud, flade når du stiller væk.</li><li><strong>MDF-plade.</strong> Glat flade, sammenklappet ca. 32 × 64 × 25 cm.</li></ul><p>Plade i MDF, ben i aluminium. Vælg udførelse ovenfor.</p>",
      "<p>Taitettava teline sänkyyn tai sohvalle — läppäri, kirja tai aamiainen peiton alta nousematta.</p><ul><li><strong>Muki ja kortti.</strong> Paikka kupille ja puhelimelle tai kirjalle.</li><li><strong>W-jalat alumiinia.</strong> Vakaat auki, litteät kun siirrät syrjään.</li><li><strong>MDF-levy.</strong> Sileä pinta, taitettuna n. 32 × 64 × 25 cm.</li></ul><p>Levy MDF:ää, jalat alumiinia. Valitse toteutus yllä.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: { "As shown": t("Som bilden", "Som bildet", "Som billedet", "Kuvan mukaan") },
      },
    ],
  }),

  pack({
    handle: "new-true-3d-stereo-shading-sleeping-eye-mask",
    title: t(
      "3D-sömnmask i memory foam",
      "3D-søvnmaske i memoryskum",
      "3D-søvnmaske i memoryskum",
      "3D-unimaski muistivaahdosta",
    ),
    metaTitle: t(
      "3D-sömnmask",
      "3D-søvnmaske",
      "3D-søvnmaske",
      "3D-unimaski",
    ),
    metaDescription: t(
      "3D-ögonmask i memory foam, lycra och issilke. Till tupplur, resa och sovrum. Välj färg och antal.",
      "3D-øyemaske i memoryskum, lycra og issilke. Til blund, reise og soverom. Velg farge og antall.",
      "3D-øjenmaske i memoryskum, lycra og issilke. Til lur, rejse og soveværelse. Vælg farve og antal.",
      "3D-silmämaski muistivaahdosta, lycrasta ja jääsilkistä. Torkkuun, matkalle ja makuuhuoneeseen. Valitse väri ja määrä.",
    ),
    body: t(
      "<p>En 3D-ögonmask i memory foam — den skärmar ljuset utan att trycka mot ögonlocken.</p><ul><li><strong>Formad kupa.</strong> Luft vid ögat, inte platt tyg mot huden.</li><li><strong>Lycra och issilke.</strong> Svalt tyg mot ansiktet, memory foam inuti.</li><li><strong>Hemma eller i väskan.</strong> Tupplur, flyg, sovrum. Välj färg och 1–3 st.</li></ul><p>Material: lycra, memory foam och issilke. Välj färg och antal ovan.</p>",
      "<p>En 3D-øyemaske i memoryskum — den stenger lyset uten å trykke mot øyelokkene.</p><ul><li><strong>Formet kappe.</strong> Luft ved øyet, ikke flatt tøy mot huden.</li><li><strong>Lycra og issilke.</strong> Kjølig tøy mot ansiktet, memoryskum inni.</li><li><strong>Hjemme eller i vesken.</strong> Blund, fly, soverom. Velg farge og 1–3 stk.</li></ul><p>Materiale: lycra, memoryskum og issilke. Velg farge og antall over.</p>",
      "<p>En 3D-øjenmaske i memoryskum — den skærmer lyset uden at trykke på øjenlågene.</p><ul><li><strong>Formet kuppel.</strong> Luft ved øjet, ikke fladt stof mod huden.</li><li><strong>Lycra og issilke.</strong> Køligt stof mod ansigtet, memoryskum indeni.</li><li><strong>Hjemme eller i tasken.</strong> Lur, fly, soveværelse. Vælg farve og 1–3 stk.</li></ul><p>Materiale: lycra, memoryskum og issilke. Vælg farve og antal ovenfor.</p>",
      "<p>3D-silmämaski muistivaahdosta — peittää valon painamatta luomia.</p><ul><li><strong>Muotoiltu kupu.</strong> Ilmaa silmän kohdalla, ei litteää kangasta ihoa vasten.</li><li><strong>Lycra ja jääsilkki.</strong> Viileä kangas kasvoille, muistivaahto sisällä.</li><li><strong>Kotona tai kassissa.</strong> Torkku, lento, makuuhuone. Valitse väri ja 1–3 kpl.</li></ul><p>Materiaali: lycra, muistivaahto ja jääsilkki. Valitse väri ja määrä yllä.</p>",
    ),
    options: [
      {
        sourceName: "Color",
        name: COLOR,
        values: {
          Black: t("Svart", "Svart", "Sort", "Musta"),
          "Rose pink Grey": t("Rosé och grå", "Rosé og grå", "Rosé og grå", "Ruusu ja harmaa"),
          "Rose pink": t("Rosé", "Rosé", "Rosé", "Ruusu"),
          Silver: t("Silver", "Sølv", "Sølv", "Hopea"),
        },
      },
      {
        sourceName: "style",
        name: STYLE,
        values: {
          "New upgrade": t("Uppdaterad modell", "Oppdatert modell", "Opdateret model", "Uudistettu malli"),
        },
      },
      {
        sourceName: "quantity",
        name: t("Antal", "Antall", "Antal", "Määrä"),
        values: {
          "1PC": t("1 st", "1 stk", "1 stk", "1 kpl"),
          "2PCS": t("2 st", "2 stk", "2 stk", "2 kpl"),
          "3PCS": t("3 st", "3 stk", "3 stk", "3 kpl"),
        },
      },
    ],
  }),

  pack({
    handle:
      "silicone-usb-cable-winder-desktop-cable-organizer-management-multipurpose-clips-cables-protector-for-wired-headphones",
    title: t(
      "Kabelclips i silikon till skrivbordet",
      "Kabelclips i silikon til skrivebordet",
      "Kabelclips i silikone til skrivebordet",
      "Silikoniset kaapelipidikkeet pöydälle",
    ),
    metaTitle: t(
      "Kabelclips till skrivbordet",
      "Kabelclips til skrivebordet",
      "Kabelclips til skrivebordet",
      "Kaapelipidikkeet pöydälle",
    ),
    metaDescription: t(
      "Självhäftande silikonclips som håller sladdarna på skrivbordet. Välj 3, 5 eller 7 fästen — och antal pack.",
      "Selvklebende silikonclips som holder ledningene på skrivebordet. Velg 3, 5 eller 7 fester — og antall pakker.",
      "Selvklæbende silikoneclips, der holder ledningerne på skrivebordet. Vælg 3, 5 eller 7 holdere — og antal pakker.",
      "Tarrakiinnitteiset silikonipidikkeet pitävät johdot pöydällä. Valitse 3, 5 tai 7 kiinnikettä — ja pakkauskoko.",
    ),
    body: t(
      "<p>Små silikonclips med tejp på undersidan — sladdarna ligger kvar på kanten i stället för att ramla bakom bordet.</p><ul><li><strong>Flera fästen.</strong> 3, 5 eller 7 clips i samma list.</li><li><strong>Dubbelhäftande.</strong> Fäst mot skrivbordet, utan skruv.</li><li><strong>Svart silikon.</strong> Välj antal clips och hur många pack du vill ha.</li></ul><p>Material: silikon. Färg: svart. Välj modell ovan.</p>",
      "<p>Små silikonclips med teip under — ledningene blir liggende på kanten i stedet for å falle bak bordet.</p><ul><li><strong>Flere fester.</strong> 3, 5 eller 7 clips i samme list.</li><li><strong>Dobbeltklebende.</strong> Fest mot skrivebordet, uten skrue.</li><li><strong>Svart silikon.</strong> Velg antall clips og hvor mange pakker du vil ha.</li></ul><p>Materiale: silikon. Farge: svart. Velg modell over.</p>",
      "<p>Små silikoneclips med tape under — ledningerne bliver liggende på kanten i stedet for at falde bag bordet.</p><ul><li><strong>Flere holdere.</strong> 3, 5 eller 7 clips i samme liste.</li><li><strong>Dobbeltklæbende.</strong> Fastgør til skrivebordet, uden skrue.</li><li><strong>Sort silikone.</strong> Vælg antal clips og hvor mange pakker du vil have.</li></ul><p>Materiale: silikone. Farve: sort. Vælg model ovenfor.</p>",
      "<p>Pienet silikonipidikkeet tarralla alla — johdot pysyvät reunalla eivätkä putoa pöydän taakse.</p><ul><li><strong>Useita kiinnikkeitä.</strong> 3, 5 tai 7 klipsiä samassa listassa.</li><li><strong>Kaksipuolinen tarra.</strong> Kiinnitä pöytään ilman ruuvia.</li><li><strong>Musta silikoni.</strong> Valitse klipsien määrä ja pakkausten lukumäärä.</li></ul><p>Materiaali: silikoni. Väri: musta. Valitse malli yllä.</p>",
    ),
    options: [
      {
        sourceName: "style",
        name: STYLE,
        values: {
          "3 clips": t("3 clips", "3 clips", "3 clips", "3 klipsiä"),
          "3 clips2PCS": t("3 clips, 2-pack", "3 clips, 2-pack", "3 clips, 2-pak", "3 klipsiä, 2-pack"),
          "3clips 6pc": t("3 clips, 6-pack", "3 clips, 6-pack", "3 clips, 6-pak", "3 klipsiä, 6-pack"),
          "5 clips": t("5 clips", "5 clips", "5 clips", "5 klipsiä"),
          "5 clips2PCS": t("5 clips, 2-pack", "5 clips, 2-pack", "5 clips, 2-pak", "5 klipsiä, 2-pack"),
          "5clips 6pc": t("5 clips, 6-pack", "5 clips, 6-pack", "5 clips, 6-pak", "5 klipsiä, 6-pack"),
          "5holes": t("5 hål", "5 hull", "5 huller", "5 reikää"),
          "7 clips": t("7 clips", "7 clips", "7 clips", "7 klipsiä"),
          "7 clips2PCS": t("7 clips, 2-pack", "7 clips, 2-pack", "7 clips, 2-pak", "7 klipsiä, 2-pack"),
          "7clips 6pc": t("7 clips, 6-pack", "7 clips, 6-pack", "7 clips, 6-pak", "7 klipsiä, 6-pack"),
        },
      },
    ],
  }),
];

export const catalogCopyByHandle = new Map(
  catalogCopy.map((product) => [product.handle, product]),
);
