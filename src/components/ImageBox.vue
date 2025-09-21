<template>
	<div class="cyber-card w-full overflow-hidden relative group" 
		 @contextmenu.prevent="showContextMenu"
		 @touchstart="onTouchStart"
		 @touchend="onTouchEnd"
		 @touchmove="onTouchMove">
		<loading-overlay :loading="loading" />

		<!-- 文件容器 -->
		<div class="relative overflow-hidden cursor-pointer" @click="showPreview">
			<!-- 图片文件 -->
			<el-image
				v-if="isImageFile"
				class="block w-full h-40 lg:h-60 transition-transform duration-300 group-hover:scale-105"
				:src="src"
				fit="cover"
				hide-on-click-modal
				@load="loading = false"
				@error="handleImageError"
			/>
			
			<!-- 非图片文件 -->
			<div 
				v-else
				class="w-full h-40 lg:h-60 flex items-center justify-center bg-cyber-bg-dark border-2 border-cyber-border transition-transform duration-300 group-hover:scale-105"
			>
				<div class="text-center">
					<font-awesome-icon :icon="getFileIcon()" class="text-4xl text-cyber-primary mb-2" />
					<div class="text-sm text-cyber-text-dim">{{ getFileType() }}</div>
				</div>
			</div>
			
			<!-- 悬停时的光效 -->
			<div class="absolute inset-0 bg-gradient-to-t from-cyber-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			
			<!-- 预览提示 -->
			<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				<div class="bg-cyber-bg-dark/80 backdrop-blur-sm rounded-full p-2">
					<font-awesome-icon :icon="faEye" class="text-cyber-primary text-sm" />
				</div>
			</div>
		</div>

		<!-- 信息面板 -->
		<div class="absolute left-0 bottom-0 w-full bg-gradient-to-t from-cyber-dark/90 to-transparent backdrop-blur-sm">
			<div class="p-3">
				<!-- 文件名 -->
				<div class="w-full flex items-center cyber-text mb-2">
					<div class="flex-1 w-full truncate">
						<el-tooltip :content="getDisplayName()" placement="top-start">
							<span class="text-sm font-medium">{{ getDisplayName() }}</span>
						</el-tooltip>
					</div>
					<div
						v-if="mode === 'converted'"
						class="w-6 h-6 flex items-center justify-center cursor-pointer text-cyber-secondary hover:text-cyber-primary transition-colors"
						@click="emit('delete')"
					>
						<font-awesome-icon :icon="faXmark" />
					</div>
				</div>
				
				<!-- 文件信息 -->
				<div class="cyber-text-dim text-xs flex items-center">
					<span class="text-cyber-accent font-mono">{{ formatBytes(size) }}</span>
					<el-divider v-if="uploadedAt" direction="vertical" class="mx-2" />
					<span v-if="uploadedAt" class="font-mono">
						{{ new Date(uploadedAt).toLocaleDateString() }}
					</span>
				</div>
			</div>

			<!-- 简化的操作按钮 -->
			<div v-if="mode === 'uploaded'" class="border-t border-cyber-border">
				<div class="w-full flex cyber-text h-10 text-center text-sm">
					<el-tooltip :content="webpUrl" placement="top-start">
						<div
							class="flex-1 flex items-center justify-center cursor-pointer hover:bg-cyber-accent/20 transition-colors duration-200"
							@click="copyLink(webpUrl)"
						>
							<font-awesome-icon :icon="faImage" class="mr-2 text-cyber-accent" />
							<span class="text-xs">EO</span>
						</div>
					</el-tooltip>
					<el-divider direction="vertical" class="h-full" />
					<div
						class="flex-1 flex items-center justify-center cursor-pointer hover:bg-cyber-primary/20 transition-colors duration-200"
						@click="downloadFile"
					>
						<font-awesome-icon :icon="faDownload" class="mr-2 text-cyber-primary" />
						<span class="text-xs">下载</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 赛博朋克边框效果 -->
		<div class="absolute inset-0 border border-cyber-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
		
		<!-- 右键菜单 -->
		<div 
			v-if="showContextMenuFlag"
			class="fixed bg-cyber-bg-dark/90 backdrop-blur-md border border-cyber-border rounded-lg shadow-lg z-50 py-2 min-w-32"
			:style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
			@click.stop
		>
			<div 
				class="px-4 py-2 hover:bg-cyber-primary/20 cursor-pointer cyber-text text-sm flex items-center"
				@click="copyLink(copyUrl)"
			>
				<font-awesome-icon :icon="faCopy" class="mr-2 text-cyber-accent" />
				复制直链
			</div>
			<div 
				class="px-4 py-2 hover:bg-cyber-primary/20 cursor-pointer cyber-text text-sm flex items-center"
				@click="copyLink(webpUrl)"
			>
				<font-awesome-icon :icon="faImage" class="mr-2 text-cyber-accent" />
				复制EO链接
			</div>
			<div 
				class="px-4 py-2 hover:bg-cyber-primary/20 cursor-pointer cyber-text text-sm flex items-center"
				@click="downloadFile"
			>
				<font-awesome-icon :icon="faDownload" class="mr-2 text-cyber-primary" />
				下载文件
			</div>
			<div class="border-t border-cyber-border my-1"></div>
			<div 
				class="px-4 py-2 hover:bg-cyber-secondary/20 cursor-pointer cyber-text text-sm flex items-center"
				@click="confirmDelete"
			>
				<font-awesome-icon :icon="faTrash" class="mr-2 text-cyber-secondary" />
				删除文件
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { faXmark, faTrash, faCopy, faEye, faDownload, faFile, faFileText, faFilePdf, faFileArchive, faFileVideo, faFileAudio, faFileCode, faImage } from '@fortawesome/free-solid-svg-icons'
import copy from 'copy-to-clipboard'
import formatBytes from '../utils/format-bytes'
import {ElTooltip, ElDivider, ElPopconfirm, ElImage, ElMessage, ElMessageBox} from 'element-plus'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const props = defineProps<{
	src: string
	copyUrl: string
	webpUrl?: string
	name: string
	size: number
	mode: 'converted' | 'uploaded'
	uploadedAt?: number
	expiresAt?: number
}>()
const emit = defineEmits(['delete'])

