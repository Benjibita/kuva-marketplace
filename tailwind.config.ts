import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /** Primary actions: checkout, add to cart, key CTAs */
        primary: "#000000",
        "primary-dark": "#262626",
        /** KUVA design language */
        kuva: {
          lavender: "#CFC9E9",
          surface: "#F5F5F5",
          line: "#EAEAEA",
          cream: "#FAFAFA",
          accent: "#FF5A5F",
          success: "#A3BFA8",
        },
      },
      borderRadius: {
        "4xl": "1.75rem",
        "5xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
        nav: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
