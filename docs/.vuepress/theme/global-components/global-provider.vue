<template>
  <n-config-provider
    :theme="theme"
    :theme-overrides="theme === null ? lightThemeOverrides : darkThemeOverrides"
    :inline-theme-disabled="true"
    s
  >
    <n-message-provider>
      <slot />
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import {
  NConfigProvider,
  NMessageProvider,
  GlobalThemeOverrides,
  GlobalTheme,
  darkTheme,
} from "naive-ui";
// import {
//   listenerThemeStateChange,
//   removeThemeStateListener,
// } from "../utils/theme-listener";
// import { useThemeData } from "@vuepress/plugin-theme-data/lib/client";
import { useAppStore } from "../store";
// import { useRouter } from "vue-router";

export default defineComponent({
  name: "GlobalPorvider",
  components: {
    NConfigProvider,
    NMessageProvider,
  },
  mounted() {
    // this.themeData.darkMode = true;
  },
  setup(props, context) {
    const lightThemeOverrides = ref<GlobalThemeOverrides>({
      Card: {},
    });

    const darkThemeOverrides = ref<GlobalThemeOverrides>({
      Card: {
        color: "#101015",
      },
    });

    // const themeData = useThemeData();
    const appStore = useAppStore();

    const theme = computed<GlobalTheme | null>(() => {
      return appStore.dark ? darkTheme : null;
    });

    return {
      theme,
      lightThemeOverrides,
      darkThemeOverrides,
      // themeData,
    };
  },
  unmounted() {
    // 移除监听
    // removeThemeStateListener();
  },
});
</script>


