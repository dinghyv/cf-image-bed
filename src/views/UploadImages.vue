<template>
	<div class="mx-auto max-w-6xl my-4 px-4">
		<!-- 页面标题 -->
		<div class="mb-6">
			<div class="cyber-text text-2xl font-bold mb-2 flex items-center">
				<font-awesome-icon :icon="faUpload" class="mr-3 text-cyber-primary" />
				图片上传中心
			</div>
			<div class="cyber-text-dim text-sm">
				每张图片大小不超过 {{ formatBytes(imageSizeLimit) }} | 支持拖拽、粘贴、选择文件
			</div>
		</div>

		<!-- 赛博朋克拖拽区域 -->
		<div class="cyber-dropzone rounded-lg relative" :class="{ 'drag-over': isDragOver }">
			<loading-overlay :loading="loading" />

			<div class="grid p-6 gap-4 grid-cols-4 min-h-[300px]" 
				 @drop.prevent="onFileDrop" 
				 @dragover.prevent="isDragOver = true"
				 @dragleave="isDragOver = false">
				
				<!-- 空状态提示 -->
				<div v-if="convertedImages.length === 0"
					class="absolute inset-0 flex items-center justify-center z-0">
					<div class="text-center cyber-text-dim">
						<div class="text-6xl mb-4 text-cyber-primary opacity-50">
							<font-awesome-icon :icon="faCopy" />
						</div>
						<div class="text-lg mb-2">拖拽图片到此处</div>
						<div class="text-sm">或使用下方按钮选择文件</div>
						<div class="mt-4 text-xs cyber-text-dim">
							<span class="inline-block px-2 py-1 bg-cyber-card border border-cyber-border rounded">
								Ctrl+V 粘贴图片
							</span>
						</div>
					</div>
				</div>

				<!-- 图片预览网格 -->
				<transition-group name="cyber-fade" tag="div" class="contents">
					<div class="col-span-3 md:col-span-1" v-for="item in convertedImages" :key="item.tmpSrc">
						<image-box :src="item.tmpSrc" :size="item.file.size" :name="item.file.name"
							@delete="removeImage(item.tmpSrc)" mode="converted" />
					</div>
				</transition-group>
			</div>
		</div>

		<!-- 赛博朋克控制面板 -->
		<div class="cyber-card mt-6 p-4">
			<div class="grid grid-cols-1 md:grid-cols-10 gap-3">
				<!-- 选择图片按钮 -->
				<div class="md:col-span-1">
					<div class="cyber-btn w-full h-12 cursor-pointer flex items-center justify-center" 
						 :class="{ 'area-disabled': loading }" 
						 @click="input?.click()">
						<font-awesome-icon :icon="faImage" class="mr-2" />
						<span class="hidden md:inline">选择</span>
					</div>
				</div>

				<!-- 文件夹选择器 -->
				<div class="md:col-span-2">
					<select v-model="selectedFolder" class="cyber-select w-full h-12 bg-cyber-bg-dark border border-cyber-border rounded text-cyber-text px-3">
						<option v-for="folder in availableFolders" :key="folder" :value="folder">
							📁 {{ folder === '/' ? '根目录' : folder.replace('/', '') }}
						</option>
					</select>
				</div>

				<!-- 状态信息 -->
				<div class="md:col-span-3">
					<div class="cyber-input w-full h-12 flex items-center justify-center md:justify-start">
						<span class="cyber-text">
							已选择 <span class="text-cyber-primary font-bold">{{ convertedImages.length }}</span> 张，
							共 <span class="text-cyber-accent font-bold">{{ formatBytes(imagesTotalSize) }}</span>
						</span>
					</div>
				</div>

				<!-- 清除按钮 -->
				<div class="md:col-span-1">
					<div class="cyber-btn-secondary w-full h-12 cursor-pointer flex items-center justify-center" 
						 :class="{ 'area-disabled': loading }" 
						 @click="clearInput">
						<font-awesome-icon :icon="faTrash" class="mr-2" />
						<span class="hidden md:inline">清除</span>
					</div>
				</div>

				<!-- 剪切板按钮 -->
				<div class="md:col-span-1">
					<div class="cyber-btn-accent w-full h-12 cursor-pointer flex items-center justify-center" 
						 :class="{ 'area-disabled': loading }" 
						 @click="clipboardUpload">
						<font-awesome-icon :icon="faCopy" class="mr-2" />
						<span class="hidden md:inline">粘贴</span>
					</div>
				</div>

				<!-- 上传按钮 -->
				<div class="md:col-span-2">
					<div class="cyber-btn-active w-full h-12 cursor-pointer flex items-center justify-center font-bold" 
						 :class="{ 'area-disabled': convertedImages.length === 0 || loading }" 
						 @click="uploadImages">
						<font-awesome-icon :icon="faUpload" class="mr-2" />
						<span class="hidden md:inline">上传到 {{ selectedFolder === '/' ? '根目录' : selectedFolder.replace('/', '') }}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 结果列表 -->
		<result-list v-show="imgResultList && imgResultList.length" 
					 :image-list="imgResultList" 
					 ref="resultList"
					 class="mt-6" />
	</div>

	<input ref="input" type="file" accept="image/*" class="hidden" multiple @change="onInputChange" />
