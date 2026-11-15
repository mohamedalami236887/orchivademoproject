# Requests workspace design specification

## Research performed

The local UI UX Pro Max skill was read in full. Its Python standard-library search script and local `products.csv`, `styles.csv`, `colors.csv`, `typography.csv`, `ux-guidelines.csv`, and `stacks/angular.csv` resources were inspected. Python 3.14.3 is available. These commands were executed from the project root:

```text
python .agents/skills/ui-ux-pro-max/scripts/search.py "enterprise SaaS operations workspace" --design-system --density 7 -p "Orchiva Requests"
python .agents/skills/ui-ux-pro-max/scripts/search.py "B2B operations command center" --design-system --density 7 -p "Orchiva Requests"
python .agents/skills/ui-ux-pro-max/scripts/search.py "data heavy operations table" --domain ux -n 4
python .agents/skills/ui-ux-pro-max/scripts/search.py "drawer keyboard focus management" --domain ux -n 4
python .agents/skills/ui-ux-pro-max/scripts/search.py "responsive request discovery" --stack angular
python .agents/skills/ui-ux-pro-max/scripts/search.py "reactive forms signals" --stack angular
python .agents/skills/ui-ux-pro-max/scripts/search.py "enterprise professional readability" --domain typography -n 3
python .agents/skills/ui-ux-pro-max/scripts/search.py "enterprise SaaS teal" --domain color -n 3
python .agents/skills/ui-ux-pro-max/scripts/search.py "responsive table mobile card" --domain ux -n 3
```

The first system query returned a marketing Hero + Features + CTA layout and glassmorphism; these do not fit an operational record screen. The narrower query returned an Accessible & Ethical style emphasizing high contrast, 16px text, keyboard navigation and visible focus. Its marketing layout is likewise set aside. The color search returned generic SaaS blue/orange and a professional teal palette; Orchiva's existing semantic teal tokens better preserve product identity. The typography search recommended a legible enterprise single-family hierarchy; the project keeps its local Aptos/Segoe stack rather than loading a remote font.

The UX search identified mobile table overflow and recommended a card layout. The focus search returned visible focus rings, logical keyboard order and unobscured focused controls. The Angular search for responsive discovery surfaced an interceptor result unrelated to this screen, so the focused `reactive forms signals` search was used for relevant local-state guidance; its records target Angular 22, so only the compatible signal principle is applied to Angular 21.

## Direction and implementation decisions

- A wide record workbench uses a compact discovery rail, readable request records and an on-demand contextual drawer. The global sidebar remains the primary navigation.
- Filters operate on the existing server search, status, type, sort and pagination contract. Active filters are visible and resettable; no client-only fake totals are shown.
- Selecting a record opens its backend workspace and shows actual status, owner, business justification, workflow stage and decisions. The full request route stays directly accessible.
- The drawer has a clear close control, Escape support, focus entry and focus return. Async loading, errors and retry are explicit.
- Desktop uses a data table with strong reference/title hierarchy. Mobile renders dedicated request cards without horizontal page overflow.
- Existing semantic light/dark tokens, 16px body scale, visible focus styling and reduced-motion support carry through. Transitions communicate drawer entry only.
