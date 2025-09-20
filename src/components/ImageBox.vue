<template>
	<div class="cyber-card w-full overflow-hidden relative group">
		<loading-overlay :loading="loading" />

		<!-- 图片容器 -->
		<div class="relative overflow-hidden cursor-pointer" @click="showPreview">
			<el-image
				class="block w-full h-40 lg:h-60 transition-transform duration-300 group-hover:scale-105"
				:src="src"
				fit="cover"
				hide-on-click-modal
				@load="loading = false"
			/>
			
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
						<el-tooltip :content="name" placement="top-start">
							<span class="text-sm font-medium">{{ name }}</span>
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

			<!-- 操作按钮 -->
			<div v-if="mode === 'uploaded'" class="border-t border-cyber-border">
				<div class="w-full flex cyber-text h-10 text-center text-sm">
					<el-tooltip :content="copyUrl" placement="top-start">
						<div
							class="flex-1 flex items-center justify-center cursor-pointer hover:bg-cyber-primary/20 transition-colors duration-200"
							@click="copyLink(copyUrl)"
						>
							<font-awesome-icon :icon="faCopy" class="mr-2 text-cyber-accent" />
							<span class="text-xs">链接</span>
						</div>
					</el-tooltip>
					<el-divider direction="vertical" class="h-full" />
					<el-tooltip :content="webpUrl" placement="top-start">
						<div
							class="flex-1 flex items-center justify-center cursor-pointer hover:bg-cyber-accent/20 transition-colors duration-200"
							@click="copyLink(webpUrl)"
						>
							<font-awesome-icon :icon="faImage" class="mr-2 text-cyber-accent" />
							<span class="text-xs">WebP</span>
						</div>
					</el-tooltip>
					<el-divider direction="vertical" class="h-full" />
					<el-popconfirm
						title="确认删除图片吗？"
						confirm-button-type="danger"
						@confirm="
							() => {
								loading = true
								emit('delete')
								return true
							}
						"
					>
						<template #reference>
							<div class="flex-1 flex items-center justify-center cursor-pointer hover:bg-cyber-secondary/20 transition-colors duration-200">
								<font-awesome-icon :icon="faTrash" class="mr-2 text-cyber-secondary" />
								<span class="text-xs">删除</span>
							</div>
						</template>
					</el-popconfirm>
				</div>
			</div>
		</div>

		<!-- 赛博朋克边框效果 -->
		<div class="absolute inset-0 border border-cyber-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
	</div>
</template>

<script setup lang="ts">
import { faXmark, faTrash, faCopy, faEye, faDownload } from '@fortawesome/free-solid-svg-icons'
import copy from 'copy-to-clipboard'
import formatBytes from '../utils/format-bytes'
import {ElTooltip, ElDivider, ElPopconfirm, ElImage, ElMessage, ElMessageBox} from 'element-plus'
import { ref } from 'vue'
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
const copyLink = (link : string) => {
  const res = copy(link)
  if (res) {
    ElMessage.success('链接复制成功')
  } else {
    ElMessage.success('链接复制失败')
  }
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

const confirmDelete = () => {
  ElMessageBox.confirm(
    `确定要删除图片 "${props.name}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'cyber-message-box'
    }
  ).then(() => {
    emit('delete')
    ElMessage.success('🎉 图片删除成功')
  }).catch(() => {})
}
</script>
