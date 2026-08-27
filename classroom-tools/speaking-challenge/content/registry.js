(function initializeRegistry(global) {
  "use strict";

  const packs = [];

  function registerPack(pack) {
    if (!pack || pack.schemaVersion !== 1 || !pack.id) {
      throw new Error("内容包格式不正确");
    }
    if (packs.some((item) => item.id === pack.id)) {
      throw new Error("内容包编号重复：" + pack.id);
    }
    packs.push(Object.freeze(pack));
  }

  global.SpeakingChallenge = Object.freeze({
    packs,
    registerPack
  });
})(window);
