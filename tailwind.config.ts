import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {


      screens: {
        xs: '300px',
        smx: '500px',
        mdx: '700px',
        lgx: '900px',
        xlx: '1100px',
        xxlx: '1300px',
      },



    },
  },
  plugins: [],
};
export default config;