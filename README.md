# slurm-- Extension

A extension for slurm system user

## features

- show slurm running tasks and informations
- record task state, and when they finished
- slrum script config syntax highlight
- show availabel resources about nodes and GRES

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
  - [ ] Shell scripts reader
  - [ ] scripts arguments manager
  - [ ] cost computer
  - [ ] gpu selector
  - [ ] start srun
