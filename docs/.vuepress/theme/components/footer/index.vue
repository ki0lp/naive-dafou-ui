<template>
  <n-layout-footer class="footer" bordered>
    <div class="layout-inner">
      <div class="footer-header">
        <div>
          <a href="https://github.com/ki0lp" target="_blank"> Github </a>
        </div>
        <div>
          <a href="https://mail.google.com" target="_blank"> Gmail </a>
        </div>
      </div>
      <n-divider />
      <div class="footer-content">
        <div class="foot-meta">
          <span data-v-7eb295c0="">Dafou CR</span>
          <span style="margin-left: 12px">
            Powered By
            <a data-v-7eb295c0="" href="http://github.com/aldercarter">
              naive ui
            </a>
          </span>
        </div>
      </div>
    </div>
  </n-layout-footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { NLayoutFooter, NDivider } from "naive-ui";

export default defineComponent({
  name: "Footer",
  components: {
    NLayoutFooter,
    NDivider,
  },
  setup() {
    return {};
  },
});
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  padding: 24px;
  color: var(--n-text-color);
  text-align: center;

  a {
    color: var(--n-text-color);
    text-decoration: none;
  }

  .layout-inner {
    margin: 0 auto;
    max-width: 1024px;
    width: 100%;
  }

  .footer-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-content {
    margin: 0 0 12px 0;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding-top: 6px;
  }
}
</style>
