const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'neon-orange': '#FF6C11',
        'neon-pink': '#FF3864',
        'cyan-blue': '#2DE2E6',
        'deep-purple': '#261447',
        'dark-red': '#0D0221',

        // Secondary Colors
        'bright-blue': '#023788',
        'teal': '#650D89',
        'magenta': '#920075',
        'bright-pink': '#F6019D',
        'crimson': '#D40078',

        // Accent Colors
        'dark-navy': '#241734',
        'deep-violet': '#2E2157',
        'hot-pink': '#FD3777',
        'bright-yellow': '#F1D153',

        // Additional Colors
        'bright-purple': '#F9C80E',
        'light-pink': '#FF4365',
        'vivid-purple': '#540D6E',
        'muted-purple': '#791E94',
        'dark-magenta': '#541388',
      },
      fontFamily: {
        'lazer': ['Lazer84', 'sans-serif'],
        'press': ['"Press Start 2P"', 'system-ui'],
      },
    },
  },
  plugins: [],
};
