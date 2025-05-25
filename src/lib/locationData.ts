import type { Provinces, District } from '@/types/location';
import locations from '@/data/turkey_locations.json';

const typedLocations: Provinces = locations as Provinces;

export function getProvinces(): string[] {
  return Object.keys(typedLocations);
}

export function getDistricts(provinceName: string): District[] {
  return typedLocations[provinceName] || [];
}

export function findDistrict(provinceName: string, districtName: string): District | undefined {
  const districts = getDistricts(provinceName);
  return districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
}
