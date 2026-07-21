import { tallyOutcome, upsertLocalized } from "./helpers";
import type { SeedContext, FacebookDataset } from "./types";

// Canonical 22 Arab countries with their capitals. Slugs are stable identifiers
// used across runs. Non-Arab locations required by the dataset (Türkiye,
// Eritrea) and the operational city of Gaza are appended afterwards.
type CountrySpec = {
  slug: string;
  ar: string;
  en: string;
  capital?: { slug: string; ar: string; en: string };
};

const ARAB_COUNTRIES: CountrySpec[] = [
  { slug: "algeria", ar: "الجزائر", en: "Algeria", capital: { slug: "algiers", ar: "الجزائر", en: "Algiers" } },
  { slug: "bahrain", ar: "البحرين", en: "Bahrain", capital: { slug: "manama", ar: "المنامة", en: "Manama" } },
  { slug: "comoros", ar: "جزر القمر", en: "Comoros", capital: { slug: "moroni", ar: "موروني", en: "Moroni" } },
  { slug: "djibouti", ar: "جيبوتي", en: "Djibouti", capital: { slug: "djibouti-city", ar: "جيبوتي", en: "Djibouti" } },
  { slug: "egypt", ar: "مصر", en: "Egypt", capital: { slug: "cairo", ar: "القاهرة", en: "Cairo" } },
  { slug: "iraq", ar: "العراق", en: "Iraq", capital: { slug: "baghdad", ar: "بغداد", en: "Baghdad" } },
  { slug: "jordan", ar: "الأردن", en: "Jordan", capital: { slug: "amman", ar: "عمّان", en: "Amman" } },
  { slug: "kuwait", ar: "الكويت", en: "Kuwait", capital: { slug: "kuwait-city", ar: "مدينة الكويت", en: "Kuwait City" } },
  { slug: "lebanon", ar: "لبنان", en: "Lebanon", capital: { slug: "beirut", ar: "بيروت", en: "Beirut" } },
  { slug: "libya", ar: "ليبيا", en: "Libya", capital: { slug: "tripoli", ar: "طرابلس", en: "Tripoli" } },
  { slug: "mauritania", ar: "موريتانيا", en: "Mauritania", capital: { slug: "nouakchott", ar: "نواكشوط", en: "Nouakchott" } },
  { slug: "morocco", ar: "المغرب", en: "Morocco", capital: { slug: "rabat", ar: "الرباط", en: "Rabat" } },
  { slug: "oman", ar: "عُمان", en: "Oman", capital: { slug: "muscat", ar: "مسقط", en: "Muscat" } },
  { slug: "palestine", ar: "فلسطين", en: "Palestine", capital: { slug: "jerusalem", ar: "القدس", en: "Jerusalem" } },
  { slug: "qatar", ar: "قطر", en: "Qatar", capital: { slug: "doha", ar: "الدوحة", en: "Doha" } },
  { slug: "saudi-arabia", ar: "السعودية", en: "Saudi Arabia", capital: { slug: "riyadh", ar: "الرياض", en: "Riyadh" } },
  { slug: "somalia", ar: "الصومال", en: "Somalia", capital: { slug: "mogadishu", ar: "مقديشو", en: "Mogadishu" } },
  { slug: "sudan", ar: "السودان", en: "Sudan", capital: { slug: "khartoum", ar: "الخرطوم", en: "Khartoum" } },
  { slug: "syria", ar: "سوريا", en: "Syria", capital: { slug: "damascus", ar: "دمشق", en: "Damascus" } },
  { slug: "tunisia", ar: "تونس", en: "Tunisia", capital: { slug: "tunis", ar: "تونس", en: "Tunis" } },
  { slug: "uae", ar: "الإمارات العربية المتحدة", en: "United Arab Emirates", capital: { slug: "abu-dhabi", ar: "أبو ظبي", en: "Abu Dhabi" } },
  { slug: "yemen", ar: "اليمن", en: "Yemen", capital: { slug: "sanaa", ar: "صنعاء", en: "Sana'a" } },
];

