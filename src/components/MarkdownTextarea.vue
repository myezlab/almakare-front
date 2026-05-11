<script setup>
import { marked } from 'marked'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  persistentHint: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 6 },
  autoGrow: { type: Boolean, default: true },
  counter: { type: Boolean, default: false },
  maxlength: { type: [Number, String], default: undefined },
  rules: { type: Array, default: () => [] },
})

const showPreview = ref(false)

function getParsedMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-2">
      <v-spacer />
      <v-menu location="bottom end" :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" variant="text" rounded="lg" class="mr-2 text-none text-medium-emphasis">
            {{ $t('MARKDOWN_HELP') }}
          </v-btn>
        </template>
        <v-card min-width="320" max-width="400" class="rounded-15 card-shadow">
          <v-card-title class="text-title-large font-weight-bold px-4 pt-4 pb-2">
            {{ $t('MARKDOWN_HELP') }}
          </v-card-title>
          <v-card-text class="px-4 pb-4 pt-0">
            <v-table density="compact">
              <thead>
                <tr>
                  <th>{{ $t('MARKDOWN_SYNTAX') }}</th>
                  <th>{{ $t('MARKDOWN_RESULT') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code># {{ $t('MARKDOWN_HEADING') }}</code></td>
                  <td class="font-weight-bold">{{ $t('MARKDOWN_HEADING') }}</td>
                </tr>
                <tr>
                  <td><code>## {{ $t('MARKDOWN_HEADING') }} 2</code></td>
                  <td class="font-weight-bold text-body-medium">{{ $t('MARKDOWN_HEADING') }} 2</td>
                </tr>
                <tr>
                  <td><code>**{{ $t('MARKDOWN_BOLD') }}**</code></td>
                  <td><strong>{{ $t('MARKDOWN_BOLD') }}</strong></td>
                </tr>
                <tr>
                  <td><code>*{{ $t('MARKDOWN_ITALIC') }}*</code></td>
                  <td><em>{{ $t('MARKDOWN_ITALIC') }}</em></td>
                </tr>
                <tr>
                  <td><code>[{{ $t('MARKDOWN_LINK') }}](url)</code></td>
                  <td class="text-primary">{{ $t('MARKDOWN_LINK') }}</td>
                </tr>
                <tr>
                  <td><code>- {{ $t('MARKDOWN_LIST_ITEM') }}</code></td>
                  <td>• {{ $t('MARKDOWN_LIST_ITEM') }}</td>
                </tr>
                <tr>
                  <td><code>1. {{ $t('MARKDOWN_LIST_ITEM') }}</code></td>
                  <td>1. {{ $t('MARKDOWN_LIST_ITEM') }}</td>
                </tr>
                <tr>
                  <td><code>> {{ $t('MARKDOWN_QUOTE') }}</code></td>
                  <td style="border-left: 3px solid #ccc; padding-left: 8px;">{{ $t('MARKDOWN_QUOTE') }}</td>
                </tr>
                <tr>
                  <td><code>`{{ $t('MARKDOWN_CODE') }}`</code></td>
                  <td><code>{{ $t('MARKDOWN_CODE') }}</code></td>
                </tr>
                <tr>
                  <td><code>---</code></td>
                  <td>
                    <hr style="margin:0" />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-btn-toggle v-model="showPreview" density="compact" rounded="lg" mandatory border>
        <v-btn :value="false" size="small" class="text-none">{{ $t('EDIT') }}</v-btn>
        <v-btn :value="true" size="small" class="text-none">{{ $t('PREVIEW') }}</v-btn>
      </v-btn-toggle>
    </div>
    <v-textarea v-if="!showPreview" v-model="model" :label="label" :hint="hint" :persistent-hint="persistentHint"
      variant="outlined" rounded="lg" :rows="rows" :auto-grow="autoGrow" :counter="counter" :maxlength="maxlength"
      :rules="rules" />
    <v-card v-else flat rounded="lg" class="pa-4 briefing-preview" min-height="160">
      <div v-if="model" class="markdown-content" v-html="getParsedMarkdown(model)" />
      <div v-else class="text-medium-emphasis text-body-medium">{{ $t('BRIEFING_EMPTY_PREVIEW') }}</div>
    </v-card>
  </div>
</template>
