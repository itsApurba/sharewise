import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/*
 * Sharewise design tokens. DESIGN.md explains every group; keep the two in step.
 *
 * Identity: a study desk at dusk. Warm paper neutrals, an ember accent for
 * "remember", and four calm review-state colors (honey, sage, clay, plum).
 */

// Warm paper neutrals. Overriding `gray` warms every Chakra default (borders, muted text, subtle buttons).
const gray = {
  50: "#FAF7F2",
  100: "#F3EEE5",
  200: "#E7DFD2",
  300: "#D3C8B7",
  400: "#ADA08C",
  500: "#857967",
  600: "#665C4E",
  700: "#4C443A",
  800: "#332D27",
  900: "#221E1A",
  950: "#171411",
};

// Brand: ember, the "remember this" accent and the streak flame.
const ember = {
  50: "#FDF3EE",
  100: "#FBE3D7",
  200: "#F5C4AC",
  300: "#EC9E7B",
  400: "#E07A51",
  500: "#CF5F35",
  600: "#B34A26",
  700: "#8F3A20",
  800: "#6E2F1D",
  900: "#4F2416",
  950: "#2E140C",
};

// Review states.
const honey = {
  50: "#FEF8EB",
  100: "#FCEDC9",
  200: "#F8D98E",
  300: "#F2C055",
  400: "#E9A52C",
  500: "#D18A17",
  600: "#AC6C10",
  700: "#855212",
  800: "#643E13",
  900: "#452B0F",
  950: "#281807",
};
const sage = {
  50: "#F1F7F2",
  100: "#DDEDE0",
  200: "#BADBC1",
  300: "#8FC29C",
  400: "#63A475",
  500: "#448759",
  600: "#346C46",
  700: "#2A5539",
  800: "#22432E",
  900: "#193123",
  950: "#0E1C14",
};
const clay = {
  50: "#FCF1F1",
  100: "#F8DEDE",
  200: "#F0BDBE",
  300: "#E39497",
  400: "#D26A6F",
  500: "#BC4B52",
  600: "#9E3A41",
  700: "#7E2F35",
  800: "#61262B",
  900: "#451C20",
  950: "#280F12",
};
const plum = {
  50: "#F4F2FA",
  100: "#E6E1F4",
  200: "#CCC3E8",
  300: "#AA9DD7",
  400: "#8977C3",
  500: "#6E5AAB",
  600: "#58468E",
  700: "#463871",
  800: "#352B55",
  900: "#251E3B",
  950: "#151122",
};

const scale = (palette) => Object.fromEntries(Object.entries(palette).map(([step, value]) => [step, { value }]));

// The semantic slots Chakra recipes read through `colorPalette` (solid, subtle, fg, ...).
const paletteSlots = (name) => ({
  contrast: { value: { _light: "white", _dark: "white" } },
  fg: { value: { _light: `{colors.${name}.700}`, _dark: `{colors.${name}.300}` } },
  subtle: { value: { _light: `{colors.${name}.100}`, _dark: `{colors.${name}.900}` } },
  muted: { value: { _light: `{colors.${name}.200}`, _dark: `{colors.${name}.800}` } },
  emphasized: { value: { _light: `{colors.${name}.300}`, _dark: `{colors.${name}.700}` } },
  solid: { value: { _light: `{colors.${name}.600}`, _dark: `{colors.${name}.600}` } },
  focusRing: { value: { _light: `{colors.${name}.500}`, _dark: `{colors.${name}.400}` } },
  border: { value: { _light: `{colors.${name}.500}`, _dark: `{colors.${name}.400}` } },
});

// review.<state>.{solid,subtle,fg,border}: what a card, badge or button uses for that state.
const reviewState = (name) => ({
  solid: { value: `{colors.${name}.solid}` },
  subtle: { value: `{colors.${name}.subtle}` },
  fg: { value: `{colors.${name}.fg}` },
  border: { value: { _light: `{colors.${name}.300}`, _dark: `{colors.${name}.700}` } },
});

