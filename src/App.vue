<script setup lang="ts">
import useUserStore from '@/store/user'

const userStore = useUserStore()
request('testHello', {
    headers: {
        a: 'test'
    }
})
const env = import.meta.env.VITE_BASE_URL
</script>

<template>
    <n-button>你好{{ env }}{{ userStore.username }}</n-button>
</template>