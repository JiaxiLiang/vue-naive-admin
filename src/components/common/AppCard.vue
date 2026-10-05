<template>
  <div class="f-card" :class="{ 'f-card-hover': bordered }">
    <slot />
  </div>
</template>

<script setup lang="ts">
// bordered 语义为“浮起”：悬浮时抬升阴影（观感属性，props 契约不变）
defineProps<{
  bordered?: boolean
}>()
</script>
