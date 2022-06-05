let latestKeyState: any = undefined;
let listener: any = undefined;

export function topMenuKeyChange(to: any) {
  latestKeyState = to;
  if (listener) {
    listenerTopMenuKeyStateChange();
  }
}

export function setTopMenuKeyListener(to: any) {
  listener = to;
}

export function listenerTopMenuKeyStateChange(immediate = true) {
  if (immediate && latestKeyState) {
    listener(latestKeyState);
  }
}

export function removeTopMenuKeyStateListener() {
  latestKeyState = undefined;
  listener = undefined;
}
