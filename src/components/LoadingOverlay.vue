<template>
	<div
		v-if="props.loading"
		class="backdrop-blur-sm left-0 top-0 h-full w-full absolute flex items-center justify-center z-50 cursor-not-allowed bg-cyber-dark/80"
	>
		<div class="text-center">
			<div class="relative">
				<font-awesome-icon :icon="faSpinner" class="text-4xl text-cyber-primary animate-cyber-spin" />
				<div class="absolute inset-0 text-cyber-primary animate-cyber-spin" style="animation-delay: 0.1s;">
					<font-awesome-icon :icon="faSpinner" class="text-4xl opacity-50" />
				</div>
			</div>
			<div class="mt-4 cyber-text text-sm font-mono">
				处理中...
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

const props = defineProps<{
	loading: boolean
}>()
</script>
