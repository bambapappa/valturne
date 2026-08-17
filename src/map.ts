import type { RegionId } from './types';
import { REGIONS } from './mockData';

export interface MapRenderOptions {
  selectedRegionId: RegionId | null;
  regionalSupport: Record<RegionId, number>;
  onSelectRegion: (id: RegionId) => void;
}

export function renderSwedenMapSvg(options: MapRenderOptions): string {
  const { selectedRegionId, regionalSupport } = options;

  // Custom stylized SVG paths for Sweden's 5 regions
  // ViewBox: 0 0 400 800
  const regionsSvg = [
    {
      id: 'norrland' as RegionId,
      name: 'Norrland',
      d: 'M 140,40 L 220,10 L 260,35 L 290,110 L 280,180 L 260,250 L 220,330 L 150,320 L 130,230 L 110,130 Z',
      labelX: 200,
      labelY: 180,
    },
    {
      id: 'svealand' as RegionId,
      name: 'Mellansverige',
      d: 'M 150,320 L 220,330 L 250,360 L 245,430 L 190,440 L 125,405 L 130,340 Z',
      labelX: 185,
      labelY: 380,
    },
    {
      id: 'stockholm' as RegionId,
      name: 'Stockholm',
      d: 'M 245,405 L 285,410 L 290,455 L 245,460 L 240,420 Z',
      labelX: 265,
      labelY: 435,
    },
    {
      id: 'vastsverige' as RegionId,
      name: 'Västsverige',
      d: 'M 125,405 L 190,440 L 195,535 L 130,555 L 105,470 Z',
      labelX: 150,
      labelY: 485,
    },
    {
      id: 'sydsverige' as RegionId,
      name: 'Sydsverige',
      d: 'M 190,440 L 245,460 L 240,570 L 195,640 L 125,640 L 130,555 L 195,535 Z',
      labelX: 185,
      labelY: 575,
    },
  ];

  const paths = regionsSvg
    .map((r) => {
      const isSelected = selectedRegionId === r.id;
      const support = Math.round(regionalSupport[r.id] ?? 20);
      const regionData = REGIONS[r.id];

      // Color coding based on support level
      let fillColor = '#e2e8f0'; // Base gray (slate-200)
      let strokeColor = '#94a3b8'; // Slate-400
      let textColor = '#0f172a';

      if (support >= 35) {
        fillColor = '#bbf7d0'; // Green-200
        strokeColor = '#16a34a';
      } else if (support >= 25) {
        fillColor = '#fef08a'; // Yellow-200
        strokeColor = '#ca8a04';
      } else if (support > 0) {
        fillColor = '#fed7aa'; // Orange-200
        strokeColor = '#ea580c';
      }

      if (isSelected) {
        fillColor = '#38bdf8'; // Sky-400
        strokeColor = '#0284c7';
      }

      return `
      <g class="region-group cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-[0.99]" 
         data-region-id="${r.id}" 
         tabindex="0"
         role="button"
         aria-label="Välj ${r.name}, väljarstöd ${support}%">
        <path d="${r.d}" 
              fill="${fillColor}" 
              stroke="${strokeColor}" 
              stroke-width="${isSelected ? '3.5' : '2'}" 
              class="transition-colors duration-200 ${isSelected ? 'filter drop-shadow-md' : ''}" />
        
        <!-- Region Marker & Pill -->
        <g transform="translate(${r.labelX}, ${r.labelY})">
          <!-- Background pill -->
          <rect x="-42" y="-14" width="84" height="28" rx="14" fill="#ffffff" stroke="${strokeColor}" stroke-width="1.5" class="drop-shadow-sm" />
          
          <!-- Text -->
          <text x="0" y="-1" text-anchor="middle" font-size="10" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">
            ${r.name}
          </text>
          <text x="0" y="10" text-anchor="middle" font-size="9" font-weight="600" fill="${strokeColor}" font-family="system-ui, -apple-system, sans-serif">
            ${support}% • ${regionData.mandates}m
          </text>
        </g>
      </g>
    `;
    })
    .join('\n');

  return `
    <svg viewBox="80 0 240 680" class="w-full max-w-sm mx-auto h-auto max-h-[580px] drop-shadow-sm select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="0.75"/>
        </pattern>
      </defs>
      <!-- Background subtle grid -->
      <rect x="0" y="0" width="400" height="800" fill="url(#grid)" opacity="0.5" />
      
      <!-- Sweden Regions -->
      <g id="regions-layer">
        ${paths}
      </g>
    </svg>
  `;
}
