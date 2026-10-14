# Sharewise design system

Sharewise is "the feed that makes you remember". The interface should feel like a study desk at dusk: warm paper, ink-dark text, one ember accent for the act of remembering, and calm colors for review states. Avoid loud gradients, neon, and dense dashboards.

The system is built on Chakra UI 3. Tokens live in `src/theme.js`, reusable components in `src/components/ds/`, and placeholder screens in `src/pages/`.

## Principles

- **Mobile first.** Design at 390px wide first. Nothing may scroll sideways at any width. Code blocks scroll inside their own box.
- **One idea per card.** Lessons, reviews and panels all sit on the same `Surface`.
- **Color carries meaning.** Ember means "remember". The four review colors mean only their review state.
- **Calm motion.** Short background and color transitions only. No bouncing or lift-on-hover. The one exception is a review card under a finger: it follows the swipe with a slight tilt and flies off once graded. With `prefers-reduced-motion` it follows without tilting and fades instead of flying.

## Tokens

### Color palettes

| Palette | Role | Use as |
|---|---|---|
| `gray` (warm paper) | Neutrals. It overrides Chakra's gray, so every default component is warm. | `bg`, `fg`, `border` |
| `brand` (ember) | Primary actions, "Remember this", active nav, the streak flame. This is the global default `colorPalette`. | `colorPalette="brand"` |
| `honey` | Review state: **due** | `review.due.*` |
| `sage` | Review state: **got it**, success toasts | `review.gotIt.*` |
| `clay` | Review state: **forgot**, error toasts, destructive buttons | `review.forgot.*` |
| `plum` | Review state: **mastered**, quizzes | `review.mastered.*` |

Each palette has steps 50 to 950, plus the semantic slots Chakra recipes read: `solid`, `contrast`, `fg`, `subtle`, `muted`, `emphasized`, `focusRing` and `border`. Every slot has a light and a dark value, so `colorPalette="sage"` works on any Chakra component.

### Semantic colors

Use these instead of raw palette steps, so dark mode works without extra code:

- `bg` is the page. `bg.panel` is cards. `bg.subtle` is the sidebar and inset areas. `bg.muted` is code blocks and hover states.
- `fg` is body text. `fg.muted` is secondary text.
- `border`, `border.muted` and `border.emphasized`.
- `review.<state>.solid | subtle | fg | border`, where state is `due`, `gotIt`, `forgot` or `mastered`. Example: `borderTopColor="review.due.solid"`.
- `streak` is the flame color.
- `syntax.keyword | string | number | title | attr | comment` color highlighted code inside `CodeSnippet`. They are for code only and carry no review meaning there.

Dark mode is a warm night (`gray.950` page, `gray.900` panels), not pure black. next-themes adds the `dark` class; Chakra's `_dark` condition follows it.

### Typography

| Token | Font | Use |
|---|---|---|
| `fonts.heading` | Fraunces (variable serif) | Titles and big numbers |
| `fonts.body` | Inter (variable) | Everything else |
| `fonts.mono` | JetBrains Mono (variable) | Code snippets, IDs |

The fonts are self-hosted through `@fontsource-variable/*` and imported in `src/main.jsx`.

Text styles (`textStyle="..."`): `display` (page titles), `title` (card and section titles), `lesson` (lesson body, 1.6 line height), `label` (small uppercase eyebrow) and `caption`.

### Spacing, sizes, radii, shadows

- **Spacing:** Chakra's 4px scale. The page gutter is `4` (16px) on phones, `6` on tablets and `10` on desktop. Cards pad `4` on phones and `5` from `md`. Stack cards with `gap="4"`.
- **Sizes:** `content` (40rem) is the reading column most screens use. `wide` (64rem) is for dashboards and two-column forms. Shell sizes: `sidebar` 15rem, `rail` 4.5rem, `topBar` 3.5rem and `bottomNav` 4rem.
- **Radii:** `card` (1rem) for surfaces, `control` (0.75rem) for inputs, notices and quiz choices, and `full` for pill buttons and badges.
- **Shadows:** `card` (resting surfaces), `raised` (toasts and menus) and `nav` (the bottom nav). All three are warm-tinted in light mode and nearly flat in dark mode.

### Breakpoints

Chakra defaults: `sm` 480, `md` 768, `lg` 1024, `xl` 1280. Write base styles for phones, then override upward: `px={{ base: "4", md: "6" }}`.

## Components (`src/components/ds/`)

