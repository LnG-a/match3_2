import {
  _decorator,
  Component,
  CCString,
  assetManager,
  log,
  director,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("StartScene")
export class StartScene extends Component {
  @property(CCString)
  bundleGameName: string = "";

  @property(CCString)
  sceneName: string = "";

  onLoad() {
    console.log("CHECKPOINT1");

    assetManager.loadBundle(this.bundleGameName, (err, bundle) => {
      console.log("CHECKPOINT2");

      if (err) {
        console.log("CHECKPOINT3");

        log("@@@ loadBundle error: " + this.bundleGameName);
      } else {
        console.log("CHECKPOINT4");

        bundle.loadScene(this.sceneName, (err, scene) => {
          if (err) {
            console.log("CHECKPOINT5");

            log("@@@ loadScene error: " + this.sceneName);
          } else {
            director.runScene(scene);
            console.log("CHECKPOINT6");
          }
        });
      }
    });
  }
}
