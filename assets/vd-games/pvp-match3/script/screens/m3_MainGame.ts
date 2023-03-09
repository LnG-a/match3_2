import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  tween,
  v3,
  Vec3,
  random,
} from "cc";
import { Gem } from "./m3_Gem";
const { ccclass, property } = _decorator;

@ccclass("m3_MainGame")
export class m3_MainGame extends Component {
  @property({ type: Prefab })
  private nodeDemo: Prefab = null;

  static readonly SCREEN_WIDTH = 375;
  static readonly SCREEN_HEIGHT = 812;
  static readonly OFFSET_X = -159.5 + 20;
  static readonly OFFSET_Y = 379 - 20;
  static readonly GENERATE_Y = m3_MainGame.SCREEN_HEIGHT / 2 + 160;

  static readonly BOARD_WIDTH = 7;
  static readonly BOARD_HEIGHT = 7;
  static readonly TYPE = 5;
  static readonly BASE_Y =
    m3_MainGame.OFFSET_Y - 40 * (m3_MainGame.BOARD_HEIGHT - 1);
  private print: boolean = false;

  board: number[][] = new Array();

  onLoad() {
    this.startGame();
  }

  update(deltaTime: number) {
    if (this.canMakeMove()) this.checkMatchAuto(null);
    if (this.checkOutOfMoves()) {
      console.log("OUT OF MOVES");
      this.startGame();
    }
  }

  switchGem(firstGem: Node, direction: number) {
    if (!this.canMakeMove()) return;
    this.node.getChildByName("focusFrame").active = false;

    let directionX;
    let directionY;
    let firstPos = firstGem.getPosition();

    let firstOrdinate = m3_MainGame.convertPosToOrdinate(firstPos);

    let secondGem: Node;
    switch (direction) {
      case Gem.LEFT: {
        if (firstOrdinate.x <= 0) return;
        directionX = -1;
        directionY = 0;
        break;
      }
      case Gem.UP: {
        if (firstOrdinate.y <= 0) return;
        directionX = 0;
        directionY = 1;
        break;
      }
      case Gem.RIGHT: {
        if (firstOrdinate.x >= m3_MainGame.BOARD_WIDTH - 1) return;
        directionX = 1;
        directionY = 0;
        break;
      }
      case Gem.DOWN: {
        if (firstOrdinate.y >= m3_MainGame.BOARD_HEIGHT - 1) return;
        directionX = 0;
        directionY = -1;
        break;
      }
      default:
        return;
    }

    let secondPos = v3(
      firstPos.x + 40 * directionX,
      firstPos.y + 40 * directionY,
      1
    );

    secondGem = this.findGemByPos(secondPos);
    if (secondGem == null || !secondGem.active) return;

    let fakeNode = instantiate(this.nodeDemo);
    fakeNode.parent = this.node;
    fakeNode.setPosition(firstPos);
    fakeNode.active = false;

    let fakeNode2 = instantiate(this.nodeDemo);
    fakeNode2.parent = this.node;
    fakeNode2.setPosition(secondPos);
    fakeNode2.active = false;

    firstGem.getComponent(Gem).setIsMoving(true);
    secondGem.getComponent(Gem).setIsMoving(true);

    tween(firstGem)
      .to(
        0.4,
        {
          position: secondPos,
        },
        { easing: "cubicOut" }
      )
      .start();

    tween(secondGem)
      .to(
        0.4,
        {
          position: firstPos,
        },
        { easing: "cubicOut" }
      )
      .call(() => {
        firstGem.getComponent(Gem).setIsMoving(false);
        secondGem.getComponent(Gem).setIsMoving(false);
        if (this.checkMatchAuto(firstPos)) {
          fakeNode.destroy();
          fakeNode2.destroy();
        } else {
          this.moveBack(
            firstGem,
            firstPos,
            secondGem,
            secondPos,
            fakeNode,
            fakeNode2
          );
        }
      })
      .start();
  }

