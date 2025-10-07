import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import history from 'connect-history-api-fallback'

export default defineConfig({
    plugins: [vue()],
    server: {
        middlewareMode: false,
        fs: {
            allow: ['.'],
        },
        proxy: {
            '/check': {
                target: 'https://mcpapi.itb-me.com',
                changeOrigin: true,
                secure: false,
            },
        },
        setup: ({ middlewares }) => {
            middlewares.use(history()); // <-- fallback all unknown routes to index.html
        },
    },
})
