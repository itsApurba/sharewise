import { LuBrain, LuChartColumn, LuChartNoAxesColumn, LuCompass, LuHouse, LuTrophy, LuUser } from "react-icons/lu";

/**
 * Primary destinations: the mobile bottom nav and the top of the desktop sidebar.
 * `badge` names a key in AppShell's `badges` prop (the Review due count).
 * Profile is `/profile`; AppShell points it at the signed-in user's `/u/:handle`.
 */
export const PRIMARY_NAV = [
  { to: "/", label: "Feed", icon: LuHouse, end: true },
  { to: "/explore", label: "Explore", icon: LuCompass },
  { to: "/review", label: "Review", icon: LuBrain, badge: "review" },
  { to: "/stats", label: "Stats", icon: LuChartColumn },
  { to: "/profile", label: "Profile", icon: LuUser, profile: true },
];

/** The original Sharewise screens, kept reachable while the feature slices replace them. */
export const CLASSIC_NAV = [
  { to: "/user-analytics", label: "User analytics", icon: LuTrophy },
  { to: "/post-analytics", label: "Post analytics", icon: LuChartNoAxesColumn },
];
