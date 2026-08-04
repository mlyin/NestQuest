export interface Property {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number | null; // last sale price or AVM estimate
  priceLabel: string; // human label e.g. "Est. $1.2M" or "Sold $980K"
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  ownerNames: string[];
}

export interface Coords {
  latitude: number;
  longitude: number;
}
