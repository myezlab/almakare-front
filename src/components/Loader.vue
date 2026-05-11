<script setup>
import logo from "@/assets/img/logo-initials.svg"
</script>
<template>
  <v-img alt="loader" :src="logo" class="shrink zoom-in-zoom-out" width="100" height="100" transition="fade-transition">
  </v-img>
</template>

<style>
.zoom-in-zoom-out {
  animation: zoom-in-zoom-out 3s ease-out infinite;
}

@keyframes zoom-in-zoom-out {
  0% {
    transform: scale(0.8, 0.8);
  }

  50% {
    transform: scale(1, 1);
  }

  100% {
    transform: scale(0.8, 0.8);
  }
}
</style>