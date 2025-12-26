/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // <--- YEH LINE SABSE ZAROORI HAI
  images: {
    unoptimized: true, // IPFS par Next.js ki image optimization nahi chalti
  },
  // Baqi config wese hi rehne dein...
};

export default nextConfig;









// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
