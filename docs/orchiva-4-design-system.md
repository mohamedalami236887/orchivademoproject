# Orchiva 4 product design system

## Research

The local UI UX Pro Max skill was read in UTF-8 and its search workflow executed from the project root:

```text
python .agents/skills/ui-ux-pro-max/scripts/search.py "CRM enterprise records workspace" --design-system --density 7 -p "Orchiva 4"
python .agents/skills/ui-ux-pro-max/scripts/search.py "CRM data table records" --domain product -n 3
python .agents/skills/ui-ux-pro-max/scripts/search.py "professional enterprise readability" --domain typography -n 3
python .agents/skills/ui-ux-pro-max/scripts/search.py "neutral teal enterprise" --domain color -n 3
python .agents/skills/ui-ux-pro-max/scripts/search.py "keyboard drawer focus" --domain ux -n 3
python .agents/skills/ui-ux-pro-max/scripts/search.py "signals reactive forms" --stack angular
```

The design-system result recommended Minimalism & Swiss Style for an enterprise app, with high contrast, clear hierarchy and subtle hover states. The CRM product record recommended Flat Design plus Minimalism & Swiss Style. Typography results recommended a consistent legible sans family. The color search gave mostly unrelated palettes, so the existing Orchiva teal semantic tokens remain the basis, moderated by quieter neutral surfaces. UX results emphasized visible focus within drawers. Angular results favored signals for local state and reactive forms for complex forms; the dataset labels these Angular 22, so implementation remains within the installed Angular 21 APIs.

Official Attio documentation describes separate workspace navigation and a main record panel, records in tables, previews and pages, and views organized by sorting and filtering. Those principles inform Orchiva's record views and inspection, without copying assets or layouts: [navigation](https://attio.com/help/reference/attio-101/introduction-to-navigating-attio), [records](https://attio.com/help/reference/attio-101/attios-data-model/understanding-records).

## Direction

- Neutral, information-first surfaces with restrained teal for selection and primary actions. Fine borders and compact radii replace ornamental elevation.
- A sidebar for global destinations; local views and controls sit inside each workspace. Data-heavy pages use available width.
- The Requests collection uses horizontal status views, a persistent filter rail, server sorting and paging, and a contextual inspector on desktop. The inspector becomes a dismissible drawer on narrow screens.
- Request Details groups persisted business data into Overview, Workflow, Activity and Documents. Every section remains reachable by keyboard and is driven by the current backend responses.
- Typography favors readable 14–16px operational text, clear title hierarchy, tabular numbers and visible focus. Light and dark token pairs are kept together.
- Shared controls have consistent hover/focus/disabled states, while reduced-motion preferences remove decorative transition.

## Boundaries

No invented metrics or mock records. Workflow Studio's tested editing and publishing behavior remains intact. Visual browser verification must be reported separately from compilation and unit tests.

## Continuation: operational workspaces

The remaining screens apply the same information hierarchy. Dashboard now leads with three linked workload counts and real status distribution on a neutral surface. Approval Inbox includes the selected request's actual document evidence beside its business context, with loading and retry states. Users can combine account, role, and department filters. Departments can isolate inactive or unmanaged teams and scan them as directory rows. Audit events expose structured metadata for reading while preserving the original JSON. Notifications group current and earlier activity. Workflow Studio supports arrow-key movement between stages and exposes selected state to assistive technology.

Additional local UI UX Pro Max searches covered heading hierarchy, visible keyboard focus, and responsive record tables. The implementation keeps focus indication, supports keyboard navigation for workflow stages, and lets dense record views reflow or scroll at narrow widths. The searches informed these choices; runtime visual review is a separate verification step.

## Approved Requests reference implementation

The supplied 1728 × 900 mockup is the visual reference for Requests. Its three-column proportions, dark navigation, horizontal status views, filter rail, compact records table, and selected-record inspector guide the Angular implementation. Status and type filters, search, sorting, paging, selection, and inspector tabs use existing APIs. The reference's department, owner, priority, and amount controls or fields are omitted where the current request list API does not provide them. Local UI UX Pro Max results favored CRM flat design and a mobile card alternative for wide tables; the implementation retains a dense table on desktop and mobile record buttons at narrow widths.
