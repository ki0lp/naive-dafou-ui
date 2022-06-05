import { MenuGroupOption } from "naive-ui";
import { h } from "vue";
import { RouterLink } from "vue-router";

export function getPages(categories): MenuGroupOption[] {
  return categories.map((c) => {
    return {
      label: c.key,
      type: "group",
      key: c.key,
      children: c.value.map((v) => {
        return {
          name: v.title,
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  path: v.path,
                },
              },
              { default: () => v.title }
            ),
          path: v.path,
          key: v.path,
        };
      }),
    };
  });
}

export function generateCategory(pages) {
  /**
   * groupBy方法
   * @param array
   * @param f
   */
  const groupBy = (array, f) => {
    let groups = {};
    array.forEach(function (o) {
      let group = JSON.stringify(f(o));
      groups[group] = groups[group] || [];
      groups[group].push(o);
    });
    return Object.keys(groups)
      .map(function (group) {
        return {
          key: group
            .replace('["', "")
            .replace('"]', "")
            .replace("[", "")
            .replace("]", ""),
          value: groups[group],
        };
      })
      .filter((f) => f.key !== "null");
  };
  // @ts-ignore
  return groupBy(pages, (p) => [p.frontmatter.category]).sort((a, b) => {
    // @ts-ignore
    return a.key >= b.key ? 1 : -1;
  });
}

export function generateHeaders(container) {
  const parseHeader = (container) => {
    const anchors = container.querySelectorAll(`h2,h3`); // ,h4,h5,h6
    const titles = Array.from(anchors).filter(
      // @ts-ignore
      (title) => !!title.innerText.trim()
    );
    if (!titles.length) {
      return [];
    }

    return titles.map((el, index) => {
      const title =
        // @ts-ignore
        el.tagName === "H3"
          ? // @ts-ignore
            `- ${el.innerText.replace("#\n", "").trim()}`
          : // @ts-ignore
            el.innerText.replace("#\n", "").trim();
      return {
        title: title,
        lineIndex: index,
        // @ts-ignore
        localName: el.tagName,
        children: [],
        isCheck: false,
        isCurrent: false,
        // @ts-ignore
        offsetTop: el.offsetTop,
      };
    });
  };
  return parseHeader(container);
}
