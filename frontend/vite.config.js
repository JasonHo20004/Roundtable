import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '#': resolve(__dirname, 'src'),
            '#shared': resolve(__dirname, 'src/shared'),
            '#features': resolve(__dirname, 'src/features'),
            '#layouts': resolve(__dirname, 'src/layouts'),
            '#pages': resolve(__dirname, 'src/pages'),
            '#contexts': resolve(__dirname, 'src/contexts'),
            '#providers': resolve(__dirname, 'src/providers'),
            '#hooks': resolve(__dirname, 'src/hooks'),
            '#routes': resolve(__dirname, 'src/routes'),
            '#constants': resolve(__dirname, 'src/constants'),
            '#assets': resolve(__dirname, 'src/assets'),
            '#utils': resolve(__dirname, 'src/utils'),
            '#services': resolve(__dirname, 'src/services'),
            '#interfaces': resolve(__dirname, 'src/interfaces'),
            '#subjects': resolve(__dirname, 'src/subjects'),
            '#observers': resolve(__dirname, 'src/observers'),
        },
    },
    build: {
        outDir: 'dist'
    },
    server: {
        host: true,
        port: 3000,
        watch: {
            usePolling: true,
            interval: 100, // Optional: polling frequency in ms
        },
        proxy: {
            '/api': {
                target: 'http://app:5000', // Should target the backend SERVICE name for container-to-container comms
                changeOrigin: true,
                secure: false,
            }
        }
    },
})