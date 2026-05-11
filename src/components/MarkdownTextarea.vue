<script setup>
import { marked } from 'marked'
import { ref } from 'vue'

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
            Aide Markdown
          </v-btn>
        </template>
        <v-card min-width="320" max-width="400" class="rounded-15 card-shadow">
          <v-card-title class="text-title-large font-weight-bold px-4 pt-4 pb-2">
            Aide Markdown
          </v-card-title>
          <v-card-text class="px-4 pb-4 pt-0">
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Syntaxe</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code># Titre</code></td>
                  <td class="font-weight-bold">Titre</td>
                </tr>
                <tr>
                  <td><code>## Titre 2</code></td>
                  <td class="font-weight-bold text-body-medium">Titre 2</td>
                </tr>
                <tr>
                  <td><code>**Gras**</code></td>
                  <td><strong>Gras</strong></td>
                </tr>
                <tr>
                  <td><code>*Italique*</code></td>
                  <td><em>Italique</em></td>
                </tr>
                <tr>
                  <td><code>[Lien](url)</code></td>
                  <td class="text-primary">Lien</td>
                </tr>
                <tr>
                  <td><code>- Élément</code></td>
                  <td>• Élément</td>
                </tr>
                <tr>
                  <td><code>1. Élément</code></td>
                  <td>1. Élément</td>
                </tr>
                <tr>
                  <td><code>> Citation</code></td>
                  <td style="border-left: 3px solid #ccc; padding-left: 8px;">Citation</td>
                </tr>
                <tr>
                  <td><code>`code`</code></td>
                  <td><code>code</code></td>
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
        <v-btn :value="false" size="small" class="text-none">Éditer</v-btn>
        <v-btn :value="true" size="small" class="text-none">Aperçu</v-btn>
      </v-btn-toggle>
    </div>
    <v-textarea v-if="!showPreview" v-model="model" :label="label" :hint="hint" :persistent-hint="persistentHint"
      variant="outlined" rounded="lg" :rows="rows" :auto-grow="autoGrow" :counter="counter" :maxlength="maxlength"
      :rules="rules" />
    <v-card v-else flat rounded="lg" class="pa-4 briefing-preview" min-height="160">
      <div v-if="model" class="markdown-content" v-html="getParsedMarkdown(model)" />
      <div v-else class="text-medium-emphasis text-body-medium">Aucun contenu à prévisualiser</div>
    </v-card>
  </div>
</template>
