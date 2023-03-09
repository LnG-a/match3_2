import { VDGameConfig } from "../../../../vd-framework/common/VDGameConfig";

export type m3_ConfigType = VDGameConfig & {
  win_coin: number;
};

export const m3_Config: m3_ConfigType = {
  GAME_ID: "1000",
  GAME_NAME: "match_3",
  versionGame: "1.0.0",
  isShowFPS: true,
  isUnitTest: true,
  //------ extends
  win_coin: 1000,
};