  moveBack(
    firstGem: Node,
    firstPos: Vec3,
    secondGem: Node,
    secondPos: Vec3,
    fakeNode: Node,
    fakeNode2: Node
  ) {
    firstGem.getComponent(Gem).setIsMoving(true);
    secondGem.getComponent(Gem).setIsMoving(true);
    tween(secondGem)
      .to(
        0.4,
        {
          position: secondPos,
        },
        { easing: "cubicOut" }
      )
      .call(() => {
        firstGem.getComponent(Gem).setIsMoving(false);
      })
      .start();

    tween(firstGem)
      .to(
        0.4,
        {
          position: firstPos,
        },
        { easing: "cubicOut" }
      )
      .call(() => {
        secondGem.getComponent(Gem).setIsMoving(false);
        fakeNode.destroy();
        fakeNode2.destroy();
      })
      .start();
  }

  checkCollide(gem: Node) {
    let pos = gem.getPosition();
    let ordinate = m3_MainGame.convertPosToOrdinate(pos);

    for (let i in this.node.children) {
      if (
        this.node.children[i] == gem ||
        //!this.node.children[i].active ||
        this.node.children[i].getComponent(Gem) == null
      ) {
        continue;
      }

      let otherPos = this.node.children[i].getPosition();

      if (
        pos.x > otherPos.x - 20 &&
        pos.x < otherPos.x + 20 &&
        pos.y > otherPos.y
      ) {
        if (pos.y < otherPos.y + 40) {
          gem.setPosition(pos.x, otherPos.y + 40, 1);
          return true;
        } else if (pos.y == otherPos.y + 40) {
          return true;
        }
      }
    }

    if (pos.y <= m3_MainGame.BASE_Y) {
      gem.setPosition(pos.x, m3_MainGame.BASE_Y, 1);
      return true;
    }
    return false;
  }