const imageError = ref(false)
const loading = ref(true)

// 右键菜单相关
const showContextMenuFlag = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

// 移动端长按相关
const longPressTimer = ref<number | null>(null)
const touchStartTime = ref(0)
const touchStartPos = ref({ x: 0, y: 0 })
const isLongPress = ref(false)

// 判断是否为图片文件
const isImageFile = computed(() => {
  return props.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff)$/i) !== null
})

// 处理图片加载错误
const handleImageError = () => {
  imageError.value = true
  loading.value = false
}

// 获取文件图标
const getFileIcon = () => {
  const ext = props.name.split('.').pop()?.toLowerCase() || ''
  
  if (['pdf'].includes(ext)) return faFilePdf
  if (['txt', 'md', 'doc', 'docx'].includes(ext)) return faFileText
  if (['zip', 'rar', '7z', 'gz'].includes(ext)) return faFileArchive
  if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return faFileVideo
  if (['mp3', 'wav', 'flac'].includes(ext)) return faFileAudio
  if (['js', 'ts', 'html', 'css', 'json', 'xml'].includes(ext)) return faFileCode
  
  return faFile
}

// 获取文件类型显示
const getFileType = () => {
  const ext = props.name.split('.').pop()?.toLowerCase() || ''
  return ext.toUpperCase()
}

// 获取不包含路径的文件显示名称
const getDisplayName = () => {
  // 从完整路径中提取文件名
  const parts = props.name.split('/')
  return parts[parts.length - 1] || props.name
}

