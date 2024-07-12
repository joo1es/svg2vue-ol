<script setup lang="ts">
const files = defineModel<{
    file: File,
    src: string,
    name: string,
}[]>()
const fileRef = ref<HTMLInputElement>()

function handleFilePick() {
    fileRef.value?.click()
}

function handleChange(e: Event) {
    const target = e.target as HTMLInputElement
    if (!target.files) return
    for (const file of target.files) {
        pushFile(file)
    }
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
            name: file.name
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
    <div class="svg-list">
        <div
            class="svg-item svg-item--upload"
            @drop.prevent="handleFileDrop"
            @dragenter.prevent
            @dragover.prevent
        >
            <div class="svg-item-upload" @click="handleFilePick">
                Upload
                <input @change="handleChange" ref="fileRef" type="file" multiple accept=".svg" />
            </div>
        </div>
        <div
            class="svg-item"
            v-for="(file, index) in files"
            :key="index"
            @click.middle.stop="files?.splice(index, 1)"
            @click="handleSvgItemClick"
        >
            <img :src="file.src" />
            <input v-model="file.name" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.svg-list {
    max-width: 1200px;
    margin: 40px auto;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    padding: 0 20px;
    .svg-item {
        background-color: #f5f5f5;
        height: 20px;
        padding-top: 100%;
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid #eee;
        box-sizing: border-box;
        transition: .2s;
        &:hover,
        &:has(:focus) {
            border-color: #40ab7f;
            .svg-item-upload {
                color: #40ab7f;
            }
        }
        > img {
            position: absolute;
            top: 15%;
            left: 15%;
            width: 70%;
            height: calc(70% - 34px);
            object-fit: contain;
        }
        input {
            position: absolute;
            bottom: 5%;
            left: 5%;
            width: 90%;
            border-radius: 10px;
            border: 2px solid #eee;
            outline: none;
            padding: 6px 10px;
            box-sizing: border-box;
            font-size: 14px;
            transition: .2s;
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
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Impact;
        font-size: 36px;
        box-sizing: border-box;
        border-radius: inherit;
        cursor: pointer;
        transition: .2s;
        input {
            display: none;
        }
    }
}
</style>