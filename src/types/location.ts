export interface District {
  name: string;
  lat: number;
  lon: number;
}

export interface Provinces {
  [provinceName: string]: District[];
}
