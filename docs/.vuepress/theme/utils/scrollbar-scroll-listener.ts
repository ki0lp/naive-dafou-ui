let latestKeyState: any = undefined;
let listener: any = undefined;

export function scrollbarScrollChange(to: any) {
  latestKeyState = to;
  if (listener) {
    listenerScrollbarScrollChange();
  }
}

export function setScrollbarScrollListener(to: any) {
  listener = to;
}

export function listenerScrollbarScrollChange(immediate = true) {
  if (immediate && latestKeyState) {
    listener(latestKeyState);
  }
}

export function removeScrollbarScrollListener() {
  latestKeyState = undefined;
  listener = undefined;
}
