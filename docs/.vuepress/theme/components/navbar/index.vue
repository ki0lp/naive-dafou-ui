<template>
  <n-layout-header class="navbar-container" bordered>
    <div class="n-text logo-container" @click="handleLogoClick">
      <router-link to="/"><img :src="iconImage" /></router-link>
      <span class="logo-content">Dafou CR</span>
    </div>
    <div class="menu-container">
      <n-menu class="menu-action" v-model:value="activeKey" mode="horizontal" :options="menus"
        @update:value="handleMenuUpdateValue" />
      <n-auto-complete class="menu-search" v-model:value="searchValue" :input-props="{ autocomplete: 'disabled' }"
        :options="searchOptions" :on-select="handleSearchSelected" placeholder="搜索" :clear-after-select="true" />
    </div>
    <div class="right-container">
      <n-space class="right-action">
        <n-button size="small" quaternary v-for="(action, key) in rightActions" :key="key"
          @click="handleRightActionClick(action)">
          {{ action.label }}
        </n-button>
      </n-space>
      <n-popover class="dropdown-action" width="288" trigger="click">
        <template #trigger>
          <n-icon size="20" class="dropdown-icon">
            <icon-menu />
          </n-icon>
        </template>
        <n-scrollbar class="dropdown-menu-action-container">
          <n-menu class="dropdown-menu-action" v-model:value="popoverActiveKey" :options="popoverMenus"
            @update:value="handlePopoverMenuUpdateValue" />
        </n-scrollbar>
      </n-popover>
    </div>
  </n-layout-header>
</template>

<script lang="ts">
import { computed, ref, defineComponent } from "vue";
import useUser from "../../hooks/user";
import { useRoute, useRouter } from "vue-router";
import useMenus from "../../hooks/menu";
import {
  NMenu,
  NLayoutHeader,
  NAutoComplete,
  NButton,
  NSpace,
  NIcon,
  NDropdown,
  NPopover,
  NScrollbar,
  NTag,
  NAvatar,
  MenuOption,
  useMessage,
} from "naive-ui";
// @ts-ignore
import iconImage from "../../assets/logo.png";
import { IosMenu as IconMenu, MdLogOut } from "@vicons/ionicons4";
import { LogOutOutline } from "@vicons/ionicons5";
import { useSiteData } from "@vuepress/client";
import { useAppStore } from "../../store";

export default defineComponent({
  name: "Navbar",
  components: {
    NMenu,
    NLayoutHeader,
    NAutoComplete,
    NButton,
    NSpace,
    NIcon,
    IconMenu,
    NDropdown,
    NPopover,
    NScrollbar,
    NTag,
    NAvatar,
    MdLogOut,
    LogOutOutline,
  },
  mounted() {
    try {
      this.loadData();
    } catch (e) {
      this.message.error(`加载数据出现错误: ${(e as Error).message}`);
    }
  },
  watch: {
    activeKey: (value) => {
      //console.log(value);
    },
    route: (value) => {
      console.log(value);
    },
  },
  setup() {
    const { logout } = useUser();

    const router = useRouter();
    const route = useRoute();
    const siteData = useSiteData();
    const appState = useAppStore();
    const { menus, popoverMenus } = useMenus();

    const handleLogout = () => {
      logout();
    };

    const message = useMessage();
    const activeKey = ref(null);
    const popoverActiveKey = ref(null);

    const loadData = () => {
      const loadActiveKey = () => {
        let key = "";
        menus.value.forEach((m, index) => {
          // @ts-ignore
          if (route.path.startsWith("/article")) {
            // @ts-ignore
            key = menus.value.find((f, inde) => f.path === "/article").path;
          } else {
            if (route.path === m.path) {
              key = m.path;
            }
          }
        });
        activeKey.value = key;
      };

      const loadPopoverActiveKey = () => {
        let key = "/";
        popoverMenus.value.forEach((p, index) => {
          // @ts-ignore
          if (p.path === "/article") {
            p?.children?.forEach((cs, inde) => {
              // @ts-ignore
              cs.children?.forEach((c, ind) => {
                if (c.path === route.path) {
                  key = c.path;
                }
              });
            });
          } else {
            const path = route.path === "" ? "/" : route.path;
            // @ts-ignore
            if (path === p.path) {
              // @ts-ignore
              key = p.path;
            }
          }
        });
        popoverActiveKey.value = key;
      };

      loadActiveKey();
      loadPopoverActiveKey();
    };

    const handleMenuUpdateValue = (key: string, item: any) => {
      if (item.path === router.currentRoute.value.path) {
        message.info("当前已经在该页面，不要再点击了");
        return;
      }
      router.push({
        path: item?.path,
      });
    };

    const handleRightActionClick = (action: any) => {
      if (action.key === "theme") {
        const dark = action.label === "深色" ? true : false;
        action.label = action.label === "深色" ? "浅色" : "深色";
        appState.setDarkTheme(dark);

        // router.replace({
        //   path: "/blank/",
        // });
      } else if (action.key === "locale") {
        message.info("还不支持");
      } else if (action.key === "github") {
        message.info("正在跳转...[其实还没有做]");
        window.open('https://github.com/ki0lp', '_blank');
      }
    };

    const handleLogoClick = () => {
      router.push({
        path: "/",
      });
    };

    const rightActions = computed(() => {
      return popoverMenus.value.filter((m: any) => {
        return m.key === "theme" || m.key === "locale" || m.key === "github";
      });
    });

    const handlePopoverMenuUpdateValue = (key: string, item: MenuOption) => {
      if (
        item.key === "theme" ||
        item.key === "locale" ||
        item.key === "github"
      ) {
        handleRightActionClick(item);
      } else {
        handleMenuUpdateValue(key, item);
      }
    };

    const searchValue = ref("");
    const searchOptions = computed(() => {
      const searhcResults = [];
      // @ts-ignore
      siteData.value.pages.forEach((p, index) => {
        const headers = p.headers;
        const childrens = [];
        headers.forEach((h, inde) => {
          if (h.title.match(searchValue?.value)) {
            childrens.push({
              label: h.title,
              key: `${h.title}_${index}_${inde}`,
              value: h.title,
            });
          }
        });
        if (childrens.length !== 0) {
          searhcResults.push({
            type: "group",
            label: p.title,
            key: `${p.path}`,
            value: p.title,
            children: childrens,
          });
        }
      });

      return searhcResults;
    });

    const handleAvatarClick = () => {
      message.info("个人中心还没有做");
    };

    const handleSearchSelected = (value: string) => {
      searchOptions.value.forEach((s, index) => {
        s.children.forEach((c, index) => {
          if (c.label.match(value) && s.key) {
            router.push({
              path: s.key,
              query: { header: value },
            });
          }
        });
      });
    };

    return {
      menus,
      handleLogout,
      activeKey,
      popoverActiveKey,
      iconImage,
      popoverMenus,
      handleMenuUpdateValue,
      handleRightActionClick,
      handleLogoClick,
      rightActions,
      handlePopoverMenuUpdateValue,
      searchValue,
      searchOptions,
      handleAvatarClick,
      handleSearchSelected,
      loadData,
      message,
    };
  },
});
</script>

