<template>
  <div class="about-container">
    <n-space class="space-container" vertical>
      <n-result
        status="418"
        title="我是个杯具"
        description="一切尽在不言中，暂时没有什么该写的"
      >
        <template #footer>
          <n-tooltip trigger="click">
            <template #trigger>
              <n-button>接受真相就是这么简单</n-button>
            </template>
            最困难的工作是如何成为一个人
          </n-tooltip>
        </template>
      </n-result>
    </n-space>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { NSpace, NResult, NButton, NTooltip } from "naive-ui";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "About",
  components: {
    NSpace,
    NResult,
    NButton,
    NTooltip,
  },
  setup() {
    const router = useRouter();
    const handleGoPost = () => {
      router.push({
        path: "/article/post",
      });
    };
    return {
      handleGoPost,
    };
  },
});
</script>

<style lang="scss" scoped>
.about-container {
  min-height: calc(100vh - 280px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  .space-container {
    display: flex;
    align-items: center;
    justify-content: center;

    :deep .n-result {
      .n-result-header {
        .n-result-header__title {
          margin-bottom: 24px;
        }
      }
    }

    .icon-container {
      img {
        max-width: 360px;
        border-radius: 5px;
      }
    }
  }
}
</style>
