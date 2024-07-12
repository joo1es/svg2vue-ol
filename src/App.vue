<script setup lang="ts">
const files = ref<{
    file: File,
    url: string
}[]>([])
</script>

<template>
     <header class="header">
          <Logo />
     </header>
     <svg-list v-model="files" />
</template>

<style lang="scss" scoped>
.header {
     display: flex;
     align-items: center;
     justify-content: center;
     background-color: #f0f0f0cc;
     position: sticky;
     top: 0;
     z-index: 10;
     height: 72px;
     backdrop-filter: blur(10px);
}
</style>