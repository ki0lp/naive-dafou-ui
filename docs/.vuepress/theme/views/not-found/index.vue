<template>
  <global-provider>
    <global-layout>
      <n-space class="space-container" vertical>
        <div class="result-container">
          <n-result
            status="404"
            title="404 资源不存在"
            description="生活总归带点荒谬"
          >
            <template #footer>
              <n-button @click="back">找点乐子吧</n-button>
            </template>
          </n-result>
        </div>
      </n-space>
    </global-layout>
  </global-provider>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { defineComponent, ref } from "vue";
import { NSpace, NButton, NResult } from "naive-ui";

export default defineComponent({
  name: "NotFound",
  components: {
    NSpace,
    NButton,
    NResult,
  },
  setup() {
    const router = useRouter();
    const back = () => {
      router.push({
        path: "/",
      });
    };
    return {
      back,
    };
  },
});
</script>

<style scoped lang="scss">
.space-container {
  height: calc(100vh - 240px);

  .result-container {
    width: 100%;
    min-height: calc(100vh - 240px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
