<script setup lang="ts">
const files = defineModel<{
    file: File,
    src: string,
    name: string,
    key: symbol
}[]>()
const fileRef = ref<HTMLInputElement>()

function handleFilePick() {
    fileRef.value?.click()
}

function handleChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement
    console.log(target.files)
    if (!target.files) return
    for (const file of target.files) {
        pushFile(file)
    }
    target.value = ''
}

document.addEventListener('paste', handlePaste)

onUnmounted(() => {
    document.removeEventListener('paste', handlePaste)
})

function pushFile(file: File) {
    const reader = new FileReader()
    reader.addEventListener('load', ()=> {
        if (typeof reader.result !== 'string') return
        const targetFile = {
            file,
            src: reader.result,
            name: file.name,
            key: Symbol()
        }
        files.value?.push(targetFile)
    })
    reader.readAsDataURL(file)
}

function handlePaste(event:  ClipboardEvent) {
    addItems(event.clipboardData && event.clipboardData.items)
}
function handleFileDrop(event: DragEvent) {
    addItems(event.dataTransfer?.items)
}

function addItems(items?: DataTransferItemList | null) {
    if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/svg+xml') !== -1) {
                const file = items[i].getAsFile();
                if (file) pushFile(file)
                break
            }
        }
    }
}

function handleSvgItemClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLDivElement
    target.querySelector('input')?.focus()
}
</script>

<template>
    <TransitionGroup name="flip-list" class="svg-flip-list" tag="div">
        <div
            class="svg-item svg-item--upload"
            @drop.prevent="handleFileDrop"
            @dragenter.prevent
            @dragover.prevent
            key="upload"
        >
            <div class="svg-item-upload" @click="handleFilePick">
                Upload
                <input @input="handleChange" ref="fileRef" type="file" multiple accept=".svg" />
            </div>
        </div>
        <div
            class="svg-item svg-item--upload"
            v-if="files && files.length > 0"
            key="download"
        >
            <div class="svg-item-upload">
                Download
            </div>
        </div>
        <div
            class="svg-item"
            v-for="(file, index) in files"
            :key="file.key"
            @click.middle.stop="files?.splice(index, 1)"
            @click="handleSvgItemClick"
        >
            <img :src="file.src" />
            <input v-model="file.name" />
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
        &:hover,
        &:has(:focus) {
            border-color: #40ab7f;
            .svg-item-upload {
                color: #40ab7f;
            }
        }
        > img {
            flex: 1;
            min-height: 0;
            object-fit: contain;
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
            &:focus {
                border-color: #40ab7f;
            }
        }
        &.svg-item--upload {
            border-style: dashed;
        }
    }
    .svg-item-upload {
        color: #ccc;
        font-family: Impact;
        font-size: 36px;
        box-sizing: border-box;
        cursor: pointer;
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