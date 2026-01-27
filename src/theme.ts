import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#faf5ff" },
          100: { value: "#f3e8ff" },
          200: { value: "#e9d5ff" },
          300: { value: "#d8b4fe" },
          400: { value: "#c084fc" },
          500: { value: "#a855f7" },
          600: { value: "#9333ea" },
          700: { value: "#7c3aed" },
          800: { value: "#6b21a8" },
          900: { value: "#581c87" },
        },
        accent: {
          50: { value: "#ecfeff" },
          100: { value: "#cffafe" },
          200: { value: "#a5f3fc" },
          300: { value: "#67e8f9" },
          400: { value: "#22d3ee" },
          500: { value: "#06b6d4" },
          600: { value: "#0891b2" },
          700: { value: "#0e7490" },
          800: { value: "#155e75" },
          900: { value: "#164e63" },
        },
        surface: {
          50: { value: "#1e1e2e" },
          100: { value: "#1a1a2e" },
          200: { value: "#16162a" },
          300: { value: "#131326" },
          400: { value: "#0f0f20" },
          500: { value: "#0a0a18" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "{colors.surface.100}" },
          subtle: { value: "{colors.surface.50}" },
          muted: { value: "rgba(255, 255, 255, 0.05)" },
          card: { value: "rgba(255, 255, 255, 0.03)" },
          cardHover: { value: "rgba(255, 255, 255, 0.08)" },
        },
        border: {
          DEFAULT: { value: "rgba(255, 255, 255, 0.1)" },
          subtle: { value: "rgba(255, 255, 255, 0.05)" },
          accent: { value: "{colors.brand.500}" },
        },
        text: {
          DEFAULT: { value: "#ffffff" },
          muted: { value: "rgba(255, 255, 255, 0.6)" },
          subtle: { value: "rgba(255, 255, 255, 0.4)" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "linear-gradient(135deg, #1a1a2e 0%, #16162a 50%, #0f0f20 100%)",
      color: "white",
      minHeight: "100vh",
    },
    "*::selection": {
      bg: "brand.500",
      color: "white",
    },
  },
})

export const system = createSystem(defaultConfig, config)
