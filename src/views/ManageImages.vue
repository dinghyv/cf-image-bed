<template>
	<div class="mx-auto max-w-6xl my-4 px-4 relative"
		 @dragover="onDragOver"
		 @dragleave="onDragLeave"
		 @drop="onDrop">
		<loading-overlay :loading="loading || uploadLoading" />

		<!-- 拖拽上传提示覆盖层 -->
		<div v-if="isDragOver" class="fixed inset-0 bg-cyber-primary/20 backdrop-blur-sm z-50 flex items-center justify-center">
			<div class="cyber-card p-8 text-center max-w-md mx-4">
				<div class="text-6xl mb-4 text-cyber-primary">
					<font-awesome-icon :icon="faUpload" />
				</div>
				<div class="cyber-text text-xl font-bold mb-2">拖拽图片到此处上传</div>
				<div class="cyber-text-dim text-sm">
					将图片拖拽到此区域，即可上传到 <span class="text-cyber-accent font-bold">{{ delimiter === '/' ? '根目录' : delimiter.replace('/', '') }}</span>
				</div>
			</div>
		</div>

		<!-- 页面标题和控制区域 -->
		<div class="cyber-card p-6 mb-6">
			<div class="flex items-center justify-between mb-4">
				<div>
					<div class="cyber-text text-2xl font-bold mb-2 flex items-center">
						<font-awesome-icon :icon="faCog" class="mr-3 text-cyber-primary" />
						管理
					</div>
					<div class="cyber-text-dim text-sm">
						已上传 <span class="text-cyber-primary font-bold">{{ uploadedImages.length }}</span> 张图片，
						共 <span class="text-cyber-accent font-bold">{{ formatBytes(imagesTotalSize) }}</span>
						<span v-if="selectedCount > 0" class="ml-4 text-cyber-secondary">
							已选择 <span class="font-bold">{{ selectedCount }}</span> 项
						</span>
					</div>
				</div>
				
				<!-- 操作按钮 -->
				<div class="flex items-center space-x-3">
					<!-- 多选模式切换 -->
					<div class="cyber-btn px-4 py-2 cursor-pointer flex items-center" @click="toggleMultiSelect">
						<font-awesome-icon :icon="isMultiSelect ? faCheckSquare : faSquare" class="mr-2 text-cyber-accent" />
						<span class="hidden md:inline">{{ isMultiSelect ? '退出多选' : '多选模式' }}</span>
					</div>
					
					<!-- 导出按钮（多选时显示） -->
					<div v-if="isMultiSelect && selectedCount > 0" class="cyber-btn-secondary px-4 py-2 cursor-pointer flex items-center" @click="showExportDialog">
						<font-awesome-icon :icon="faDownload" class="mr-2 text-cyber-secondary" />
						<span class="hidden md:inline">导出链接</span>
					</div>
					
					<!-- 移动到文件夹按钮（多选时显示） -->
					<div v-if="isMultiSelect && selectedCount > 0" class="cyber-btn px-4 py-2 cursor-pointer flex items-center" @click="showMoveDialog">
						<font-awesome-icon :icon="faFolderOpen" class="mr-2 text-cyber-accent" />
						<span class="hidden md:inline">移动到</span>
					</div>
					
					<!-- 批量删除按钮（多选时显示） -->
					<div v-if="isMultiSelect && selectedCount > 0" class="cyber-btn px-4 py-2 cursor-pointer flex items-center bg-cyber-secondary border-cyber-secondary" @click="batchDelete">
						<font-awesome-icon :icon="faTrash" class="mr-2 text-cyber-secondary" />
						<span class="hidden md:inline">批量删除</span>
					</div>
					
					<div class="cyber-btn px-4 py-2 cursor-pointer flex items-center" @click="addFolder">
						<font-awesome-icon :icon="faFolderPlus" class="mr-2 text-cyber-accent" />
						<span class="hidden md:inline">新建文件夹</span>
					</div>
					<div class="cyber-btn px-4 py-2 cursor-pointer flex items-center" @click="listImages">
						<font-awesome-icon :icon="faRedoAlt" class="mr-2 text-cyber-primary" />
						<span class="hidden md:inline">刷新</span>
					</div>
				</div>
			</div>

			<!-- 文件夹导航 -->
			<div class="flex items-center justify-start flex-wrap gap-2">
				<div v-for="it in prefixes" 
					 :key="it"
					 :class="{
						'cyber-folder active': delimiter === it,
						'cyber-folder selected': isMultiSelect && selectedFolders.includes(it),
						'cyber-folder': delimiter !== it && (!isMultiSelect || !selectedFolders.includes(it))
					 }"
					 @click="isMultiSelect ? toggleFolderSelection(it) : changeFolder(it)">
					<!-- 多选模式下的复选框 -->
					<div v-if="isMultiSelect" class="mr-2">
						<font-awesome-icon 
							:icon="selectedFolders.includes(it) ? faCheckSquare : faSquare" 
							class="text-cyber-primary" 
						/>
					</div>
					<font-awesome-icon :icon="faFolder" class="text-2xl mr-2" />
					<span v-if="it !== '/'" class="cyber-text">{{ it.replace("/", "") }}</span>
					<span v-else class="cyber-text">根目录</span>
				</div>
			</div>
		</div>

		<!-- 图片网格 -->
		<div class="cyber-grid">
			<transition-group name="cyber-fade" tag="div" class="contents">
				<div v-for="item in uploadedImages" :key="item.url" class="relative">
					<!-- 多选模式下的复选框 -->
					<div v-if="isMultiSelect" class="absolute top-2 left-2 z-10">
						<div 
							class="w-6 h-6 bg-cyber-bg-card border border-cyber-primary rounded cursor-pointer flex items-center justify-center"
							@click="toggleImageSelection(item)"
						>
							<font-awesome-icon 
								:icon="item.isSelected ? faCheckSquare : faSquare" 
								:class="item.isSelected ? 'text-cyber-primary' : 'text-cyber-text-dim'" 
							/>
						</div>
					</div>
					
					<image-box
						:src="item.url"
						:copyUrl="item.copyUrl"
						:webpUrl="item.webpUrl"
						:name="item.key"
						:size="item.size"
						:class="{ 'opacity-50': isMultiSelect && !item.isSelected }"
						@delete="deleteImage(item.key)"
						mode="uploaded"
					/>
				</div>
			</transition-group>
		</div>

		<!-- 空状态 -->
		<div v-if="uploadedImages.length === 0 && !loading" 
			 class="text-center py-16">
			<div class="cyber-text-dim">
				<font-awesome-icon :icon="faFolder" class="text-6xl mb-4 text-cyber-primary opacity-50" />
				<div class="text-lg mb-2">暂无图片</div>
				<div class="text-sm mb-4">当前文件夹为空，请上传图片或切换到其他文件夹</div>
				<div class="text-xs cyber-text-dim">
					<span class="inline-block px-3 py-2 bg-cyber-card border border-cyber-border rounded">
						💡 提示：可以直接拖拽图片到此页面进行上传
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { requestListImages, requestDeleteImage, createFolder, requestAllFolders, requestMoveImages, requestUploadImages, requestDeleteFolder } from '../utils/request'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import formatBytes from '../utils/format-bytes'
import { computed, onMounted, ref } from 'vue'
import type { ImgItem, ImgReq, Folder, ExportOptions, SelectedItem, MoveOptions } from '../utils/types'
import ImageBox from '../components/ImageBox.vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { faRedoAlt, faFolder, faFolderPlus, faCog, faCheckSquare, faSquare, faDownload, faTrash, faFolderOpen, faUpload } from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import copy from 'copy-to-clipboard'

