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
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'download': []
}>()

const store = useStore()
const { primaryColor } = storeToRefs(store)

// 存储预览图片的 URL
const previewUrl = ref('')

// 监听弹窗打开状态，生成预览图
watch(() => props.open, async (newVal) => {
  if (newVal) {
    try {
      previewUrl.value = await exportImage(primaryColor.value)
    } catch (error) {
      console.error('生成预览图失败:', error)
      // 这里可以添加错误提示
    }
  }
})

// 处理下载
async function handleDownload() {
  if (!previewUrl.value) return
  
  const link = document.createElement('a')
  link.download = 'content.png'
  link.href = previewUrl.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  emit('download')
  emit('update:open', false)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent class="sm:max-w-[800px]">
      <AlertDialogHeader>
        <AlertDialogTitle>导出图片预览</AlertDialogTitle>
        <AlertDialogDescription>
          请确认以下预览内容是否符合预期
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- 预览区域 -->
      <div class="my-4 max-h-[60vh] overflow-auto border rounded-md p-4">
        <div v-if="previewUrl" class="flex justify-center">
          <img :src="previewUrl" alt="预览图片" class="max-w-full" />
        </div>
        <div v-else class="text-center py-4 text-gray-500">
          正在生成预览...
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