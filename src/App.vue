<script setup lang="ts">
request('testHello', {
    headers: {
        a: 'test'
    }
})
const env = import.meta.env.VITE_BASE_URL
</script>

<template>
    <n-button>你好{{ env }}</n-button>
</template>