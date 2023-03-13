import {
  _decorator,
  Component,
  SpriteFrame,
  resources,
  Sprite,
  Node,
  tween,
  v3,
  EventTouch,
} from "cc";
import { m3_MainGame } from "./m3_MainGame";
const { ccclass, property } = _decorator;

@ccclass("m3_Gem")
export class Gem extends Component {
  @property({ type: SpriteFrame })
  private blue = null;
  @property({ type: SpriteFrame })
  private green = null;
  @property({ type: SpriteFrame })
  private orange = null;
  @property({ type: SpriteFrame })
  private purple = null;
  @property({ type: SpriteFrame })
  private red = null;
  @property({ type: SpriteFrame })
  private white = null;
  @property({ type: SpriteFrame })
  private yellow = null;

  @property({ type: Number })
  private gemType;

  private gemTypes: Array<SpriteFrame> = null;

  static readonly DEFAULT_VEL = 100;
  static readonly g: number = 0.1;
  static readonly ANGLE: number = 2;
  static readonly MAX_DISTANCE: number = 10;

  static readonly LEFT: number = 0;
  static readonly UP: number = 1;
  static readonly RIGHT: number = 2;
  static readonly DOWN: number = 3;
  private velocity = Gem.DEFAULT_VEL;

  private isDestroying: boolean = false;
  private isFalling: boolean = true;
  private isFocus: boolean = false;
  private isMoving: boolean = false;
  private isNormalGem: boolean = true;
  private isVerticalSuper: boolean = false;
  private isHorizontalSuper: boolean = false;
  private isMega: boolean = false;
  private isUltra: boolean = false;

  onLoad() {
    this.gemTypes = [
      this.blue,
      this.green,
      this.orange,
      this.purple,
      this.red,
      this.white,
      this.yellow,
    ];

    this.node.on(
      Node.EventType.TOUCH_START,
      (event) => {
        if (this.isFalling) return;
        this.isFocus = true;
      },
      this.node
    );

    this.node.on(
      Node.EventType.TOUCH_MOVE,
      (event: EventTouch) => {
        if (this.isFocus) {
          let deltaX = event.getLocation().x - event.getStartLocation().x;
          let deltaY = event.getLocation().y - event.getStartLocation().y;
          if (this.distance(deltaX, deltaY) > Gem.MAX_DISTANCE) {
            let direction = this.checkDirection(deltaX, deltaY);
            this.isFocus = false;
            if (this.isDestroying) return;
            this.node.parent
              .getComponent(m3_MainGame)
              .switchGem(this.node, direction);
          }
        }
      },
      this.node
    );

    this.node.on(
      Node.EventType.TOUCH_CANCEL,
      (event: EventTouch) => {
        this.isFocus = false;
      },
      this.node
    );

    this.node.on(
      Node.EventType.TOUCH_END,
      (event: EventTouch) => {
        this.isFocus = false;
      },
      this.node
    );

    this.node.getChildByName("horizontal_super").active = false;
    this.node.getChildByName("vertical_super").active = false;
    this.node.getChildByName("mega").active = false;
    this.node.getChildByName("ultra").active = false;
    let randomNum = m3_MainGame.randomNumber(20);
    // if (randomNum == 0) {
    //   this.node.getChildByName("mega").active = true;
    //   this.isMega = true;
    // }
    // if (randomNum == 1) {
    //   this.node.getChildByName("vertical_super").active = true;
    //   this.isVerticalSuper = true;
    // }
    // if (randomNum == 2) {
    //   this.node.getChildByName("horizontal_super").active = true;
    //   this.isHorizontalSuper = true;
    // }
    if (randomNum == 4) {
      this.node.getChildByName("ultra").active = true;
      this.isNormalGem = false;
      this.isUltra = true;
    }
  }

