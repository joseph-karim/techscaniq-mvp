/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // TechScanIQ Brand Colors - Primary Palette
        "brand": {
          "black": "#000000",
          "white": "#FFFFFF",
          "teal": "#00C2B2",
          "gunmetal": "#2C2C2E",
        },
        
        // Semantic Colors
        "error": "#f87171",
        "warning": "#fb923c",
        "caution": "#facc15",
        "success": "#4ade80",
        
        // Neutral Grays
        "gray": {
          50: "#f9fafb",
          200: "#e5e7eb",
          600: "#4b5563",
          700: "#374151",
          900: "#111827",
        },
        
        // Legacy colors maintained for compatibility
        "brand-black": "#000000",
        "brand-white": "#FFFFFF", 
        "brand-digital-teal": "#00C2B2",
        "brand-gunmetal-gray": "#2C2C2E",
        "deep-navy": "#0B1E40",
        "slate-gray": "#64748B", 
        "electric-teal": "#14B8A6",
        "signal-green": "#10B981",
        "risk-red": "#DC2626",
        "caution-amber": "#F59E0B",
        "neutral-gray": "#6B7280",
        "gunmetal-gray": "#2C2C2E",
        "digital-teal": "#00C2B2",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        "space": ["Space Grotesk", "system-ui", "sans-serif"],
        "ibm": ["IBM Plex Sans", "system-ui", "sans-serif"],
        "mono": ["IBM Plex Mono", "monospace"],
        // Legacy support
        heading: ["Space Grotesk", "system-ui", "sans-serif"],
        grotesk: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Professional typography scale
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h2': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'h4': ['1.25rem', { lineHeight: '1.5' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        // Professional spacing scale for high whitespace
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}