| Component | What it does |
|---|---|
| `AppShell` | The frame for in-app routes; render routes inside it as children (`<Outlet />`). Below `md` it shows a top bar plus a fixed bottom nav (Feed / Explore / Review / Stats / Profile). At `md` it shows an icon rail. From `lg` it shows a full sidebar with a "Classic" group. Pass `badges={{ review: n }}` to fill the Review due-count badge. Nav items live in `navItems.js`. |
| `PageContainer` | Centers a screen. `width="content"` (default) or `"wide"`. |
| `PageHeader` | Eyebrow, serif title, description, right-side actions and an optional `backTo` link. |
| `SectionHeading` | An `h2` with an optional action on the right. |
| `PreviewNotice` | A honey note marking a screen that shows sample data. Remove it when the screen gets real data. |
| `Surface` | The card surface. Use it for any panel. |
| `LessonCard` / `LessonCardSkeleton` | Author line, title, markdown body, code, link, tags (linking to Explore), a quiz tag, and a "Remember this" footer. Takes an API Lesson. With `to` the body is a short preview (about 280 characters, long code blocks cut to 6 lines) ending in "Read more"; without it the body renders in full. `footer` replaces the footer and `headerAction` adds a menu at the top right. `AuthorLine` is exported from the same file for reuse. `components/lessons/LessonItem` wires it to the API (remember toggle, author edit/delete menu). |
| `Markdown` | Renders a lesson body as the safe markdown subset in `backend/API.md` (parsed by `src/lib/markdown.js` into React elements, so no HTML is ever injected). `limit` makes a preview and `more` is shown after it when text was cut. |
| `CodeSnippet` | A code block (a string or `{ language, source }`) that scrolls inside its own box, with a copy button and syntax highlighting in the `syntax.*` colors. highlight.js and its grammars load lazily on the first snippet (`useHighlightedCode` in `src/hooks/useRichText.js`); until then the plain source shows. |
| `ReviewCard` / `ReviewCardSkeleton` | A saved lesson coming back (an API Review). A choice quiz is answered by picking, a free-answer quiz by typing (or "Show answer", which counts as forgot), and a lesson without a quiz by "Show the lesson" then "Got it" or "Forgot". Each answer goes to `onAnswer(body)`, which resolves to the API's `{ review, result }`; the card then colors itself by the result, reveals the lesson and answer, and says when it comes back. `onContinue` adds a button after the result. `shortcuts` adds window keys and a hint row of key caps (hidden on touch screens): Space shows the lesson, 1 / ← / F forgot, 2 / → / G got it, A-D pick a choice, Enter or Space continues. `swipeable` lets touch readers grade a revealed lesson by swiping right (got it) or left (forgot), with a sage or clay edge and label fading in on the trailing side; the card then flies off and `onContinue` runs at once. The buttons stay as the accessible fallback. The gesture and key hooks are in `hooks/useReviewGestures.js`. |
| `QuizChoices` | Lettered answer buttons, graded by the caller. `onPick(index)` fires on the first pick and locks the group; once `correctIndex` is known it shows the right answer in sage and a wrong `picked` in clay. |
| `ReviewStateBadge` | A pill for `due`, `gotIt`, `forgot` or `mastered`. The state metadata is in `reviewStates.js`. |
| `StreakAvatar` | An avatar with a flame-and-number badge. A streak of 0 shows the plain avatar. |
| `StatTile` | A label and a big number, tinted by `palette`. |
| `WeekChart` | Seven columns of reviews per day, today last, with values on the caps and a hidden table for screen readers. `days` is `[{ date, count }]`. |
| `ActivityHeatmap` | A GitHub-style grid of reviews per day: one column per week (Sunday on top), ember shades by quarter of the busiest day, a Less/More legend. Hovering, focusing or tapping a cell shows its date and count in the line below. It scrolls sideways inside its card, never the page. `days` is `[{ date, count }]`, oldest first. `components/activity/ActivityPanel` wraps it in a card with totals for a handle (on profiles and Stats). |
| `EmptyState` | A dashed panel with an icon, title, guidance and an optional action. |
| `FeedSkeleton`, `ListSkeleton`, `StatTilesSkeleton` | Loading placeholders that match the real layouts. |
| `Logo`, `LogoMark`, `ColorModeButton` | Brand mark and the light/dark toggle. |

### Deck components (`src/components/decks/`)

| Component | What it does |
|---|---|
| `DeckCover` | A deck's emoji on its cover colour. The API's cover colours map to palettes in `deckStyle.js` (`ember` → `brand`, `ink` → `gray`, the rest by name). Cover colours are the user's choice and carry no review meaning. |
| `DeckCard` / `DeckCardSkeleton` | A deck as a link tile: cover band, title, owner, lesson and remember counts, and "All yours" once the viewer remembers every lesson. |
| `DeckRow` | Deck cards in one row that scrolls sideways inside its own box (snap per card). Used by Explore's "Popular decks" and the profile's "Decks". |
| `DeckFormDialog` | Create or edit a deck: title, description, an emoji (quick picks or any typed emoji) and a cover colour. |
| `AddToDeckButton` | "Add to deck" on the lesson page: toggles the lesson in each of your decks, or starts a new deck with it. |

