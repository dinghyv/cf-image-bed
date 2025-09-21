import { router } from '../router';
import { Env } from '../[[path]]'
import { json } from 'itty-router-extras';
import StatusCode, { Ok, Fail, Build, ImgItem, ImgList, ImgReq, Folder, AuthToken, FailCode, NotAuth } from "../type";
import { checkFileType, getFilePath, parseRange } from '../utils'
import { R2ListOptions } from "@cloudflare/workers-types";

// 处理文件名：替换空格为连字符，添加时间戳
function processFileName(originalName: string, timestamp: number): string {
    // 获取文件扩展名
    const lastDotIndex = originalName.lastIndexOf('.')
    const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
    const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : ''
    
    // 替换空格为连字符，移除其他特殊字符
    const cleanName = nameWithoutExt
        .replace(/\s+/g, '-')  // 替换空格为连字符
        .replace(/[^a-zA-Z0-9\-_]/g, '')  // 只保留字母、数字、连字符和下划线
        .replace(/-+/g, '-')  // 合并多个连字符
        .replace(/^-|-$/g, '')  // 移除开头和结尾的连字符
    
    // 添加时间戳
    return `${cleanName}-${timestamp}${extension}`
}

const auth = async (request: Request, env: Env) => {
    const method = request.method;
    // console.log(method)
    if (method == "GET" || method == "OPTIONS") {
        return
    }
    // get user token
    const token = request.headers.get('Authorization')
    if (!token) {
        return json(NotAuth())
    }
    // with kv equal
    const authKey = env.AUTH_TOKEN;
    if (!authKey) {
        return json(Fail("system not auth setting"))
    }
    if (authKey != token) {
        return json(FailCode("auth fail", StatusCode.NotAuth))
    }
    // return new Response('Not Authenticated', { status: 401 })
}

// 检测token是否有效
router.post('/checkToken', async (req: Request, env: Env) => {
    const data = await req.json() as AuthToken
    const token = data.token
    if (!token) {
        return json(Ok(false))
    }
    const authKey = env.AUTH_TOKEN;
    if (!authKey) {
        return json(Ok(false))
    }
    if (authKey != token) {
        return json(Ok(false))
    }
    return json(Ok(true))
})

