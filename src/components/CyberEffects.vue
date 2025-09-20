<template>
	<div>
		<!-- 扫描线效果 -->
		<div class="cyber-scanline"></div>
		
		<!-- 粒子容器 -->
		<div class="cyber-particles" ref="particlesContainer"></div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const particlesContainer = ref<HTMLElement>()
let animationId: number | null = null

const createParticle = () => {
	if (!particlesContainer.value) return
	
	const particle = document.createElement('div')
	particle.className = 'cyber-particle'
	
	// 随机位置
	particle.style.left = Math.random() * 100 + '%'
	particle.style.animationDuration = (Math.random() * 5 + 5) + 's'
	particle.style.animationDelay = Math.random() * 2 + 's'
	
	// 随机颜色
	const colors = ['#00ff88', '#ff0080', '#00d4ff']
	particle.style.background = colors[Math.floor(Math.random() * colors.length)]
	
	particlesContainer.value.appendChild(particle)
	
	// 动画结束后移除粒子
	setTimeout(() => {
		if (particle.parentNode) {
			particle.parentNode.removeChild(particle)
		}
	}, 10000)
}

const startParticleSystem = () => {
	const createParticleInterval = () => {
		createParticle()
		animationId = setTimeout(createParticleInterval, Math.random() * 2000 + 1000)
	}
	createParticleInterval()
}

const stopParticleSystem = () => {
	if (animationId) {
		clearTimeout(animationId)
		animationId = null
	}
}

onMounted(() => {
	startParticleSystem()
})

onUnmounted(() => {
	stopParticleSystem()
})
</script>

<style scoped>
/* 样式已在全局CSS中定义 */
</style>
