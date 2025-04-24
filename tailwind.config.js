/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom sci-fi palette
        'terminal-green': '#00ff00',
        'neon-green': '#39ff14',
        'dark-space': '#050505',
        'midnight': '#121212',
        'deep-void': '#0a0a0a',
        'hud-blue': '#007eff',
      },
      boxShadow: {
        'neon-green': '0 0 5px rgba(57, 255, 20, 0.5), 0 0 20px rgba(57, 255, 20, 0.3)',
        'neon-red': '0 0 5px rgba(255, 20, 20, 0.5), 0 0 20px rgba(255, 20, 20, 0.3)',
        'neon-blue': '0 0 5px rgba(0, 126, 255, 0.5), 0 0 20px rgba(0, 126, 255, 0.3)',
      },
      fontFamily: {
        'sci-fi': ['"Orbitron"', '"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} 