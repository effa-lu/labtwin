/**
 * Design tokens — the single place to change how the product looks.
 * Effa owns this file. Change a value here and every panel, button and 3D object follows.
 *
 * Source: LABTWIN Color System v1.0 (Effa, 2026-09-05). Dark charcoal chrome, blue-led.
 * Usage ratio: primary blue 60 · secondary blue 20 · orange 10 · gray 7 · light neutral 3.
 */
export const brand = {
  // core
  primaryBlue: '#59B4C5', // trust / science — main brand
  secondaryBlue: '#88C5CF', // support / interface — UI elements
  activeCyan: '#2AAABC', // interactive / highlight — buttons, links
  accentOrange: '#D16736', // energy / attention — alerts, accents
  neutralGray: '#9A9A9A', // text / icons — secondary text
  lightNeutral: '#D3BAB4', // surfaces / borders — panels, cards
  // extended (visualization & data)
  deepTeal: '#3B6B72',
  sage: '#8AAE9B',
  lavender: '#B6B0D9',
  sand: '#E8D9C9',
  coral: '#E07A5F',
  yellow: '#E0B547',
  stone: '#C7C7CC',
  plum: '#6E5A8E',
  // the charcoal the system is presented on
  charcoal: '#3A3E40',
  charcoalDeep: '#2D3133',
  charcoalRaised: '#454A4D',
} as const;

export const tokens = {
  color: {
    // chrome — dark charcoal, three depths
    bg: brand.charcoalDeep, // viewport / page ground
    surface: brand.charcoal, // panels
    surfaceMuted: brand.charcoalRaised, // inputs, hover rows, cards
    border: '#4F5558',
    borderStrong: '#5E6568',

    // header
    headerBg: brand.charcoalDeep,
    headerText: '#ECEEEF',
    headerMuted: brand.neutralGray,
    headerBorder: '#44494B',
    wordmarkA: '#F2F3F3', // "LAB"
    wordmarkB: brand.activeCyan, // "TWIN"

    // text
    text: '#ECEEEF',
    textMuted: brand.neutralGray,
    textOnAccent: '#FFFFFF',

    // interaction
    primary: brand.primaryBlue, // brand elements, active tabs, headings
    primarySoft: 'rgba(89,180,197,0.16)',
    interactive: brand.activeCyan, // buttons, links, hover
    interactiveSoft: 'rgba(42,170,188,0.18)',
    accent: brand.primaryBlue, // kept for older call sites
    accentSoft: 'rgba(89,180,197,0.16)',
    secondary: brand.accentOrange, // selection, alerts, "+"
    secondarySoft: 'rgba(209,103,54,0.18)',
    lightNeutral: brand.lightNeutral, // card edges, dividers with warmth
    danger: brand.coral,

    // scene
    floor: '#4A5053',
    wall: '#6A7377',
    grid: '#3E4447',
    gridSection: '#4E5558',
    selected: brand.accentOrange,
    hovered: brand.activeCyan,

    // components — blue-led (60/20), extended palette for the rest
    entity: {
      CAB: brand.primaryBlue, // cabinet
      SHF: brand.secondaryBlue, // open shelf
      BCH: brand.sand, // bench — warm worktop
      FHD: brand.deepTeal, // fume hood
      FRZ: brand.stone, // fridge / freezer — white goods
      SAF: brand.accentOrange, // safety cabinet — semantic
      SNK: brand.activeCyan, // sink — water
      EQP: brand.neutralGray, // generic equipment
      GLV: brand.stone, // glovebox — white body
    },

    // extended palette exposed for charts / data views
    viz: [brand.primaryBlue, brand.accentOrange, brand.sage, brand.lavender, brand.yellow, brand.coral, brand.plum, brand.deepTeal],
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { sm: 4, md: 8, lg: 12, pill: 999 },
  font: {
    family:
      '"Montserrat", "Avenir Next", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", Consolas, monospace',
    size: { xs: 11, sm: 12, md: 14, lg: 18 },
    /** wide tracking for uppercase labels, as in the brand sheet */
    tracking: 1.6,
  },
  panel: {
    paletteWidth: 236,
    inspectorWidth: 304,
  },
} as const;

export type Tokens = typeof tokens;
