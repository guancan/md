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

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'download': []
}>()
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
        <div id="preview-container">
          <!-- 预览内容将在这里动态插入 -->
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('update:open', false)">
          取消
        </AlertDialogCancel>
        <AlertDialogAction @click="emit('download')">
          下载图片
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template> 