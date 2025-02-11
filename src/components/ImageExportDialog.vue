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
import { Button } from '@/components/ui/button'

const props = defineProps<{
  isOpen: boolean
  imageUrl: string
}>()

const emit = defineEmits<{
  (e: `update:isOpen`, value: boolean): void
}>()

function downloadImage() {
  const link = document.createElement(`a`)
  link.download = `content-${Date.now()}.png`
  link.href = props.imageUrl
  link.click()
}
</script>

<template>
  <AlertDialog :open="isOpen" @update:open="emit('update:isOpen', $event)">
    <AlertDialogContent class="max-w-3xl">
      <AlertDialogHeader>
        <AlertDialogTitle>导出预览</AlertDialogTitle>
        <AlertDialogDescription>
          请检查导出效果是否符合预期
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="my-4 max-h-[60vh] overflow-auto">
        <img :src="imageUrl" alt="预览图" class="w-full" >
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="downloadImage">
          下载图片
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
