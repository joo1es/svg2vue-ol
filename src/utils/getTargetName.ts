import { capitalize, camelize } from 'vue'
import pinyin from 'tiny-pinyin'

export function getTargetName(name: string, index?: number) {
    const splitName = name.replace(/[（） ]/g, '')
    let targetName = ''
    for (const item of pinyin.parse(splitName)) {
        if (item.type === 2) {
            targetName += `-${item.target}`.toLowerCase()
        } else {
            targetName += item.source
        }
    }
    return capitalize(camelize(targetName.replace(/-+/g, '-'))) + (index || '')
}