const fallbackSans = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: "brand",
      WebkitTapHighlightColor: "transparent",
    },
    body: {
      bg: "bg",
      color: "fg",
      fontFamily: "body",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
    },
    "h1, h2, h3": { textWrap: "balance" },
    "p": { textWrap: "pretty" },
  },
  theme: {
    tokens: {
      colors: {
        gray: scale(gray),
        brand: scale(ember),
        honey: scale(honey),
        sage: scale(sage),
        clay: scale(clay),
        plum: scale(plum),
      },
      fonts: {
        heading: { value: `"Fraunces Variable", Georgia, "Times New Roman", serif` },
        body: { value: `"Inter Variable", ${fallbackSans}` },
        mono: { value: `"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace` },
      },
      radii: {
        card: { value: "1rem" },
        control: { value: "0.75rem" },
      },
      sizes: {
        // Layout widths. `content` is the reading column every screen centers on.
        content: { value: "40rem" },
        wide: { value: "64rem" },
        sidebar: { value: "15rem" },
        rail: { value: "4.5rem" },
        bottomNav: { value: "4rem" },
        topBar: { value: "3.5rem" },
        // Chakra 3 dropped container.*; kept for anything still sizing against Chakra 2's values.
        container: {
          sm: { value: "640px" },
          md: { value: "768px" },
          lg: { value: "1024px" },
          xl: { value: "1280px" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: { _light: "{colors.gray.50}", _dark: "{colors.gray.950}" } },
          subtle: { value: { _light: "{colors.gray.100}", _dark: "#1D1915" } },
          muted: { value: { _light: "{colors.gray.100}", _dark: "{colors.gray.900}" } },
          panel: { value: { _light: "#FFFDF9", _dark: "{colors.gray.900}" } },
        },
        fg: {
          DEFAULT: { value: { _light: "{colors.gray.900}", _dark: "#EFE8DC" } },
          muted: { value: { _light: "{colors.gray.600}", _dark: "{colors.gray.400}" } },
        },
        brand: paletteSlots("brand"),
        honey: paletteSlots("honey"),
        sage: paletteSlots("sage"),
        clay: paletteSlots("clay"),
        plum: paletteSlots("plum"),
        review: {
          due: reviewState("honey"),
          gotIt: reviewState("sage"),
          forgot: reviewState("clay"),
          mastered: reviewState("plum"),
        },
        streak: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
        // Syntax highlighting inside code snippets only; they carry no review meaning there.
        syntax: {
          keyword: { value: { _light: "{colors.plum.700}", _dark: "{colors.plum.300}" } },
          string: { value: { _light: "{colors.sage.700}", _dark: "{colors.sage.300}" } },
          number: { value: { _light: "{colors.honey.700}", _dark: "{colors.honey.300}" } },
          title: { value: { _light: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          attr: { value: { _light: "{colors.clay.700}", _dark: "{colors.clay.300}" } },
          comment: { value: { _light: "{colors.gray.500}", _dark: "{colors.gray.500}" } },
        },
      },
      shadows: {
        card: {
          value: {
            _light: "0 1px 2px rgba(60, 42, 24, 0.06), 0 2px 8px rgba(60, 42, 24, 0.05)",
            _dark: "0 1px 2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 240, 220, 0.04)",
          },
        },
        raised: {
          value: {
            _light: "0 4px 12px rgba(60, 42, 24, 0.08), 0 12px 32px rgba(60, 42, 24, 0.08)",
            _dark: "0 4px 12px rgba(0, 0, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.4)",
          },
        },
        nav: {
          value: {
            _light: "0 -1px 0 rgba(60, 42, 24, 0.08), 0 -4px 16px rgba(60, 42, 24, 0.04)",
            _dark: "0 -1px 0 rgba(255, 240, 220, 0.06)",
          },
        },
      },
    },
    slotRecipes: {
      // Calm toasts: a panel with a state-colored edge instead of a solid block of color.
      // AppToaster sets colorPalette from the toast type.
      toast: {
        base: {
          root: {
            borderRadius: "control",
            boxShadow: "raised",
            borderInlineStartWidth: "4px",
            borderColor: "colorPalette.solid",
            ...Object.fromEntries(
              ["warning", "success", "error"].map((type) => [
                `&[data-type=${type}]`,
                { bg: "bg.panel", color: "fg", "--toast-trigger-bg": "colors.bg.muted", "--toast-border-color": "colors.border" },
              ]),
            ),
          },
          indicator: { color: "colorPalette.solid" },
        },
      },
    },
    textStyles: {
      display: {
        value: { fontFamily: "heading", fontWeight: "600", fontSize: "2xl", lineHeight: "1.15", letterSpacing: "-0.01em" },
      },
      title: {
        value: { fontFamily: "heading", fontWeight: "600", fontSize: "lg", lineHeight: "1.3" },
      },
      lesson: {
        value: { fontFamily: "body", fontSize: "md", lineHeight: "1.6" },
      },
      label: {
        value: { fontFamily: "body", fontWeight: "600", fontSize: "xs", letterSpacing: "0.06em", textTransform: "uppercase" },
      },
      caption: {
        value: { fontFamily: "body", fontSize: "sm", color: "fg.muted" },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export default system;
