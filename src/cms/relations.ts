import { ValidationError, type PayloadRequest } from "payload";

export const relationID = (value: unknown): string => {
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id: number | string }).id);
  }
  return value === undefined || value === null ? "" : String(value);
};

export const validateCityCountry = async ({
  city,
  country,
  req,
  collection,
}: {
  city: unknown;
  country: unknown;
  req: PayloadRequest;
  collection: "events" | "people";
}) => {
  const cityID = relationID(city);
  const countryID = relationID(country);
  if (!cityID || !countryID) return;

  const cityDocument = (await req.payload.findByID({
    collection: "cities",
    id: cityID,
    depth: 0,
    overrideAccess: true,
  })) as { country?: unknown };

  if (relationID(cityDocument.country) !== countryID) {
    throw new ValidationError({
      collection,
      errors: [
        {
          path: "city",
          label: { ar: "المدينة", en: "City" },
          message: "المدينة المختارة لا تتبع الدولة المحددة / The selected city does not belong to the selected country.",
        },
      ],
    });
  }
};
