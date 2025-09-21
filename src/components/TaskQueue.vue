<template>
  <div class="fixed bottom-4 right-4 z-50">
    <!-- 任务队列按钮 -->
    <div 
      v-if="tasks.length > 0"
      class="cyber-card p-4 max-w-sm cursor-pointer transition-all duration-300 hover:scale-105"
      :class="{ 'animate-pulse': isUploading }"
      @click="toggleQueue"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <font-awesome-icon 
            :icon="isUploading ? faSpinner : faCloudUploadAlt" 
            :class="{ 'animate-spin': isUploading }"
            class="text-cyber-primary mr-2" 
          />
          <span class="cyber-text font-bold text-sm">
            {{ isUploading ? '上传中...' : '待上传任务' }}
          </span>
        </div>
        <div class="cyber-badge">{{ tasks.length }}</div>
      </div>
      
      <!-- 总体进度条 -->
      <div v-if="isUploading && overallProgress > 0" class="mb-2">
        <div class="flex justify-between text-xs cyber-text-dim mb-1">
          <span>总进度</span>
          <span>{{ Math.round(overallProgress) }}%</span>
        </div>
        <div class="cyber-progress-bar">
          <div 
            class="cyber-progress-fill" 
            :style="{ width: overallProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- 当前上传文件信息 -->
      <div v-if="isUploading && currentUploadingFile" class="text-xs cyber-text-dim">
        <div class="truncate">{{ currentUploadingFile.name }}</div>
        <div v-if="currentFileProgress > 0" class="flex justify-between items-center mt-1">
          <div class="cyber-progress-bar flex-1 mr-2">
            <div 
              class="cyber-progress-fill" 
              :style="{ width: currentFileProgress + '%' }"
            ></div>
          </div>
          <span>{{ Math.round(currentFileProgress) }}%</span>
        </div>
      </div>
    </div>

    <!-- 展开的任务队列 -->
    <div 
      v-if="showQueue && tasks.length > 0"
      class="cyber-card p-4 max-w-md mb-4 max-h-96 overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="cyber-text font-bold">上传任务队列</h3>
        <div class="flex items-center space-x-2">
          <el-button 
            v-if="!isUploading && tasks.length > 0"
            type="primary" 
            size="small"
            @click="startBatchUpload"
            class="cyber-btn-primary"
          >
            <font-awesome-icon :icon="faUpload" class="mr-1" />
            开始上传
          </el-button>
          <el-button 
            size="small"
            @click="clearAllTasks"
            :disabled="isUploading"
            class="cyber-btn-secondary"
          >
            <font-awesome-icon :icon="faTrash" class="mr-1" />
            清空
          </el-button>
          <el-button 
            size="small"
            @click="toggleQueue"
            class="cyber-btn"
          >
            <font-awesome-icon :icon="faTimes" />
          </el-button>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="space-y-2">
        <div 
          v-for="(task, index) in tasks" 
          :key="task.id"
          class="flex items-center justify-between p-3 bg-cyber-bg-dark rounded border border-cyber-border"
          :class="{
            'border-cyber-primary bg-cyber-primary/10': task.status === 'uploading',
            'border-cyber-accent bg-cyber-accent/10': task.status === 'completed',
            'border-cyber-secondary bg-cyber-secondary/10': task.status === 'failed'
          }"
        >
          <div class="flex items-center flex-1 min-w-0">
            <font-awesome-icon 
              :icon="getTaskIcon(task.status)" 
              :class="getTaskIconClass(task.status)"
              class="mr-2 flex-shrink-0"
            />
            <div class="min-w-0 flex-1">
              <div class="cyber-text text-sm truncate">{{ task.file.name }}</div>
              <div class="cyber-text-dim text-xs">
                {{ formatBytes(task.file.size) }} → {{ getDisplayPath(task.targetFolder) }}
              </div>
              <!-- 单个任务进度条 -->
              <div v-if="task.status === 'uploading' && task.progress !== undefined" class="mt-1">
                <div class="cyber-progress-bar">
                  <div 
                    class="cyber-progress-fill" 
                    :style="{ width: task.progress + '%' }"
                  ></div>
                </div>
                <div class="text-xs cyber-text-dim mt-1">{{ Math.round(task.progress) }}%</div>
              </div>
            </div>
          </div>
          
          <el-button 
            v-if="task.status === 'pending'"
            size="small"
            type="danger"
            @click="removeTask(index)"
            :disabled="isUploading"
            class="ml-2 flex-shrink-0"
          >
            <font-awesome-icon :icon="faTrash" />
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faCloudUploadAlt, 
  faSpinner, 
  faUpload, 
  faTrash, 
  faTimes,
  faFile,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import formatBytes from '../utils/format-bytes'
import { requestUploadImages } from '../utils/request'

export interface UploadTask {
  id: string
  file: File
  targetFolder: string
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  progress?: number
  error?: string
}

const props = defineProps<{
  tasks: UploadTask[]
  currentFolder: string
}>()

const emit = defineEmits<{
  updateTasks: [tasks: UploadTask[]]
  uploadComplete: []
}>()

