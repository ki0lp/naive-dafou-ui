<template>
  <div class="article-container">
    <n-space class="space-container" vertical>
      <div class="empty-container" v-if="pageData.title === 'Dafou CR'">
        <n-empty>
          <template #icon>
            <n-icon>
              <warning-outline />
            </n-icon>
          </template>
          暂时没有数据，请点击文章列表查看
        </n-empty>
      </div>
      <div class="content-container" v-else>
        <div class="document-scroll-container">
          <div class="pages-container-header">
            <div class="breadcrumb-container">
              <n-breadcrumb v-if="pageData.title">
                <n-breadcrumb-item href="#"> 首页 </n-breadcrumb-item>
                <n-breadcrumb-item href="#"> 文档 </n-breadcrumb-item>
                <n-breadcrumb-item href="#">
                  {{ pageData.title }}
                </n-breadcrumb-item>
              </n-breadcrumb>
            </div>
            <div class="title-container">
              <h1>{{ pageData.title }}</h1>
            </div>
            <div class="subtitle-container">
              <div class="tag-container">
                <n-space>
                  <n-tag
                    size="small"
                    v-for="(tag, index) in pageData.frontmatter.tag"
                    :key="index"
                  >
                    {{ tag }}
                  </n-tag>
                </n-space>
              </div>
              <div class="date-container">
                <n-tag size="small" v-if="pageData.frontmatter.date">
                  {{ pageData.frontmatter.date }}
                </n-tag>
              </div>
            </div>
            <n-divider />
          </div>
          <n-card class="md-theme-container" :bordered="false">
            <Content />
          </n-card>
        </div>
        <div class="anchor-container">
          <n-anchor
            :show-rail="false"
            :trigger-top="96"
            ref="anchorRef"
            :top="96"
            :bound="96"
            position="fixed"
            affix
          >
            <n-card>
              <n-scrollbar class="anchor-container-scrollbar">
                <n-anchor-link
                  v-for="(toc, index) in tocs"
                  :title="toc.title"
                  @click.stop="handleTocTimelineClick(toc)"
                  :key="index"
                  :class="toc.isCurrent ? 'n-anchor-link--current' : ''"
                >
                  <n-anchor-link
                    v-if="toc.children.length !== 0"
                    v-for="(tc, ind) in toc.children"
                    :title="'- ' + tc.title"
                    @click.stop="handleTocTimelineClick(tc)"
                    :key="ind"
                    :class="tc.isCurrent ? 'n-anchor-link--current' : ''"
                  />
                </n-anchor-link>
              </n-scrollbar>
            </n-card>
          </n-anchor>
        </div>
      </div>
    </n-space>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRaw, computed } from "vue";