// list image
router.post('/list', auth, async (req: Request, env: Env) => {
    const data = await req.json() as ImgReq
    if (!data.limit) {
        data.limit = 10
    }
    if (data.limit > 100) {
        data.limit = 100
    }
    if (!data.delimiter) {
        data.delimiter = "/"
    }
    let include = undefined
    if (data.delimiter != "/") {
        include = data.delimiter
    }
    
    console.log('List request - delimiter:', data.delimiter, 'include:', include)
    
    // 根据是否在根目录使用不同的查询策略
    let options: R2ListOptions
    if (data.delimiter === "/") {
        // 根目录：直接查询所有内容
        options = {
            limit: data.limit,
            cursor: data.cursor,
            delimiter: "/"
        }
    } else {
        // 子文件夹：使用prefix限制查询范围
        options = {
            limit: data.limit,
            cursor: data.cursor,
            delimiter: "/",
            prefix: include
        }
    }
    
    console.log('R2 query options:', options)
    const list = await env.R2.list(options)
    
    console.log('R2 list result - objects count:', list.objects.length, 'prefixes:', list.delimitedPrefixes)
    console.log('All objects keys:', list.objects.map(obj => obj.key))
    
    const truncated = list.truncated ? list.truncated : false
    const cursor = list.cursor
    const objs = list.objects
    
    // 过滤出当前文件夹下的图片文件（不是文件夹标记文件）
    const imageObjects = objs.filter(obj => {
        // 排除文件夹标记文件（以 / 结尾的文件）
        if (obj.key.endsWith('/')) {
            return false
        }
        
        // 如果指定了prefix，只返回该prefix下的文件
        if (include) {
            return obj.key.startsWith(include)
        }
        
        return true
    })
    
    const urls = imageObjects.map(it => {
        // 判断是否为图片文件
        const isImageFile = it.key.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff)$/i)
        
        return <ImgItem>{
            url: `/rest/${it.key}`,
            copyUrl: `${env.COPY_URL}/${it.key}`,
            webpUrl: isImageFile ? `${env.WEB_URL}/${it.key}` : `${env.WEB_URL}/${it.key}?eo`,
            key: it.key,
            size: it.size
        }
    })
    
    // 处理文件夹列表
    let filteredPrefixes = list.delimitedPrefixes || []
    
    // 如果指定了prefix（在子文件夹中），需要过滤出直接子文件夹
    if (include) {
        console.log('Filtering prefixes for include:', include)
        console.log('All prefixes before filtering:', filteredPrefixes)
        
        // 确保include路径以/结尾，便于比较
        const normalizedInclude = include.endsWith('/') ? include : include + '/'
        
        filteredPrefixes = filteredPrefixes.filter(prefix => {
            console.log('Checking prefix:', prefix, 'against normalizedInclude:', normalizedInclude)
            
            // 确保prefix以当前路径开头
            if (!prefix.startsWith(normalizedInclude)) {
                console.log('Prefix does not start with include, skipping')
                return false
            }
            
            // 获取相对于当前文件夹的路径
            const relativePath = prefix.substring(normalizedInclude.length)
            console.log('Relative path:', relativePath)
            
            // 移除结尾的斜杠来判断层级
            const cleanRelativePath = relativePath.endsWith('/') ? relativePath.slice(0, -1) : relativePath
            console.log('Clean relative path:', cleanRelativePath)
            
            // 直接子文件夹应该只有一层，即cleanRelativePath不包含斜杠且不为空
            const isDirectSubfolder = cleanRelativePath && !cleanRelativePath.includes('/')
            console.log('Is direct subfolder:', isDirectSubfolder)
            
            return isDirectSubfolder
        })
    }
    
    // 如果没有找到任何delimitedPrefixes，尝试从对象中提取文件夹信息
    if (filteredPrefixes.length === 0) {
        console.log('No delimitedPrefixes found, extracting from objects...')
        const folderSet = new Set<string>()
        
        // 从所有对象中提取文件夹路径
        list.objects.forEach(obj => {
            // 获取对象所在的文件夹路径
            const lastSlashIndex = obj.key.lastIndexOf('/')
            if (lastSlashIndex > 0) {
                const folderPath = obj.key.substring(0, lastSlashIndex + 1)
                
                if (include) {
                    // 如果在子文件夹中，只处理当前文件夹的子文件夹
                    const normalizedInclude = include.endsWith('/') ? include : include + '/'
                    if (folderPath.startsWith(normalizedInclude)) {
                        const relativePath = folderPath.substring(normalizedInclude.length)
                        const cleanRelativePath = relativePath.endsWith('/') ? relativePath.slice(0, -1) : relativePath
                        const isDirectSubfolder = cleanRelativePath && !cleanRelativePath.includes('/')
                        
                        if (isDirectSubfolder) {
                            folderSet.add(folderPath)
                        }
                    }
                } else {
                    // 在根目录中，提取所有直接子文件夹
                    const pathParts = folderPath.split('/')
                    if (pathParts.length === 2 && pathParts[0] === '' && pathParts[1] !== '') { // 直接子文件夹
                        folderSet.add(folderPath)
                    }
                }
            }
        })
        
        filteredPrefixes = Array.from(folderSet).sort()
        console.log('Extracted folders from objects:', filteredPrefixes)
    }
    
    console.log('Filtered prefixes:', filteredPrefixes)
    console.log('Returning - images:', urls.length, 'prefixes:', filteredPrefixes.length)
    
    return json(Ok(<ImgList>{
        list: urls,
        next: truncated,
        cursor: cursor,
        prefixes: filteredPrefixes
    }))
})

