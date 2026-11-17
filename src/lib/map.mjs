// Borderless map (§3.5 E). Land geometry only (world-atlas land-110m): the
// dataset contains no country boundaries, so none can be drawn. Equal Earth.
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function landPath(width = 1000) {
  const topo = require('world-atlas/land-110m.json');
  if (Object.keys(topo.objects).join() !== 'land') throw new Error('Map data must contain land only');
  const land = feature(topo, topo.objects.land);
  const projection = geoEqualEarth().fitWidth(width, land);
  const path = geoPath(projection).digits(1);
  const [[x0, y0], [x1, y1]] = path.bounds(land);
  const d = path(land);
  return { d, width: Math.ceil(x1 - x0), height: Math.ceil(y1 - y0), offset: [x0, y0] };
}