</template>

<script setup lang="ts">
import { faImage, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons'
import { faUpload } from '@fortawesome/free-solid-svg-icons'
import { computed, onMounted, onUnmounted, ref, h } from 'vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import formatBytes from '../utils/format-bytes'
import { ElNotification as elNotify, ElMessage } from 'element-plus'
import { requestUploadImages, requestAllFolders } from '../utils/request'
import { useRouter } from 'vue-router'
import ImageBox from '../components/ImageBox.vue'
import ResultList from '../components/ResultList.vue'
import type { ConvertedImage, ImgItem, ImgReq } from '../utils/types'
const convertedImages = ref<ConvertedImage[]>([])
const imgResultList = ref<ImgItem[]>([])
const availableFolders = ref<string[]>(['/'])
const selectedFolder = ref('/')
const imagesTotalSize = computed(() =>
	convertedImages.value.reduce((total, item) => total + item.file.size, 0)
)

const imageSizeLimit = 20 * 1024 * 1024
const input = ref<HTMLInputElement>()
const loading = ref(false)
const isDragOver = ref(false)
const router = useRouter()

const onInputChange = () => {
	appendConvertedImages(input.value?.files)
}
const onFileDrop = (e: DragEvent) => {
	isDragOver.value = false
	appendConvertedImages(e.dataTransfer?.files)
}
const onPaste = (e: ClipboardEvent) => {
	appendConvertedImages(e.clipboardData?.files)
}

// 获取可用文件夹列表
const loadAvailableFolders = async () => {
	try {
		const folders = await requestAllFolders()
		availableFolders.value = folders
	} catch (error) {
		console.error('Failed to load folders:', error)
		availableFolders.value = ['/']
	}
}

onMounted(() => {
	document.onpaste = onPaste
	loadAvailableFolders()
})

onUnmounted(() => {
	document.onpaste = null
	convertedImages.value.forEach((item) => URL.revokeObjectURL(item.tmpSrc))
})

const clearInput = () => {
	convertedImages.value = []
	imgResultList.value = []
}

const clipboardUpload = () => {
	navigator.clipboard.read().then(clipboardContents => {
		for (const item of clipboardContents) {
			if (item.types.includes("image/png")) {

				item.getType("image/png").then(blob => {
					const file = new File([blob], "clipboard.png", {
						type: "image/png",
					});
					convertedImages.value = [
						...convertedImages.value,
						{
							file,
							tmpSrc: URL.createObjectURL(file)
						}
					]
				});
			} else {
				ElMessage({
					message: '剪切板中不是图片！',
					type: 'warning',
				})
			}
		}
	});

}

const appendConvertedImages = async (files: FileList | null | undefined) => {
	if (!files) return

	loading.value = true
	for (let i = 0; i < files.length; i++) {
		const file = files.item(i)
		if (!file) return
		if (file.size > imageSizeLimit) {
			elNotify({
				message: `${file.name} 文件过大`,
				type: 'error'
			})
			continue
		}

		if (!file.type.startsWith('image/')) {
			elNotify({
				message: `${file.name} 不是图片文件`,
				type: 'error'
			})
			continue
		}

		convertedImages.value = [
			...convertedImages.value,
			{
				file,
				tmpSrc: URL.createObjectURL(file)
			}
		]
	}
	loading.value = false
}

const removeImage = (tmpSrc: string) => {
	convertedImages.value = convertedImages.value.filter((item) => item.tmpSrc !== tmpSrc)
	URL.revokeObjectURL(tmpSrc)
}

const uploadImages = () => {
	loading.value = true

	const formData = new FormData()
	for (let item of convertedImages.value) {
		formData.append('files', item.file)
	}
	// 添加目标文件夹参数
	formData.append('folder', selectedFolder.value)

	requestUploadImages(formData)
		.then((res) => {
			elNotify({
				title: '上传完成',
				message: `共 ${convertedImages.value.length} 张图片已上传到 ${selectedFolder.value === '/' ? '根目录' : selectedFolder.value.replace('/', '')}，${formatBytes(
					imagesTotalSize.value
				)}`,
				type: 'success'
			})
			convertedImages.value = []
			imgResultList.value = res
			// console.log(res)
			// router.push('/')
		})
		.catch(() => { })
		.finally(() => {
			loading.value = false
		})
}
</script>

<style>
.remove-now-btn .el-picker-panel__footer button:first-child {
	display: none;
}

/* 赛博朋克淡入动画 */
.cyber-fade-enter-active,
.cyber-fade-leave-active {
	transition: all 0.5s ease;
}

.cyber-fade-enter-from {
	opacity: 0;
	transform: translateY(20px) scale(0.9);
}

.cyber-fade-leave-to {
	opacity: 0;
	transform: translateY(-20px) scale(0.9);
}

.cyber-fade-move {
	transition: transform 0.5s ease;
}
</style>
