<script setup>
import { usePicture } from "@/composables/usePicture.js"
import { useMessagesStore } from '@/stores/messages'
import { mdiCameraOutline, mdiClose, mdiImageOutline } from '@mdi/js'
import { ref } from 'vue'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const showFullscreen = ref(false)

const props = defineProps({
  docPath: {
    type: String,
    required: true
  },
  storagePath: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: null
  },
  pictureName: {
    type: String,
    default: 'image'
  },
  size: {
    type: [Number, String],
    default: 100
  },
  for: {
    type: String,
    default: 'picture'
  },
  hasThumbnail: {
    type: Boolean,
    default: false
  },
  cover: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:source'])
const { uploadPicture } = usePicture()
const messagesStore = useMessagesStore()

async function onFileUpdated(event) {
  try {
    const file = event.target.files[0]
    if (!file) return

    const { pictureUrl } = await uploadPicture({
      pictureData: file,
      pictureName: props.pictureName,
      docPath: props.docPath,
      storagePath: props.storagePath,
      hasThumbnail: props.hasThumbnail
    })

    messagesStore.add({ type: 'success', text: t('NEW_PICTURE_SAVED') })

    emit('update:source', pictureUrl)

  } catch (error) {
    console.error("Error uploading picture:", error)
    messagesStore.add({ type: 'error', text: t('FAILED_TO_UPLOAD_PICTURE') })
  }
}

</script>

<template>
  <div class="d-inline-flex justify-center" style="position: relative">
    <!-- Picture preview or placeholder -->
    <v-img v-if="props.source" :src="props.source" :lazy-src="props.source" :width="$props.size" :height="$props.size"
      class="rounded-15 border-light cursor-pointer" :cover="props.cover" transition="fade-transition"
      @click="showFullscreen = true" />

    <v-card v-else @click="$refs.fileInput.click()"
      class="d-flex rounded-15 flex-column align-center justify-center text-medium-emphasis " variant="tonal"
      color="primary" :width="$props.size" :height="$props.size">
      <v-icon :icon="mdiImageOutline" size="x-large" class="mb-1" />
      <span class="text-body-small text-center">{{ $t('ADD_PHOTO') }}</span>
    </v-card>

    <!-- Camera icon button -->
    <v-btn v-if="props.source && !props.readonly" :icon="mdiCameraOutline" size="x-small" color="#ffffff99" flat
      style="position: absolute; right: 8px; top: 8px" @click="$refs.fileInput.click()" />

    <input ref="fileInput" type="file" :id="$props.for" @change="onFileUpdated" accept="image/*,.svg"
      style="display: none" />

    <!-- Fullscreen picture overlay -->
    <v-overlay v-model="showFullscreen" class="d-flex align-center justify-center" scrim="black"
      content-class="d-flex align-center justify-center" scroll-strategy="block"
      @click:outside="showFullscreen = false">
      <Teleport to="body">
        <v-btn v-if="showFullscreen" :icon="mdiClose" color="white" variant="text"
          style="position: fixed; top: 16px; right: 16px; z-index: 3001" @click.stop="showFullscreen = false" />
      </Teleport>
      <v-img :src="props.source" max-width="90vw" max-height="90vh" contain @click.stop="showFullscreen = false"
        :min-width="$vuetify.display.mobile ? 'calc(100vw - 32px)' : '1000px'"
        :min-height="$vuetify.display.mobile ? '100%' : 'auto'" />
    </v-overlay>


  </div>
</template>