**Quiz shapes:** a lesson's optional `quiz` follows `backend/API.md`: `{ prompt, kind: "choice" | "text", choices? }`, plus `correctIndex` / `answer` only once the viewer may see them. Answers are graded on the server. `ReviewCard` and the lesson page handle both kinds; only multiple choice goes through `QuizChoices`.

**Toasts:** call `toaster.success | error | warning | info({ title, description })` from `src/components/ui/toaster.js`. Toasts appear at the top, so they never cover the bottom nav. They render as a panel with a state-colored edge: sage, clay, honey, or ember for info.

## Routes

| Path | Screen | Status |
|---|---|---|
| `/` | Feed | Real: lessons mixed with due reviews, infinite scroll; a welcome plus newest lessons when logged out |
| `/explore` | Explore | Real, public; `?tag=` filters; a "Popular decks" row when no tag is picked |
| `/deck/:id` | Deck: its lessons in order, "Remember all", owner edit/delete and remove-from-deck | Real, public |
| `/review` | Review queue | Real: one due card at a time, swipe or keys to grade, progress, the last card's result, done state |
| `/stats` | Stats | Real data: your streak and progress, a twelve-week activity heatmap, top lessons and teachers, community totals |
| `/u/:handle` | Profile with a twelve-week activity heatmap and the user's decks above the tabs (`?tab=followers` or `following` picks the list) | Real data |
| `/profile` | Redirects to the signed-in user's profile | Done |
| `/settings/profile` | Edit my profile, log out, delete account | Real data |
| `/lesson/:id` | Lesson detail | Real: remember toggle, inline quiz, author menu, "Add to deck" |
| `/lesson/:id/edit` | Edit lesson | Real, author only |
| `/new` | Lesson composer | Real, with validation, a Write/Preview toggle for the markdown body, quiz builder and card preview |
| `/login`, `/signup` | Auth (own layout, no nav). `?next=` is where to go afterwards | Real data |
| `/welcome` | Onboarding after sign-up: suggested people to follow (own layout) | Real data |
| `/post`, `/user-analytics`, `/post-analytics` | Classic screens | Real data, restyled |
| `*` | Not found | Done |

Only `/explore`, `/deck/:id`, `/login` and `/signup` are public. Every other route sits inside `RequireAuth` (`src/components/auth/Guards.jsx`), which sends logged-out visitors to `/login?next=<path>`.

Sample data lives in `src/sample/sampleData.js`. All of it is invented. Each feature slice should replace its imports from that file with real queries, and delete the file once nothing imports it.

## Adding a screen

1. Create `src/pages/MyPage.jsx`:

   ```jsx
   import { Stack } from "@chakra-ui/react";
   import { PageContainer, PageHeader } from "../components/ds/Page";
   import LessonCard from "../components/ds/LessonCard";
   import { FeedSkeleton } from "../components/ds/Skeletons";
   import EmptyState from "../components/ds/EmptyState";

   const MyPage = () => {
     const { data, isLoading } = useMyQuery();
     return (
       <PageContainer>
         <PageHeader eyebrow='Section' title='My page' description='One line on what this is for.' />
         {isLoading ? <FeedSkeleton /> : data.length === 0 ? <EmptyState title='Nothing here yet' /> : (
           <Stack gap='4'>{data.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}</Stack>
         )}
       </PageContainer>
     );
   };
   export default MyPage;
   ```

2. Register it in `src/AllRoutes.jsx`, inside the `<AppShell>` route for in-app screens, or inside `<AuthLayout>` for signed-out screens.
3. If it is a primary destination, add it to `PRIMARY_NAV` in `navItems.js`. Keep the bottom nav at five items; put anything else under the sidebar or the profile screen.
4. Always handle three states: loading (a skeleton), empty (`EmptyState`) and error (`EmptyState` with a retry hint).
5. Check it at 390x844, 768 and 1440, in light and dark. `document.documentElement.scrollWidth` must equal the viewport width.

## Rules of thumb

- Use semantic tokens (`bg.panel`, `fg.muted`, `review.due.solid`), never hex values, in components.
- Put `minW="0"` on flex children that hold text, and `overflowWrap="anywhere"` on user-written text (names, emails, URLs).
- Use pill buttons (`rounded="full"`) for actions. Use `colorPalette="gray"` with `variant="ghost"` or `"outline"` for secondary actions, and `clay` for destructive ones.
- Icons come from `react-icons/lu` (Lucide) at `boxSize` 4 or 5.
