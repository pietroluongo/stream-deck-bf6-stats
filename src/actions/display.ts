import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
  TitleParametersDidChangeEvent,
  WillAppearEvent,
} from "@elgato/streamdeck";
import fs, { WatchListener } from "fs";
import fsAsync from "fs/promises";
import _ from "lodash";

type DisplaySettings = {
  fieldToRender?: string;
};

@action({ UUID: "com.gabriel-pietroluongo.bf6-stats.display" })
export class DisplayAction extends SingletonAction<DisplaySettings> {
  private watcher?: fs.FSWatcher;

  override async onWillAppear(
    ev: WillAppearEvent<DisplaySettings>
  ): Promise<void> {
    streamDeck.logger.info("ON WILL APPEAR!!!!");
    await this.setTitleFromField(ev);
    // this.updateWatcher(
    //   ev.action.setTitle,
    //   (await ev.action.getSettings()).fieldToRender
    // );
  }

  //   override async onDidReceiveSettings(
  //     ev: DidReceiveSettingsEvent<DisplaySettings>
  //   ): Promise<void> {
  //     this.updateWatcher(
  //       ev.action.setTitle,
  //       (await ev.action.getSettings()).fieldToRender
  //     );
  //   }

  //   private async updateWatcher(
  //     setTitle: (a: string) => Promise<void>,
  //     fieldToRender?: string
  //   ) {
  //     this.watcher = fs.watch("./data.json", async (eventType) => {
  //       if (eventType === "change") {
  //         streamDeck.logger.info(`WATCHER TRIGGER!!!`);
  //         const file = await fsAsync.readFile("./data.json");
  //         const data = _.get(
  //           JSON.parse(file.toString()),
  //           fieldToRender ?? "",
  //           "FAIL"
  //         ) as string;
  //         await setTitle(data);
  //       }
  //     });
  //   }

  override async onKeyDown(ev: KeyDownEvent<DisplaySettings>): Promise<void> {
    await this.setTitleFromField(ev);
  }

  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<DisplaySettings>
  ): Promise<void> {
    await this.setTitleFromField(ev);
  }

  private async setTitleFromField(
    ev:
      | DidReceiveSettingsEvent<DisplaySettings>
      | WillAppearEvent<DisplaySettings>
      | KeyDownEvent<DisplaySettings>
  ) {
    streamDeck.logger.info("GETTING DATA FROM FILE!!!");
    const file = await fsAsync.readFile("./data.json");
    const parsed = JSON.parse(file.toString());

    const fieldToRender = (await ev.action.getSettings()).fieldToRender;
    const displayValue = `${fieldToRender}.displayValue`;
    const displayName = `${fieldToRender}.displayName`;

    const value = _.get(parsed, displayValue ?? "", displayValue) as string;

    const name = _.get(parsed, displayName ?? "", displayName) as string;
    await ev.action.setTitle(`${name}\n${value}`);
  }
}
