<template>
  <n-layout class="global-container">
    <NavBar />
    <n-layout position="absolute" style="top: 64px" has-sider>
      <Sidebar v-if="sidebar" />
      <n-layout :native-scrollbar="false">
        <n-spin class="spin-container" :show="loading">
          <slot />
          <Footer />
          <n-back-top :right="24" />
        </n-spin>
      </n-layout>
    </n-layout>
  </n-layout>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { NLayout, NSpin, NBackTop } from "naive-ui";
import NavBar from "../components/navbar/index.vue";
import Sidebar from "../components/sidebar/index.vue";
import Footer from "../components/footer/index.vue";
import useLoading from "../hooks/loading";
import {
  listenerLoadingStateChange,
  removeLoadingStateListener,
} from "../utils/loading-listener";
import { usePageData } from "@vuepress/client";

export default defineComponent({
  name: "DefaultLayout",
  components: {
    NLayout,
    NSpin,
    NBackTop,
    NavBar,
    Sidebar,
    Footer,
  },
  setup(props, context) {
    const pageData = usePageData();

    const { loading, setLoading } = useLoading(false);

    listenerLoadingStateChange((loadingState) => {
      setLoading(loadingState);
    });

    const sidebar = computed(() => {
      return pageData.value.path.startsWith("/article/");
    });

    return {
      loading,
      setLoading,
      sidebar,
    };
  },
  unmounted() {
    // 移除监听
    removeLoadingStateListener();
  },
});
</script>

<style lang="scss" scoped>
.global-container {
  width: 100vw;
  height: 100vh;
}
</style>
