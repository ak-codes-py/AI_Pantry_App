import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
        fontFamily: {
          'playfair': ['"Playfair Display"', 'serif'],
          'merriweather-light':["Merriweather", 'serif'],
          'manrope': ['Manrope', 'sans-serif'],
          'space-grotesk':["Space Grotesk", "sans-serif"]
        },
        fontWeight: {
          'light': '300',
          'normal': '400',
          'medium': '500',
          'semibold': '600',
          'bold': '700',
          'extrabold': '800',
          'black': '900',
        },
        boxShadow: {
          'perfect':'box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px',
          '3d': 'rgba(0, 0, 0, 0.2) 0px 60px 40px -7px;'
        },
        backgroundColor: {
          'matt': '#333'
        }
      },
  },
  plugins: [],
};
export default config;
