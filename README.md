# RPG Maker MV Custom Core

This is a custom core for RPG Maker MV. It is based on the default core, but with some changes.

> :warning: This core is WIP

## Backstory

We are currently working on the game [Traveler](https://traveler-rpg.dev).
It uses [RPG Maker MV](https://rpgmakerofficial.com/product/mv/) which isn't updated/maintained anymore since a few years.

It contains a lot of bugs and some features are missing. Some stuff looks pretty ugly (like error messages).
So we started rewriting the core.

Some people came and asked whether we can provide our rewritten core to them.
So here we are.

## Version Overview

| Name                                       | Version                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| [RPG Core](NewData/js/rpg_core.js)         | v1.6.2-custom                                                  |
| [RPG Managers](NewData/js/rpg_managers.js) | v1.6.2-custom                                                  |
| [RPG Objects](jNewData/s/rpg_objects.js)   | v1.6.2-custom                                                  |
| [RPG Scenes](NewData/js/rpg_scenes.js)     | v1.6.2-custom                                                  |
| [RPG Sprites](NewData/js/rpg_sprites.js)   | v1.6.2-custom                                                  |
| [RPG Windows](NewData/js/rpg_windows.js)   | v1.6.2-custom                                                  |
| [Pixi.js](NewData/js/libs/pixi.js)         | [v4.5.6](https://github.com/pixijs/pixijs/releases/tag/v4.5.6) |
| [FPSMeter](NewData/js/libs/fpsmeter.js)    | v0.3.1                                                         |

## Installation

### Installation for RPG Maker MV

1. Download the latest release
2. Copy the whole `NewData` folder into your RPG Maker MV installation
3. Start RPG Maker MV and create a new project

### Installation for existing projects

1. Download the latest release
2. Copy the contents of the `NewData` folder into your project
3. Replace [NewData/index.html#L11](https://github.com/Aiko-IT-Systems/rmmv-core/blob/main/NewData/index.html#L11) with your game title
4. Replace [NewData/package.json#L2](https://github.com/Aiko-IT-Systems/rmmv-core/blob/main/NewData/package.json#L2) & [NewData/package.json#L7](https://github.com/Aiko-IT-Systems/rmmv-core/blob/main/NewData/package.json#L7) with your game title and [NewData/package.json#L3](https://github.com/Aiko-IT-Systems/rmmv-core/blob/main/NewData/package.json#L2) with your game description

## Changes

TODO