<template>
  <CommonPage>
    <n-upload
      class="mx-auto w-[75%] p-20 text-center"
      :custom-request="handleUpload"
      :show-file-list="false"
      accept=".png,.jpg,.jpeg"
      @before-upload="onBeforeUpload"
    >
      <n-upload-dragger>
        <div class="h-150 f-c-c flex-col">
          <i class="i-mdi:upload mb-12 text-68 color-primary" />
          <n-text class="text-14 color-gray">
            点击或者拖动文件到该区域来上传
          </n-text>
        </div>
      </n-upload-dragger>
    </n-upload>

    <n-card v-if="imgList && imgList.length" class="mt-16 items-center">
      <n-image-group>
        <n-space justify="space-between" align="center">
          <n-card v-for="(item, index) in imgList" :key="index" class="w-280 hover:card-shadow">
            <div class="h-160 f-c-c">
              <n-image width="200" :src="item.url" />
            </div>
            <n-space class="mt-16" justify="space-evenly">
              <n-button dashed type="primary" @click="copy(item.url)">
                url
              </n-button>
              <n-button dashed type="primary" @click="copy(`![${item.fileName}](${item.url})`)">
                MD
              </n-button>
              <n-button
                dashed
                type="primary"
                @click="copy(`&lt;img src=&quot;${item.url}&quot; /&gt;`)"
              >
                img
              </n-button>
            </n-space>
          </n-card>
          <div v-for="i in 4" :key="i" class="w-280" />
        </n-space>
      </n-image-group>
    </n-card>
  </CommonPage>
</template>

<script setup lang="ts">
// 图片上传演示页：拖拽/点选上传图片，成功后本地预览，并提供 url / Markdown / img 三种格式的地址一键复制
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'
import { useClipboard } from '@vueuse/core'

defineOptions({ name: 'ImgUpload' })

const { copy, copied } = useClipboard()

// 已上传图片列表：文件名 + 本地预览 url
const imgList = reactive<Array<{ fileName: string, url: string }>>([])

// 复制成功后给出反馈提示
watch(copied, (val) => {
  if (val)
    $message.success('已复制到剪切板')
})

// 上传前置校验：非图片类型直接拦截，返回 false 中止上传
function onBeforeUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file?.type.startsWith('image/')) {
    $message.error('只能上传图片')
    return false
  }
  return true
}

// 自定义上传请求：不走真实接口，延迟 1.5s 后生成本地 blob url 加入预览列表
async function handleUpload({ file, onFinish }: UploadCustomRequestOptions) {
  if (!file || !file.type) {
    $message.error('请选择文件')
  }

  // 模拟接口耗时，成功后用 blob url 做本地预览
  $message.loading('上传中...')
  setTimeout(() => {
    $message.success('上传成功')
    imgList.push({ fileName: file.name, url: URL.createObjectURL(file.file!) })
    onFinish()
  }, 1500)
}
</script>
