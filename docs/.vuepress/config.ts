import { defineUserConfig } from "vuepress";
import theme from "./theme";

export default defineUserConfig({
  lang: "zh-CN",
  title: "Dafou CR",
  description: "Dafou CR",
  port: 3000,
  theme: theme,
  markdown: {
    anchor: {
      tabIndex: false,
    },
  },
});
// base: "/naive-dafou-ui-dist/", build 的时候需要带上git的项目名称
