import { LuBrain, LuChartColumn, LuChartNoAxesColumn, LuCompass, LuHouse, LuPenLine, LuTrophy, LuUser, LuUsers } from "react-icons/lu";
import { SAMPLE_VIEWER } from "../../sample/sampleData";

/**
 * Primary destinations: the mobile bottom nav and the top of the desktop sidebar.
 * `badge` names a key in AppShell's `badges` prop (the Review due count).
 * Profile points at the sample viewer until auth knows who is signed in.
 */
export const PRIMARY_NAV = [
  { to: "/", label: "Feed", icon: LuHouse, end: true },
  { to: "/explore", label: "Explore", icon: LuCompass },
  { to: "/review", label: "Review", icon: LuBrain, badge: "review" },
  { to: "/stats", label: "Stats", icon: LuChartColumn },
  { to: `/u/${SAMPLE_VIEWER.handle}`, label: "Profile", icon: LuUser },
];

/** The original Sharewise screens, kept reachable while the feature slices replace them. */
export const CLASSIC_NAV = [
  { to: "/create", label: "Create user / post", icon: LuPenLine },
  { to: "/users", label: "Users", icon: LuUsers },
  { to: "/user-analytics", label: "User analytics", icon: LuTrophy },
  { to: "/post-analytics", label: "Post analytics", icon: LuChartNoAxesColumn },
];