  checkMatchAuto(pos: Vec3) {
    if (pos != null) console.log("checkOnMove");
    let matched = false;
    let typeGems = new Array();
    let ordinate: Vec3;
    if (pos != null) ordinate = m3_MainGame.convertPosToOrdinate(pos);

    //set up a array
    for (let i = 0; i < m3_MainGame.BOARD_HEIGHT; i++) {
      typeGems.push(new Array());
    }
    for (let x = 0; x < m3_MainGame.BOARD_HEIGHT; x++) {
      for (let y = 0; y < m3_MainGame.BOARD_WIDTH; y++) {
        let checkedGem = this.findGemByOrdinate(v3(x, y, 0));
        if (checkedGem == null || checkedGem.getComponent(Gem).getIsFalling()) {
          typeGems[x].push(-1);
        } else {
          typeGems[x].push(checkedGem.getComponent(Gem).getGemType());
        }
      }
    }

    let stack = 1;

    //Check column
    for (let x = 0; x < m3_MainGame.BOARD_WIDTH; x++) {
      stack = 1;
      for (let y = 0; y < m3_MainGame.BOARD_HEIGHT - 1; y++) {
        if (typeGems[x][y] == -1) stack = 0;
        if (typeGems[x][y] == typeGems[x][y + 1]) stack++;
        else {
          if (stack >= 3) {
            matched = true;

            //Check for super
            let superY = -1;
            if (stack == 4) {
              if (pos != null) {
                superY = ordinate.y;
              } else {
                superY = y - 2;
              }
              this.createVerticalSuper(x, superY);
            }

            //Check for mega
            let megaY = this.checkMega(typeGems, x, y - stack, y);

            //Check for ultra
            let ultraY = -1;
            if (stack == 5) {
              ultraY = y - 2;
              this.createUltra(x, ultraY);
            }

            for (let i = y; i > Math.max(y - stack, -1); i--) {
              if (i == megaY) continue;
              if (i == superY) continue;
              if (i == ultraY) continue;
              typeGems[x][i] = -1;
              // let newNode = this.findGemByOrdinate(v3(x, i, 0));
              // if (newNode == null) {
              //   console.log("found null");
              //   continue;
              // }
              // newNode.getComponent(Gem).destroying();
            }
          }
          stack = 1;
        }

        if (y == m3_MainGame.BOARD_HEIGHT - 2 && stack >= 3) {
          matched = true;

          //Check for super
          let superY = -1;
          if (stack == 4) {
            if (pos != null) {
              superY = ordinate.y;
            } else {
              superY = y - 1;
            }
            this.createVerticalSuper(x, superY);
          }

          //Check for mega
          let megaY = this.checkMega(typeGems, x, y + 1 - stack, y + 1);

          //Check for ultra
          let ultraY = -1;
          if (stack == 5) {
            if (pos != null) {
              ultraY = ordinate.y;
            } else {
              ultraY = y - 1;
            }
            this.createUltra(x, ultraY);
          }

          for (let i = y + 1; i > y + 1 - stack; i--) {
            if (i == megaY) continue;
            if (i == superY) continue;
            if (i == ultraY) continue;
            typeGems[x][i] = -1;
            // let newNode = this.findGemByOrdinate(v3(x, i, 0));
            // if (newNode == null) continue;
            // newNode.getComponent(Gem).destroying();
          }
          stack = 1;
        }
      }
    }

    //Check row
    for (let y = 0; y < m3_MainGame.BOARD_HEIGHT; y++) {
      stack = 1;
      for (let x = 0; x < m3_MainGame.BOARD_WIDTH - 1; x++) {
        if (typeGems[x][y] == -1) stack = 0;
        if (typeGems[x][y] == typeGems[x + 1][y]) stack++;
        else {
          if (stack >= 3) {
            matched = true;
            //Check for super
            let superX = -1;
            if (stack == 4) {
              if (pos != null) {
                superX = ordinate.x;
              } else {
                superX = x - stack + 1;
              }
              this.createHorizontalSuper(superX, y);
            }

            //Check for ultra
            let ultraX = -1;
            if (stack == 5) {
              if (pos != null) {
                ultraX = ordinate.x;
              } else {
                ultraX = x - stack + 1;
              }
              this.createUltra(ultraX, y);
            }

            for (let i = x; i > Math.max(x - stack, -1); i--) {
              if (i == superX) continue;
              if (i == ultraX) continue;
              typeGems[i][y] = -1;
              // let newNode = this.findGemByOrdinate(v3(i, y, 0));
              // if (newNode == null) continue;
              // newNode.getComponent(Gem).destroying();
            }
          }
          stack = 1;
        }
        if (x == m3_MainGame.BOARD_WIDTH - 2 && stack >= 3) {
          matched = true;

          //Check for super\
          let superX = -1;
          if (stack == 4) {
            if (pos != null) {
              superX = ordinate.x;
            } else {
              superX = x - stack + 2;
            }
            this.createHorizontalSuper(superX, y);
          }

          //Check for ultra
          let ultraX = -1;
          if (stack == 5) {
            console.log(pos);
            if (pos != null) {
              ultraX = ordinate.x;
            } else {
              ultraX = x - stack + 2;
            }
            this.createUltra(ultraX, y);
          }

          for (let i = x + 1; i > x + 1 - stack; i--) {
            if (i == superX) continue;
            if (i == ultraX) continue;
            typeGems[i][y] = -1;
            // let newNode = this.findGemByOrdinate(v3(i, y, 0));
            // if (newNode == null) continue;
            //newNode.getComponent(Gem).destroying();
          }

          stack = 1;
        }
      }
    }

    //destroy
    for (let y = 0; y < m3_MainGame.BOARD_HEIGHT; y++)
      for (let x = 0; x < m3_MainGame.BOARD_WIDTH; x++) {
        if (typeGems[x][y] == -1) {
          let newNode = this.findGemByOrdinate(v3(x, y, 0));
          if (newNode == null) {
            console.log("destroy found null");
            continue;
          }
          newNode.getComponent(Gem).destroying();
        }
      }

    return matched;
  }

  checkOutOfMoves() {
    let typeGems = new Array();

    for (let i = 0; i < m3_MainGame.BOARD_HEIGHT; i++) {
      typeGems.push(new Array());
    }

    for (let x = 0; x < m3_MainGame.BOARD_HEIGHT; x++) {
      for (let y = 0; y < m3_MainGame.BOARD_WIDTH; y++) {
        let checkedGem = this.findGemByOrdinate(v3(x, y, 0));
        if (checkedGem == null || checkedGem.getComponent(Gem).getIsFalling()) {
          return;
        }
        typeGems[x].push(checkedGem.getComponent(Gem).getGemType());
      }
    }

    for (let x = 0; x < m3_MainGame.BOARD_WIDTH; x++) {
      for (let y = 0; y < m3_MainGame.BOARD_HEIGHT; y++) {
        if (this.checkGemMatch(typeGems, x, y)) {
          return false;
        }
      }
    }
    return true;
  }

