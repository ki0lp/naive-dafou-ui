<template>
  <n-layout-sider
    class="layout-sider-container"
    :native-scrollbar="false"
    :collapsed="collapsed"
    :collapsed-width="0"
    @collapse="collapsed = true"
    @expand="collapsed = false"
    collapsed-trigger-style="top: 240px;right: -20px;"
    trigger-style="top: 240px;"
    show-trigger
    bordered
  >
    <n-menu
      :collapsed="collapsed"
      :collapsed-width="64"
      v-model:value="activeKey"
      :collapsed-icon-size="22"
      :options="pages"
    />
  </n-layout-sider>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { NLayoutSider, NMenu } from "naive-ui";
import useMenus from "../../hooks/menu";
import { useMessage } from "naive-ui";
import { setLoadingStateEmitter } from "../../utils/loading-listener";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "Sidebar",
  components: {
    NLayoutSider,
    NMenu,
  },
  mounted() {
    try {
      // 加载数据
      this.loadData();
      this.loadView();
    } catch (e) {
      this.message.error(`加载数据出现错误 : ${(e as Error).message}`);
    } finally {
      //setLoadingStateEmitter(false);
    }
  },
  watch: {
    pages: function (value) {
      this.$nextTick(() => {
        setLoadingStateEmitter(false);
      });
    },
    activeKey: function (value) {},
  },
  setup(props, context) {
    const collapsed = ref<boolean>(false);
    const message = useMessage();
    // 获取当前的路由位置
    const route = useRoute();

    const activeKey = ref(null);
    const { pages } = useMenus();

    const loadData = () => {
      /**
       * 加载pages列表
       */
      const loadPages = () => {
        //setLoadingStateEmitter(true);
        try {
        } catch (e) {
        } finally {
          //setLoadingStateEmitter(false);
        }
      };

      const loadActiveKey = () => {
        activeKey.value = route.path;
      };

      loadPages();
      loadActiveKey();
    };

    const loadView = () => {};

    return {
      collapsed,
      message,
      activeKey,
      pages,
      loadData,
      loadView,
    };
  },
});
</script>

<style lang="scss" scoped>
.layout-sider-container {
  :deep .n-menu-item {
    padding: 0 6px;
  }
}

/* 媒体视图 */
/* ipad pro */
@media screen and (max-width: 1024px) {
  .layout-sider-container {
    display: none;
  }
}

/* ipad */
@media screen and (max-width: 768px) {
}

/* iphone6 7 8 plus */
@media screen and (max-width: 414px) {
}

/* iphoneX */
@media screen and (max-width: 375px) and (-webkit-device-pixel-ratio: 3) {
}

/* iphone6 7 8 */
@media screen and (max-width: 375px) and (-webkit-device-pixel-ratio: 2) {
}

/* iphone5 */
@media screen and (max-width: 320px) {
}
</style>
