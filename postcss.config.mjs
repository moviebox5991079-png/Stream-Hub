/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- Note: Quotes zaroori hain
    autoprefixer: {},
  },
};

export default config;