import {
  NSpace,
  NSpin,
  NDivider,
  NEmpty,
  NAnchor,
  NAnchorLink,
  NScrollbar,
  NBreadcrumb,
  NBreadcrumbItem,
  NTag,
  NEllipsis,
  NCard,
  NIcon,
  AnchorInst,
} from "naive-ui";
import { useMessage } from "naive-ui";
import { TocData } from "./type";
import { WarningOutline } from "@vicons/ionicons5";
import { usePageData } from "@vuepress/client";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "Post",
  components: {
    NSpace,
    NSpin,
    NDivider,
    NEmpty,
    NAnchor,
    NAnchorLink,
    NScrollbar,
    NBreadcrumb,
    NBreadcrumbItem,
    NTag,
    NEllipsis,
    NCard,
    WarningOutline,
    NIcon,
  },
  mounted() {
    try {
      // 加载数据
      this.initData();
    } catch (e) {
      // @ts-ignore
      this.message.error(`加载数据出现错误 : ${(e as Error).message}`);
    } finally {
      //setLoadingStateEmitter(false);
    }
  },
  watch: {
    pageData: function (value) {
      this.$nextTick(() => {
        this.initTocs();
      });
    },
    tocs: function (value) {
      this.$nextTick(() => {
        // this.scrollToAnchor();
      });
    },
  },
  setup(props, context) {
    const message = useMessage();
    const pageData = usePageData();
    // const scrollerContainer = ref(null);
    const anchorRef = ref<AnchorInst | null>(null);

    const route = useRoute();

    const handleTocTimelineClick = (toc) => {
      let id = toc.title
        .replaceAll("？", "")
        .replaceAll("（", "-")
        .replaceAll("）", "-")
        .replaceAll("，", "-")
        .replaceAll(" ", "-")
        .toLowerCase();

      if (/[0-9]([\s\S]*)/.test(id)) {
        id = "_" + id;
      }
      if (id) {
        anchorRef.value?.scrollTo(`#${id}`);
        setAnthorCurrent(toc);
      }
    };

    const setAnthorCurrent = (toc) => {
      const forEach = (tocs) => {
        tocs.forEach((t, index) => {
          if (t === toc) {
            t.isCurrent = true;
          } else {
            t.isCurrent = false;
          }
          if (t.children) {
            forEach(t.children);
          }
        });
      };
      forEach(tocs.value);
    };

    const tocs = ref<TocData[]>([]);
    // const scrollbarContainer = ref(null);

    const initData = () => {
      // /**
      //  * loadScrollbarContainer
      //  */
      // const loadScrollbarContainer = () => {
      //   // console.log(anchorRef.value.$root.$el);
      //   // @ts-ignore
      //   scrollbarContainer.value = anchorRef.value.$root.$el.querySelector(
      //     `.n-scroller-page-container .n-scrollbar-container`
      //   );
      //   //@ts-ignore
      //   scrollbarContainer?.value.addEventListener("scroll", function () {
      //     const top = scrollbarContainer?.value.scrollTop;
      //     // console.log(top);
      //     tocs.value.forEach((t: TocData, i) => {
      //       const next = tocs?.value.at(i + 1);
      //       if (t.offsetTop <= top && next && top <= next.offsetTop) {
      //         t.isCurrent = true;
      //       } else {
      //         t.isCurrent = false;
      //       }
      //     });
      //   });
      // };
      // loadScrollbarContainer();
      initTocs();
    };

    /**
     * initTocs
     */
    const initTocs = () => {
      const map = (headers) => {
        return headers.map((header) => {
          let id = header.title
            .replaceAll("？", "")
            .replaceAll("（", "-")
            .replaceAll("）", "-")
            .replaceAll("，", "-")
            .replaceAll(" ", "-")
            .toLowerCase();

          if (/[0-9]([\s\S]*)/.test(id)) {
            id = "_" + id;
          }

          let offsetTop = 0;
          // @ts-ignore
          // if (!import.meta.env.SSR) {
          // @ts-ignore
          offsetTop = document?.querySelector(`#${id}`)?.offsetTop; //  + 220
          // }

          return {
            children: map(header.children),
            level: header.level,
            slug: header.slug,
            title: header.title,
            isCurrent: false,
            offsetTop: offsetTop,
          };
        });
      };
      if (pageData.value.headers.length !== 0) {
        tocs.value = map(pageData.value.headers);
      }
    };

    const scrollToAnchor = () => {
      const { header } = route.query;
      if (header) {
        // @ts-ignore
        const ts = tocs.value.filter((t, index) => t.title === header);
        if (ts.length === 1) {
          handleTocTimelineClick(ts[0]);
        }
      }
    };

    return {
      message,
      pageData,
      // scrollerContainer,
      tocs,
      handleTocTimelineClick,
      anchorRef,
      initData,
      initTocs,
      scrollToAnchor,
    };
  },
  unmounted() {},
});
</script>