const loading = ref(false)
const delimiter = ref('/')
const uploadedImages = ref<ImgItem[]>([])
const prefixes = ref<String[]>([])
const isMultiSelect = ref(false)
const selectedFolders = ref<string[]>([])
const isDragOver = ref(false)
const uploadLoading = ref(false)

const imagesTotalSize = computed(() =>
    uploadedImages.value.reduce((total, item) => total + item.size, 0)
)

const selectedCount = computed(() => {
    const selectedImages = uploadedImages.value.filter(img => img.isSelected).length
    return selectedImages + selectedFolders.value.length
})
const changeFolder = (path : string) => {
  console.log(path)
  delimiter.value = path
  listImages()
}
const addFolder = () => {
  ElMessageBox.prompt('请输入目录名称，仅支持 [0-9A-Za-z_-] 组成的名称', '📁 新增目录', {
    confirmButtonText: '🚀 创建',
    cancelButtonText: '❌ 取消',
    inputPattern: /^[0-9A-Za-z_-]+$/,
    inputErrorMessage: '无效的目录名称',
    customClass: 'cyber-message-box cyber-folder-dialog',
    inputPlaceholder: '例如: my-folder',
    inputValidator: (value) => {
      if (!value) {
        return '目录名称不能为空'
      }
      if (!/^[0-9A-Za-z_-]+$/.test(value)) {
        return '目录名称只能包含字母、数字、下划线和连字符'
      }
      return true
    }
  }).then(({ value }) => {
    loading.value = true
    createFolder(<Folder & { parentPath?: string }> {
      name: value,
      parentPath: delimiter.value
    }).then((res) => {
      console.log(res)
      ElMessage.success('🎉 文件夹创建成功')
      listImages()
    }).catch(() => {
      ElMessage.error('❌ 文件夹创建失败')
    }).finally(() => {
      loading.value = false
    })
  }).catch(() => {})
}
const listImages = () => {
	loading.value = true
	requestListImages(<ImgReq> {
    limit: 100,
    delimiter: delimiter.value
  }).then((data) => {
    uploadedImages.value = data.list
    if (data.prefixes && data.prefixes.length) {
      prefixes.value = data.prefixes
      if (delimiter.value !== '/') {
        prefixes.value = ['/', ...data.prefixes]
      }
    } else {
      prefixes.value = ['/']
    }
  }).catch(() => {})
		.finally(() => {
			loading.value = false
		})
}

