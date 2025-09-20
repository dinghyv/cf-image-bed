module.exports = {
	content: ['./index.html', './src/**/*.vue'],
	theme: {
		extend: {
			colors: {
				cyber: {
					primary: '#00ff88',
					secondary: '#ff0080',
					accent: '#00d4ff',
					'dark': '#0a0a0a',
					'darker': '#050505',
					'card': '#111111',
					'text': '#ffffff',
					'text-dim': '#888888',
					'border': '#333333',
					'glow': '#00ff88'
				}
			},
			fontFamily: {
				'cyber': ['Courier New', 'monospace'],
			},
			animation: {
				'cyber-glow': 'cyberGlow 8s ease-in-out infinite alternate',
				'cyber-spin': 'cyberSpin 1s linear infinite',
				'cyber-pulse': 'cyberPulse 2s ease-in-out infinite',
			},
			keyframes: {
				cyberGlow: {
					'0%': { opacity: '0.3' },
					'100%': { opacity: '0.7' }
				},
				cyberSpin: {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				cyberPulse: {
					'0%, 100%': { 
						boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)',
						transform: 'scale(1)'
					},
					'50%': { 
						boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)',
						transform: 'scale(1.02)'
					}
				}
			},
			boxShadow: {
				'cyber': '0 0 10px rgba(0, 255, 136, 0.3)',
				'cyber-lg': '0 0 20px rgba(0, 255, 136, 0.6)',
				'cyber-xl': '0 0 30px rgba(0, 255, 136, 0.8)',
			}
		}
	},
	plugins: [],
	important: true
}
