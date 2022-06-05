import { defineClientConfig } from "@vuepress/client";
import store from "./store";

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    app.use(store);
    router.beforeEach(async (to, from, next) => {
      next();
    });
    router.afterEach(async (to, from, next) => {});
  },
  setup() {},
  rootComponents: [],
});
