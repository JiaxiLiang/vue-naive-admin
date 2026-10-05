<template>
  <div class="f-card" :class="{ 'f-card-hover': bordered }">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bordered?: boolean
}>()
</script>
