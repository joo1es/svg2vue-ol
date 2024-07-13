export function getTemplate(svg: string, currentColor = 1, typescript = 1) {
    svg = getSvg(svg)

    if (currentColor) {
        svg = setCurrentColor(svg)
    }

    const ids = svg.matchAll(/ id="(.+?)"/g)

    const data: [string, string][] = []
    let count = 0

    // id should be unique
    for (const id of ids) {
        if (!id[1]) continue
        const currentId = `id${count}`
        svg = svg
            .replace(id[0], ` :id="${currentId}"`)
            .replace(new RegExp(` ([a-z]+?)="url\\(#${id[1]}\\)"`, 'g'), ` :$1="'url(#' + ${currentId} + ')'"`)
        data.push([currentId, `'${id[1]}_' + randomString`])
        count += 1
    }

    const dataString = count > 0 ? `
    data: () => {
        const randomString = Math.random().toString(36).slice(-10)
        return {
            ${data.map(item => `${item[0]}: ${item[1]}`).join(', ')}
        }
    }` : ''

    return `<template>
    ${svg}
</template>
${ dataString ? `
<script ${typescript ? 'lang="ts"' : ''}>
import { defineComponent } from 'vue'

export default defineComponent({
    ${dataString}
})
</script>` : '' }
`
}

export function getSvg(svg: string) {
    const match = svg.match(/<svg([\s\S]*)<\/svg>/)
    return match?.[0] || ''
}

export function setCurrentColor(svg: string) {
    return svg.replace(/(stroke|fill)=(['"])(.*?)(['"])/g, (_, name, quote, content, quote2) => {
        if (content === 'none') {
            return `${name}=${quote}${content}${quote2}`
        } else {
            return `${name}=${quote}currentColor${quote2}`
        }
    })
}