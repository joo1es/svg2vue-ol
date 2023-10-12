import { defineDefaultConfig, onBeforeRequest } from '@oasis-end/request'

defineDefaultConfig({
    baseUrl: import.meta.env.VITE_BASE_URL
})

onBeforeRequest(config => {
    config.headers = {
        token: 'test-token'
    }
})