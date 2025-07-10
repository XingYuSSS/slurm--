# slurm-- Extension

[![version](https://img.shields.io/badge/version-0.10.0-blue.svg?logo=github)](https://github.com/XingYuSSS/slurm--/blob/v0.10.0/CHANGELOG.md)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/xy-sss.slurm--extension?color=red)](https://marketplace.visualstudio.com/items?itemName=xy-sss.slurm--extension)
[![MIT License](https://img.shields.io/badge/License-MIT-gree.svg)](https://opensource.org/licenses/MIT)

slurm-- is a multifunctional tool for SLURM syntax highlight, manage tasks, view resource, and launch tasks.

We are continuously developing this extension, if there is a feature you would like to see added or if you encounter a bug, please feel free to give us feedback in [github](https://github.com/XingYuSSS/slurm--)!

## features

### syntax highlight

- Support for shell-like scripts, including `.sh`, `.slrum` or `.sbatch` files, etc.

![highlight](assets/pics/highlight.png)

### task manager

- show slurm running tasks and informations

- record running tasks, and confirm them when finished

- sort tasks by id or name

- convenient opening of log files
> Click on `stdout` or `stderr` to open the file

- select multiple running tasks and cancel them
> Select tasks by `ctrl` or `shift` and press `delete` to cancel them

- cancel all running tasks

- [`job array` support](#job-array-support)

![task](assets/pics/task.png)

### resources viewer

- show availabel resources about nodes and GRES

- sort resources by name or availability

- launch terminal with chosen GRES

![resource](assets/pics/resource.png)

### script launcher

- drop script and one-click launch task

![launcher](assets/pics/launcher.png)

> Drop a script from Explorer to launcher panel  
> Click on script to open the file

## language support

We add multilingual support at version `0.6.0`!

Supported Languages:
- en (English)
- zh-cn (简体中文)

We welcome contributions to add more languages or improve existing translations. If you are interested in helping, please submit a pull request. Thank you for your support!

## job array support

We add `job array` support at version `0.9.0`!

![jobarray](assets/pics/jobarray.png)

## License

Slurm-- is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
