export interface Movie {
  id: string;
  title: string;
  image: string;
  badge: "IMAX" | "4DX" | "Standard" | "DOLBY 3D" | "VIP";
  duration: string;
  genre: string[];
  description: string;
  rating?: string;
  releaseYear?: string;
  cinemas: string[];
  showtimes: string[];
  isFeatured?: boolean;
}
