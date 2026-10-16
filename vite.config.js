import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const { VITE_API_BASE_URL } = loadEnv(mode, '.', 'VITE_')
  const server = {}

  if (command === 'serve') {
    if (!VITE_API_BASE_URL) {
      throw new Error(
        'Defina VITE_API_BASE_URL no arquivo .env para iniciar o proxy da API no desenvolvimento.',
      )
    }

    let apiTarget
    try {
      apiTarget = new URL(VITE_API_BASE_URL)
    } catch {
      throw new Error('VITE_API_BASE_URL precisa ser uma URL HTTP ou HTTPS válida.')
    }

    if (apiTarget.protocol !== 'http:' && apiTarget.protocol !== 'https:') {
      throw new Error('VITE_API_BASE_URL precisa usar o protocolo HTTP ou HTTPS.')
    }

    server.proxy = {
      '/api': {
        target: apiTarget.origin,
        changeOrigin: true,
      },
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server,
  }
})
