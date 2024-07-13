<script setup lang="ts">
import { FileModel } from '@/types'
import { useEventListener, useLocalStorage } from '@vueuse/core'
import JSZip from 'jszip'
import { getTargetName } from '@/utils/getTargetName'
import { getTemplate } from '@/utils/getTemplate'
import { base64ToBlob } from '@/utils/base64ToBlob'
import localforage from 'localforage'

const selected = ref<Set<string>>(new Set())

const typescript = useLocalStorage('typescript', 1)
const currentColor = useLocalStorage('currentColor', 1)

const files = ref<FileModel[]>([])

const checked = computed({
    get() {
        return (files.value.length > 0 && files.value.length === selected.value.size) ? 1 : 0
    },
    set(value) {
        if (value) {
            selected.value.clear()
            files.value.forEach(file => selected.value.add(file.key))
        } else {
            selected.value.clear()
        }
    }
})

function remove(keys: Set<string> | string[]) {
    for (const key of keys) {
        files.value = files.value.filter(file => keys instanceof Set ? !keys.has(file.key) : !keys.includes(file.key))
        selected.value.delete(key)
    }
}

const loading = ref(false)
async function download() {
    loading.value = true
    try {
        const targetFiles = selected.value.size === 0 ? files.value : files.value.filter(file => selected.value.has(file.key))
        const archive = new JSZip()
        const names: Map<string, number> = new Map()
        const promises: Promise<void>[] = []
        const indexContent: string[] = []
        for (const file of targetFiles) {
            promises.push(new Promise<void>((resolve, reject) => {
                const nameMap = file.name || 'Icon'
                if (names.get(nameMap) === void 0) {
                    names.set(nameMap, 0)
                } else {
                    names.set(nameMap, (names.get(nameMap) || 0) + 1)
                }
                const fileReader = new FileReader()
                fileReader.readAsText(base64ToBlob(file.src), 'utf-8')
                fileReader.onloadend = function(evt) {
                        // 在文件读取完毕后，其内容将被保存在result属性中
                        const content = evt.target?.result
                        if (typeof content === 'string') {
                            const targetName = getTargetName(nameMap)
                            indexContent.push(`export { default as ${targetName} } from './${targetName}.vue'`)
                            archive.file(`${targetName}.vue`, getTemplate(content, currentColor.value, typescript.value))
                        }
                        resolve()
                }
                fileReader.onabort = reject
                fileReader.onerror = reject
            }))
        }
        await Promise.all(promises)
        archive.file(`index.${typescript.value ? 'ts' : 'js'}`, indexContent.join('\n'))
        const content = await archive.generateAsync({ type:'blob' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = 'Icons.zip'
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)
    } finally {
        loading.value = false
    }
}

function sort() {
    files.value.sort((a, b) => {
        return a.name.localeCompare(b.name)
    })
}

useEventListener('keyup', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.ctrlKey && e.code === 'KeyA') {
        e.preventDefault()
        checked.value = 1
    }
    if (e.code === 'Delete') {
        remove(selected.value)
    }
})

const dataInit = ref(false)
localforage.getItem<string>('files').then(value => {
    try {
        files.value = value ? JSON.parse(value) : []
    } catch {
        files.value = []
    } finally {
        dataInit.value = true
    }
})
watch(files, () => {
    localforage.setItem('files', JSON.stringify(files.value))
}, {
    deep: true
})
</script>

<template>
    <header class="header">
        <Logo />
    </header>
    <svg-list v-if="dataInit" v-model="files" v-model:selected="selected" @remove="remove" />
    <div class="tools" @click.stop>
        <NSpace align="center">
            <NCheckbox v-model:checked="checked" :checked-value="1" :unchecked-value="0" :indeterminate="selected.size > 0 && !checked">
                {{ selected.size }} item{{ selected.size === 1 ? '' : 's' }}
            </NCheckbox>
            <NCheckbox v-model:checked="currentColor" :checked-value="1" :unchecked-value="0">
                Set currentColor
            </NCheckbox>
            <NCheckbox v-model:checked="typescript" :checked-value="1" :unchecked-value="0">
                Use typescript
            </NCheckbox>
            <NButton type="error" :disabled="selected.size === 0" round @click="remove(selected)">
                <template #icon>
                    <NIcon><Remove /></NIcon>
                </template>
            </NButton>
            <NButton type="info" :disabled="files.length === 0" round @click="sort">
                <template #icon>
                    <NIcon><Sort /></NIcon>
                </template>
            </NButton>
            <NButton type="success" :disabled="files.length === 0" round :loading="loading" @click="download">
                <template #icon>
                    <NIcon><Download /></NIcon>
                </template>
                Download
            </NButton>
        </NSpace>
    </div>
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
.tools {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f0f0f0cc;
    backdrop-filter: blur(10px);
    padding: 10px 20px;
    border-radius: 40px;
    font-size: 14px;
}
.svg-flip-list {
    margin-bottom: 80px;
}
</style>