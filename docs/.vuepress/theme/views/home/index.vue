<template>
  <div class="workplace-container">
    <n-space class="space-container" vertical>
      <n-result
        title="这里是首页"
        description="一切尽在不言中，暂时没有什么该写的"
      >
        <template #icon>
          <div class="icon-container">
            <router-link to="">
              <img :src="bannerImg" />
            </router-link>
          </div>
        </template>
        <template #footer>
          <n-tooltip trigger="click">
            <template #trigger>
              <n-button>深沉的就像森林般</n-button>
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
import { setLoadingStateEmitter } from "../../utils/loading-listener";
import {
  NLayout,
  NLayoutContent,
  NSpace,
  NResult,
  NButton,
  NTooltip,
  useMessage,
} from "naive-ui";
import { useRouter } from "vue-router";
import { useSiteData } from "@vuepress/client";
import bannerImg from "../../assets/logo.png";

export default defineComponent({
  name: "Home",
  components: {
    NLayout,
    NLayoutContent,
    NSpace,
    NResult,
    NButton,
    NTooltip,
  },
  mounted() {
    setLoadingStateEmitter(true);
    try {
      // 加载数据
      this.loadData();
    } catch (e) {
      // this.siteData.$message.error(
      //   `加载数据出现错误 : ${(e as Error).message}`
      // );
    } finally {
      setLoadingStateEmitter(false);
    }
  },
  setup() {
    // const messgae = useMessage();
    const router = useRouter();
    const siteData = useSiteData();

    const handleGoPost = () => {
      router.push({
        path: "/article/post",
      });
    };
    return {
      // messgae,
      siteData,
      handleGoPost,
      bannerImg,
    };
  },
});
</script>

<style lang="scss" scoped>
.workplace-container {
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
        max-width: 320px;
        border-radius: 5px;
      }
    }
  }
}
</style>
