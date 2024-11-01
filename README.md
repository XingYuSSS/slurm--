# slurm-- Extension

A extension for slurm system user

## features

- slrum script syntax highlight

![highlight](assets/pics/highlight.png)

- show slurm running tasks and informations
- record task state, and when they finished

![task](assets/pics/task.png)

> Click on `stdout` or `stderr` to open the file

- show availabel resources about nodes and GRES

![resource](assets/pics/resource.png)

- drop script and one-click launch task

![launcher](assets/pics/launcher.png)

> Drop a script from Explorer to launcher panel  
> Click on script to open the file

## future features

- launch task with chosen GRES and timelimit

## TODO

- Task
  - [X] auto task refresh
  - [X] cancel task
  - [X] show gres and command info
  - [X] open log file
  - [X] save tasks to disk
  - [X] Select multiple tasks and cancel
  - [ ] group and count by state, command or start time
  - [ ] start and end time
  - [ ] scripts arguments
- Resources
  - [X] scan availabal GRES and Memory
  - [X] auto refreash
  - [X] copy GRES or node to clipboard
- Script Syntax
  - [X] syntax highlight
- Launcher
  - [X] launch script
  - [X] drop script file to view
  - [ ] start srun
  - [ ] Shell scripts reader
  - [ ] scripts arguments manager
  - [ ] gpu selector