const showQueue = ref(false)
const isUploading = ref(false)
const overallProgress = ref(0)
const currentUploadingFile = ref<File | null>(null)
const currentFileProgress = ref(0)

// 计算总体上传进度
const completedTasks = computed(() => 
  props.tasks.filter(task => task.status === 'completed').length
)

const failedTasks = computed(() => 
  props.tasks.filter(task => task.status === 'failed').length
)

// 监听任务变化来计算总体进度
watch(() => props.tasks, (newTasks) => {
  if (isUploading.value && newTasks.length > 0) {
    const completed = newTasks.filter(task => task.status === 'completed').length
    const failed = newTasks.filter(task => task.status === 'failed').length
    const total = newTasks.length
    
    overallProgress.value = ((completed + failed) / total) * 100
  }
}, { deep: true })

const toggleQueue = () => {
  showQueue.value = !showQueue.value
}

const removeTask = (index: number) => {
  const newTasks = [...props.tasks]
  newTasks.splice(index, 1)
  emit('updateTasks', newTasks)
}

const clearAllTasks = () => {
  if (isUploading.value) return
  emit('updateTasks', [])
  showQueue.value = false
}

const getTaskIcon = (status: string) => {
  switch (status) {
    case 'uploading': return faSpinner
    case 'completed': return faCheck
    case 'failed': return faExclamationTriangle
    default: return faFile
  }
}

const getTaskIconClass = (status: string) => {
  switch (status) {
    case 'uploading': return 'text-cyber-primary animate-spin'
    case 'completed': return 'text-cyber-accent'
    case 'failed': return 'text-cyber-secondary'
    default: return 'text-cyber-text-dim'
  }
}

// 批量上传功能
const startBatchUpload = async () => {
  if (isUploading.value || props.tasks.length === 0) return
  
  isUploading.value = true
  overallProgress.value = 0
  currentFileProgress.value = 0
  
  const newTasks = [...props.tasks]
  
  try {
    for (let i = 0; i < newTasks.length; i++) {
      const task = newTasks[i]
      if (task.status !== 'pending') continue
      
      task.status = 'uploading'
      task.progress = 0
      currentUploadingFile.value = task.file
      currentFileProgress.value = 0
      
      // 更新任务状态
      emit('updateTasks', [...newTasks])
      
      try {
        // 创建FormData
        const formData = new FormData()
        formData.append('files', task.file)
        formData.append('folder', task.targetFolder)
        
        // 模拟进度更新（因为requestUploadImages可能不支持进度回调）
        const progressInterval = setInterval(() => {
          if (task.progress !== undefined && task.progress < 90) {
            task.progress += Math.random() * 20
            currentFileProgress.value = task.progress
            emit('updateTasks', [...newTasks])
          }
        }, 200)
        
        // 执行上传
        await requestUploadImages(formData)
        
        // 清除进度模拟
        clearInterval(progressInterval)
        
        // 标记完成
        task.status = 'completed'
        task.progress = 100
        currentFileProgress.value = 100
        
        emit('updateTasks', [...newTasks])
        
        // 短暂延迟让用户看到完成状态
        await new Promise(resolve => setTimeout(resolve, 300))
        
      } catch (error) {
        task.status = 'failed'
        task.error = String(error)
        emit('updateTasks', [...newTasks])
        console.error('Upload failed for file:', task.file.name, error)
      }
    }
    
    const completedCount = newTasks.filter(task => task.status === 'completed').length
    const failedCount = newTasks.filter(task => task.status === 'failed').length
    
    if (completedCount > 0) {
      ElMessage.success(`🎉 成功上传 ${completedCount} 个文件`)
    }
    
    if (failedCount > 0) {
      ElMessage.error(`❌ ${failedCount} 个文件上传失败`)
    }
    
    // 通知父组件上传完成
    emit('uploadComplete')
    
    // 延迟一段时间后自动清除已完成的任务
    setTimeout(() => {
      const remainingTasks = newTasks.filter(task => task.status === 'pending' || task.status === 'failed')
      emit('updateTasks', remainingTasks)
      
      if (remainingTasks.length === 0) {
        showQueue.value = false
      }
    }, 2000)
    
  } finally {
    isUploading.value = false
    currentUploadingFile.value = null
    currentFileProgress.value = 0
    overallProgress.value = 0
  }
}

// 路径显示格式化
const getDisplayPath = (path: string) => {
  if (path === '/') {
    return '根目录'
  }
  
  // 标准化路径显示
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath
  
  return `/${normalizedPath}/`
}

// 暴露方法给父组件
defineExpose({
  startBatchUpload,
  clearAllTasks,
  toggleQueue
})
</script>

<style scoped>
.cyber-badge {
  background: var(--cyber-primary);
  color: var(--cyber-bg-dark);
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: bold;
}

.cyber-progress-bar {
  width: 100%;
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 9999px;
  height: 8px;
  overflow: hidden;
}

.cyber-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyber-primary), var(--cyber-accent));
  transition: all 0.3s ease;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
