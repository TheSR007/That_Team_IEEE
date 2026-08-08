import { getMovieById } from "./movieDetailsData";

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: "standard" | "vip";
  status: "available" | "occupied" | "selected";
  price: number;
  spacerBefore?: boolean;
}

export interface SeatRow {
  rowLabel: string;
  isVip?: boolean;
  seats: Seat[];
}

export interface SelectSeatMovieData {
  movieId: string;
  movieTitle: string;
  posterImage: string;
  bgOverlayImage: string;
  showtime: string;
  cinemaVenue: string;
  screenName: string;
  format: string;
  standardPrice: number;
  vipPrice: number;
  convenienceFee: number;
  initialSelectedSeatIds: string[];
  rows: SeatRow[];
}

export const defaultSeatData: SelectSeatMovieData = {
  movieId: "neon-odyssey",
  movieTitle: "Neon Odyssey",
  posterImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB_4b86t0lSkAT9Arc1N22XF-ixIuZHc6zX_2QsRmI_TV6T0OAp4OfTHn_RgXWBQOywaxMFnJpkVYWBwptRRt5_H99Y9vcHaz3uhZ_SnEkcKxJS0_SgvK4Mn0CEh8CoplsyOqLFScG0-0n6jhvr2Jlkxg4bN0bITkvofuPbhDp4oUeHeMCijLPiFjcbl0ZvcplAAv19hi-YWxy1Mgr5spGcY_cCKXrpfBX7ujLovtHQemwP_o12h_IdlQ",
  bgOverlayImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAPeQpoc3__LqxodR985GLebkuheNJ5uMREFikxNL5FbJsRCvyKjFioSivRaTgRylaRVZ379b3WljuUI4JKwA5OLebSHm0Ce6W9D5apF4D0Gmfnc6Qd2azAuU7GRmwjpJ14M8z-PZXUh0QttCQvBOfGx9JhnsaMxKu_-ejlrhfwXLBJxy-UkGCbP4Dmee5CKVif1q_Y_Gi4HedctTm4751JIsilxE6egkoXtwAbSn29-RLVtaXImiLLGw",
  showtime: "21:00",
  cinemaVenue: "Starlight Grand",
  screenName: "Screen 4",
  format: "IMAX 3D",
  standardPrice: 12.0,
  vipPrice: 18.0,
  convenienceFee: 3.0,
  initialSelectedSeatIds: ["C5", "C6"],
  rows: [
    {
      rowLabel: "A",
      seats: [
        { id: "A1", row: "A", number: 1, type: "standard", status: "occupied", price: 12 },
        { id: "A2", row: "A", number: 2, type: "standard", status: "occupied", price: 12 },
        { id: "A3", row: "A", number: 3, type: "standard", status: "available", price: 12, spacerBefore: true },
        { id: "A4", row: "A", number: 4, type: "standard", status: "available", price: 12 },
        { id: "A5", row: "A", number: 5, type: "standard", status: "available", price: 12 },
        { id: "A6", row: "A", number: 6, type: "standard", status: "available", price: 12 },
        { id: "A7", row: "A", number: 7, type: "standard", status: "occupied", price: 12, spacerBefore: true },
        { id: "A8", row: "A", number: 8, type: "standard", status: "occupied", price: 12 },
      ],
    },
    {
      rowLabel: "B",
      seats: [
        { id: "B1", row: "B", number: 1, type: "standard", status: "available", price: 12 },
        { id: "B2", row: "B", number: 2, type: "standard", status: "available", price: 12 },
        { id: "B3", row: "B", number: 3, type: "standard", status: "occupied", price: 12, spacerBefore: true },
        { id: "B4", row: "B", number: 4, type: "standard", status: "occupied", price: 12 },
        { id: "B5", row: "B", number: 5, type: "standard", status: "available", price: 12 },
        { id: "B6", row: "B", number: 6, type: "standard", status: "available", price: 12 },
        { id: "B7", row: "B", number: 7, type: "standard", status: "available", price: 12, spacerBefore: true },
        { id: "B8", row: "B", number: 8, type: "standard", status: "available", price: 12 },
      ],
    },
    {
      rowLabel: "C",
      seats: [
        { id: "C1", row: "C", number: 1, type: "standard", status: "occupied", price: 12 },
        { id: "C2", row: "C", number: 2, type: "standard", status: "occupied", price: 12 },
        { id: "C3", row: "C", number: 3, type: "standard", status: "available", price: 12 },
        { id: "C4", row: "C", number: 4, type: "standard", status: "available", price: 12, spacerBefore: true },
        { id: "C5", row: "C", number: 5, type: "standard", status: "selected", price: 12 },
        { id: "C6", row: "C", number: 6, type: "standard", status: "selected", price: 12 },
        { id: "C7", row: "C", number: 7, type: "standard", status: "available", price: 12, spacerBefore: true },
        { id: "C8", row: "C", number: 8, type: "standard", status: "available", price: 12 },
        { id: "C9", row: "C", number: 9, type: "standard", status: "available", price: 12 },
        { id: "C10", row: "C", number: 10, type: "standard", status: "occupied", price: 12 },
      ],
    },
    {
      rowLabel: "D",
      isVip: true,
      seats: [
        { id: "D1", row: "D", number: 1, type: "vip", status: "available", price: 18 },
        { id: "D2", row: "D", number: 2, type: "vip", status: "available", price: 18 },
        { id: "D3", row: "D", number: 3, type: "vip", status: "available", price: 18, spacerBefore: true },
        { id: "D4", row: "D", number: 4, type: "vip", status: "occupied", price: 18 },
        { id: "D5", row: "D", number: 5, type: "vip", status: "occupied", price: 18 },
        { id: "D6", row: "D", number: 6, type: "vip", status: "available", price: 18, spacerBefore: true },
        { id: "D7", row: "D", number: 7, type: "vip", status: "available", price: 18 },
      ],
    },
  ],
};

export function getSeatDataByMovieId(movieId: string): SelectSeatMovieData {
  const movieDetails = getMovieById(movieId);
  if (!movieDetails) {
    return defaultSeatData;
  }

  return {
    ...defaultSeatData,
    movieId: movieDetails.id,
    movieTitle: movieDetails.title,
    posterImage: movieDetails.image,
    bgOverlayImage: movieDetails.backdropImage || defaultSeatData.bgOverlayImage,
    format: movieDetails.badge || "IMAX 3D",
  };
}
