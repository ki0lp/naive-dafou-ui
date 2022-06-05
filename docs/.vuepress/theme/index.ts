import { path } from "@vuepress/utils";
import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { nprogressPlugin } from "@vuepress/plugin-nprogress";
import { defaultTheme } from "@vuepress/theme-default";
import { generateCategory } from "./utils/page";
import { tocPlugin } from "@vuepress/plugin-toc";
import { mediumZoomPlugin } from "@vuepress/plugin-medium-zoom";

export default {
  extends: defaultTheme({
    darkMode: true,
  }),
  name: "theme",
  layouts: {
    Layout: path.resolve(__dirname, "layouts/default-layout.vue"),
    Blank: path.resolve(__dirname, "layouts/blank-layout.vue"),
    404: path.resolve(__dirname, "views/not-found/index.vue"),
    Login: path.resolve(__dirname, "views/login/index.vue"),
    Home: path.resolve(__dirname, "views/home/index.vue"),
    Article: path.resolve(__dirname, "views/article/index.vue"),
    About: path.resolve(__dirname, "views/about/index.vue"),
  },
  plugins: [
    registerComponentsPlugin({
      components: {
        GlobalProvider: path.resolve(
          __dirname,
          "./global-components/global-provider.vue"
        ),
        GlobalLayout: path.resolve(__dirname, "./layouts/global-layout.vue"),
      },
    }),
    nprogressPlugin(),
    tocPlugin({}),
    mediumZoomPlugin({}),
  ],
  clientConfigFile: path.resolve(__dirname, "client.ts"),
  templateDev: path.resolve(__dirname, "templates/dev.html"),
  templateBuild: path.resolve(__dirname, "templates/build.html"),
  onInitialized: (app) => {
    // 添加分类
    app.siteData.categories = generateCategory(app.pages);
    app.siteData.pages = app.pages.filter(
      (f) => !f?.filePathRelative?.match("README.md")
    );
  },
};
