/** Deck cover colours (API values) and the theme palette each one paints with. */
export const DECK_COLORS = [
  { value: "ember", palette: "brand", label: "Ember" },
  { value: "honey", palette: "honey", label: "Honey" },
  { value: "sage", palette: "sage", label: "Sage" },
  { value: "clay", palette: "clay", label: "Clay" },
  { value: "plum", palette: "plum", label: "Plum" },
  { value: "ink", palette: "gray", label: "Ink" },
];

export const deckPalette = (color) => DECK_COLORS.find((c) => c.value === color)?.palette ?? "brand";

/** Quick picks in the deck form; any single emoji can be typed instead. */
export const DECK_EMOJIS = ["📚", "⚡", "🧠", "🛟", "🌱", "🧩", "🎯", "🔥", "💡", "🛠️", "🎨", "🚀"];

export const DECK_TITLE = [3, 60];
export const DECK_DESCRIPTION_MAX = 200;
