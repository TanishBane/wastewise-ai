/**
 * WasteWise AI — Premium Multicolor Enterprise Design Tokens
 * 
 * Refined palette establishing WasteWise AI's green sustainability identity
 * complemented by royal blue, vibrant teal, soft cyan, violet, amber, and coral accents.
 */

export const tokens = {
  colors: {
    // Brand Greens
    brand: {
      deep: '#12523C',         // Deep forest green for branding / strong headers
      primary: '#16865D',      // Primary emerald interactive accent
      mint: '#47D7A0',         // Bright mint highlight / indicator
      pale: '#E4F7ED',         // Pale green surface background
      dark: '#12523C',         // Deep forest reference
      panel: '#172B3D',        // Deep feature surface
    },

    // Teal & Cyan Spectrum
    teal: {
      deep: '#087E8B',         // Deep teal for model telemetry & analytics
      vibrant: '#13B8A6',      // Vibrant teal for interactive states / inference
      softCyan: '#DDF5F7',     // Soft cyan for tinted cards / badges
    },

    // Professional Blue Spectrum
    blue: {
      royal: '#4263D8',        // Professional royal blue for Recommended Prep
      bright: '#5585F7',       // Bright blue for highlights & focus rings
      pale: '#EAF0FF',         // Pale blue surface for prep cards & badges
    },

    // Premium Violet Spectrum
    violet: {
      premium: '#7656D6',      // Premium violet for Potential Surplus & scenarios
      soft: '#A78BFA',         // Soft violet accent line
      pale: '#F0EBFF',         // Pale violet surface background
    },

    // Amber & Orange Spectrum
    amber: {
      main: '#E7A32D',         // Amber for moderate risk / cost exposure
      orange: '#F28C45',       // Warm orange accent
      pale: '#FFF3D9',         // Pale amber background
      text: '#92400E',         // WCAG AA compliant dark amber text (6.8:1)
    },

    // Coral & Red Spectrum
    coral: {
      main: '#E96B63',         // Coral for urgent shortage / alert accent
      deepRed: '#BF3F45',      // Deep red for critical text / borders (5.2:1)
      pale: '#FDE9E7',         // Pale coral background
    },

    // Neutrals & Canvas Surfaces
    canvas: {
      bg: '#F5F7FA',           // Main application background
      surface: '#FFFFFF',      // Standard card surface
      alternate: '#F0F3F8',    // Alternate background / row highlight
      border: '#DFE5EC',       // Subtle border
      deepPanel: '#172B3D',    // Deep feature surface / banner
    },

    // Neutral Text Tokens (WCAG AA Compliant)
    text: {
      primary: '#17232E',      // Primary text (15.6:1 on white)
      secondary: '#647386',    // Secondary text (4.9:1 on white)
      muted: '#8A99A8',        // Non-text decorative only
    },

    // Semantic Status Tokens
    semantic: {
      danger: {
        bg: '#FDE9E7',
        border: '#E96B63',
        text: '#BF3F45',
        solid: '#BF3F45',
        badgeBg: '#FDE9E7',
      },
      warning: {
        bg: '#FFF3D9',
        border: '#E7A32D',
        text: '#92400E',
        solid: '#E7A32D',
        badgeBg: '#FFF3D9',
      },
      success: {
        bg: '#E4F7ED',
        border: '#47D7A0',
        text: '#12523C',
        solid: '#16865D',
        badgeBg: '#E4F7ED',
      },
      info: {
        bg: '#EAF0FF',
        border: '#5585F7',
        text: '#4263D8',
        solid: '#4263D8',
        badgeBg: '#EAF0FF',
      },
      violet: {
        bg: '#F0EBFF',
        border: '#A78BFA',
        text: '#7656D6',
        solid: '#7656D6',
        badgeBg: '#F0EBFF',
      },
      teal: {
        bg: '#DDF5F7',
        border: '#13B8A6',
        text: '#087E8B',
        solid: '#087E8B',
        badgeBg: '#DDF5F7',
      },
    },

    // Chart Data Visualization Palette
    chart: {
      model: '#16865D',         // Primary emerald forest
      modelHover: '#47D7A0',    // Bright mint hover
      baseline: '#647386',      // Professional slate blue comparison
      uncertaintyBand: '#DDF5F7',// 80% soft cyan interval fill
      uncertaintyLine: '#12523C',// Whisker stroke line
      prep: '#4263D8',          // Preparation series royal blue
      surplus: '#7656D6',       // Surplus series violet
      risk: '#E7A32D',          // Risk series amber
      grid: '#DFE5EC',          // Neutral grid tone
    },
  },

  // Typography Hierarchy (Minimum 12px everywhere)
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSizes: {
      xs: '12px',              // Strict minimum UI tier
      sm: '13px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
  },
} as const;

export type ThemeTokens = typeof tokens;
