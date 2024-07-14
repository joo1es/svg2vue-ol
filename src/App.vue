<script setup lang="ts">
import { FileModel } from '@/types'
import { useEventListener, useLocalStorage } from '@vueuse/core'
import JSZip from 'jszip'
import { areRectanglesIntersecting, getTargetName, getTemplate, setCurrentColor } from '@/utils'
import localforage from 'localforage'
import { NColorPicker } from 'naive-ui'

const selected = ref<Set<string>>(new Set())

const typescript = useLocalStorage('typescript', 1)
const currentColor = useLocalStorage('currentColor', 0)
const allowVue = useLocalStorage('allowVue', 1)
const color = useLocalStorage('color', '#40ab7fff')

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
            promises.push(new Promise<void>(resolve => {
                const nameMap = file.name || 'Icon'
                if (names.get(nameMap) === void 0) {
                    names.set(nameMap, 0)
                } else {
                    names.set(nameMap, (names.get(nameMap) || 0) + 1)
                }
                const content = file.content
                if (typeof content === 'string') {
                    const targetName = getTargetName(nameMap)
                    indexContent.push(`export { default as ${targetName} } from './${targetName}.vue'`)
                    archive.file(`${targetName}.vue`, getTemplate(content, currentColor.value, typescript.value))
                }
                resolve()
            }))
        }
        await Promise.all(promises)
        archive.file(`index.${typescript.value ? 'ts' : 'js'}`, indexContent.join('\n'))
        const content = await archive.generateAsync({ type: 'blob' })
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

function setToCurrentColor() {
    for (const file of files.value) {
        if (selected.value.has(file.key)) {
            file.content = setCurrentColor(file.content)
        }
    }
}

const startX = ref(0)
const startY = ref(0)
const moveX = ref(0)
const moveY = ref(0)
const moving = ref(false)
const hadMoved = ref(false)
useEventListener('mousedown', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.button !== 0) {
        return
    }
    startX.value = e.pageX
    startY.value = e.pageY
    moveX.value = e.pageX
    moveY.value = e.pageY
    moving.value = true
    hadMoved.value = false
})
useEventListener('mousemove', e => {
    if (!moving.value) return
    hadMoved.value = true
    moveX.value = e.pageX
    moveY.value = e.pageY
})
useEventListener('mouseup', e => {
    if (!hadMoved.value) {
        const element = e.target as HTMLDivElement
        if (
            element &&
            (element === document.documentElement || element.classList.contains('n-config-provider') || element.classList.contains('svg-flip-list'))
        ) {
            selected.value.clear()
        }
    } else {
        if (currentStyleNumber.value.width > 20 || currentStyleNumber.value.height > 20) {
            const svgItems = document.getElementsByClassName('svg-item')
            const intersectingKeys = new Set<string>()
            Array.from(svgItems).forEach(item => {
                const currentItem = item as HTMLDivElement
                const boundingClientRect = currentItem.getBoundingClientRect()
                const rectanglesIntersecting = areRectanglesIntersecting(currentStyleNumber.value, {
                    left: boundingClientRect.left + document.documentElement.scrollLeft,
                    top: boundingClientRect.top + document.documentElement.scrollTop,
                    width: boundingClientRect.width,
                    height: boundingClientRect.height
                })
                if (rectanglesIntersecting && currentItem.dataset.key) intersectingKeys.add(currentItem.dataset.key)
            })
            if (e.ctrlKey || e.shiftKey || e.altKey) {
                for (const key of intersectingKeys) {
                    selected.value.add(key)
                }
            } else {
                selected.value = intersectingKeys
            }
        }
    }
    moving.value = false
    hadMoved.value = false
})
const currentStyleNumber = computed(() => {
    return {
        top: Math.min(startY.value, moveY.value),
        left: Math.min(startX.value, moveX.value),
        height: Math.abs(startY.value - moveY.value),
        width: Math.abs(startX.value - moveX.value),
    }
})
const currentStyle = computed(() => {
    return {
        top: currentStyleNumber.value.top + 'px',
        left: currentStyleNumber.value.left + 'px',
        height: currentStyleNumber.value.height + 'px',
        width: currentStyleNumber.value.width + 'px',
    }
})

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
    <n-config-provider :theme-overrides="{ common: { primaryColor: '#40ab7f', primaryColorHover: '#40ab7fcc' } }">
        <header class="header">
            <Logo />
        </header>
        <svg-list v-if="dataInit" v-model="files" v-model:selected="selected" :allowVue="allowVue" :color="color" @remove="remove" />
        <div class="tools" @mousedown.stop>
            <NSpace align="center">
                <NCheckbox v-model:checked="checked" :checked-value="1" :unchecked-value="0" :indeterminate="selected.size > 0 && !checked">
                    {{ selected.size }} item{{ selected.size === 1 ? '' : 's' }}
                </NCheckbox>
                <n-popover trigger="click" :to="false">
                    <NSpace vertical>
                        <NColorPicker
                            v-model:value="color"
                            :modes="['hex']"
                            size="small"
                            :swatches="[
                                '#000',
                                '#333',
                                '#ccc',
                                '#40ab7f',
                                '#2080F0',
                                '#F0A020',
                                'rgba(208, 48, 80, 1)',
                                '#11B8CAFF',
                            ]"
                        />
                        <NButton block :disabled="selected.size === 0" @click="setToCurrentColor">Set to&nbsp;<span :style="{ borderBottom: `2px solid ${color}` }">currentColor</span></NButton>
                        <NCheckbox v-model:checked="currentColor" :checked-value="1" :unchecked-value="0">
                            All set to&nbsp;<span :style="{ borderBottom: `2px solid ${color}`, marginLeft: '.1em' }">currentColor</span>
                        </NCheckbox>
                        <NCheckbox v-model:checked="typescript" :checked-value="1" :unchecked-value="0">
                            Use typescript
                        </NCheckbox>
                        <NCheckbox v-model:checked="allowVue" :checked-value="1" :unchecked-value="0">
                            Accept .vue file
                        </NCheckbox>
                    </NSpace>
                    <template #trigger>
                        <NButton round>
                            <template #icon>
                                <NIcon><Settings /></NIcon>
                            </template>
                        </NButton>
                    </template>
                </n-popover>
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
                <NButton type="primary" :disabled="files.length === 0" round :loading="loading" @click="download">
                    <template #icon>
                        <NIcon><Download /></NIcon>
                    </template>
                    Download
                </NButton>
            </NSpace>
        </div>
        <div v-show="hadMoved" class="selecting-box" :style="currentStyle" />
    </n-config-provider>
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
    z-index: 10;
}
.svg-flip-list {
    margin-bottom: 80px;
}
:deep(.n-color-picker-trigger__value) {
    display: none;
}
.selecting-box {
    border: 2px solid var(--primary-color);
    position: absolute;
    background-color: #40ab7f30;
    z-index: 20;
    border-radius: 2px;
}
</style>