/** PostCSS config for Tailwind / NativeWind. Use sync-only plugins (Tailwind 3.3.2) to avoid "Use process(css).then(cb)" with NativeWind v2. */
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
