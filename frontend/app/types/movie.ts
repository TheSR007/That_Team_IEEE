export interface CastMember {
  name: string;
  character: string;
  image: string;
}

export interface LocationShowtime {
  cinemaName: string;
  distance: string;
  formats: string[];
  showtimes: string[];
}

export interface Movie {
  id: string;
  title: string;
  image: string;
  backdropImage?: string;
  badge: "IMAX" | "4DX" | "Standard" | "DOLBY 3D" | "VIP";
  duration: string;
  genre: string[];
  description: string;
  rating?: string;
  releaseYear?: string;
  cinemas: string[];
  showtimes: string[];
  isFeatured?: boolean;
  director?: string;
  releaseDate?: string;
  cast?: CastMember[];
  locationShowtimes?: LocationShowtime[];
}