// batch upload file
router.post('/upload', auth, async (req: Request, env: Env) => {
    const files = await req.formData()
    const images = files.getAll("files")
    const targetFolder = files.get("folder") as string || "/" // 获取目标文件夹，默认为根目录
    const errs = []
    const urls = Array<ImgItem>()
    for (let item of images) {
        const fileType = item.type
        if (!checkFileType(fileType)) {
            errs.push(`${fileType} not support.`)
            continue
        }
	const originFileName = item.name
        const time = new Date().getTime()
        
        // 处理文件名：替换空格为连字符，添加时间戳
        const processedFileName = processFileName(originFileName, time)
        const objecPath = await getFilePath(fileType, processedFileName, time, targetFolder)
        const header = new Headers()
        header.set("content-type", fileType)
        header.set("content-length", `${item.size}`)
        const object = await env.R2.put(objecPath, item.stream(), {
            httpMetadata: header,
        }) as R2Object
        if (object || object.key) {
            // 判断是否为图片文件
            const isImageFile = object.key.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff)$/i)
            
            urls.push({
                key: object.key,
                size: object.size,
                copyUrl: `${env.COPY_URL}/${object.key}`,
                webpUrl: isImageFile ? `${env.WEB_URL}/${object.key}` : `${env.WEB_URL}/${object.key}?eo`,
                url: `/rest/${object.key}`,
                filename: item.name
            })
        }
    }
    return json(Build(urls, errs.toString()))
})

// 获取所有文件夹
router.post('/folders', auth, async (req: Request, env: Env) => {
    try {
        const options = <R2ListOptions>{
            limit: 1000,
            delimiter: "/"
        }
        const list = await env.R2.list(options)
        const allFolders = ['/'] // 总是包含根目录
        
        if (list.delimitedPrefixes && list.delimitedPrefixes.length > 0) {
            // 确保文件夹路径格式一致，以 / 结尾
            const folders = list.delimitedPrefixes.map(prefix => 
                prefix.endsWith('/') ? prefix : prefix + '/'
            )
            allFolders.push(...folders)
        } else {
            // 如果没有delimitedPrefixes，从对象中提取文件夹信息
            const folderSet = new Set<string>()
            
            list.objects.forEach(obj => {
                const lastSlashIndex = obj.key.lastIndexOf('/')
                if (lastSlashIndex > 0) {
                    const folderPath = obj.key.substring(0, lastSlashIndex + 1)
                    folderSet.add(folderPath)
                }
            })
            
            const folders = Array.from(folderSet).sort()
            allFolders.push(...folders)
        }
        
        return json(Ok(allFolders))
    } catch (e) {
        return json(Fail("Failed to get folders"))
    }
})

// 创建目录
router.post("/folder", auth, async (req: Request, env: Env) => {
    try {
        const data = await req.json() as Folder & { parentPath?: string }
        const regx = /^[0-9A-Za-z_-]+$/
        if (!regx.test(data.name)) {
            return json(Fail("Folder name error"))
        }
        
        // 构建完整的文件夹路径
        let folderPath = data.name + '/'
        if (data.parentPath && data.parentPath !== '/') {
            // 移除父路径末尾的斜杠（如果有的话）
            const parentPath = data.parentPath.endsWith('/') ? data.parentPath.slice(0, -1) : data.parentPath
            folderPath = parentPath + '/' + folderPath
        }
        
        console.log('Creating folder with path:', folderPath)
        
        // 创建一个有内容的文件夹标记文件，确保R2能识别为文件夹前缀
        await env.R2.put(folderPath, new TextEncoder().encode('folder'), {
            httpMetadata: {
                contentType: 'text/plain'
            }
        })
        
        console.log('Folder created successfully:', folderPath)
        return json(Ok("Success"))
    } catch (e) {
        console.error('Failed to create folder:', e)
        return json(Fail("Create folder fail"))
    }
})