// 拖拽上传相关函数
const onDragOver = (e: DragEvent) => {
	e.preventDefault()
	isDragOver.value = true
}

const onDragLeave = (e: DragEvent) => {
	e.preventDefault()
	// 只有当拖拽离开整个容器时才设置为false
	if (!e.currentTarget?.contains(e.relatedTarget as Node)) {
		isDragOver.value = false
	}
}

const onDrop = async (e: DragEvent) => {
	e.preventDefault()
	isDragOver.value = false
	
	const files = e.dataTransfer?.files
	if (!files || files.length === 0) {
		return
	}
	
	// 过滤出图片文件
	const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
	if (imageFiles.length === 0) {
		ElMessage.warning('请拖拽图片文件')
		return
	}
	
	// 检查文件大小限制
	const maxSize = 20 * 1024 * 1024 // 20MB
	const oversizedFiles = imageFiles.filter(file => file.size > maxSize)
	if (oversizedFiles.length > 0) {
		ElMessage.error(`以下文件超过20MB限制: ${oversizedFiles.map(f => f.name).join(', ')}`)
		return
	}
	
	uploadLoading.value = true
	
	try {
		const formData = new FormData()
		imageFiles.forEach(file => {
			formData.append('files', file)
		})
		// 上传到当前文件夹
		formData.append('folder', delimiter.value)
		
		const uploadedItems = await requestUploadImages(formData)
		
		ElMessage.success(`🎉 成功上传 ${uploadedItems.length} 张图片到 ${delimiter.value === '/' ? '根目录' : delimiter.value.replace('/', '')}`)
		
		// 刷新图片列表
		listImages()
	} catch (error) {
		console.error('Upload failed:', error)
		ElMessage.error(`上传失败: ${error}`)
	} finally {
		uploadLoading.value = false
	}
}

onMounted(() => {
	listImages()
})

const deleteImage = (src: string) => {
	requestDeleteImage({
    keys: src
  }).then((res) => {
		uploadedImages.value = uploadedImages.value.filter((item) => item.key !== res)
	})
}

// 多选相关方法
const toggleMultiSelect = () => {
  isMultiSelect.value = !isMultiSelect.value
  if (!isMultiSelect.value) {
    // 退出多选模式时清除所有选择
    uploadedImages.value.forEach(img => img.isSelected = false)
    selectedFolders.value = []
  }
}

const toggleImageSelection = (item: ImgItem) => {
  item.isSelected = !item.isSelected
}

const toggleFolderSelection = (folderPath: string) => {
  const index = selectedFolders.value.indexOf(folderPath)
  if (index > -1) {
    selectedFolders.value.splice(index, 1)
  } else {
    selectedFolders.value.push(folderPath)
  }
}

// 导出功能
const showExportDialog = () => {
  // 创建一个自定义的导出选择弹窗
  ElMessageBox({
    title: '🔗 导出链接',
    message: `
      <div class="cyber-export-dialog">
        <div class="mb-4">
          <label class="block text-sm font-medium cyber-text mb-2">选择导出格式：</label>
          <select id="exportType" class="cyber-select w-full p-3 bg-cyber-bg-dark border border-cyber-border rounded text-cyber-text">
            <option value="direct">📎 Direct Link</option>
            <option value="webp">🖼️ WebP Link</option>
            <option value="html-direct">🌐 HTML (Direct Link)</option>
            <option value="html-webp">🌐 HTML (WebP Link)</option>
            <option value="markdown-direct">📝 Markdown (Direct Link)</option>
            <option value="markdown-webp">📝 Markdown (WebP Link)</option>
          </select>
        </div>
        <div class="text-xs cyber-text-dim">
          将导出选中的 ${selectedCount.value} 项内容
        </div>
      </div>
    `,
    dangerouslyUseHTMLString: true,
    showCancelButton: true,
    confirmButtonText: '🚀 导出',
    cancelButtonText: '❌ 取消',
    customClass: 'cyber-message-box cyber-export-dialog-box',
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        const selectElement = document.getElementById('exportType') as HTMLSelectElement
        const selectedType = selectElement?.value as ExportOptions['type']
        if (selectedType) {
          exportLinks(selectedType)
        }
        done()
      } else {
        done()
      }
    }
  }).catch(() => {})
}

