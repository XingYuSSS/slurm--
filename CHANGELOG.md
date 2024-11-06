# Change Log

All notable changes to the "slurm--" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased][Unreleased]

## [0.5.1][0.5.1] - 2024-11-06

### Fixed

- Removed unused command `slurm--.refreshing` and button ([#1](https://github.com/XingYuSSS/slurm--/issues/1))

## [0.5.0][0.5.0] - 2024-11-05

### Added

- Add script argument
- Add `add argument`, `delete scripts` and `change scripts` commands and buttons
- Add `args` field in script model
- Add launch srun terminal
- Add `launch terminal` command and button
- Add state of node and more icons

### Changed

- Node in state except `idle` and `mixed` will not count GRES

## [0.4.1][0.4.1] - 2024-11-02

### Added

- Add extension icon

### Changed

- Improving the `readme`
- Fix `changelog`

## [0.4.0][0.4.0] - 2024-10-18

### Added

- Add launcher view
- Add `refresh scripts`, `launch scripts`, `add scripts` and `delete scripts` commands and buttons
- Add `refresh resources` button
- Add drop file controller in launcher view
- Add script service
- Add script model

### Changed

- Replace openfile button with open by click treeview item

## [0.3.1][0.3.1] - 2024-10-13

### Added

- Bundle the extension using webpack

### Fixed

- Fix same state nodes showing together in resource view
- Fix no GRES node showing `(NaN/NaN)` in resource view
- Fix no GRES task showing `(N/A:NaN)` in resource view

## [0.3.0][0.3.0] - 2024-10-12

### Added

- Add resource view
- Add refresh resouces and auto refresh command
- Add copy GRES and node to clipboard by CTRL+C
- Add resouce service
- Add node model

### Changed

- use regex literal instead of RegExp

### Fixed

- Fixed tasks view not refresh after confirm all finished tasks
- Fixed tasks service not save to disk after confirm task and confirm all tasks
- Fixed confirmd tasks not write to disk when multiple users were using the system simultaneously
- Fixed `%J` in outpath

### Removed

- Removed useless `hello world` command

## [0.2.0][0.2.0] - 2024-10-08

### Added

- Add select multiple tasks
- Add cancel all selected tasks
- Add keybindings in `package.json`
- Add icon for more task states
- Inject slurm syntax highlight into shell

### Changed

- Change scripts view to launcher view
- Refactor the code into a more hierarchical structure
- Change required vscode version from ^1.93.0 to ^1.89.0

### Fixed

- Fixed the issue where the GRES and output path of a task fail after load from the disk

## [0.1.2][0.1.2] - 2024-10-05

### Added

- Add task storage
- Add task confirm button
- Add `finished` field in `task` class
- Add some states of task

### Changed

- Finished task will not be removed, but marked as finished
- Task in view will be grouped by finish state
- Changed task tooltip, removed task name

## [0.1.1][0.1.1] - 2024-09-23

### Added

- Add auto refresh switch button
- Add open `.out` and `.err` file button
- Add icon and title for view
- Add Config Manager for read settings
- Add configuration in `package.json`
- Add confirm dialog before cancel task

### Changed

- Change refresh icon
- Refactory init

### Fixed

- Add `readonly` to some fields

## [0.1.0][0.1.0] - 2024-09-19

### Added

- Add slurm View Container
- Add tasks model
- Add tasks command
- Add tasks tree view
  - Add manual refresh
  - Add cancel task
  - Add state icon
  - add more info
- Add GRES
- Add auto refresh
- Add runBash in `utils`

[unreleased]: https://github.com/XingYuSSS/slurm--/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/XingYuSSS/slurm--/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/XingYuSSS/slurm--/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/XingYuSSS/slurm--/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/XingYuSSS/slurm--/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/XingYuSSS/slurm--/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/XingYuSSS/slurm--/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/XingYuSSS/slurm--/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/XingYuSSS/slurm--/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/XingYuSSS/slurm--/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/XingYuSSS/slurm--/tree/v0.1.0
