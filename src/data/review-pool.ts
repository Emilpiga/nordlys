type LocalizedText = Record<string, string>;

export type ReviewTemplate = {
  rating: number;
  title: LocalizedText;
  body: LocalizedText;
};

export type ReviewAuthor = {
  author: string;
  location: string;
};

/** Target written-review count per product (seeded, stable). */
export const REVIEW_COUNT_MIN = 5;
export const REVIEW_COUNT_MAX = 13;

export const REVIEW_AUTHORS: ReviewAuthor[] = [
  { author: "Ebba K.", location: "Östersund" },
  { author: "Gustav M.", location: "Gävle" },
  { author: "Silje R.", location: "Bodø" },
  { author: "Håkon L.", location: "Fredrikstad" },
  { author: "Mette B.", location: "Kolding" },
  { author: "Søren P.", location: "Vejle" },
  { author: "Aino S.", location: "Oulu" },
  { author: "Veikko N.", location: "Kuopio" },
  { author: "Nora C.", location: "Luleå" },
  { author: "Viktor Å.", location: "Borås" },
  { author: "Thea D.", location: "Ålesund" },
  { author: "Jonas E.", location: "Sandnes" },
  { author: "Freja W.", location: "Horsens" },
  { author: "Magnus T.", location: "Herning" },
  { author: "Emilia H.", location: "Lahti" },
  { author: "Onni V.", location: "Pori" },
  { author: "Klara Ö.", location: "Kalmar" },
  { author: "Felix A.", location: "Skellefteå" },
  { author: "Ingrid B.", location: "Hamar" },
  { author: "Petter S.", location: "Tønsberg" },
  { author: "Camilla J.", location: "Svendborg" },
  { author: "Rasmus K.", location: "Helsingør" },
  { author: "Liisa M.", location: "Joensuu" },
  { author: "Mikko R.", location: "Vaasa" },
  { author: "Stina F.", location: "Trollhättan" },
  { author: "Oscar L.", location: "Nyköping" },
  { author: "Marte N.", location: "Lillehammer" },
  { author: "Even G.", location: "Haugesund" },
  { author: "Louise H.", location: "Næstved" },
  { author: "Andreas C.", location: "Randers" },
  { author: "Saara P.", location: "Hämeenlinna" },
  { author: "Eero T.", location: "Kotka" },
  { author: "Linnea D.", location: "Piteå" },
  { author: "Albin W.", location: "Falkenberg" },
  { author: "Kari O.", location: "Mo i Rana" },
  { author: "Sigrid E.", location: "Kristiansund" },
  { author: "Ida M.", location: "Holstebro" },
  { author: "Christian V.", location: "Slagelse" },
  { author: "Noora K.", location: "Rovaniemi" },
  { author: "Juhani A.", location: "Mikkeli" },
  { author: "Tove S.", location: "Ystad" },
  { author: "Henning B.", location: "Arvika" },
  { author: "Live T.", location: "Molde" },
  { author: "Bjørn H.", location: "Porsgrunn" },
  { author: "Pia R.", location: "Hjørring" },
  { author: "Mads L.", location: "Sønderborg" },
  { author: "Helmi J.", location: "Seinäjoki" },
  { author: "Antti F.", location: "Kajaani" },
];

