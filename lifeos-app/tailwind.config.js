module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0F0F0F',
        surface: '#1A1A1A',
        surfaceAlt: '#2D2D2D',
        accent: '#6366F1',
        accentMuted: '#4F46E5',
        gold: '#C9A962',
      },
    },
  },
  plugins: [],
};
