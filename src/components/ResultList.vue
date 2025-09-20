<template>
  <div class="cyber-card p-6">
    <div class="flex items-center mb-6">
      <font-awesome-icon :icon="faCheckCircle" class="text-cyber-primary mr-3 text-2xl" />
      <h3 class="cyber-text text-xl font-bold">上传结果</h3>
      <div class="ml-auto text-cyber-accent text-sm font-mono">
        共 {{ imageList.length }} 张图片
      </div>
    </div>

    <el-tabs v-model="activeName" class="cyber-tabs" @tab-click="handleClick">
      <el-tab-pane name="first">
        <template #label>
          <span class="flex items-center">
            <font-awesome-icon :icon="faEye" class="mr-2" />
            预览
          </span>
        </template>
        <image-item :image-list="imageList" ref="imageItem" />
      </el-tab-pane>
      
      <el-tab-pane name="second">
        <template #label>
          <span class="flex items-center">
            <font-awesome-icon :icon="faCode" class="mr-2" />
            HTML
          </span>
        </template>
        <div class="cyber-input p-4 max-w-full overflow-auto whitespace-pre font-mono text-sm cursor-pointer hover:border-cyber-primary transition-colors" @click="copyLink">
          {{ htmlLinks() }}
        </div>
      </el-tab-pane>
      
      <el-tab-pane name="third">
        <template #label>
          <span class="flex items-center">
            <font-awesome-icon :icon="faFileText" class="mr-2" />
            Markdown
          </span>
        </template>
        <div class="cyber-input p-4 max-w-full overflow-auto whitespace-pre font-mono text-sm cursor-pointer hover:border-cyber-primary transition-colors" @click="copyLink">
          {{ markdownLinks() }}
        </div>
      </el-tab-pane>
      
      <el-tab-pane name="fourth">
        <template #label>
          <span class="flex items-center">
            <font-awesome-icon :icon="faLink" class="mr-2" />
            链接
          </span>
        </template>
        <div class="cyber-input p-4 max-w-full overflow-auto whitespace-pre font-mono text-sm cursor-pointer hover:border-cyber-primary transition-colors" @click="copyLink">
          {{ viewLinks() }}
        </div>
      </el-tab-pane>
      
      <el-tab-pane name="fifth">
        <template #label>
          <span class="flex items-center">
            <font-awesome-icon :icon="faImage" class="mr-2" />
            WebP
          </span>
        </template>
        <div class="cyber-input p-4 max-w-full overflow-auto whitespace-pre font-mono text-sm cursor-pointer hover:border-cyber-primary transition-colors" @click="copyLink">
          {{ webpLinks() }}
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ElCard, ElImage, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { ref } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import ImageItem from '../components/ImageItem.vue'
import type { ImgItem } from '../utils/types'
import copy from 'copy-to-clipboard'
import { faCheckCircle, faEye, faCode, faFileText, faLink } from '@fortawesome/free-solid-svg-icons'
const props = defineProps<{
  imageList: ImgItem[]
}>()

const activeName = ref('first')
const htmlLinks = () => {
  let text = ''
  const length = props.imageList.length
  for(let i = 0; i < length; i++) {
    const it = props.imageList[i]
    text += `<a href="${it.url}" target="_blank"><img src="${it.url}"></a>\n`
  }
  return text
}
const viewLinks = () => {
  let text = ''
  const length = props.imageList.length
  for(let i = 0; i < length; i++) {
    const it = props.imageList[i]
    text += `${it.url}\n`
  }
  return text
}
const markdownLinks = () => {
  let text = ''
  const length = props.imageList.length
  for(let i = 0; i < length; i++) {
    const it = props.imageList[i]
    text += `![${it.filename}](${it.url})\n`
  }
  return text
}
const webpLinks = () => {
  let text = ''
  const length = props.imageList.length
  for(let i = 0; i < length; i++) {
    const it = props.imageList[i]
    text += `${it.webpUrl}\n`
  }
  return text
}
const copyLink = (event: any) => {
  // console.log(event.target.innerText)
  const res = copy(event.target.innerText)
  if (res) {
    ElMessage.success('链接复制成功')
  } else {
    ElMessage.success('链接复制失败')
  }
}
const handleClick = (tab: TabsPaneContext, event: Event) => {
  // console.log(tab, event)
}
</script>

<style scoped>
.cyber-tabs {
  --el-tabs-header-height: 48px;
}

.cyber-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
  background: var(--cyber-bg-card);
  border: 1px solid var(--cyber-border);
  border-radius: 8px;
  padding: 4px;
}

.cyber-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.cyber-tabs :deep(.el-tabs__nav) {
  border: none;
}

.cyber-tabs :deep(.el-tabs__item) {
  color: var(--cyber-text-dim);
  border: none;
  background: transparent;
  border-radius: 4px;
  margin: 0 2px;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.cyber-tabs :deep(.el-tabs__item:hover) {
  color: var(--cyber-primary);
  background: rgba(0, 255, 136, 0.1);
}

.cyber-tabs :deep(.el-tabs__item.is-active) {
  color: var(--cyber-primary);
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid var(--cyber-primary);
}

.cyber-tabs :deep(.el-tabs__content) {
  padding: 0;
}

.cyber-tabs :deep(.el-tab-pane) {
  color: var(--cyber-text);
}
</style>
