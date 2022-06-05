<template>
  <global-provider>
    <n-layout class="container">
      <n-layout class="page-container">
        <n-layout-content class="content-container">
          <LoginForm />
        </n-layout-content>
        <n-layout-footer class="footer">
          <Footer />
        </n-layout-footer>
      </n-layout>
    </n-layout>
  </global-provider>
</template>

<script lang="ts">
import Footer from "../../components/footer/index.vue";
import LoginForm from "./components/login-form.vue";
import { defineComponent } from "vue";
import {
  NConfigProvider,
  NMessageProvider,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
} from "naive-ui";

export default defineComponent({
  name: "Login",
  components: {
    NConfigProvider,
    NMessageProvider,
    NLayout,
    NLayoutContent,
    NLayoutFooter,
    Footer,
    LoginForm,
  },
  setup() {
    return {};
  },
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  height: 100vh;

  :deep .n-layout-scroll-container {
    width: 100%;
    height: 100%;

    .page-container {
      height: 100%;
      display: flex;

      .content-container {
        height: 100%;
        padding-bottom: 159px;
        display: flex;

        .n-layout-scroll-container {
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
        }
      }

      .footer {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 100%;
      }
    }
  }
}
</style>
