import { LuCheck, LuClock, LuGraduationCap, LuRotateCcw } from "react-icons/lu";

/** The four review states and how each one reads. Palettes match the review.* semantic tokens. */
export const REVIEW_STATES = {
  due: { label: "Due today", palette: "honey", icon: LuClock },
  gotIt: { label: "Got it", palette: "sage", icon: LuCheck },
  forgot: { label: "Forgot", palette: "clay", icon: LuRotateCcw },
  mastered: { label: "Mastered", palette: "plum", icon: LuGraduationCap },
};
