import { ref } from "vue";
import { useAppStore } from "../store";
import type { MenuOption } from "naive-ui";
import { getPages } from "../utils/page";
import { useSiteData } from "@vuepress/client";

export default function useMenus() {
  const appState = useAppStore();
  const siteData = useSiteData();

  const pages = [
    // @ts-ignore
    ...getPages(siteData.value.categories),
  ];

  const menus = ref<MenuOption[]>([
    {
      name: "Home",
      label: "首页",
      path: "/",
      key: "/",
      meta: {
        icon: "icon-home",
        locale: "menu.home",
      },
    },
    {
      name: "Post",
      label: "文档",
      path: "/article",
      key: "/article",
      meta: {
        icon: "icon-align-right",
        locale: "menu.post",
      },
    },
    {
      name: "About",
      label: "关于",
      path: "/about",
      key: "/about",
      meta: {
        icon: "icon-rotate-right",
        locale: "menu.category",
      },
    },
  ]);

  const popoverMenus = ref<MenuOption[]>([
    {
      label: appState.dark ? "浅色" : "深色",
      key: "theme",
      path: "theme",
    },
    {
      label: "English",
      key: "locale",
      path: "locale",
    },
    {
      name: "Home",
      label: "首页",
      path: "/",
      key: "/",
      meta: {
        icon: "icon-home",
        locale: "menu.home",
      },
    },
    {
      name: "Post",
      label: "文档",
      path: "/article",
      key: "/article",
      meta: {
        icon: "icon-align-right",
        locale: "menu.post",
      },
      children: pages,
    },
    {
      name: "About",
      label: "关于",
      path: "/about",
      key: "/about",
      meta: {
        icon: "icon-rotate-right",
        locale: "menu.category",
      },
    },
    {
      label: "Github",
      key: "github",
      path: "github",
    },
  ]);

  return { menus, pages, popoverMenus };
}
