<template>
  <div class="auto-bg" :class="{ 'card-border': bordered }">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bordered?: boolean
}>()
</script>
