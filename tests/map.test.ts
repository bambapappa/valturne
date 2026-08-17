import { describe, expect, it } from 'vitest';
import { renderSwedenMapSvg } from '../src/map';

describe('Map Module', () => {
  it('renders SVG with all 5 Sweden regions', () => {
    const svg = renderSwedenMapSvg({
      selectedRegionId: 'stockholm',
      regionalSupport: {
        norrland: 20,
        svealand: 25,
        stockholm: 35,
        vastsverige: 30,
        sydsverige: 20,
      },
      onSelectRegion: () => {},
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('data-region-id="norrland"');
    expect(svg).toContain('data-region-id="svealand"');
    expect(svg).toContain('data-region-id="stockholm"');
    expect(svg).toContain('data-region-id="vastsverige"');
    expect(svg).toContain('data-region-id="sydsverige"');
    expect(svg).toContain('35%');
  });
});
