import { _decorator, Component, Node } from "cc";
import { m3_MainGame } from "../screens/m3_MainGame";
const { ccclass, property } = _decorator;

@ccclass("m3_Director")
export class m3_Director extends Component {
  private static _instance: m3_Director = null!;

  public static get instance(): m3_Director {
    if (this._instance == null) {
      this._instance = new m3_Director();
    }

    return this._instance;
  }
  playScreen: m3_MainGame | null = null;
}