const exportLinks = async (type: ExportOptions['type']) => {
  try {
    loading.value = true
    const selectedItems = await getSelectedItems()
    let exportText = ''
    
    selectedItems.forEach(item => {
      if (item.type === 'folder') {
        exportText += `\n=== 文件夹: ${item.name} ===\n`
      }
      
      if (item.items) {
        item.items.forEach(img => {
          switch (type) {
            case 'direct':
              exportText += `${img.copyUrl}\n`
              break
            case 'webp':
              exportText += `${img.webpUrl}\n`
              break
            case 'html-direct':
              exportText += `<a href="${img.copyUrl}" target="_blank"><img src="${img.copyUrl}" alt="${img.filename || img.key}"></a>\n`
              break
            case 'html-webp':
              exportText += `<a href="${img.webpUrl}" target="_blank"><img src="${img.webpUrl}" alt="${img.filename || img.key}"></a>\n`
              break
            case 'markdown-direct':
              exportText += `![${img.filename || img.key}](${img.copyUrl})\n`
              break
            case 'markdown-webp':
              exportText += `![${img.filename || img.key}](${img.webpUrl})\n`
              break
          }
        })
      }
    })
    
    // 显示导出结果弹窗
    ElMessageBox({
      title: '📋 导出结果',
      message: `
        <div class="cyber-result-dialog">
          <div class="mb-4">
            <div class="cyber-text text-sm mb-2">导出内容预览：</div>
            <div class="cyber-input p-4 max-h-80 overflow-auto whitespace-pre font-mono text-sm cursor-pointer hover:border-cyber-primary transition-colors" onclick="this.select()">${exportText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
          <div class="text-xs cyber-text-dim">
            点击上方文本框可全选内容，或点击下方按钮复制到剪贴板
          </div>
        </div>
      `,
      dangerouslyUseHTMLString: true,
      showCancelButton: true,
      confirmButtonText: '📋 复制到剪贴板',
      cancelButtonText: '❌ 关闭',
      customClass: 'cyber-message-box cyber-result-dialog-box cyber-large-dialog',
      showClose: true,
      customStyle: {
        width: '80%',
        maxWidth: '800px',
        minHeight: '400px'
      }
    }).then(() => {
      copy(exportText)
      ElMessage.success('🎉 链接已复制到剪贴板')
    }).catch(() => {})
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    loading.value = false
  }
}

const getSelectedItems = async (): Promise<SelectedItem[]> => {
  const items: SelectedItem[] = []
  
  // 添加选中的图片
  const selectedImages = uploadedImages.value.filter(img => img.isSelected)
  if (selectedImages.length > 0) {
    items.push({
      type: 'image',
      key: 'current',
      name: '当前文件夹',
      items: selectedImages
    })
  }
  
  // 添加选中的文件夹
  for (const folderPath of selectedFolders.value) {
    try {
      // 获取文件夹内的图片
      const folderData = await requestListImages({
        limit: 1000,
        delimiter: folderPath
      })
      
      items.push({
        type: 'folder',
        key: folderPath,
        name: folderPath === '/' ? '根目录' : folderPath.replace('/', ''),
        items: folderData.list
      })
    } catch (error) {
      console.error(`Failed to get images from folder ${folderPath}:`, error)
      // 如果获取失败，添加一个空的文件夹项
      items.push({
        type: 'folder',
        key: folderPath,
        name: folderPath === '/' ? '根目录' : folderPath.replace('/', ''),
        items: []
      })
    }
  }
  
  return items
}

