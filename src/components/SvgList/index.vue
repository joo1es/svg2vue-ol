<script setup lang="ts">
import { getTargetName } from '@/utils/getTargetName'
import { FileModel } from '@/types'
import { getSvg } from '@/utils'

const props = defineProps<{
    allowVue: number,
    color: string
}>()

defineEmits(['remove'])

const selected = defineModel<Set<string>>('selected', { required: true })
const files = defineModel<FileModel[]>({ required: true })
const fileRef = ref<HTMLInputElement>()

function handleFilePick() {
    fileRef.value?.click()
}

function handleChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement
    if (!target.files) return
    for (const file of target.files) {
        pushFile(file)
    }
    target.value = ''
}

function clearSelected() {
    // selected.value.clear()
}

document.addEventListener('paste', handlePaste)
document.addEventListener('click', clearSelected)

onUnmounted(() => {
    document.removeEventListener('paste', handlePaste)
    document.removeEventListener('click', clearSelected)
})

function pushFile(file: File) {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
        if (typeof reader.result !== 'string') return
        const content = getSvg(reader.result)
        const targetFile = {
            content,
            name: file.name.split('.')[0],
            key: Math.random().toString(36).slice(2)
        }
        if (content) files.value?.push(targetFile)
    })
    reader.readAsText(file)
}

function handlePaste(event: ClipboardEvent) {
    addItems(event.clipboardData && event.clipboardData.items)
}
function handleFileDrop(event: DragEvent) {
    dragover.value = false
    addItems(event.dataTransfer?.items)
}

function addItems(items?: DataTransferItemList | null) {
    if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/svg+xml') !== -1 || (props.allowVue && !items[i].type)) {
                const file = items[i].getAsFile()
                if (file) pushFile(file)
            }
        }
    }
}

function handleSvgItemClick(e: MouseEvent, file: FileModel) {
    // const target = e.currentTarget as HTMLDivElement
    // target.querySelector('input')?.focus()
    if (e.ctrlKey) {
        if (selected.value.has(file.key)) {
            selected.value.delete(file.key)
        } else {
            selected.value.add(file.key)
        }
    } else if (e.shiftKey) {
        const firstSelected = [...selected.value][0]
        let startIndex = 0
        if (firstSelected) {
            startIndex = files.value.findIndex(f => f.key === firstSelected)
        }
        const currentIndex = files.value.findIndex(f => f.key === file.key)
        const start = Math.min(startIndex, currentIndex)
        const max = Math.max(startIndex, currentIndex)
        for (let i = start; i <= max; i++) {
            if (files.value[i]) {
                selected.value.add(files.value[i].key)
            }
        }
    } else {
        selected.value.clear()
        selected.value.add(file.key)
    }
}

const filesWithName = computed(() => {
    const names: Map<string, number> = new Map()
    return files.value?.map(file => {
        const nameMap = file.name || 'Icon'
        if (names.get(nameMap) === void 0) {
            names.set(nameMap, 0)
        } else {
            names.set(nameMap, (names.get(nameMap) || 0) + 1)
        }
        const targetName = getTargetName(nameMap, names.get(nameMap))
        return {
            ...file,
            targetName,
            selected: selected.value.has(file.key)
        }
    }) || []
})

const dragover = ref(false)
</script>

<template>
    <TransitionGroup name="flip-list" class="svg-flip-list" tag="div">
        <div
            key="upload"
            class="svg-item svg-item--upload"
            :class="{ dragover }"
            @drop.prevent="handleFileDrop"
            @dragenter.prevent="dragover = true"
            @dragover.prevent="dragover = true"
            @dragend="dragover = false"
            @dragleave="dragover = false"
            @click="handleFilePick"
        >
            <div class="svg-item-upload">
                <NIcon><Upload /></NIcon>
                <input ref="fileRef" type="file" multiple :accept="allowVue ? '.svg,.vue' : '.svg'" @input="handleChange" >
            </div>
        </div>
        <div
            v-for="(file, index) in filesWithName"
            :key="file.key"
            class="svg-item"
            :class="{ selected: file.selected }"
            :data-key="file.key"
            @click.middle.stop="$emit('remove', [file.key])"
            @click.stop="handleSvgItemClick($event, file)"
        >
            <span :title="file.targetName + '.vue'">{{ file.targetName }}.vue</span>
            <div class="svg-item-img" :style="{ color }">
                <NIcon v-html="file.content"/>
            </div>
            <input v-model="files[index].name" @click.stop >
        </div>
    </TransitionGroup>
</template>

<style lang="scss" scoped>
.svg-flip-list {
    max-width: 1600px;
    margin: 40px auto;
    position: relative;
    --gap: 20px;
    --row-items: 6;
    padding-right: var(--gap);
    @media (max-width: 1800px) and (min-width: 1400px) {
        --row-items: 5;
    }
    @media (max-width: 1400px) and (min-width: 1000px) {
        --row-items: 4;
    }
    @media (max-width: 1000px) and (min-width: 600px) {
        --row-items: 3;
    }
    @media (max-width: 600px)  {
        --row-items: 2;
    }
    .svg-item {
        background-color: #f5f5f5;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid #eee;
        box-sizing: border-box;
        transition: .2s;
        aspect-ratio: 1 / 1;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px;
        width: calc(100% / var(--row-items) - var(--gap));
        margin-left: var(--gap);
        margin-bottom: var(--gap);
        vertical-align: middle;
        > span {
            font-size: 12px;
            text-align: center;
            color: #aaa;
            font-family: Fira Code;
            line-height: 1.5;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            margin-bottom: 5px;
        }
        &:hover,
        &.selected,
        &.dragover {
            border-color: var(--primary-color);
            .svg-item-upload {
                color: var(--primary-color);
            }
        }
        .svg-item-img {
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
            font-size: 64px;
        }
        input {
            width: 100%;
            border-radius: 10px;
            border: 2px solid #eee;
            outline: none;
            padding: 8px 10px;
            box-sizing: border-box;
            font-size: 14px;
            transition: .2s;
            margin-top: 10px;
            font-family: Fira Code;
            &:focus {
                border-color: var(--primary-color);
            }
        }
        &.svg-item--upload {
            border-style: dashed;
            cursor: pointer;
        }
    }
    .svg-item-upload {
        color: #ccc;
        font-family: Impact;
        font-size: 64px;
        box-sizing: border-box;
        transition: .2s;
        letter-spacing: -1px;
        input {
            display: none;
        }
    }
}
</style>

<style>
/* 1. 声明过渡效果 */
.flip-list-move,
.flip-list-enter-active,
.flip-list-leave-active {
  transition: all .4s;
}

/* 2. 声明进入和离开的状态 */
.flip-list-enter-from,
.flip-list-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}

/* 3. 确保离开的项目被移除出了布局流
      以便正确地计算移动时的动画效果。 */
.flip-list-leave-active {
  position: absolute;
}
</style>