<style lang="scss" scoped>
.article-container {
  min-height: calc(100vh - 280px);
  display: flex;
  justify-content: center;
  padding: 32px;

  .space-container {
    display: flex;
    width: 100%;

    .empty-container {
      min-height: calc(100vh - 280px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-container {
      display: flex;
      flex-wrap: nowrap;

      .document-scroll-container {
        flex: 1;
        padding: 0 7px;
        overflow: hidden;

        .pages-container-header {
          .breadcrumb-container {
            width: 100%;

            :deep ul {
              display: flex;

              li:last-of-type {
                width: 100%;
                flex: 1;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }
          }

          .title-container {
            margin: 24px 0;
          }

          .subtitle-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 24px;

            .tag-container {
            }

            .date-container {
            }
          }
        }

        :deep .md-theme-container {
          padding: 0;

          .n-card__content {
            padding: 0;

            padding: 0;

            h1 {
              border-bottom: 1px solid var(--n-border-color);
            }

            h2 {
              border-bottom: 1px solid var(--n-border-color);
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              .header-anchor {
                opacity: 1;
              }
              .header-anchor:hover {
                text-decoration: underline;
              }
            }

            div[class*="language-"].line-numbers-mode::after {
              background-color: var(--code-bg-color);
            }

            code {
              background-color: transparent;
            }

            a.header-anchor {
              margin-left: inherit;
            }

            blockquote {
              background-color: var(--blockquote-bg-color);
              color: inherit;
              border-radius: 3px;
              padding: 0.25rem 1rem 0.25rem 1rem;
              border-left: 0.3rem solid var(--c-border-dark);
              overflow-x: scroll;
            }

            th,
            td {
              border: inherit;
            }

            table {
              width: 100%;
              background-color: var(--code-bg-color);
              border: 1px solid var(--c-border-dark);
              border-radius: 3px;
              display: "";
              border-spacing: 0;
              border-collapse: collapse;

              thead {
                tr {
                  border-top: none;
                }

                th {
                  border-collapse: collapse;
                  border-top: none;
                  border-right: 1px solid var(--c-border-dark);
                  border-bottom: 1px solid var(--c-border-dark);
                  padding: 5px 9px;
                  font-size: 14px;
                  font-weight: normal;
                  text-align: center;
                }
                th:last-of-type {
                  border-right: none;
                }
              }
              tbody {
                td {
                  border-collapse: collapse;
                  border-right: 1px solid var(--c-border-dark);
                  border-bottom: 1px solid var(--c-border-dark);
                  padding: 5px 9px;
                  font-size: 12px;
                  font-weight: normal;
                  text-align: center;
                  word-break: break-all;
                }
                td:last-of-type {
                  border-right: none;
                }
                tr:last-of-type {
                  background-color: transparent;
                  td {
                    border-bottom: none;
                  }
                }
              }
            }

            img {
              width: 100%;
              border-radius: 3px;
              border: 1px solid var(--c-img-border);
              box-sizing: border-box;
            }

            div[class*="language-"].line-numbers-mode {
              .line-numbers {
                padding-top: 1rem;
              }
            }

            div[class*="language-"]::before {
              top: 0.1em;
            }

            ::-webkit-scrollbar {
              height: 5px; // 设置横向滚动条的高度
              width: 5px; // 设置纵向滚动条宽度
              cursor: pointer;
            }

            ::-webkit-scrollbar-track {
              display: none;
              border-radius: 10px;
              cursor: pointer;
            }

            // 滚动条滑块样式
            ::-webkit-scrollbar-thumb {
              background-color: var(--c-scrollbar-color);
              // display: none;
              border-radius: 10px;
              cursor: pointer;
            }

            ::-webkit-scrollbar-thumb:hover {
              background-color: var(--c-scrollbar-color-hover);
              cursor: pointer;
            }

            ::-webkit-scrollbar-track-piece {
              border-radius: 10px;
              cursor: pointer;
            }
          }
        }
      }

      .anchor-container {
        $anchorWidth: 180px;
        $anchorAttachWidth: $anchorWidth; // 38
        $maskHeigth: 6vmin;

        width: $anchorWidth;
        padding: 0px 7px 0px 7px;
        position: relative;

        :deep .n-anchor-link {
          padding: 2px 8px;
          .n-anchor-link__title {
            padding-right: 6px;
          }
        }

        :deep .anchor-container-scrollbar {
          max-height: calc(100vh - 302px);
          .n-scrollbar-container {
            .n-scrollbar-content {
              padding: 6px 12px 6px 0;

              .n-anchor-link {
                .n-anchor-link {
                  margin-right: 0;
                  .n-anchor-link__title {
                    padding-right: 0px;
                  }
                }
              }
            }
          }
        }

        :deep .n-scrollbar > .n-scrollbar-rail.n-scrollbar-rail--vertical {
          right: 1px;
        }

        :deep .n-card > .n-card__content {
          padding: 0 0 0 6px;
        }

        :deep .n-affix {
          width: $anchorAttachWidth;
        }

        :deep .tag-padding-left {
          padding-left: 16px;
        }

        :deep .n-anchor-link--current {
          background-color: var(--n-link-color);
          border-radius: 3px;

          .n-anchor-link__title {
            color: var(--n-link-text-color-active);
          }
        }
      }
    }
  }
}

/* 媒体视图 */
/* ipad pro */
@media screen and (max-width: 1024px) {
  .article-container {
    padding: 12px;
    .space-container {
      .document-scroll-container {
        padding: 0;
      }

      .anchor-container {
        display: none;
      }
    }
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
