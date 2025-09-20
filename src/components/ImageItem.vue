<template>
  <div class="space-y-4">
    <div class="cyber-card p-6" v-for="it in imageList" :key="it.key">
      <!-- 卡片头部 -->
      <div class="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div class="flex items-center">
          <font-awesome-icon :icon="faImage" class="text-cyber-primary mr-3" />
          <span class="cyber-text text-lg font-bold">{{ it.filename }}</span>
        </div>
        <div class="text-cyber-accent text-sm font-mono">
          已上传
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="lg:flex items-start justify-start gap-6">
        <!-- 图片预览 -->
        <div class="flex-shrink-0">
          <el-image
              class="block w-48 h-48 rounded-lg overflow-hidden border border-cyber-border hover:border-cyber-primary transition-colors"
              :src="it.url"
              fit="cover"
              hide-on-click-modal
              lazy
              @error="imageError = true"
              @load="loading = false"
              :preview-src-list="[it.url]"
          />
        </div>

        <!-- 链接列表 -->
        <div class="flex-1 min-w-0">
          <div class="space-y-4">
            <!-- 直接链接 -->
            <div class="w-full">
              <label class="block text-sm font-medium cyber-text mb-2 flex items-center">
                <font-awesome-icon :icon="faLink" class="mr-2 text-cyber-primary" />
                Direct Link
              </label>
              <div class="relative">
                <input 
                  :value="it.copyUrl" 
                  class="cyber-input w-full cursor-pointer pr-10" 
                  readonly 
                  @click="copyLink" 
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-primary">
                  <font-awesome-icon :icon="faCopy" />
                </div>
              </div>
            </div>

            <!-- WebP链接 -->
            <div class="w-full">
              <label class="block text-sm font-medium cyber-text mb-2 flex items-center">
                <font-awesome-icon :icon="faImage" class="mr-2 text-cyber-accent" />
                WebP Link
              </label>
              <div class="relative">
                <input 
                  :value="it.webpUrl" 
                  class="cyber-input w-full cursor-pointer pr-10" 
                  readonly 
                  @click="copyLink" 
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-primary">
                  <font-awesome-icon :icon="faCopy" />
                </div>
              </div>
            </div>

            <!-- HTML链接 (Direct) -->
            <div class="w-full">
              <label class="block text-sm font-medium cyber-text mb-2 flex items-center">
                <font-awesome-icon :icon="faCode" class="mr-2 text-cyber-accent" />
                HTML (Direct)
              </label>
              <div class="relative">
                <input 
                  :value="htmlLink(it.copyUrl, it.filename)" 
                  class="cyber-input w-full cursor-pointer pr-10" 
                  readonly 
                  @click="copyLink" 
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-primary">
                  <font-awesome-icon :icon="faCopy" />
                </div>
              </div>
            </div>

            <!-- HTML链接 (WebP) -->
            <div class="w-full">
              <label class="block text-sm font-medium cyber-text mb-2 flex items-center">
                <font-awesome-icon :icon="faCode" class="mr-2 text-cyber-accent" />
                HTML (WebP)
              </label>
              <div class="relative">
                <input 
                  :value="htmlLink(it.webpUrl, it.filename)" 
                  class="cyber-input w-full cursor-pointer pr-10" 
                  readonly 
                  @click="copyLink" 
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-primary">
                  <font-awesome-icon :icon="faCopy" />
                </div>
              </div>
            </div>

            <!-- Markdown链接 (Direct) -->
            <div class="w-full">
              <label class="block text-sm font-medium cyber-text mb-2 flex items-center">
                <font-awesome-icon :icon="faFileText" class="mr-2 text-cyber-secondary" />
                Markdown (Direct)
              </label>
              <div class="relative">
                <input 
                  :value="markdownLink(it.copyUrl, it.filename)" 
                  class="cyber-input w-full cursor-pointer pr-10" 
                  readonly 
                  @click="copyLink" 
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-primary">
                  <font-awesome-icon :icon="faCopy" />
                </div>
              </div>
            </div>

            <!-- Markdown链接 (WebP) -->
            <div class="w-full">
              <label class="block text-sm font-medium cyber-text mb-2 flex items-center">
                <font-awesome-icon :icon="faFileText" class="mr-2 text-cyber-secondary" />
                Markdown (WebP)
              </label>
              <div class="relative">
                <input 
                  :value="markdownLink(it.webpUrl, it.filename)" 
                  class="cyber-input w-full cursor-pointer pr-10" 
                  readonly 
                  @click="copyLink" 
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-primary">
                  <font-awesome-icon :icon="faCopy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImgItem } from '../utils/types'
import copy from 'copy-to-clipboard'
import { ElCard, ElImage, ElMessage } from 'element-plus'
import { ref } from 'vue'
import { faImage, faCode, faLink, faCopy, faFileText } from '@fortawesome/free-solid-svg-icons'
const props = defineProps<{
  imageList: ImgItem[]
}>()
const imageError = ref(false)
const loading = ref(false)
const markdownLink = (link: String, filename: String) => {
  return `![${filename}](${link})`
}
const htmlLink = (link: String, filename: String) => {
  return `<a href="${link}" target="_blank" title="${filename}"><img src="${link}"></a>`
}

const copyLink = (event: any) => {
  // console.log(event.target.value)
  const res = copy(event.target.value)
  if (res) {
    ElMessage.success('链接复制成功')
  } else {
    ElMessage.success('链接复制失败')
  }
}
</script>

<style scoped>
/* 移除原有的样式，使用新的赛博朋克样式 */
</style>
