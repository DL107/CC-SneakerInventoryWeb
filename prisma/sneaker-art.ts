/**
 * Generates a stylized side-profile sneaker illustration as an SVG string,
 * with a transparent background so it can sit directly on the shelf view.
 * Used only by the seed script — real users upload their own photos.
 */
export type SneakerColorway = {
  upper: string;      // main body panels
  overlay: string;    // toe cap, heel counter, eyestay
  band: string;       // the diagonal side band
  sole: string;       // midsole
  outsole: string;    // bottom rubber
  laces: string;
  collar?: string;    // ankle collar (defaults to overlay)
};

const UPPER_PATH = `M90,412
    C 78,386 88,352 124,334
    C 158,318 196,320 234,332
    C 286,350 328,344 364,314
    C 392,290 408,252 434,228
    C 448,216 470,212 484,218
    C 496,226 504,238 518,244
    C 542,252 570,246 596,244
    C 640,240 690,252 720,282
    C 750,312 766,368 762,400
    C 758,412 744,415 726,415
    L 110,414 Z`;

export function sneakerSvg(c: SneakerColorway): string {
  const collar = c.collar ?? c.overlay;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="900" height="560">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.10"/>
    </linearGradient>
  </defs>

  <!-- Compress length and raise height about the ground line so the
       profile reads as a basketball/lifestyle sneaker, not a loafer -->
  <g transform="translate(70,485) scale(0.86,1.3) translate(-10,-485)">

  <!-- outsole -->
  <path d="M96,452 L752,446 C784,445 792,458 779,469 C698,485 212,488 124,477 C97,473 87,460 96,452 Z" fill="${c.outsole}"/>

  <!-- midsole -->
  <path d="M78,412 C68,438 88,454 130,453 L752,447 C794,445 802,426 787,408 L764,402 L106,410 Z" fill="${c.sole}" stroke="#00000022" stroke-width="2"/>

  <!-- upper body -->
  <path d="${UPPER_PATH}" fill="${c.upper}"/>

  <!-- tongue padding -->
  <path d="M434,228 C448,216 470,212 484,218 C490,230 490,242 483,250 C468,242 453,238 441,240 C434,236 432,232 434,228 Z" fill="${collar}" opacity="0.9"/>

  <!-- heel counter -->
  <path d="M596,244 C640,240 690,252 720,282 C750,312 766,368 762,400 C758,412 744,415 726,415 L650,415 C648,352 630,296 596,244 Z" fill="${c.overlay}"/>

  <!-- toe cap -->
  <path d="M90,412 C78,386 88,352 124,334 C158,318 196,320 234,332 C228,362 212,390 180,410 C150,414 108,413 90,412 Z" fill="${c.overlay}"/>

  <!-- eyestay / lace panel strip along the instep -->
  <path d="M322,352 C356,340 386,318 410,292 C424,274 436,256 452,242 L478,234 C488,250 490,266 484,280 C462,294 440,314 420,334 C400,354 372,368 344,372 C330,364 322,358 322,352 Z" fill="${c.overlay}" opacity="0.95"/>

  <!-- laces: bars crossing the eyestay -->
  <g stroke-linecap="round">
    <line x1="361" y1="309" x2="407" y2="353" stroke="#00000025" stroke-width="17"/>
    <line x1="395" y1="274" x2="441" y2="318" stroke="#00000025" stroke-width="17"/>
    <line x1="428" y1="240" x2="474" y2="284" stroke="#00000025" stroke-width="17"/>
    <line x1="361" y1="309" x2="407" y2="353" stroke="${c.laces}" stroke-width="13"/>
    <line x1="395" y1="274" x2="441" y2="318" stroke="${c.laces}" stroke-width="13"/>
    <line x1="428" y1="240" x2="474" y2="284" stroke="${c.laces}" stroke-width="13"/>
  </g>

  <!-- side band -->
  <path d="M235,412 C340,404 456,376 556,330 L582,318 C592,334 590,352 578,364 C494,404 372,414 285,414 Z" fill="${c.band}"/>

  <!-- subtle bottom shading on upper -->
  <path d="${UPPER_PATH}" fill="url(#shade)"/>

  <!-- stitch accents -->
  <path d="M234,332 C228,362 212,390 180,410" fill="none" stroke="#00000022" stroke-width="3" stroke-dasharray="7 6"/>
  <path d="M596,244 C630,296 648,352 650,415" fill="none" stroke="#00000022" stroke-width="3" stroke-dasharray="7 6"/>
  </g>
</svg>`;
}