// Non-Arab countries required by the imported content.
const EXTRA_COUNTRIES: CountrySpec[] = [
  { slug: "turkey", ar: "تركيا", en: "Türkiye", capital: { slug: "istanbul", ar: "إسطنبول", en: "Istanbul" } },
  { slug: "eritrea", ar: "إريتريا", en: "Eritrea" },
];

// Extra cities beyond capitals, required by imported content.
const EXTRA_CITIES: { slug: string; ar: string; en: string; country: string }[] = [
  { slug: "gaza", ar: "غزة", en: "Gaza", country: "palestine" },
  { slug: "gaziantep", ar: "غازي عنتاب", en: "Gaziantep", country: "turkey" },
];

export const COUNTRY_UNCONFIRMED_SLUG = "country-unconfirmed";

export const seedTaxonomies = async (
  ctx: SeedContext,
  dataset: FacebookDataset,
): Promise<void> => {
  const { payload, flags, report } = ctx;

  // Event types (from dataset, stable slugs).
  let order = 1;
  for (const type of dataset.taxonomies.eventTypes) {
    const { doc, outcome } = await upsertLocalized(payload, flags, {
      collection: "event-types",
      slug: type.slug,
      common: { isActive: true, order: order++ },
      ar: { name: type.name.ar },
      en: { name: type.name.en },
    });
    ctx.eventTypes.set(type.slug, doc.id);
    tallyOutcome(report.eventTypes, outcome);
  }

  // Countries: canonical Arab set first, then required extras.
  let countryOrder = 1;
  const allCountries = [...ARAB_COUNTRIES, ...EXTRA_COUNTRIES];
  for (const country of allCountries) {
    const { doc, outcome } = await upsertLocalized(payload, flags, {
      collection: "countries",
      slug: country.slug,
      common: { isActive: true, order: countryOrder++ },
      ar: { name: country.ar },
      en: { name: country.en },
    });
    ctx.countries.set(country.slug, doc.id);
    tallyOutcome(report.countries, outcome);
  }

  // Internal inactive "country unconfirmed" record for missing-country people.
  {
    const { doc, outcome } = await upsertLocalized(payload, flags, {
      collection: "countries",
      slug: COUNTRY_UNCONFIRMED_SLUG,
      common: { isActive: false, order: 9999 },
      ar: { name: "دولة غير مؤكدة — للمراجعة" },
      en: { name: "Country unconfirmed — review only" },
    });
    ctx.countries.set(COUNTRY_UNCONFIRMED_SLUG, doc.id);
    tallyOutcome(report.countries, outcome);
  }

  // Cities: capitals of each country, then extra cities, then any dataset city
  // not already covered (deduplicated by slug).
  let cityOrder = 1;
  const seededCitySlugs = new Set<string>();
  const upsertCity = async (spec: { slug: string; ar: string; en: string; country: string }) => {
    if (seededCitySlugs.has(spec.slug)) return;
    const countryId = ctx.countries.get(spec.country);
    if (!countryId) {
      report.errors.push(`City ${spec.slug} references country ${spec.country} that was not seeded`);
      return;
    }
    const { doc, outcome } = await upsertLocalized(payload, flags, {
      collection: "cities",
      slug: spec.slug,
      common: { country: countryId, isActive: true, order: cityOrder++ },
      ar: { name: spec.ar },
      en: { name: spec.en },
    });
    ctx.cities.set(spec.slug, doc.id);
    seededCitySlugs.add(spec.slug);
    tallyOutcome(report.cities, outcome);
  };

  for (const country of allCountries) {
    if (country.capital) {
      await upsertCity({ ...country.capital, country: country.slug });
    }
  }
  for (const city of EXTRA_CITIES) await upsertCity(city);

  // Any city present in the dataset taxonomies but not yet covered above.
  for (const city of dataset.taxonomies.cities) {
    await upsertCity({ slug: city.slug, ar: city.name.ar, en: city.name.en, country: city.countrySlug });
  }
};
