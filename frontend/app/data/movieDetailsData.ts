import type { Movie } from "../types/movie";
import { moviesData } from "./moviesData";

export const detailedMoviesData: Record<string, Movie> = {
  "neon-odyssey": {
    id: "neon-odyssey",
    title: "Neon Odyssey",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYuCvyARE3VGdStliB8mAuraGYY_slA7HYymLAOSbVGGD3goLz2EjKJzaVXRekIPgz-EB1bvNT0XBurhZv0SBDnJBzyx6EcvNwpLHx1hzzQITgrSPc7N0EMG9BLVUqeCYuAx77lhCd3vQtucGrAyEXqnukWaoKTNttdJIWPBT5EYk_ASrwkJIyKKArWwElfJ3nHCOjf3FyT9qgdFG3WsN80WDgibtvfEN4NjInyi3OEwrCNOI0kljNLQ",
    backdropImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7QcMWKKvMGpjPvtaegbmTyHCUyTRkmj8UM2gcSw2Ct78TPTzL-YF09c68MoiQPuUoYZBWO5wO4r3bkxajr3cB8X4N7JEHNsNRL1VbRaOSetW8t247YrLgbdypA6-3Y-1zmqhLlBtkiN-eW8M4E4jHCQS5yWd_7YPkFlmTUggxZ16mMk8XdgIhsMjtGRhYW9Px2H8H3X854-IvOPHN0tU4I8UjQx31eQ09ogSHBowutbJKiIOYVbRi3w",
    badge: "IMAX",
    duration: "2h 45m",
    genre: ["Sci-Fi", "Action"],
    description:
      "In a dystopian future, a lone rogue must navigate the neon-lit underworld to uncover a conspiracy that threatens the last of humanity.",
    rating: "8.5",
    releaseYear: "2024",
    director: "J.K. Sterling",
    releaseDate: "November 12, 2024",
    cinemas: ["Starlight Grand", "Metroplex 14", "The Majestic"],
    showtimes: ["18:30", "21:00", "23:45"],
    isFeatured: true,
    cast: [
      {
        name: "Elias Thorne",
        character: "Kael",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCNJi2aSeelIgzwbrIDeEpygyvOjs9deEsdFDMvJZKMFu925ftbvzI71POtZElQtUbTkj6nY3ITgeNbSWbAwHQVzAaTWXjaiDwymB0fZudik1uVuG8ICcg6lSQ3g-l1S7kiobS_flwGLy1slJnBlAvb6T7Qb9viJ6VOqVXS8wUoRNLpT7y2zXLKkvwvCQ5asj89Vay4d_LWJ0LNkcUsLqyrtKswpC4OLPsexVtGjr2pdREE4EQU9H_ObQ",
      },
      {
        name: "Sarah Vance",
        character: "Lyra",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBBRBnBO2PddeX_gstyI2xwPF3CmKLHOuaDfCOSaG0B-XzBPKF1dRkpt_dehzzf-lDgVsI99Mt5ztZ38VQI65RjUZdcrYYPg0I8InpdTU8Df7GGf41YhvR_3byxWInxiOk-DeZ4i34PIe5dckIiQfUFRagCQmrHQF9o5nI19b0qFMMySPxRPb8oL5yiGsi4i54rQevKAB4GrBzApjoPCXRjdOEwP06Wgqym-TGJKxdkcuxmq4077hEh0g",
      },
    ],
    locationShowtimes: [
      {
        cinemaName: "Starlight Grand",
        distance: "2.4 mi",
        formats: ["IMAX", "Standard"],
        showtimes: ["18:30", "21:00", "23:45"],
      },
      {
        cinemaName: "Metroplex 14",
        distance: "5.1 mi",
        formats: ["4DX", "Standard"],
        showtimes: ["19:15", "22:30"],
      },
      {
        cinemaName: "The Majestic",
        distance: "8.7 mi",
        formats: ["Standard"],
        showtimes: ["17:00", "20:15"],
      },
    ],
  },
  "neon-horizons": {
    id: "neon-horizons",
    title: "Neon Horizons",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYuCvyARE3VGdStliB8mAuraGYY_slA7HYymLAOSbVGGD3goLz2EjKJzaVXRekIPgz-EB1bvNT0XBurhZv0SBDnJBzyx6EcvNwpLHx1hzzQITgrSPc7N0EMG9BLVUqeCYuAx77lhCd3vQtucGrAyEXqnukWaoKTNttdJIWPBT5EYk_ASrwkJIyKKArWwElfJ3nHCOjf3FyT9qgdFG3WsN80WDgibtvfEN4NjInyi3OEwrCNOI0kljNLQ",
    backdropImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7QcMWKKvMGpjPvtaegbmTyHCUyTRkmj8UM2gcSw2Ct78TPTzL-YF09c68MoiQPuUoYZBWO5wO4r3bkxajr3cB8X4N7JEHNsNRL1VbRaOSetW8t247YrLgbdypA6-3Y-1zmqhLlBtkiN-eW8M4E4jHCQS5yWd_7YPkFlmTUggxZ16mMk8XdgIhsMjtGRhYW9Px2H8H3X854-IvOPHN0tU4I8UjQx31eQ09ogSHBowutbJKiIOYVbRi3w",
    badge: "IMAX",
    duration: "2h 45m",
    genre: ["Action", "Sci-Fi"],
    description:
      "In a dystopian future, one rogue agent must navigate a sprawling megacity to uncover a conspiracy.",
    rating: "8.9",
    releaseYear: "2024",
    director: "J.K. Sterling",
    releaseDate: "October 20, 2024",
    cinemas: ["Downtown Cinema", "Mall Multiplex"],
    showtimes: ["14:30", "17:45", "21:00"],
    isFeatured: true,
    cast: [
      {
        name: "Elias Thorne",
        character: "Kael",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCNJi2aSeelIgzwbrIDeEpygyvOjs9deEsdFDMvJZKMFu925ftbvzI71POtZElQtUbTkj6nY3ITgeNbSWbAwHQVzAaTWXjaiDwymB0fZudik1uVuG8ICcg6lSQ3g-l1S7kiobS_flwGLy1slJnBlAvb6T7Qb9viJ6VOqVXS8wUoRNLpT7y2zXLKkvwvCQ5asj89Vay4d_LWJ0LNkcUsLqyrtKswpC4OLPsexVtGjr2pdREE4EQU9H_ObQ",
      },
      {
        name: "Sarah Vance",
        character: "Lyra",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBBRBnBO2PddeX_gstyI2xwPF3CmKLHOuaDfCOSaG0B-XzBPKF1dRkpt_dehzzf-lDgVsI99Mt5ztZ38VQI65RjUZdcrYYPg0I8InpdTU8Df7GGf41YhvR_3byxWInxiOk-DeZ4i34PIe5dckIiQfUFRagCQmrHQF9o5nI19b0qFMMySPxRPb8oL5yiGsi4i54rQevKAB4GrBzApjoPCXRjdOEwP06Wgqym-TGJKxdkcuxmq4077hEh0g",
      },
    ],
    locationShowtimes: [
      {
        cinemaName: "Downtown Cinema",
        distance: "1.8 mi",
        formats: ["IMAX", "Standard"],
        showtimes: ["14:30", "17:45", "21:00"],
      },
      {
        cinemaName: "Mall Multiplex",
        distance: "4.2 mi",
        formats: ["Standard"],
        showtimes: ["15:00", "18:15"],
      },
    ],
  },
};

