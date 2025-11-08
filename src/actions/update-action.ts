import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import fs from "fs/promises";

type UpdateSettings = {
  profileId?: string;
};

interface Response {
  data: {
    platformInfo: {
      platformUserHandle: string;
    };
    segments: {
      type: string;
      stats: {
        [key: string]: {
          displayValue: string;
          displayName: string;
          metadata: {
            imageUrl?: string;
          };
        };
      };
    }[];
  };
}

@action({ UUID: "com.gabriel-pietroluongo.bf6-stats.update" })
export class UpdateAction extends SingletonAction<UpdateSettings> {
  override async onKeyDown(ev: KeyDownEvent<UpdateSettings>): Promise<void> {
    const { settings } = ev.payload;
    await ev.action.setTitle("loading...");

    streamDeck.logger.info(`user requested update!`);

    if (!settings.profileId) {
      streamDeck.logger.error(
        `attempted to update stats without profile id set!`
      );
      await ev.action.showAlert();
      return;
    }

    try {
      const targetUrl = `https://api.tracker.gg/api/v2/bf6/standard/profile/ign/${settings.profileId}`;
      for (const action of streamDeck.actions) {
        streamDeck.logger.info(`action manifestId: ${action.manifestId}`);
        if (
          action.manifestId === "com.gabriel-pietroluongo.bf6-stats.display"
        ) {
          streamDeck.logger.info("dispatching.....");
          await action.setTitle("");
        }
      }
      streamDeck.logger.info(`hitting ${targetUrl}`);
      const data = await fetch(targetUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36,",
        },
      });

      if (!data.ok) {
        streamDeck.logger.error(`response has error! ${await data.text()}`);
        await ev.action.setTitle("ERROR!");
        setTimeout(() => {
          ev.action.setTitle("");
        }, 2000);
        return;
      }

      streamDeck.logger.info(`response received: ${data}`);
      const result: Response = (await data.json()) as Response;
      await fs.writeFile("./data.json", JSON.stringify(result));
      await ev.action.setTitle("OK!");
      setTimeout(() => {
        ev.action.setTitle("");
      }, 2000);
    } catch (e) {
      await ev.action.setTitle("failed!");
      streamDeck.logger.error(e);
      setTimeout(() => {
        ev.action.setTitle("");
      }, 2000);
    }
  }
}
