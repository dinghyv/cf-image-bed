<template>
	<el-config-provider :locale="zhCn">
		<div class="w-full h-screen overflow-x-hidden overflow-y-auto font-cyber flex flex-col">
			<!-- 赛博朋克导航栏 -->
			<div class="cyber-nav w-full h-16 sticky left-0 top-0 z-10 flex-shrink-0">
				<div class="mx-auto max-w-6xl px-4 h-full flex items-center">
					<!-- Logo区域 -->
					<div class="flex items-center">
						<div class="relative">
							<img src="/favicon.png" class="w-8 h-8 block mr-3 filter brightness-0 invert" />
							<div class="absolute -inset-1 bg-cyber-primary opacity-20 blur-sm"></div>
						</div>
						<div class="text-lg cyber-text font-bold tracking-wider">
							{{ appName }}
						</div>
					</div>
					
					<div class="flex-1"></div>

					<!-- 导航按钮 -->
					<div class="flex items-center space-x-2">
						<div
							:class="{
								'cyber-btn-active': $route.path === '/up',
								'cyber-btn': $route.path !== '/up'
							}"
							class="px-4 py-2 rounded-md text-sm cursor-pointer"
							@click="router.push('/up')"
						>
							<font-awesome-icon :icon="faUpload" class="mr-2" />
							<span class="hidden md:inline-block">上传</span>
						</div>

						<div
							:class="{
								'cyber-btn-active': $route.path === '/',
								'cyber-btn': $route.path !== '/'
							}"
							class="px-4 py-2 rounded-md text-sm cursor-pointer"
							@click="router.push('/')"
						>
							<font-awesome-icon :icon="faCog" class="mr-2" />
							<span class="hidden md:inline-block">管理</span>
						</div>
					</div>
				</div>
			</div>

			<!-- 主内容区域 -->
			<div class="flex-1 overflow-auto relative">
				<el-scrollbar>
					<router-view />
					<!-- 赛博朋克特效 -->
					<cyber-effects />
				</el-scrollbar>
			</div>

			<!-- 赛博朋克页脚 -->
			<div class="w-full h-16 flex items-center justify-center cyber-text-dim text-sm border-t border-cyber-border flex-shrink-0">
				<div class="flex items-center space-x-2">
					<span>Powered by</span>
					<a :href="repoLink" target="_blank" class="cyber-text hover:text-cyber-primary transition-colors duration-300 underline decoration-cyber-primary">
						{{ repoName }}
					</a>
					<span class="text-cyber-primary">|</span>
					<span class="animate-cyber-pulse">⚡ CYBER MODE ⚡</span>
				</div>
			</div>
		</div>
	</el-config-provider>
</template>

<script setup lang="ts">
import { faCog, faUpload } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'vue-router'
import { ElScrollbar, ElConfigProvider } from 'element-plus'
import zhCn from "element-plus/es/locale/lang/zh-cn"
import CyberEffects from './components/CyberEffects.vue'

const repoLink = 'https://www.antwen.com'
const repoName = 'Antwen'
const appName = '图床管理工具'

document.title = appName

const router = useRouter()
</script>
