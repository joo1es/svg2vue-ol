<script setup lang="ts">
import { getTargetName } from '@/utils/getTargetName'
import { FileModel } from '@/types'

defineEmits(['remove'])

const selected = defineModel<Set<symbol>>('selected', { required: true })
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
    selected.value.clear()
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
        const targetFile = {
            file,
            src: reader.result,
            name: file.name.split('.')[0],
            key: Symbol()
        }
        files.value?.push(targetFile)
    })
    reader.readAsDataURL(file)
}

function handlePaste(event: ClipboardEvent) {
    addItems(event.clipboardData && event.clipboardData.items)
}
function handleFileDrop(event: DragEvent) {
    addItems(event.dataTransfer?.items)
}

function addItems(items?: DataTransferItemList | null) {
    if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/svg+xml') !== -1) {
                const file = items[i].getAsFile()
                if (file) pushFile(file)
                break
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
</script>

<template>
    <TransitionGroup name="flip-list" class="svg-flip-list" tag="div">
        <div
            key="upload"
            class="svg-item svg-item--upload"
            @drop.prevent="handleFileDrop"
            @dragenter.prevent
            @dragover.prevent
            @click="handleFilePick"
        >
            <div class="svg-item-upload">
                <NIcon><Upload /></NIcon>
                <input ref="fileRef" type="file" multiple accept=".svg" @input="handleChange" >
            </div>
        </div>
        <div
            v-for="(file, index) in filesWithName"
            :key="file.key"
            class="svg-item"
            :class="{ selected: file.selected }"
            @click.middle.stop="$emit('remove', [file.key])"
            @click.stop="handleSvgItemClick($event, file)"
        >
            <span :title="file.targetName">{{ file.targetName }}.vue</span>
            <div class="svg-item-img">
                <img :src="file.src" >
            </div>
            <input v-model="files[index].name" @click.stop >
        </div>
    </TransitionGroup>
</template>

<style lang="scss" scoped>
.svg-flip-list {
    max-width: 1200px;
    margin: 40px auto;
    position: relative;
    --gap: 20px;
    --row-items: 5;
    padding-right: var(--gap);
    user-select: none;
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
        &.selected {
            border-color: #40ab7f;
            .svg-item-upload {
                color: #40ab7f;
            }
        }
        .svg-item-img {
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
            > img {
                height: 64px;
                object-fit: contain;
            }
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
                border-color: #40ab7f;
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