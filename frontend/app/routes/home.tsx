import type { Route } from "./+types/home";
import SignUp from "./signup";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CinemaSeat - Premier Cinema Experience" },
    { name: "description", content: "Welcome to CinemaSeat Movie Catalog." },
  ];
}

export default function Home() {
  return <SignUp />;
}