// 删除文件夹
router.post("/folder/delete", auth, async (req: Request, env: Env) => {
    try {
        const data = await req.json() as { folderPath: string }
        const { folderPath } = data
        
        if (!folderPath) {
            return json(Fail("No folder path provided"))
        }
        
        // 确保文件夹路径以 / 结尾
        const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/'
        
        // 列出文件夹中的所有文件
        const listOptions = <R2ListOptions>{
            prefix: normalizedPath,
            limit: 1000
        }
        const list = await env.R2.list(listOptions)
        
        // 删除文件夹中的所有文件
        const deletePromises = list.objects.map(obj => env.R2.delete(obj.key))
        await Promise.all(deletePromises)
        
        // 删除文件夹标记（如果存在）
        try {
            await env.R2.delete(normalizedPath)
        } catch (e) {
            // 文件夹标记可能不存在，忽略错误
        }
        
        return json(Ok(`Deleted ${list.objects.length} files from folder`))
    } catch (e) {
        return json(Fail("Delete folder fail"))
    }
})

// 移动图片
router.post('/move', auth, async (req: Request, env: Env) => {
    try {
        const data = await req.json() as { keys: string[], targetFolder: string }
        const { keys, targetFolder } = data
        
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return json(Fail("No keys provided"))
        }
        
        if (!targetFolder) {
            return json(Fail("No target folder provided"))
        }
        
        const movedKeys: string[] = []
        const errors: string[] = []
        
        for (const key of keys) {
            try {
                // 获取原文件
                const originalObject = await env.R2.get(key)
                if (!originalObject) {
                    errors.push(`File ${key} not found`)
                    continue
                }
                
                // 生成新的文件路径
                const fileName = key.split('/').pop() || key
                const newKey = targetFolder === '/' ? 
                    `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}` :
                    `${targetFolder.replace(/\/$/, '')}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`
                
                // 复制到新位置
                await env.R2.put(newKey, originalObject.body, {
                    httpMetadata: originalObject.httpMetadata,
                    customMetadata: originalObject.customMetadata
                })
                
                // 删除原文件
                await env.R2.delete(key)
                
                movedKeys.push(newKey)
            } catch (error) {
                errors.push(`Failed to move ${key}: ${error}`)
            }
        }
        
        if (errors.length > 0) {
            return json(Build(movedKeys, errors.join('; ')))
        }
        
        return json(Ok(movedKeys))
    } catch (e) {
        return json(Fail("Move operation failed"))
    }
})

// 删除key
router.get('/del/:id+', async (req: Request, env: Env) => {
    const key = req.params.id
    if (!key) {
        return json(Fail("not delete key"))
    }
    
    // 防止删除文件夹标记文件
    if (key.endsWith('/')) {
        return json(Fail("Cannot delete folder marker"))
    }
    
    try {
        await env.R2.delete(key)
    } catch (e) {
        console.log(`img delete error:${e.message}`,)
    }
    return json(Ok(key))
})

// delete image
router.delete("/", auth, async (req: Request, env: Env) => {
    const params = await req.json()
    // console.log(params)
    const keys = params.keys;
    if (!keys || keys.length < 1) {
        return json(Fail("not delete keys"))
    }
    const arr = keys.split(',')
    try {
        for (let it of arr) {
            if (it && it.length) {
                // 防止删除文件夹标记文件
                if (!it.endsWith('/')) {
                    await env.R2.delete(it)
                }
            }
        }
    } catch (e) {
        console.log(`img delete error:${e.message}`,)
    }
    return json(Ok(keys))
})

// image detail
router.get("/:id+", async (req: Request, env: Env) => {
    let id = req.params.id
    const range = parseRange(req.headers.get('range'))
    const object = await env.R2.get(id, {
        range,
        onlyIf: req.headers,
    })
    if (object == null) {
        return json(Fail("object not found"))
    }
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    if (range) {
        headers.set("content-range", `bytes ${range.offset}-${range.end}/${object.size}`)
    }
    const status = object.body ? (range ? 206 : 200) : 304
    return new Response(object.body, {
        headers,
        status
    })
})
