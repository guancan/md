<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="backdrop-blur-sm fixed inset-0 z-[9998] bg-black/50"
    >
      <div class="fixed bottom-[100px] right-[100px] text-white">
        <div class="text-gray-300">
          正在保存图片，请勿操作或关闭窗口
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