<style scoped lang="scss">
.navbar-container {
  display: grid;
  grid-template-columns: 240px 1fr auto;
  align-items: center;
  height: 64px;
  padding: 0 24px;

  .logo-container {
    display: flex;
    font-size: 18px;
    align-items: center;
    cursor: pointer;

    a {
      display: inline-flex;

      img {
        width: 32px;
        height: 32px;
        margin-right: 16px;
      }
    }
  }

  .menu-container {
    display: flex;
    align-items: center;

    .menu-search {
      max-width: 216px;
    }
  }

  .right-container {
    display: flex;
    align-items: center;

    .right-action {
      display: flex;
      align-items: center;

      .name-action-span {
        display: inline-block;
        vertical-align: middle;
        //cursor: pointer;
        padding: 3px;
      }

      //.name-action-span:hover, .name-action-span:active {
      //  background-color: rgba(46, 51, 56, 0.09);
      //  border-radius: 5px;
      //}

      .logout-action-span {
        display: inline-block;
        padding: 2px;
        vertical-align: middle;
        margin-left: 3px;
        cursor: pointer;
        margin-right: calc((var(--n-height) - 10px) / -2);
      }

      .logout-action-span:hover,
      .logout-action-span:active {
        background-color: var(--n-close-color-hover);
        border-radius: 50%;
      }
    }

    .dropdown-action {
      display: none;
      align-items: center;
      margin-left: 16px;
      padding: 0 !important;

      .dropdown-menu-action-container {
        overflow: auto;
        max-height: 70vh;
      }
    }

    .dropdown-icon {
      display: none;
      align-items: center;
      cursor: pointer;
    }
  }
}

:deep .dropdown-action {
  padding: 0 !important;

  .dropdown-menu-action-container {
    overflow: auto;
    max-height: 70vh;
  }
}

/* 媒体视图 */
/* ipad pro */
@media screen and (max-width: 1024px) {
  .navbar-container {
    grid-template-columns: auto 1fr auto;
    padding: 0 16px;

    .logo-container {
      .logo-content {
        display: none;
      }
    }

    .menu-container {
      .menu-action {
        display: none;
      }

      .menu-search {
        max-width: inherit;
      }
    }

    .right-container {
      .right-action {
        display: none !important;
      }

      .dropdown-icon {
        display: flex;
        margin-left: 16px;
      }
    }
  }
}

/* ipad */
@media screen and (max-width: 768px) {}

/* iphone6 7 8 plus */
@media screen and (max-width: 414px) {}

/* iphoneX */
@media screen and (max-width: 375px) and (-webkit-device-pixel-ratio: 3) {}

/* iphone6 7 8 */
@media screen and (max-width: 375px) and (-webkit-device-pixel-ratio: 2) {}

/* iphone5 */
@media screen and (max-width: 320px) {}
</style>

<style lang="scss">
.dropdown-action {
  padding: 12px 0 !important;
  border-radius: 6px !important;

  .n-popover__content {
    .dropdown-menu-action-container {
      max-height: 70vh;

      .n-scrollbar-container {
        .n-scrollbar-content {
          .user-container {
            padding: 0 18px;
            line-height: 1.75;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          .dropdown-menu-action {
            .n-submenu {
              .n-menu-item-content {
                padding-left: 18px !important;
              }

              .n-submenu-children {
                .n-menu-item-group-title {
                  padding-left: 27px !important;
                }

                div {
                  .n-menu-item {
                    .n-menu-item-content {
                      padding-left: 36px !important;
                    }
                  }
                }
              }
            }

            .n-menu-item {
              .n-menu-item-content {
                padding-left: 18px !important;
              }
            }
          }
        }
      }
    }
  }
}
</style>