  checkGemMatch(typeGems: number[][], x: number, y: number) {
    let temp: number;
    let check: boolean;
    for (let direction = 0; direction < 4; direction++) {
      switch (direction) {
        case Gem.LEFT: {
          if (x == 0) continue;
          temp = typeGems[x][y];
          typeGems[x][y] = typeGems[x - 1][y];
          typeGems[x - 1][y] = temp;

          if (this.precheckMatch(typeGems)) return true;

          typeGems[x - 1][y] = typeGems[x][y];
          typeGems[x][y] = temp;

          break;
        }
        case Gem.UP: {
          if (y == 0) continue;
          temp = typeGems[x][y];
          typeGems[x][y] = typeGems[x][y + 1];
          typeGems[x][y + 1] = temp;

          if (this.precheckMatch(typeGems)) return true;

          typeGems[x][y + 1] = typeGems[x][y];
          typeGems[x][y] = temp;

          break;
        }
        case Gem.RIGHT: {
          if (x == m3_MainGame.BOARD_WIDTH - 1) continue;
          temp = typeGems[x][y];
          typeGems[x][y] = typeGems[x + 1][y];
          typeGems[x + 1][y] = temp;

          if (this.precheckMatch(typeGems)) return true;

          typeGems[x + 1][y] = typeGems[x][y];
          typeGems[x][y] = temp;

          break;
        }
        case Gem.DOWN: {
          if (y == m3_MainGame.BOARD_WIDTH - 1) continue;
          temp = typeGems[x][y];
          typeGems[x][y] = typeGems[x][y - 1];
          typeGems[x][y - 1] = temp;

          if (this.precheckMatch(typeGems)) return true;

          typeGems[x][y - 1] = typeGems[x][y];
          typeGems[x][y] = temp;

          break;
        }
        default:
          break;
      }
    }
    return false;
  }

  canMakeMove() {
    for (let i in this.node.children) {
      if (this.node.children[i].getComponent(Gem) == null) continue;
      if (
        this.node.children[i].getComponent(Gem).getIsFalling() ||
        this.node.children[i].getComponent(Gem).getIsMoving()
      )
        return false;
    }
    return true;
  }

  checkMega(typeGems: number[][], megaX: number, start: number, end: number) {
    let stack = 1;
    for (let y = end; y > start; y--) {
      stack = 1;
      for (
        let x = Math.max(megaX - 2, 0);
        x < Math.min(megaX + 2, m3_MainGame.BOARD_WIDTH - 1);
        x++
      ) {
        if (typeGems[x][y] == -1) stack = 0;
        if (typeGems[x][y] == typeGems[x + 1][y]) stack++;
        else {
          if (stack >= 3) {
            for (let i = x; i > Math.max(x - stack, -1); i--) {
              let newNode = this.findGemByOrdinate(v3(i, y, 0));
              if (newNode == null) {
                console.log("null");
                continue;
              }
              if (i == megaX) {
                this.createMega(newNode);
                continue;
              }
              typeGems[i][y] = -1;

              // if (newNode != null) newNode.getComponent(Gem).destroying();
            }
            return y;
          }
          stack = 1;
        }
        if (
          x == Math.min(megaX + 1, m3_MainGame.BOARD_WIDTH - 2) &&
          stack >= 3
        ) {
          for (let i = x + 1; i > x + 1 - stack; i--) {
            let newNode = this.findGemByOrdinate(v3(i, y, 0));
            if (newNode == null) {
              console.log("null");
              continue;
            }
            if (i == megaX) {
              this.createMega(newNode);
              continue;
            }
            typeGems[i][y] = -1;

            // if (newNode != null) newNode.getComponent(Gem).destroying();
          }
          return y;
        }
      }
    }
    return -1;
  }

  createVerticalSuper(x: number, y: number) {
    let newNode = this.findGemByOrdinate(v3(x, y, 0));
    if (newNode != null) this.specialGemExplode(newNode);
    newNode.getChildByName("vertical_super").active = true;
    newNode.getComponent(Gem).setIsVerticalSuper(true);
    newNode.getComponent(Gem).setIsNormalGem(false);
  }

  createHorizontalSuper(x: number, y: number) {
    let newNode = this.findGemByOrdinate(v3(x, y, 0));
    if (newNode != null) this.specialGemExplode(newNode);
    newNode.getChildByName("horizontal_super").active = true;
    newNode.getComponent(Gem).setIsHorizontalSuper(true);
    newNode.getComponent(Gem).setIsNormalGem(false);
  }

  createMega(newNode: Node) {
    this.specialGemExplode(newNode);
    newNode.getChildByName("mega").active = true;
    newNode.getComponent(Gem).setIsMega(true);
    newNode.getComponent(Gem).setIsNormalGem(false);
  }

  createUltra(x: number, y: number) {
    let newNode = this.findGemByOrdinate(v3(x, y, 0));
    if (newNode != null) this.specialGemExplode(newNode);
    newNode.getChildByName("ultra").active = true;
    newNode.getComponent(Gem).setIsUltra(true);
    newNode.getComponent(Gem).setIsNormalGem(false);
  }

  specialGemExplode(gemCheck: Node) {
    let gemComponent = gemCheck.getComponent(Gem);
    if (gemComponent.getIsNormalGem()) return;

    if (gemComponent.getIsVerticalSuper()) {
      this.superExplode(gemCheck.position, true);
      gemCheck.getChildByName("vertical_super").active = false;
      gemComponent.setIsVerticalSuper(false);
    }
    if (gemComponent.getIsHorizontalSuper()) {
      this.superExplode(gemCheck.position, false);
      gemCheck.getChildByName("horizontal_super").active = false;
      gemComponent.setIsHorizontalSuper(false);
    }
    if (gemComponent.getIsMega()) {
      this.megaExplode(gemCheck.position);
      gemCheck.getChildByName("mega").active = false;
      gemComponent.setIsMega(false);
    }
    if (gemComponent.getIsUltra()) {
      gemCheck.getChildByName("ultra").active = false;
      gemComponent.setIsUltra(false);
      this.ultraExplode(gemComponent.getGemType());
    }
  }

  superExplode(pos: Vec3, vertical: boolean) {
    let ordinate = m3_MainGame.convertPosToOrdinate(pos);
    if (vertical) {
      for (let i = 0; i < m3_MainGame.BOARD_HEIGHT; i++) {
        if (i == ordinate.y) continue;
        let newNode = this.findGemByOrdinate(v3(ordinate.x, i, 0));
        if (newNode == null) continue;
        newNode.getComponent(Gem).destroying();
      }
    } else {
      for (let i = 0; i < m3_MainGame.BOARD_WIDTH; i++) {
        if (i == ordinate.x) continue;
        let newNode = this.findGemByOrdinate(v3(i, ordinate.y, 0));
        if (newNode == null) continue;
        newNode.getComponent(Gem).destroying();
      }
    }
  }

  megaExplode(pos: Vec3) {
    let ordinate = m3_MainGame.convertPosToOrdinate(pos);
    for (let x = ordinate.x - 1; x <= ordinate.x + 1; x++) {
      for (let y = ordinate.y - 1; y <= ordinate.y + 1; y++) {
        if (x == ordinate.x && y == ordinate.y) continue;
        let newNode = this.findGemByOrdinate(v3(x, y, 0));
        if (newNode != null) newNode.getComponent(Gem).destroying();
      }
    }
    let newNode = this.findGemByOrdinate(v3(ordinate.x - 2, ordinate.y, 0));
    if (newNode != null) newNode.getComponent(Gem).destroying();

    newNode = this.findGemByOrdinate(v3(ordinate.x + 2, ordinate.y, 0));
    if (newNode != null) newNode.getComponent(Gem).destroying();

    newNode = this.findGemByOrdinate(v3(ordinate.x, ordinate.y - 2, 0));
    if (newNode != null) newNode.getComponent(Gem).destroying();

    newNode = this.findGemByOrdinate(v3(ordinate.x, ordinate.y + 2, 0));
    if (newNode != null) newNode.getComponent(Gem).destroying();
  }

  ultraExplode(type: number) {
    let count = 0;
    while (count < 12) {
      for (let i in this.node.children) {
        let a = m3_MainGame.randomNumber(49);
        if (
          this.node.children[i].active &&
          this.node.children[i].getComponent(Gem) != null &&
          a < 11
        ) {
          this.node.children[i].getComponent(Gem).destroying();
          count++;
          if (count >= 12) break;
        }
      }
    }
  }

  precheckMatch(typeGems: number[][]) {
    for (let x = 0; x <= m3_MainGame.BOARD_WIDTH - 1; x++) {
      for (let y = 0; y <= m3_MainGame.BOARD_HEIGHT - 1; y++) {
        if (
          (x == 0 && y == 0) ||
          (x == 0 && y == m3_MainGame.BOARD_HEIGHT - 1) ||
          (x == m3_MainGame.BOARD_WIDTH - 1 && y == 0) ||
          (x == m3_MainGame.BOARD_WIDTH - 1 &&
            y == m3_MainGame.BOARD_HEIGHT - 1)
        ) {
          continue;
        } else if (x == 0 || x == m3_MainGame.BOARD_WIDTH - 1) {
          if (
            typeGems[x][y] == typeGems[x][y + 1] &&
            typeGems[x][y] == typeGems[x][y - 1]
          )
            return true;
        } else if (y == 0 || y == m3_MainGame.BOARD_HEIGHT - 1) {
          if (
            typeGems[x][y] == typeGems[x + 1][y] &&
            typeGems[x][y] == typeGems[x - 1][y]
          )
            return true;
        } else {
          if (
            (typeGems[x][y] == typeGems[x][y + 1] &&
              typeGems[x][y] == typeGems[x][y - 1]) ||
            (typeGems[x][y] == typeGems[x + 1][y] &&
              typeGems[x][y] == typeGems[x - 1][y])
          )
            return true;
        }
      }
    }
    return false;
  }

  generateGem(i: number, j: number) {
    let node = instantiate(this.nodeDemo);
    node.parent = this.node;
    node
      .getComponent(Gem)
      .changeType(m3_MainGame.randomNumber(m3_MainGame.TYPE));

    node.setPosition(
      m3_MainGame.OFFSET_X + 40 * i,
      m3_MainGame.GENERATE_Y + 40 * j,
      //+ m3_MainGame.OFFSET_Y - 40 * j
      0
    );
  }

  focusOn(x: number, y: number) {
    let focusFrame = this.node.getChildByName("focusFrame");
    focusFrame.setPosition(x, y, 1);
    focusFrame.active = true;
  }

  findGemByPos(checkPos: Vec3) {
    for (let i in this.node.children) {
      if (
        this.node.children[i].active &&
        this.node.children[i].getPosition().x == checkPos.x &&
        this.node.children[i].getPosition().y >= checkPos.y - 10 &&
        this.node.children[i].getPosition().y <= checkPos.y + 10 &&
        this.node.children[i].getComponent(Gem) != null &&
        !this.node.children[i].getComponent(Gem).getIsMoving() &&
        !this.node.children[i].getComponent(Gem).getIsDestroying()
      ) {
        return this.node.children[i];
      }
    }
    return null;
  }

  findGemByOrdinate(checkOrdinate: Vec3) {
    if (
      checkOrdinate.x < 0 ||
      checkOrdinate.y < 0 ||
      checkOrdinate.x > m3_MainGame.BOARD_WIDTH - 1 ||
      checkOrdinate.y > m3_MainGame.BOARD_HEIGHT - 1
    )
      return null;
    let checkPos = m3_MainGame.convertOrdinateToPos(checkOrdinate);
    return this.findGemByPos(checkPos);
  }

  startGame() {
    for (let i in this.node.children) {
      if (this.node.children[i].getComponent(Gem))
        this.node.children[i].destroy();
    }
    for (let i = 0; i < m3_MainGame.BOARD_HEIGHT; i++) {
      for (let j = 0; j < m3_MainGame.BOARD_WIDTH; j++) {
        this.generateGem(i, j);
      }
    }

    this.node.getChildByName("focusFrame").active = false;
  }

  swapMap() {}

  static randomNumber(max: number) {
    return Math.floor(Math.random() * max);
  }

  static convertPosToOrdinate(pos: Vec3) {
    return v3(
      Math.round((pos.x - m3_MainGame.OFFSET_X) / 40),
      Math.round(-(pos.y - m3_MainGame.OFFSET_Y) / 40)
    );
  }

  static convertOrdinateToPos(ordinate: Vec3) {
    return v3(
      ordinate.x * 40 + m3_MainGame.OFFSET_X,
      -ordinate.y * 40 + m3_MainGame.OFFSET_Y
    );
  }
}
