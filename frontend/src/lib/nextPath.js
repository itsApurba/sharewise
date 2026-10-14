import { useSearchParams } from "react-router-dom";

/** Only same-app paths are allowed as a post-login destination. */
export const safeNext = (next) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

/** Where to go after logging in: the `?next=` path the guard sent us from, or the feed. */
export const useNextPath = () => {
  const [params] = useSearchParams();
  return safeNext(params.get("next"));
};
