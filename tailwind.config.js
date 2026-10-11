/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        lab: {
          void: '#04060f',
          abyss: '#070b1a',
          deep: '#0b1124',
          panel: '#0e1730',
          line: '#1b2a4d',
          cyan: '#22e3ff',
          blue: '#3b82f6',
          violet: '#a855f7',
          amber: '#fbbf24',
          danger: '#f43f5e',
          mint: '#34d399',
        },
      },
      opacity: {
        // Fine-grained alphas used by the glass/glow styling.
        2: '0.02',
        3: '0.03',
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(34, 227, 255, 0.45)',
        'glow-lg': '0 0 60px -10px rgba(34, 227, 255, 0.55)',
        violet: '0 0 32px -6px rgba(168, 85, 247, 0.55)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'spin-slow': 'spin 9s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'scan-line': 'scan-line 4s linear infinite',
        wobble: 'wobble 3.4s ease-in-out infinite',
        heat: 'heat 1.8s ease-in-out infinite',
        // Gesture Guide illustrations. Kept short and looping so each card
        // demonstrates its gesture without demanding attention.
        sway: 'sway 2.8s ease-in-out infinite',
        pinch: 'pinch 2s ease-in-out infinite',
        drop: 'drop 2.4s ease-in-out infinite',
        pour: 'pour 3s ease-in-out infinite',
        scroll: 'scroll 2.6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(2000%)' },
        },
        wobble: {
          '0%,100%': { transform: 'translateX(0) scaleY(1)' },
          '50%': { transform: 'translateX(2px) scaleY(1.012)' },
        },
        heat: {
          '0%,100%': { opacity: '0.25', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.6', transform: 'translateY(-6px) scale(1.04)' },
        },
        /* ---- Gesture Guide loops ---- */
        sway: {
          '0%,100%': { transform: 'translateX(-4px) rotate(-3deg)' },
          '50%': { transform: 'translateX(4px) rotate(3deg)' },
        },
        pinch: {
          // the squeeze itself, held briefly at the closed position
          '0%,100%': { transform: 'scale(1)' },
          '40%,60%': { transform: 'scale(0.9)' },
        },
        drop: {
          '0%': { transform: 'translateY(-6px)' },
          '55%': { transform: 'translateY(6px)' },
          '100%': { transform: 'translateY(-6px)' },
        },
        pour: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '45%,70%': { transform: 'rotate(-10deg)' },
        },
        scroll: {
          '0%,100%': { transform: 'translateY(7px)' },
          '50%': { transform: 'translateY(-7px)' },
        },
      },
    },
  },
  plugins: [],
}
