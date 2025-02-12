<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStore } from '@/stores'
import { exportImage } from '@/utils'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits({
  'update:open': (_value: boolean) => true,
  'download': () => true,
})

const store = useStore()
const { primaryColor, isDark, output } = storeToRefs(store)
const isGenerating = ref(false)

// 与主编辑器一致的预览容器引用
const outputWrapper = ref<HTMLElement | null>(null)

// 修改后的下载处理函数
async function handleDownload() {
  if (!outputWrapper.value)
    return

  try {
    isGenerating.value = true

    // 显示预览容器并准备布局
    const container = outputWrapper.value
    container.style.display = `block`
    await nextTick()

    // 等待布局稳定
    await new Promise(resolve => requestAnimationFrame(resolve))
    void container.offsetHeight // 强制重绘

    // 执行导出
    const urls = await exportImage(
      primaryColor.value,
      isDark.value ? `#191919` : `#ffffff`,
      { top: 20, right: 20, bottom: 100, left: 20 },
      560,
      { enable: true }, // 默认分片配置
    )

    // 处理下载
    if (Array.isArray(urls)) {
      urls.forEach((url, index) => {
        const link = document.createElement(`a`)
        link.download = `md-content-${index + 1}-${new Date().getTime()}.png`
        link.href = url
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }
    else {
      const link = document.createElement(`a`)
      link.download = `md-content-${new Date().getTime()}.png`
      link.href = urls
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    emit(`download`)
    emit(`update:open`, false)
  }
  catch (error) {
    console.error(`导出失败:`, error)
  }
  finally {
    isGenerating.value = false
    // 隐藏预览容器
    outputWrapper.value.style.display = `none`
  }
}
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent class="sm:max-w-[800px]">
      <AlertDialogHeader>
        <AlertDialogTitle>导出预览</AlertDialogTitle>
        <AlertDialogDescription>
          请确认以下内容是否符合预期
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- 与主编辑器一致的预览结构 -->
      <div class="my-4 max-h-[60vh] overflow-hidden border rounded-md p-4">
        <div
          id="output-wrapper"
          ref="outputWrapper"
          class="relative h-full"
          :class="{ output_night: isDark }"
        >
          <div class="preview h-full overflow-auto">
            <!-- 实时渲染内容 -->
            <section
              v-if="output"
              id="output"
              class="prose dark:prose-invert max-w-none p-4"
              v-html="output"
            />

            <!-- 加载状态 -->
            <div v-if="isGenerating" class="loading-mask">
              <div class="loading-mask-box">
                <div class="loading__img" />
                <span>正在生成预览...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('update:open', false)">
          取消
        </AlertDialogCancel>
        <AlertDialogAction @click="handleDownload">
          下载图片
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style lang="postcss" scoped>
.loading-mask {
  @apply absolute inset-0 flex items-center justify-center bg-background/90;

  .loading-mask-box {
    @apply flex flex-col items-center gap-2;

    .loading__img {
      @apply h-12 w-12 animate-pulse bg-[url('@/assets/images/favicon.png')] bg-contain bg-no-repeat opacity-75;
    }

    span {
      @apply text-sm text-muted-foreground;
    }
  }
}

.preview {
  &::-webkit-scrollbar {
    @apply h-2 w-2;
  }

  &::-webkit-scrollbar-thumb {
    @apply rounded-full bg-border;
  }
}
</style>
