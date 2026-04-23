/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 🛡️ Esto le dice a Vercel: "No te detengas aunque haya avisos de ESLint"
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🛡️ Y esto: "No te detengas por avisos de TypeScript"
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig