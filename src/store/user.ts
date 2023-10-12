export default defineStore('user', () => {
    const username = ref('testusername')

    return {
        username,
    }
})