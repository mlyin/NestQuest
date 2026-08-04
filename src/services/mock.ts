import { Coords, Property } from "../types";
import { formatPrice } from "../geo";

/** Generates believable houses in a ring around the user for offline/dev use. */
export function generateMockProperties(center: Coords): Property[] {
  const streets = ["Maple", "Oak", "Cedar", "Birch", "Elm", "Willow"];
  const types = ["Single Family", "Townhouse", "Condo"];
  const out: Property[] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const meters = 25 + (i % 3) * 20; // 25–65m away
    const dLat = (meters * Math.cos(angle)) / 111_320;
    const dLon =
      (meters * Math.sin(angle)) /
      (111_320 * Math.cos((center.latitude * Math.PI) / 180));
    const price = 450_000 + i * 130_000 + (i % 2) * 90_000;
    const beds = 2 + (i % 4);
    out.push({
      id: `mock-${i}`,
      address: `${100 + i * 4} ${streets[i % streets.length]} St`,
      latitude: center.latitude + dLat,
      longitude: center.longitude + dLon,
      price,
      priceLabel: `Est. ${formatPrice(price)}`,
      bedrooms: beds,
      bathrooms: 1 + (i % 3),
      squareFootage: 1100 + i * 240,
      yearBuilt: 1955 + i * 7,
      propertyType: types[i % types.length],
      lastSalePrice: price - 60_000,
      lastSaleDate: `20${15 + (i % 8)}-06-14`,
      ownerNames: [["Jordan Lee", "Sam Rivera", "Alex Chen"][i % 3]],
    });
  }
  return out;
}
