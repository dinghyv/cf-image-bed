// 支持常见文件类型，不再限制只有图片
const supportFiles = [
  // 图片格式
  { type: 'image/png', ext: 'png' }, 
  { type: 'image/jpeg', ext: 'jpeg' }, 
  { type: 'image/gif', ext: 'gif' }, 
  { type: 'image/webp', ext: 'webp' }, 
  { type: 'image/jpg', ext: 'jpg' }, 
  { type: 'image/x-icon', ext: 'ico' }, 
  { type: 'application/x-ico', ext: 'ico' }, 
  { type: 'image/vnd.microsoft.icon', ext: 'ico' },
  { type: 'image/svg+xml', ext: 'svg' },
  { type: 'image/bmp', ext: 'bmp' },
  { type: 'image/tiff', ext: 'tiff' },
  // 文档格式
  { type: 'application/pdf', ext: 'pdf' },
  { type: 'text/plain', ext: 'txt' },
  { type: 'application/msword', ext: 'doc' },
  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
  { type: 'application/vnd.ms-excel', ext: 'xls' },
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
  { type: 'application/vnd.ms-powerpoint', ext: 'ppt' },
  { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' },
  // 压缩文件
  { type: 'application/zip', ext: 'zip' },
  { type: 'application/x-rar-compressed', ext: 'rar' },
  { type: 'application/x-7z-compressed', ext: '7z' },
  { type: 'application/gzip', ext: 'gz' },
  // 音视频文件
  { type: 'audio/mpeg', ext: 'mp3' },
  { type: 'audio/wav', ext: 'wav' },
  { type: 'video/mp4', ext: 'mp4' },
  { type: 'video/avi', ext: 'avi' },
  { type: 'video/quicktime', ext: 'mov' },
  // 代码文件
  { type: 'application/json', ext: 'json' },
  { type: 'text/javascript', ext: 'js' },
  { type: 'text/css', ext: 'css' },
  { type: 'text/html', ext: 'html' },
  { type: 'application/xml', ext: 'xml' },
  // 其他常见格式
  { type: 'application/octet-stream', ext: 'bin' }
]

// 更新支持的文件类型列表（现在支持所有常见格式）
const supportFile = supportFiles.map(f => f.type).join(',');

// 字符串编码
export function randomString(value: number) {
    let baseStr = 'Aa0Bb1Cc2Dd3Ee4Ff5Gg6Hh7Ii8Jj9KkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';
    const chars = baseStr.split('');
    let maxPos = baseStr.length;
    const uuid = [];
    let q = value;
    for (; q > 0;) {
        let mod = q % maxPos;
        q = (q - mod) / maxPos;
        uuid.push(chars[mod]);
    }
    return uuid.join('');
}

// 解析range
export function parseRange(encoded: string | null): undefined | { offset: number, end: number, length: number } {
    if (encoded === null) {
        return
    }
    const parts = encoded.split("bytes=")[1]?.split("-") ?? []
    if (parts.length !== 2) {
        throw new Error('Not supported to skip specifying the beginning/ending byte at this time')
    }
    return {
        offset: Number(parts[0]),
        end: Number(parts[1]),
        length: Number(parts[1]) + 1 - Number(parts[0]),
    }
}

// 检查文件类是否支持（现在支持所有文件类型）
export function checkFileType(val: string): boolean {
    // 如果在支持列表中，直接返回true
    if (supportFile.indexOf(val) > -1) {
        return true
    }
    // 对于不在列表中的文件类型，也允许上传（作为通用文件处理）
    return true
}

// 获取文件名
export async function getFilePath(val: string, filename: string, time: number, targetFolder: string = "/"): Promise<string> {
    // 使用处理过的文件名，如果没有则生成随机文件名
    let fileName = filename
    if (!fileName) {
        const rand = Math.floor(Math.random() * 100000)
        // 尝试从MIME类型获取扩展名
        const types = supportFiles.filter(it => it.type === val)
        let ext = 'bin' // 默认扩展名
        if (types && types.length > 0) {
            ext = types[0].ext
        } else {
            // 对于未知的MIME类型，尝试从类型推断扩展名
            if (val.startsWith('image/')) ext = val.split('/')[1] || 'img'
            else if (val.startsWith('video/')) ext = val.split('/')[1] || 'video'
            else if (val.startsWith('audio/')) ext = val.split('/')[1] || 'audio'
            else if (val.startsWith('text/')) ext = 'txt'
            else if (val.startsWith('application/')) {
                const subtype = val.split('/')[1]
                if (subtype.includes('json')) ext = 'json'
                else if (subtype.includes('xml')) ext = 'xml'
                else if (subtype.includes('pdf')) ext = 'pdf'
                else ext = 'bin'
            }
        }
        fileName = randomString(time + rand).concat(`.${ext}`)
    }
    
    // 如果指定了目标文件夹，直接上传到该文件夹
    if (targetFolder && targetFolder !== "/") {
        // 移除开头的斜杠，并确保结尾没有斜杠
        let folderPath = targetFolder.startsWith("/") ? targetFolder.substring(1) : targetFolder
        folderPath = folderPath.endsWith("/") ? folderPath.slice(0, -1) : folderPath
        return `${folderPath}/${fileName}`
    }
    
    // 根目录仍然使用年份月份结构
    let date = new Date()
    const year = date.getFullYear() //获取完整的年份(4位)
    let month = date.getMonth() + 1 //获取当前月份(0-11,0代表1月)
    if (month < 10) {
        month = `0${month}`;
    }
    
    return `${year}/${month}/${fileName}`

}