  update(deltaTime: number) {
    if (this.isFocus) {
      let currentPos = this.node.getPosition();
      this.node.parent
        .getComponent(m3_MainGame)
        .focusOn(currentPos.x, currentPos.y);
    }

    if (!this.isMoving) {
      if (this.node.parent.getComponent(m3_MainGame).checkCollide(this.node)) {
        this.isFalling = false;
        this.velocity = Gem.DEFAULT_VEL;
      } else {
        this.isFalling = true;
      }
    }

    if (this.isFalling) {
      this.falling();
    }
  }

  static loadSpriteFrame(path: string) {
    resources.load(path, SpriteFrame, (err, sprite) => {
      if (err) {
        console.error(err);
      }
      return sprite;
    });
  }

  destroying() {
    //regenerate

    if (this.isDestroying) return;

    this.isDestroying = true;

    let currentPos = this.node.getPosition();
    this.node.parent.getComponent(m3_MainGame).generateGem(
      (currentPos.x - m3_MainGame.OFFSET_X) / 40,
      // -(currentPos.y - m3_MainGame.OFFSET_Y) / 40
      0
    );

    if (this.isVerticalSuper)
      this.node.parent.getComponent(m3_MainGame).superExplode(currentPos, true);

    if (this.isHorizontalSuper)
      this.node.parent
        .getComponent(m3_MainGame)
        .superExplode(currentPos, false);

    if (this.isMega)
      this.node.parent.getComponent(m3_MainGame).megaExplode(currentPos);

    if (this.isUltra)
      this.node.parent.getComponent(m3_MainGame).ultraExplode(this.gemType);

    tween(this.node)
      .to(0.1, { scale: v3(1.1, 1.1, 1) })
      .to(0.2, { scale: v3(0, 0, 1) })
      .call(() => {
        this.node.destroy();
      })
      .start();
  }

  falling() {
    let newPos = this.node.getPosition();
    newPos.y -= this.velocity;
    this.velocity += Gem.g;
    this.node.setPosition(newPos.x, newPos.y, 1);
  }

  changeType(after: number) {
    this.gemType = after;
    this.node.getComponent(Sprite).spriteFrame = this.gemTypes[after];
    // "art/gems/blue/spriteFrame"
  }

  checkDirection(deltaX: number, deltaY: number) {
    if (deltaX / deltaY >= Gem.ANGLE || deltaX / deltaY <= -Gem.ANGLE) {
      if (deltaX < 0) return Gem.LEFT;
      else return Gem.RIGHT;
    }
    if (deltaY / deltaX >= Gem.ANGLE || deltaY / deltaX <= -Gem.ANGLE) {
      if (deltaY < 0) return Gem.DOWN;
      else return Gem.UP;
    }
    return null;
  }

  distance(deltaX: number, deltaY: number) {
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  onDestroy() {
    this.node.off(Node.EventType.TOUCH_START, null, this.node);
  }

  getGemType() {
    return this.gemType;
  }

  getIsDestroying() {
    return this.isDestroying;
  }

  getIsMoving() {
    return this.isMoving;
  }

  getIsFalling() {
    return this.isFalling;
  }

  setIsFalling(isFalling: boolean) {
    this.isFalling = isFalling;
  }

  setIsMoving(isMoving: boolean) {
    this.isMoving = isMoving;
  }

  setIsHorizontalSuper(isHorizontalSuper: boolean) {
    this.isHorizontalSuper = isHorizontalSuper;
  }
  getIsHorizontalSuper() {
    return this.isHorizontalSuper;
  }
  setIsVerticalSuper(isVerticalSuper: boolean) {
    this.isVerticalSuper = isVerticalSuper;
  }

  getIsVerticalSuper() {
    return this.isVerticalSuper;
  }

  setIsMega(isMega: boolean) {
    this.isMega = isMega;
  }

  getIsMega() {
    return this.isMega;
  }

  setIsUltra(isUltra: boolean) {
    this.isUltra = isUltra;
  }

  getIsUltra() {
    return this.isUltra;
  }

  setIsNormalGem(isNormalGem: boolean) {
    this.isNormalGem = isNormalGem;
  }

  getIsNormalGem() {
    return this.isNormalGem;
  }
}
