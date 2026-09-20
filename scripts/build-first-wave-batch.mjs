#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("scripts/.cj-top30.json", "utf8"));
const ranks = new Set([1, 2, 5, 6, 7, 10, 11, 12, 14, 17, 18, 19, 21, 25, 26, 29]);
const skusWanted = new Set();
data.products.forEach((p, i) => {
  if (ranks.has(i + 1)) skusWanted.add(p.sku);
});

const copy = {
  CJNSSYMY00527: {
    handle: "turtleneck-sweater-dress",
    title: "Stickad klänning med polokrage",
    metaTitle: "Stickad klänning med polokrage",
    metaDescription:
      "Lång stickad klänning med polokrage till kalla dagar. Flera färger, storlek S–5XL.",
    descriptionHtml:
      "<p>En lång stickad klänning med polokrage — varm bas till höst och vinter.</p><ul><li><strong>Polokrage.</strong> Täcker halsen, lång ärm.</li><li><strong>Lång modell.</strong> Faller som klänning, inte som kort tröja.</li><li><strong>Flera färger.</strong> Bland annat grått, aprikos, rosa och vinrött.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJLY1891796: {
    handle: "button-turtleneck-sweater-dress",
    title: "Stickad klänning med knappar",
    metaTitle: "Stickad klänning med knappar",
    metaDescription:
      "Stickad klänning med polokrage och knapprad. Vit, rosa eller armégrön. Storlek S–L.",
    descriptionHtml:
      "<p>En stickad klänning med polokrage och knappar fram — lång ärm till kyligare dagar.</p><ul><li><strong>Knapprad.</strong> Detalj fram längs kragen.</li><li><strong>Lång modell.</strong> Fungerar som klänning eller lång tröja.</li><li><strong>Tre färger.</strong> Vit, rosa eller armégrön.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJDD1886234: {
    handle: "fleece-shark-leggings",
    title: "Fleecefodrade leggings",
    metaTitle: "Fleecefodrade leggings",
    metaDescription:
      "Tjocka fleecefodrade leggings till kalla dagar. Hög midja, storlek S–XL.",
    descriptionHtml:
      "<p>Fleecefodrade leggings med hög midja — tätt snitt till kalla dagar.</p><ul><li><strong>Fleecefoder.</strong> Varmare än vanliga leggings.</li><li><strong>Hög midja.</strong> Sitter stadigt runt midjan.</li><li><strong>Vinterbruk.</strong> Tänk som underställ eller vardagsbyxa.</li></ul><p>Asiatisk storlek, faller litet. Välj storlek ovan.</p>",
  },
  CJLS1833644: {
    handle: "hoodie-pants-lounge-set",
    title: "Set med huvtröja och byxor",
    metaTitle: "Set med huvtröja och byxor",
    metaDescription:
      "Avslappnat set med oversized huvtröja och långbyxor. Flera färger.",
    descriptionHtml:
      "<p>Ett avslappnat set med oversized huvtröja och matchande långbyxor.</p><ul><li><strong>Två delar.</strong> Tröja och byxor i samma set.</li><li><strong>Löst snitt.</strong> Oversized topp, bekväma byxor.</li><li><strong>Vardag.</strong> För hemma, promenad eller resor.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJNSFSWJ01136: {
    handle: "cashmere-feel-winter-shawl",
    title: "Mjuk vintersjal",
    metaTitle: "Mjuk vintersjal",
    metaDescription: "Mjuk sjal till kalla dagar. Flera färger.",
    descriptionHtml:
      "<p>En mjuk sjal till kalla dagar — lindas runt halsen eller över axlarna.</p><ul><li><strong>Mjuk yta.</strong> Behaglig mot huden.</li><li><strong>Vinteraccessoar.</strong> För ytterkläder eller inomhus.</li><li><strong>Flera färger.</strong> Välj ovan.</li></ul><p>Ett storleksalternativ per färg om inget annat anges.</p>",
  },
  CJLY2152316: {
    handle: "knit-sweater-skirt-set",
    title: "Stickat set med tröja och kjol",
    metaTitle: "Stickat set med tröja och kjol",
    metaDescription:
      "Tvådelat stickat set med långärmad tröja och kjol. Flera färger.",
    descriptionHtml:
      "<p>Ett tvådelat stickat set — långärmad tröja och matchande kjol.</p><ul><li><strong>Två delar.</strong> Tröja och kjol i samma stickning.</li><li><strong>Vardag elegant.</strong> Fungerar ihop eller isär.</li><li><strong>Flera färger.</strong> Välj ovan.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJMY2100177: {
    handle: "crew-neck-winter-pullover",
    title: "Stickad tröja med rund hals",
    metaTitle: "Stickad tröja med rund hals",
    metaDescription:
      "Lös stickad tröja med rund hals och långa ärmar. Flera färger, storlek S–XL.",
    descriptionHtml:
      "<p>En lös stickad tröja med rund hals — enkel modell till vardagen.</p><ul><li><strong>Rund hals.</strong> Klassisk stickad pullover.</li><li><strong>Löst snitt.</strong> Bekväm fall, långa ärmar.</li><li><strong>Flera färger.</strong> Välj ovan.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJYD1948143: {
    handle: "belted-double-breasted-trench",
    title: "Dubbelknäppt trenchcoat med skärp",
    metaTitle: "Dubbelknäppt trenchcoat med skärp",
    metaDescription:
      "Trenchcoat med slag, dubbelknäppning och skärp. Storlek S–XL.",
    descriptionHtml:
      "<p>En dubbelknäppt trenchcoat med skärp — klassisk yttermodell till hösten.</p><ul><li><strong>Dubbelknäppning.</strong> Slag och skärp i midjan.</li><li><strong>Halvlång.</strong> Täcker höften, långa ärmar.</li><li><strong>Vardagsytter.</strong> Över stickat eller blus.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJJS1886197: {
    handle: "fleece-wide-leg-trousers",
    title: "Fleecefodrade byxor med vid ben",
    metaTitle: "Fleecefodrade byxor med vid ben",
    metaDescription:
      "Varma byxor med fleecefoder och raka, vida ben. Storlek S–XL.",
    descriptionHtml:
      "<p>Varma byxor med fleecefoder och vida ben — till kalla dagar.</p><ul><li><strong>Fleecefoder.</strong> Tjockare än vanliga byxor.</li><li><strong>Vida ben.</strong> Rakt, avslappnat snitt.</li><li><strong>Vintervardag.</strong> Inomhus eller under ytterkläder.</li></ul><p>Asiatisk storlek, faller litet. Välj storlek ovan.</p>",
  },
  CJMY1794081: {
    handle: "plaid-lantern-sleeve-cardigan",
    title: "Rutig kofta med ballongärm",
    metaTitle: "Rutig kofta med ballongärm",
    metaDescription: "Rutig kofta med ballongärmar. Storlek S–XL.",
    descriptionHtml:
      "<p>En rutig kofta med ballongärmar — öppen fram, till vardag och lager-på-lager.</p><ul><li><strong>Rutor.</strong> Mönster som syns på avstånd.</li><li><strong>Ballongärm.</strong> Volym i ärmen, vanlig längd.</li><li><strong>Kofta.</strong> Bärs öppet över topp eller klänning.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJNSSYMY01057: {
    handle: "slim-knit-cardigan",
    title: "Smal stickad kofta",
    metaTitle: "Smal stickad kofta",
    metaDescription: "Smal stickad kofta i flera färger. Storlek S–XL.",
    descriptionHtml:
      "<p>En smal stickad kofta — enkel modell som lagras över topp eller klänning.</p><ul><li><strong>Smal passform.</strong> Följer kroppen mer än oversized.</li><li><strong>Kofta.</strong> Öppen eller knäppt beroende på modell.</li><li><strong>Flera färger.</strong> Välj ovan.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJYD2464025: {
    handle: "belted-batwing-winter-coat",
    title: "Kappa med skärp och vida ärmar",
    metaTitle: "Kappa med skärp och vida ärmar",
    metaDescription:
      "Vinterkappa med hög hals, vida ärmar och skärp. Storlek S–XL.",
    descriptionHtml:
      "<p>En kappa med hög hals, vida ärmar och skärp — lös modell till kalla dagar.</p><ul><li><strong>Hög hals.</strong> Extra skydd runt halsen.</li><li><strong>Vida ärmar.</strong> Batwing-känsla, skärp i midjan.</li><li><strong>Ytterplagg.</strong> Över stickat eller klänning.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJMY1370041: {
    handle: "solid-turtleneck-winter-sweater",
    title: "Stickad tröja med polokrage",
    metaTitle: "Stickad tröja med polokrage",
    metaDescription:
      "Enfärgad stickad tröja med polokrage. Flera färger, storlek S–XL.",
    descriptionHtml:
      "<p>En enfärgad stickad tröja med polokrage — varm bas till höst och vinter.</p><ul><li><strong>Polokrage.</strong> Täcker halsen.</li><li><strong>Enfärgad.</strong> Enkel att kombinera.</li><li><strong>Långa ärmar.</strong> Till vardag och under ytterkläder.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJQB1895285: {
    handle: "batwing-lapel-knit-cardigan",
    title: "Stickad kofta med slag",
    metaTitle: "Stickad kofta med slag",
    metaDescription: "Lös stickad kofta med slag och vida ärmar. Flera färger.",
    descriptionHtml:
      "<p>En lös stickad kofta med slag och vida ärmar — öppnas fram.</p><ul><li><strong>Slag.</strong> Kavajliknande halslinje.</li><li><strong>Vida ärmar.</strong> Löst, avslappnat snitt.</li><li><strong>Flera färger.</strong> Välj ovan.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJNSWTFY01084: {
    handle: "woolen-double-breasted-jacket",
    title: "Dubbelknäppt jacka i yllekänsla",
    metaTitle: "Dubbelknäppt jacka i yllekänsla",
    metaDescription: "Dubbelknäppt jacka med slag, yllekänsla. Storlek S–XL.",
    descriptionHtml:
      "<p>En dubbelknäppt jacka med slag — mer strukturerad yttermodell.</p><ul><li><strong>Dubbelknäppning.</strong> Klassisk kappa-/kavajdetalj.</li><li><strong>Yllekänsla.</strong> Tjockare yttertyg.</li><li><strong>Halvlång.</strong> Över tröja eller klänning.</li></ul><p>Asiatisk storlek, faller litet. Välj färg och storlek ovan.</p>",
  },
  CJJS2194401: {
    handle: "fleece-lined-warm-leggings",
    title: "Varma fleecefodrade leggings",
    metaTitle: "Varma fleecefodrade leggings",
    metaDescription: "Varma leggings med fleecefoder. Hög midja, storlek S–XL.",
    descriptionHtml:
      "<p>Varma leggings med fleecefoder — tätt snitt till kalla dagar.</p><ul><li><strong>Fleecefoder.</strong> Mjukt och varmt inuti.</li><li><strong>Hög midja.</strong> Sitter stadigt.</li><li><strong>Vinterbruk.</strong> Under klänning eller som byxa hemma.</li></ul><p>Asiatisk storlek, faller litet. Välj storlek ovan.</p>",
  },
};

const products = data.products
  .filter((p) => skusWanted.has(p.sku))
  .map((p) => {
    const c = copy[p.sku];
    if (!c) throw new Error(`Missing copy for ${p.sku}`);
    return {
      pid: p.pid,
      handle: c.handle,
      title: c.title,
      productType: p.type,
      tags: p.tags,
      priceSek: p.estPriceSek,
      metaTitle: c.metaTitle,
      metaDescription: c.metaDescription,
      descriptionHtml: c.descriptionHtml,
    };
  });

if (products.length !== 16) {
  throw new Error(`Expected 16 products, got ${products.length}`);
}

writeFileSync(
  "scripts/cj-import-batch.json",
  JSON.stringify({ products }, null, 2),
);
console.log(
  JSON.stringify(
    { count: products.length, handles: products.map((p) => p.handle) },
    null,
    2,
  ),
);