// 批量删除
const batchDelete = async () => {
  ElMessageBox({
    title: '⚠️ 批量删除确认',
    message: `
      <div class="cyber-delete-dialog">
        <div class="text-center mb-4">
          <div class="text-6xl mb-4">🗑️</div>
          <div class="cyber-text text-lg mb-2">确定要删除选中的 <span class="text-cyber-secondary font-bold">${selectedCount.value}</span> 项吗？</div>
          <div class="cyber-text-dim text-sm">此操作不可撤销，请谨慎操作！</div>
        </div>
      </div>
    `,
    dangerouslyUseHTMLString: true,
    showCancelButton: true,
    confirmButtonText: '💥 确认删除',
    cancelButtonText: '❌ 取消',
    customClass: 'cyber-message-box cyber-delete-dialog-box',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    
    try {
      const selectedImages = uploadedImages.value.filter(img => img.isSelected)
      const selectedFolderPaths = selectedFolders.value
      
      // 删除选中的图片
      if (selectedImages.length > 0) {
        const keysToDelete = selectedImages.map(img => img.key)
        await requestDeleteImage({ keys: keysToDelete.join(',') })
      }
      
      // 删除选中的文件夹
      if (selectedFolderPaths.length > 0) {
        const deleteFolderPromises = selectedFolderPaths.map(folderPath => 
          requestDeleteFolder({ folderPath })
        )
        await Promise.all(deleteFolderPromises)
      }
      
      // 清除选择状态
      uploadedImages.value.forEach(img => img.isSelected = false)
      selectedFolders.value = []
      
      ElMessage.success('🎉 删除成功')
      
      // 刷新图片列表
      listImages()
    } catch (error) {
      console.error('Delete failed:', error)
      ElMessage.error(`❌ 删除失败: ${error}`)
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

// 移动文件夹功能
const showMoveDialog = async () => {
  const selectedImages = uploadedImages.value.filter(img => img.isSelected)
  if (selectedImages.length === 0) {
    ElMessage.warning('请先选择要移动的图片')
    return
  }

  // 获取所有可用文件夹
  let allFolders = ['/']
  try {
    allFolders = await requestAllFolders()
  } catch (error) {
    console.error('Failed to load folders:', error)
    ElMessage.error('获取文件夹列表失败')
    return
  }

  // 过滤掉当前文件夹
  const availableFolders = allFolders.filter(folder => folder !== delimiter.value)

  // 创建目标文件夹选择弹窗
  ElMessageBox({
    title: '📁 移动到文件夹',
    message: `
      <div class="cyber-move-dialog">
        <div class="mb-4">
          <div class="cyber-text text-sm mb-2">选择目标文件夹：</div>
          <select id="targetFolder" class="cyber-select w-full p-3 bg-cyber-bg-dark border border-cyber-border rounded text-cyber-text">
            ${availableFolders.map(folder => 
              `<option value="${folder}">📁 ${folder === '/' ? '根目录' : folder.replace('/', '')}</option>`
            ).join('')}
          </select>
        </div>
        <div class="text-xs cyber-text-dim">
          将移动选中的 ${selectedImages.length} 张图片到目标文件夹
        </div>
      </div>
    `,
    dangerouslyUseHTMLString: true,
    showCancelButton: true,
    confirmButtonText: '🚀 移动',
    cancelButtonText: '❌ 取消',
    customClass: 'cyber-message-box cyber-move-dialog-box',
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        const selectElement = document.getElementById('targetFolder') as HTMLSelectElement
        const targetFolder = selectElement?.value
        if (targetFolder) {
          moveImages(targetFolder, selectedImages)
        }
        done()
      } else {
        done()
      }
    }
  }).catch(() => {})
}

const moveImages = (targetFolder: string, images: ImgItem[]) => {
  ElMessageBox.confirm(
    `确定要将 ${images.length} 张图片移动到 "${targetFolder === '/' ? '根目录' : targetFolder.replace('/', '')}" 吗？`,
    '移动确认',
    {
      confirmButtonText: '移动',
      cancelButtonText: '取消',
      type: 'info',
      customClass: 'cyber-message-box'
    }
  ).then(() => {
    loading.value = true
    
    // 调用真实的移动API
    const keys = images.map(img => img.key)
    requestMoveImages({
      keys: keys,
      targetFolder: targetFolder
    }).then((movedKeys) => {
      ElMessage.success(`🎉 成功移动 ${movedKeys.length} 张图片到目标文件夹`)
      
      // 清除选择状态
      uploadedImages.value.forEach(img => img.isSelected = false)
      selectedFolders.value = []
      
      // 刷新图片列表
      listImages()
    }).catch((error) => {
      console.error('Move failed:', error)
      ElMessage.error(`移动失败: ${error}`)
    }).finally(() => {
      loading.value = false
    })
  }).catch(() => {})
}
</script>
