export function base64ToBlob(base64Data: string) {
    const arr = base64Data.split(','),
        fileType = arr[0].match(/:(.*?);/)?.[1],
        bstr = atob(arr[1])
    let l = bstr.length
    const u8Arr = new Uint8Array(l)

    while (l--) {
        u8Arr[l] = bstr.charCodeAt(l)
    }
    return new Blob([u8Arr], {
        type: fileType
    })
}