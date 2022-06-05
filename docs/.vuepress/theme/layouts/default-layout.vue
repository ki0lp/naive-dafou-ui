<template>
  <global-provider>
    <global-layout>
      <n-space class="space-container" vertical>
        <component :is="component" />
      </n-space>
    </global-layout>
  </global-provider>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { NSpace } from "naive-ui";
import Home from "../views/home/index.vue";
import Article from "../views/article/index.vue";
import About from "../views/about/index.vue";
import { usePageData } from "@vuepress/client";

export default defineComponent({
  name: "DefaultLayout",
  components: {
    NSpace,
    Home,
    Article,
    About,
  },
  setup(props, context) {
    const pageData = usePageData();

    const component = computed(() => {
      if (pageData.value.path === "/") {
        return Home;
      } else if (pageData.value.path.startsWith("/article/")) {
        return Article;
      } else if (pageData.value.path === "/about/") {
        return About;
      } else {
        return Home;
      }
    });

    return {
      component,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>
