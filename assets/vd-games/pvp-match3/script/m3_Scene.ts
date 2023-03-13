import { _decorator, Component, log, assetManager, Prefab } from "cc";
import VDAsyncTaskMgr from "../../../vd-framework/async-task/VDAsyncTaskMgr";
import { VDAudioManager } from "../../../vd-framework/audio/VDAudioManager";
import VDScreenManager from "../../../vd-framework/ui/VDScreenManager";
import { m3_Config } from "./common/m3_Config";
const { ccclass, property } = _decorator;

@ccclass("m3_Scene")
export class m3_Scene extends Component {
  onLoad() {
    log("@ _Scene: onLoad  !!!");
    console.log("CHECKPOINT 0 ");

    let bundle = assetManager.getBundle("bundle_" + m3_Config.GAME_NAME);
    if (bundle) {
      this.node.addComponent(VDScreenManager);

      console.log("CHECKPOINT 1 ");
      VDScreenManager.instance.assetBundle = bundle;

      console.log("CHECKPOINT 2 ");
      VDScreenManager.instance.setupCommon();

      console.log("CHECKPOINT 3 ");
      bundle.load("res/prefabs/screen/mainGame", Prefab, (error, prefab) => {
        if (error) {
          log(`bundle.load: ${error}`);
        } else {
          log("load loading success");
          // VDScreenManager.instance.initWithRootScreen(prefab);
          VDScreenManager.instance.initWithRootScreen(prefab, (screen) => {
            log("initWithRootScreen " + screen.name + " success!");
          });
        }
      });
    }
  }

  onDestroy() {
    VDAudioManager.instance.destroy();
    VDAsyncTaskMgr.instance.stop();
  }
}
