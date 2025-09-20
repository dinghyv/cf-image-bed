<template>
  <div class="mx-auto max-w-6xl my-4 px-4 relative">
    <!-- 赛博朋克认证卡片 -->
    <div class="cyber-card mx-auto max-w-2xl mt-20 p-8">
      <!-- 标题区域 -->
      <div class="text-center mb-8">
        <div class="cyber-text text-3xl font-bold mb-4 flex items-center justify-center">
          <font-awesome-icon :icon="faShieldAlt" class="mr-3 text-cyber-primary" />
          系统认证
        </div>
        <div class="cyber-text-dim text-sm">
          请输入您的认证Token以访问图床管理系统
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="space-y-6">
        <!-- Token输入框 -->
        <div>
          <label class="block text-sm font-medium cyber-text mb-3 flex items-center">
            <font-awesome-icon :icon="faKey" class="mr-2 text-cyber-accent" />
            认证Token
          </label>
          <div class="relative">
            <input 
              v-model="token" 
              type="password"
              class="cyber-input w-full h-14 text-lg font-mono" 
              placeholder="请输入认证Token"
              @keyup.enter="saveToken"
            />
            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyber-primary">
              <font-awesome-icon :icon="faLock" />
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="pt-4">
          <div 
            class="cyber-btn-active w-full h-14 cursor-pointer flex items-center justify-center font-bold text-lg" 
            :class="{ 'area-disabled': loading }" 
            @click="saveToken"
          >
            <font-awesome-icon v-if="!loading" :icon="faSave" class="mr-3" />
            <font-awesome-icon v-else :icon="faSpinner" class="mr-3 animate-cyber-spin" />
            {{ loading ? '验证中...' : '保存并验证' }}
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="text-center">
          <div class="cyber-text-dim text-xs">
            <font-awesome-icon :icon="faInfoCircle" class="mr-1" />
            请确保Token有效，系统将自动验证并跳转到管理页面
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElInput, ElButton, ElMessage } from 'element-plus'
import storage from '../utils/storage'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkToken } from '../utils/request'
import { faShieldAlt, faKey, faLock, faSave, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
const token = ref('')
const loading = ref(false)
const router = useRouter()
const saveToken = () => {
  loading.value = true
  if (!token.value) {
    loading.value = false
    ElMessage.error('请输入token')
    return
  }
  checkToken({
    token: token.value
  }).then(res => {
    if (res) {
      // 检测token是否有效
      storage.local.set('auth-token', token.value)
      router.push('/')
    } else {
      ElMessage.error('Token无效')
    }
  }).finally(() => {
    loading.value = false
  })

}
</script>

<style scoped>

</style>
