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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useStore } from '@/stores'
import { exportImage } from '@/utils'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
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

// 新增配置参数
const config = ref({
  outputWidth: 560,
  scale: 2,
  margins: {
    top: 50,
    right: 40,
    bottom: 100,
    left: 40,
  },
  sliceOptions: {
    enable: true,
    sliceHeight: 720,
    redundancyPercent: 5,
  },
  zipDownload: true,
})

// 在现有代码中添加以下工具函数
function getContentSnippet(content: string, maxLength: number) {
  // 移除 HTML 标签并截取纯文本
  const text = content.replace(/<[^>]+>/g, ``).trim()
  // 过滤非法字符并截取
  return (text.slice(0, maxLength) || `untitled`)
    .replace(/[\\/:*?"<>|]/g, ``)
    .replace(/\s+/g, `_`)
}

function getTimestamp() {
  const now = new Date()
  return now.toISOString()
    .replace(/T/, `_`)
    .replace(/\..+/, ``)
    .replace(/:/g, ``)
}

function getFileName(type: `slice` | `full` | `zip`, totalSlices?: number) {
  const content = output.value // 从 store 获取的原始内容
  const baseName = type === `slice`
    ? getContentSnippet(content, 12)
    : getContentSnippet(content, 24)

  const timestamp = getTimestamp() // 格式：2024-05-20_153015

  switch (type) {
    case `slice`:
      return `${baseName}_[${totalSlices}片]_${timestamp}`
    case `full`:
      return `${baseName}_${timestamp}`
    case `zip`:
      return `${baseName}_[${totalSlices}片]_${timestamp}`
  }
}

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
      config.value.margins,
      config.value.outputWidth,
      config.value.sliceOptions,
      config.value.scale,
    )

    // 修改下载处理部分
    if (config.value.zipDownload && Array.isArray(urls)) {
      // ZIP 打包逻辑
      const zip = new JSZip()
      const zipName = getFileName(`zip`, urls.length)
      const folderName = zipName.replace(/\.zip$/, ``) // 去除扩展名
      const imgFolder = zip.folder(folderName) // 使用动态文件夹名称

      // 并行获取所有图片 Blob
      const blobPromises = urls.map(async (url, _index) => {
        const response = await fetch(url)
        return await response.blob()
      })

      const blobs = await Promise.all(blobPromises)

      // 修改分片文件命名逻辑
      blobs.forEach((blob, _index) => {
        const index = _index + 1
        const paddedIndex = index.toString().padStart(2, `0`) // 补零到两位
        const fileName = `${paddedIndex}_${getContentSnippet(output.value, 12)}_part${index}.png`
        imgFolder?.file(fileName, blob)
      })

      // 生成 ZIP 文件
      const zipBlob = await zip.generateAsync({ type: `blob` })
      saveAs(zipBlob, `${zipName}.zip`)
    }
    else {
      // 原有单文件下载逻辑
      if (Array.isArray(urls)) {
        urls.forEach((url, index) => {
          const paddedIndex = (index + 1).toString().padStart(2, `0`) // 补零到两位
          const fileName = `${paddedIndex}_${getFileName(`slice`, urls.length)}_part${index + 1}.png`
          const link = document.createElement(`a`)
          link.download = fileName
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
      }
      else {
        const fileName = `${getFileName(`full`)}.png`
        const link = document.createElement(`a`)
        link.download = fileName
        link.href = urls
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    emit(`download`)
    emit(`update:open`, false)
  }
  catch (error) {
    console.error(`导出失败:`, error)
    // 使用项目中的通知组件替代 alert，或添加 ESLint 例外注释
    // eslint-disable-next-line no-alert
    alert(`导出失败：${error instanceof Error ? error.message : `未知错误`}`)
  }
  finally {
    isGenerating.value = false
    // 增加空值检查
    if (outputWrapper.value) {
      outputWrapper.value.style.display = `none`
    }
  }
}
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent class="sm:max-w-[800px]">
      <AlertDialogHeader>
        <AlertDialogTitle>导出配置</AlertDialogTitle>
        <AlertDialogDescription>
          调整图片导出参数以获得最佳效果
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- 参数配置区域 -->
      <div class="space-y-4">
        <!-- 基础配置调整为两列 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>输出宽度 (px)</Label>
            <Input v-model.number="config.outputWidth" type="number" min="400" max="1200" />
          </div>
          <div class="space-y-2">
            <Label>放大倍数</Label>
            <Input
              v-model.number="config.scale"
              type="number"
              min="1"
              max="4"
              step="0.5"
            />
          </div>
        </div>

        <!-- 边距配置 -->
        <div class="grid grid-cols-4 gap-2">
          <div class="space-y-2">
            <Label>上边距</Label>
            <Input v-model.number="config.margins.top" type="number" />
          </div>
          <div class="space-y-2">
            <Label>右边距</Label>
            <Input v-model.number="config.margins.right" type="number" />
          </div>
          <div class="space-y-2">
            <Label>下边距</Label>
            <Input v-model.number="config.margins.bottom" type="number" />
          </div>
          <div class="space-y-2">
            <Label>左边距</Label>
            <Input v-model.number="config.margins.left" type="number" />
          </div>
        </div>

        <!-- 分片配置调整为一行三列 -->
        <div class="flex flex-wrap items-end gap-4">
          <!-- 启用开关 -->
          <div class="min-w-[200px] flex flex-1 items-center gap-2">
            <Switch v-model:checked="config.sliceOptions.enable" />
            <Label>启用分片导出</Label>
          </div>

          <!-- 分片高度 -->
          <div class="space-y-2 min-w-[200px] flex-1">
            <Label>分片高度 (px)</Label>
            <Input
              v-model.number="config.sliceOptions.sliceHeight"
              type="number"
              min="400"
              max="2000"
              :disabled="!config.sliceOptions.enable"
            />
          </div>

          <!-- 分片冗余 -->
          <div class="space-y-2 min-w-[200px] flex-1">
            <Label>分片冗余 (%)</Label>
            <Input
              v-model.number="config.sliceOptions.redundancyPercent"
              type="number"
              min="1"
              max="20"
              :disabled="!config.sliceOptions.enable"
            />
          </div>
        </div>
      </div>

      <!-- 预览区域保持不变 -->
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
