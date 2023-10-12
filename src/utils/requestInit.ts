import { defineDefaultConfig, onBeforeRequest } from '@oasis-end/request'

defineDefaultConfig({
    baseUrl: import.meta.env.VITE_BASE_URL
})

onBeforeRequest(config => {
    const headers = new Headers()
    headers.append('token', 'test-token')
    config.headers = headers
})