export const REVIEW_TEMPLATES: ReviewTemplate[] = [
  {
    rating: 5,
    title: {
      sv: "Precis vad jag behövde",
      no: "Akkurat det jeg trengte",
      da: "Præcis det, jeg havde brug for",
      fi: "Juuri sitä mitä tarvitsin",
    },
    body: {
      sv: "Enkelt att använda från första dagen. Känns genomtänkt utan att vara krångligt.",
      no: "Enkelt å bruke fra første dag. Føles gjennomtenkt uten å være kronglete.",
      da: "Nem at bruge fra første dag. Føles gennemtænkt uden at være besværlig.",
      fi: "Helppo käyttää heti ensimmäisestä päivästä. Tuntuu harkitulta ilman kikkailua.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Ser bättre ut hemma än på bild",
      no: "Ser bedre ut hjemme enn på bilde",
      da: "Ser bedre ud hjemme end på billedet",
      fi: "Näyttää paremmalta kotona kuin kuvassa",
    },
    body: {
      sv: "Färgen och storleken stämmer. Den smälter in i rummet på ett sätt som produktfotot inte riktigt fångar.",
      no: "Farge og størrelse stemmer. Den smelter inn i rommet på en måte produktbildet ikke helt fanger.",
      da: "Farve og størrelse stemmer. Den smelter ind i rummet på en måde, produktbilledet ikke helt fanger.",
      fi: "Väri ja koko täsmäävät. Se sulautuu huoneeseen tavalla, jota tuotekuva ei aivan tavoita.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Använder den varje dag",
      no: "Bruker den hver dag",
      da: "Bruger den hver dag",
      fi: "Käytän sitä joka päivä",
    },
    body: {
      sv: "Inget krångel, inget som går sönder vid vanlig användning. Den har hamnat i den dagliga rutinen.",
      no: "Ikke noe krøll, ingenting som går i stykker ved vanlig bruk. Den har havnet i den daglige rutinen.",
      da: "Intet bøvl, intet der går i stykker ved almindelig brug. Den er røget ind i den daglige rutine.",
      fi: "Ei säätöä, ei hajoa tavallisessa käytössä. Se on jäänyt päivittäiseen rutiiniin.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Känns mer gedigen än priset",
      no: "Føles mer solid enn prisen",
      da: "Føles mere solid end prisen",
      fi: "Tuntuu hintaa jykevämmältä",
    },
    body: {
      sv: "Förväntade mig något lättare. Vikten och finishen gör att den inte känns som en tillfällig grej.",
      no: "Forventet noe lettere. Vekten og finishen gjør at den ikke føles som en midlertidig greie.",
      da: "Forventede noget lettere. Vægten og finishen gør, at den ikke føles som en midlertidig ting.",
      fi: "Odotin kevyempää. Paino ja viimeistely tekevät siitä muuta kuin tilapäisratkaisun.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Gjorde det den skulle",
      no: "Gjorde det den skulle",
      da: "Gjorde det, den skulle",
      fi: "Teki sen mitä piti",
    },
    body: {
      sv: "Inga överraskningar, och det är en komplimang. Packningen var hel och beskrivningen stämde.",
      no: "Ingen overraskelser, og det er et kompliment. Emballasjen var hel og beskrivelsen stemte.",
      da: "Ingen overraskelser, og det er et kompliment. Emballagen var hel, og beskrivelsen stemte.",
      fi: "Ei yllätyksiä, ja se on kehu. Pakkaus oli ehjä ja kuvaus piti paikkansa.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Lätt att leva med",
      no: "Lett å leve med",
      da: "Nem at leve med",
      fi: "Helppo arjessa",
    },
    body: {
      sv: "Tar inte plats, är lätt att göra rent och hamnar inte i en låda efter en vecka.",
      no: "Tar ikke plass, er lett å gjøre ren og havner ikke i en skuff etter en uke.",
      da: "Fylder ikke, er nem at gøre ren og ender ikke i en skuffe efter en uge.",
      fi: "Ei vie tilaa, on helppo puhdistaa eikä jää laatikkoon viikon jälkeen.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Skulle köpa igen",
      no: "Ville kjøpt igjen",
      da: "Ville købe igen",
      fi: "Ostaisin uudestaan",
    },
    body: {
      sv: "Hade en billigare variant tidigare som nöttes ner. Den här känns som den håller säsongen ut.",
      no: "Hadde en billigere variant tidligere som ble slitt. Denne føles som den holder sesongen ut.",
      da: "Havde en billigere udgave tidligere, som blev slidt. Den her føles, som om den holder sæsonen.",
      fi: "Aiempi halvempi versio kului. Tämä vaikuttaa kestävän kauden loppuun.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Fint hantverkskänsla",
      no: "Fin håndverksfølelse",
      da: "Fin håndværksfornemmelse",
      fi: "Tuntuu huolellisesti tehdyltä",
    },
    body: {
      sv: "Kanterna är släta och inget sitter löst. Små detaljer som man märker när man tar i den varje dag.",
      no: "Kantene er glatte og ingenting sitter løst. Små detaljer man merker når man tar i den hver dag.",
      da: "Kanterne er glatte, og intet sidder løst. Små detaljer, man mærker, når man tager i den hver dag.",
      fi: "Reunat ovat sileät eikä mikään heilua. Pieniä asioita, jotka huomaa kun käyttää joka päivä.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Bra, med en liten invändning",
      no: "Bra, med en liten innvending",
      da: "God, med et lille forbehold",
      fi: "Hyvä, pienellä varauksella",
    },
    body: {
      sv: "Gör jobbet. Instruktionen kunde varit tydligare, men efter fem minuter hade jag fattat ändå.",
      no: "Gjør jobben. Instruksen kunne vært tydeligere, men etter fem minutter skjønte jeg det likevel.",
      da: "Gør arbejdet. Vejledningen kunne have været tydeligere, men efter fem minutter havde jeg fattet det alligevel.",
      fi: "Hoitaa homman. Ohje olisi voinut olla selkeämpi, mutta viidessä minuutissa tajusin silti.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Något mindre än jag trodde",
      no: "Litt mindre enn jeg trodde",
      da: "Lidt mindre, end jeg troede",
      fi: "Hieman pienempi kuin luulin",
    },
    body: {
      sv: "Måtten stämmer om man läser noga. Jag hade ändå föreställt mig den ett snäpp större. Fungerar bra där den står.",
      no: "Målene stemmer om man leser nøye. Jeg hadde likevel sett den for meg et hakk større. Fungerer fint der den står.",
      da: "Målene stemmer, hvis man læser grundigt. Jeg havde alligevel forestillet mig den et hak større. Virker fint der, hvor den står.",
      fi: "Mitat pitävät jos lukee tarkkaan. Silti kuvittelin sen hieman isommaksi. Toimii hyvin paikallaan.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Stabil i vardagen",
      no: "Stabil i hverdagen",
      da: "Stabil i hverdagen",
      fi: "Vakaa arjessa",
    },
    body: {
      sv: "Inget wow, men inget som irriterar heller. Precis den sortens sak man slutar tänka på — vilket är bra.",
      no: "Ikke noe wow, men ingenting som irriterer heller. Akkurat den sorten ting man slutter å tenke på — og det er bra.",
      da: "Ikke noget wow, men heller ikke noget, der irriterer. Præcis den slags ting, man holder op med at tænke på — og det er godt.",
      fi: "Ei mitään wau, mutta ei ärsytäkään. Juuri sellainen juttu jota ei enää huomaa — ja se on hyvä.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Leveransen var smidig",
      no: "Leveransen var smidig",
      da: "Leveringen var smidig",
      fi: "Toimitus sujui",
    },
    body: {
      sv: "Kom fram helt och utan märken. Själva produkten är som utlovad; förpackningen var lite större än nödvändigt.",
      no: "Kom frem hel og uten merker. Selve produktet er som lovet; emballasjen var litt større enn nødvendig.",
      da: "Kom frem hel og uden mærker. Selve produktet er som lovet; emballagen var lidt større end nødvendigt.",
      fi: "Saapui ehjänä ilman jälkiä. Tuote on kuten luvattiin; pakkaus oli hieman turhan iso.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Gör vad den ska — inte mer",
      no: "Gjør det den skal — ikke mer",
      da: "Gør det, den skal — ikke mere",
      fi: "Tekee sen mitä pitää — ei enempää",
    },
    body: {
      sv: "Ingen mirakelprodukt, men den ersätter det jag hade och är trevligare att ha framme.",
      no: "Ingen mirakelprodukt, men den erstatter det jeg hadde og er triveligere å ha fremme.",
      da: "Ingen mirakelvare, men den erstatter det, jeg havde, og er rarere at have fremme.",
      fi: "Ei ihmetuote, mutta korvaa vanhan ja on kivempi pitää esillä.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Tog en stund att vänja sig",
      no: "Tok en stund å venne seg til",
      da: "Tog et øjeblik at vænne sig til",
      fi: "Vaatii hetken totuttelua",
    },
    body: {
      sv: "Första kvällen var jag tveksam till greppet. Efter en vecka använder jag den utan att tänka.",
      no: "Første kvelden var jeg usikker på grepet. Etter en uke bruker jeg den uten å tenke.",
      da: "Den første aften var jeg i tvivl om grebet. Efter en uge bruger jeg den uden at tænke.",
      fi: "Ensimmäisenä iltana ote askarrutti. Viikon jälkeen käytän sitä ajattelematta.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Färg och finish stämmer",
      no: "Farge og finish stemmer",
      da: "Farve og finish stemmer",
      fi: "Väri ja viimeistely täsmäävät",
    },
    body: {
      sv: "Matchar resten av köket bättre än jag vågade hoppas. En skarv syns om man letar, men inte på vanligt avstånd.",
      no: "Matcher resten av kjøkkenet bedre enn jeg turte håpe. En skjøt synes hvis man leter, men ikke på vanlig avstand.",
      da: "Matcher resten af køkkenet bedre, end jeg turde håbe. En samling ses, hvis man leder, men ikke på almindelig afstand.",
      fi: "Sopii keittiöön paremmin kuin uskalsin toivoa. Sauman näkee jos etsii, ei tavalliselta etäisyydeltä.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Praktisk mer än prålig",
      no: "Praktisk mer enn prangende",
      da: "Praktisk mere end prangende",
      fi: "Enemmän käytännöllinen kuin pramea",
    },
    body: {
      sv: "Den ser okej ut och fungerar bättre. Jag köpte den för funktionen, och den levererar där.",
      no: "Den ser grei ut og fungerer bedre. Jeg kjøpte den for funksjonen, og den leverer der.",
      da: "Den ser okay ud og virker bedre. Jeg købte den for funktionen, og den leverer dér.",
      fi: "Näyttää ihan hyvältä ja toimii paremmin. Ostin sen toiminnon takia, ja siinä se lunastaa.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Hade velat ha en extra variant",
      no: "Hadde ønsket en ekstra variant",
      da: "Havde ønsket en ekstra variant",
      fi: "Olisin halunnut lisävariantin",
    },
    body: {
      sv: "Den jag valde fungerar. Saknar ett mellanalternativ i storlek, men det är mer ett önskemål än ett fel.",
      no: "Den jeg valgte fungerer. Savner et mellomalternativ i størrelse, men det er mer et ønske enn en feil.",
      da: "Den, jeg valgte, virker. Savner et mellemstørrelsesvalg, men det er mere et ønske end en fejl.",
      fi: "Valitsemani toimii. Välivaihtoehtoa koossa jäi kaipaamaan, mutta se on toive eikä vika.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Lättare än väntat",
      no: "Lettere enn forventet",
      da: "Lettere end forventet",
      fi: "Kevyempi kuin odotin",
    },
    body: {
      sv: "Bra när man ska flytta den. Känns inte klen, bara inte lika tung som den ser ut på bild.",
      no: "Bra når man skal flytte den. Føles ikke spinkel, bare ikke like tung som den ser ut på bilde.",
      da: "God, når man skal flytte den. Føles ikke spinkel, bare ikke lige så tung, som den ser ud på billedet.",
      fi: "Hyvä kun sitä siirtää. Ei tunnu huterolta, vain kevyemmältä kuin kuvassa.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Som beskrivet, nästan",
      no: "Som beskrevet, nesten",
      da: "Som beskrevet, næsten",
      fi: "Kuten kuvattu, melkein",
    },
    body: {
      sv: "Materialet stämmer. Nyansen är ett steg varmare än på skärmen, vilket faktiskt passade bättre hemma hos oss.",
      no: "Materialet stemmer. Nyansen er et hakk varmere enn på skjermen, noe som faktisk passet bedre hjemme hos oss.",
      da: "Materialet stemmer. Nuancen er et hak varmere end på skærmen, hvilket faktisk passede bedre hjemme hos os.",
      fi: "Materiaali täsmää. Sävy on asteen lämpimämpi kuin ruudulla, ja se sopi meille paremmin.",
    },
  },
  {
    rating: 3,
    title: {
      sv: "Okej, inte mer",
      no: "Greit, ikke mer",
      da: "Okay, ikke mere",
      fi: "Ihan ok, ei sen enempää",
    },
    body: {
      sv: "Fungerar, men jag hade förväntat mig lite mer tyngd i materialet. Kanske byter jag upp den senare.",
      no: "Fungerer, men jeg hadde forventet litt mer tyngde i materialet. Kanskje bytter jeg opp senere.",
      da: "Virker, men jeg havde forventet lidt mere tyngde i materialet. Måske skifter jeg op senere.",
      fi: "Toimii, mutta odotin materiaaliin hieman enemmän tuntumaa. Saatan vaihtaa myöhemmin jämäkämpään.",
    },
  },
  {
    rating: 3,
    title: {
      sv: "Gör jobbet med förbehåll",
      no: "Gjør jobben med forbehold",
      da: "Gør arbejdet med forbehold",
      fi: "Hoitaa homman varauksin",
    },
    body: {
      sv: "Använder den, men den kräver lite tillpassning. Inget trasigt — bara inte lika självklar som jag hoppats.",
      no: "Bruker den, men den krever litt tilpasning. Ingenting ødelagt — bare ikke like selvfølgelig som jeg hadde håpet.",
      da: "Bruger den, men den kræver lidt tilpasning. Intet i stykker — bare ikke lige så selvfølgelig, som jeg havde håbet.",
      fi: "Käytän sitä, mutta se vaatii säätöä. Ei rikki — vain vähemmän itsestään selvä kuin toivoin.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Har rekommenderat den",
      no: "Har anbefalt den",
      da: "Har anbefalet den",
      fi: "Olen suositellut",
    },
    body: {
      sv: "Syster frågade vad vi använder. Skickade länken utan att tveka — den har blivit en given del av köket.",
      no: "Søster spurte hva vi bruker. Sendte linken uten å nøle — den har blitt en selvsagt del av kjøkkenet.",
      da: "Søster spurgte, hvad vi bruger. Sendte linket uden at tøve — den er blevet en given del af køkkenet.",
      fi: "Sisko kysyi mitä käytämme. Lähetin linkin heti — siitä on tullut keittiön vakio.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Tyst och utan krångel",
      no: "Stille og uten krøll",
      da: "Stille og uden bøvl",
      fi: "Hiljainen eikä säätöä",
    },
    body: {
      sv: "Inget som rasslar eller behöver justeras. Sätter den på plats och den blir där.",
      no: "Ingenting som rasler eller trenger justering. Setter den på plass, og der blir den.",
      da: "Intet, der rasler eller skal justeres. Sætter den på plads, og dér bliver den.",
      fi: "Ei helise eikä vaadi säätöä. Asetan paikalleen ja se jää siihen.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Bra till priset",
      no: "Bra til prisen",
      da: "God til prisen",
      fi: "Hyvä hintaan",
    },
    body: {
      sv: "Hade kunnat betala mer för samma sak i butik. Här får man funktionen utan onödig emballagekänsla.",
      no: "Kunne betalt mer for det samme i butikk. Her får man funksjonen uten unødvendig emballasjefølelse.",
      da: "Kunne have betalt mere for det samme i butik. Her får man funktionen uden unødig emballagefornemmelse.",
      fi: "Kaupassa tästä olisi maksanut enemmän. Tässä saa toiminnon ilman turhaa pakkausfiilistä.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Passade in direkt",
      no: "Passet inn med en gang",
      da: "Passede ind med det samme",
      fi: "Sopii heti joukkoon",
    },
    body: {
      sv: "Behövde inte gömma den. Står framme och ser ut som den hör hemma där.",
      no: "Trengte ikke å gjemme den. Står fremme og ser ut som den hører hjemme der.",
      da: "Behøvede ikke at gemme den. Står fremme og ser ud, som om den hører til dér.",
      fi: "Ei tarvinnut piilottaa. Seisoo esillä ja näyttää kuuluvan siihen.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Enkelt att sköta",
      no: "Enkelt å stelle",
      da: "Nem at holde",
      fi: "Helppo hoitaa",
    },
    body: {
      sv: "Torkar av den med en trasa. Inget specialmedel, inget som fastnar i springor.",
      no: "Tørker den av med en klut. Ingen spesialmidler, ingenting som setter seg i sprekker.",
      da: "Tørrer den af med en klud. Ingen specialmidler, intet der sætter sig i sprækker.",
      fi: "Pyyhkäisen rätillä. Ei erikoisaineita, ei tartu rakoihin.",
    },
  },
  {
    rating: 5,
    title: {
      sv: "Hade den i åtanke länge",
      no: "Hadde den i tankene lenge",
      da: "Havde den i tankerne længe",
      fi: "Pyöri mielessä pitkään",
    },
    body: {
      sv: "Väntade ett tag. Glad att jag tog den — den löste just det lilla problemet vi hade i vardagen.",
      no: "Ventet en stund. Glad jeg tok den — den løste akkurat det lille problemet vi hadde i hverdagen.",
      da: "Ventede et stykke tid. Glad for, at jeg tog den — den løste præcis det lille problem, vi havde i hverdagen.",
      fi: "Odotin hetken. Ilo että otin — se ratkaisi juuri sen pienen arjen ongelman.",
    },
  },
  {
    rating: 4,
    title: {
      sv: "Inget att klaga på, nästan",
      no: "Ingenting å klage på, nesten",
      da: "Ikke noget at klage over, næsten",
      fi: "Ei valittamista, melkein",
    },
    body: {
      sv: "En liten gjutkant syns om man tittar nära. På hyllan märks den inte. Annars nöjd.",
      no: "En liten støpekant synes hvis man ser nærme. I hyllen merkes den ikke. Ellers fornøyd.",
      da: "En lille støbekant ses, hvis man kigger tæt på. I hylden mærkes den ikke. Ellers tilfreds.",
      fi: "Pieni valutusreuna näkyy läheltä. Hyllyssä sitä ei huomaa. Muuten tyytyväinen.",
    },
  },
];
