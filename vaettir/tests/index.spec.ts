import { Vaettir, Obs } from "../src/index.js";
import { it, expect } from "@jest/globals";

it("should have unique id", () => {
  const firstAgent = Vaettir.build()
    .id("vaettir")
    .api(() => {
      return {};
    })
    .finish();

  const secondAgent = Vaettir.build()
    .id("vaettir")
    .api(() => {
      return {};
    })
    .finish();

  expect(firstAgent.id).not.toBe(secondAgent.id);
});

it("should support custom channels", () => {
  const firstAgent = Vaettir.build()
    .channels((channels) => ({
      ...channels,
      custom: Obs.make<void>(),
    }))
    .api(({ channels }) => ({
      triggerChange: () => channels.change.emit(),
      triggerCustom: () => channels.custom.emit(),
    }))
    .finish();

  let changeTriggered = 0;
  let customTriggered = 0;

  firstAgent.channels.change.sub(() => (changeTriggered += 1));
  firstAgent.channels.custom.sub(() => (customTriggered += 1));

  firstAgent.api.triggerChange();
  firstAgent.api.triggerCustom();

  expect(changeTriggered).toBe(1);
  expect(customTriggered).toBe(1);
});

it("should support behave the same as systemic-ts-utils/destruction", async () => {
  let destroyFlag = 0;
  const firstAgent = Vaettir.build()
    .api(({ onDestroy }) => {
      onDestroy(() => {
        destroyFlag += 1;
      });
      return {};
    })
    .finish();

  firstAgent.destroy();
  firstAgent.destroy();
  firstAgent.destroy();
  await firstAgent.whenDestroyed;
  expect(firstAgent.isDestroyed()).toBe(true);
  expect(destroyFlag).toBe(1);
});

it("should emit change on destruction", async () => {
  let changeFlag = 0;
  const firstAgent = Vaettir.build().finish();
  firstAgent.channels.change.sub(() => {
    changeFlag += 1;
  });

  firstAgent.destroy();
  expect(changeFlag).toBe(1);
});
