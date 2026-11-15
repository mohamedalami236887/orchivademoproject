import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name()) {
        @case ('dashboard') { <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="4" rx="2"/><rect x="14" y="11" width="7" height="10" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/> }
        @case ('requests') { <path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h4M10 12h6M10 16h6"/> }
        @case ('approvals') { <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/> }
        @case ('documents') { <path d="M4 5a2 2 0 0 1 2-2h4l2 3h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/> }
        @case ('workflows') { <circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 5h3a4 4 0 0 1 4 4v1M8 19h3a4 4 0 0 0 4-4v-1"/> }
        @case ('users') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> }
        @case ('departments') { <path d="M3 21h18M5 21V6l7-3 7 3v15M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/> }
        @case ('audit') { <path d="M12 22a10 10 0 1 0-10-10"/><path d="M2 4v6h6M12 6v6l4 2"/> }
        @case ('bell') { <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/> }
        @case ('menu') { <path d="M4 7h16M4 12h16M4 17h16"/> }
        @case ('collapse') { <path d="m15 18-6-6 6-6"/> }
        @case ('expand') { <path d="m9 18 6-6-6-6"/> }
        @case ('plus') { <path d="M12 5v14M5 12h14"/> }
        @case ('search') { <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/> }
        @case ('refresh') { <path d="M20 7h-5V2M4 17h5v5"/><path d="M5.1 9A8 8 0 0 1 18 5l2 2M18.9 15A8 8 0 0 1 6 19l-2-2"/> }
        @case ('sun') { <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/> }
        @case ('moon') { <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/> }
        @case ('logout') { <path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/> }
        @case ('close') { <path d="m6 6 12 12M18 6 6 18"/> }
        @case ('arrow-right') { <path d="M5 12h14M13 6l6 6-6 6"/> }
        @case ('download') { <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/> }
        @case ('upload') { <path d="M12 16V4m0 0 4 4m-4-4-4 4M5 21h14"/> }
        @case ('filter') { <path d="M4 5h16l-6 7v5l-4 2v-7z"/> }
        @case ('activity') { <path d="M3 12h4l2-7 4 14 2-7h6"/> }
        @case ('clock') { <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/> }
        @case ('paperclip') { <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/> }
        @default { <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/> }
      }
    </svg>
  `,
  styles: [':host{display:inline-grid;width:1.15rem;height:1.15rem;flex:0 0 auto}:host svg{width:100%;height:100%}']
})
export class IconComponent { readonly name = input.required<string>(); }