export function getMovieById(id: string): Movie | null {
  if (detailedMoviesData[id]) {
    return detailedMoviesData[id];
  }
  
  const baseMovie = moviesData.find((m) => m.id === id);
  if (!baseMovie) return null;

  return {
    ...baseMovie,
    backdropImage: baseMovie.image,
    director: "Marcus Vance",
    releaseDate: "December 5, 2024",
    cast: [
      {
        name: "Alex Rivera",
        character: "Lead Protagonist",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCNJi2aSeelIgzwbrIDeEpygyvOjs9deEsdFDMvJZKMFu925ftbvzI71POtZElQtUbTkj6nY3ITgeNbSWbAwHQVzAaTWXjaiDwymB0fZudik1uVuG8ICcg6lSQ3g-l1S7kiobS_flwGLy1slJnBlAvb6T7Qb9viJ6VOqVXS8wUoRNLpT7y2zXLKkvwvCQ5asj89Vay4d_LWJ0LNkcUsLqyrtKswpC4OLPsexVtGjr2pdREE4EQU9H_ObQ",
      },
      {
        name: "Elena Rostova",
        character: "Co-Lead",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBBRBnBO2PddeX_gstyI2xwPF3CmKLHOuaDfCOSaG0B-XzBPKF1dRkpt_dehzzf-lDgVsI99Mt5ztZ38VQI65RjUZdcrYYPg0I8InpdTU8Df7GGf41YhvR_3byxWInxiOk-DeZ4i34PIe5dckIiQfUFRagCQmrHQF9o5nI19b0qFMMySPxRPb8oL5yiGsi4i54rQevKAB4GrBzApjoPCXRjdOEwP06Wgqym-TGJKxdkcuxmq4077hEh0g",
      },
    ],
    locationShowtimes: baseMovie.cinemas.map((cinema, idx) => ({
      cinemaName: cinema,
      distance: `${(idx + 1) * 2.5} mi`,
      formats: [baseMovie.badge, "Standard"],
      showtimes: baseMovie.showtimes,
    })),
  };
}