// 对于非图片文件，立即设置loading为false
onMounted(() => {
  if (!isImageFile.value) {
    loading.value = false
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
  hideContextMenu()
})
const copyLink = (link : string) => {
  const res = copy(link)
  if (res) {
    ElMessage.success('链接复制成功')
  } else {
    ElMessage.error('链接复制失败')
  }
  hideContextMenu()
}

const showPreview = () => {
  ElMessageBox({
    title: '🖼️ 图片预览',
    message: `
      <div class="cyber-preview-dialog">
        <div class="text-center mb-4">
          <img src="${props.src}" alt="${props.name}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" />
        </div>
        <div class="cyber-text text-sm mb-2">
          <strong>文件名：</strong>${props.name}
        </div>
        <div class="cyber-text text-sm mb-4">
          <strong>大小：</strong>${formatBytes(props.size)}
        </div>
      </div>
    `,
    dangerouslyUseHTMLString: true,
    showCancelButton: true,
    confirmButtonText: '📥 下载',
    cancelButtonText: '🗑️ 删除',
    customClass: 'cyber-message-box cyber-preview-dialog-box',
    showClose: true,
    customStyle: {
      width: '90%',
      maxWidth: '600px'
    },
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        // 下载功能
        downloadImage()
        done()
      } else if (action === 'cancel') {
        // 删除功能
        confirmDelete()
        done()
      } else if (action === 'close') {
        // 点击右上角关闭按钮，直接关闭，不执行任何操作
        done()
      } else {
        // 其他情况，直接关闭
        done()
      }
    }
  }).catch(() => {})
}

const downloadImage = () => {
  const link = document.createElement('a')
  link.href = props.copyUrl
  link.download = props.name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('🎉 下载已开始')
}

// 下载文件（直接跳转到EO链接）
const downloadFile = () => {
  window.open(props.webpUrl, '_blank')
  hideContextMenu()
}

// 显示右键菜单
const showContextMenu = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  let clientX: number, clientY: number
  
  if (event instanceof MouseEvent) {
    clientX = event.clientX
    clientY = event.clientY
  } else {
    // TouchEvent
    const touch = event.touches[0] || event.changedTouches[0]
    clientX = touch.clientX
    clientY = touch.clientY
  }
  
  contextMenuX.value = clientX
  contextMenuY.value = clientY
  showContextMenuFlag.value = true
  
  // 立即添加全局点击监听器来隐藏菜单
  document.addEventListener('click', hideContextMenu, { once: true })
  document.addEventListener('touchstart', hideContextMenu, { once: true })
}

// 隐藏右键菜单
const hideContextMenu = () => {
  showContextMenuFlag.value = false
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('touchstart', hideContextMenu)
}

// 移动端长按事件处理
const onTouchStart = (event: TouchEvent) => {
  touchStartTime.value = Date.now()
  const touch = event.touches[0]
  touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  isLongPress.value = false
  
  // 清除之前的定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
  
  // 设置长按定时器（800ms）
  longPressTimer.value = window.setTimeout(() => {
    isLongPress.value = true
    // 触发右键菜单
    showContextMenu(event)
    // 添加振动反馈（如果设备支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, 800)
}

const onTouchMove = (event: TouchEvent) => {
  if (!longPressTimer.value) return
  
  const touch = event.touches[0]
  const deltaX = Math.abs(touch.clientX - touchStartPos.value.x)
  const deltaY = Math.abs(touch.clientY - touchStartPos.value.y)
  
  // 如果移动距离超过10px，取消长按
  if (deltaX > 10 || deltaY > 10) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const onTouchEnd = (event: TouchEvent) => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  // 如果是长按触发的结束事件，阻止默认的点击行为
  if (isLongPress.value) {
    event.preventDefault()
    event.stopPropagation()
    isLongPress.value = false
  }
}

const confirmDelete = () => {
  hideContextMenu()
  ElMessageBox.confirm(
    `确定要删除文件 "${getDisplayName()}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'cyber-message-box'
    }
  ).then(() => {
    emit('delete')
    ElMessage.success('🎉 文件删除成功')
  }).catch(() => {})
}
</script>
