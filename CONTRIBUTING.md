# How to Contribute

Thanks for your interest in contributing to this project! ❤️

We welcome bug reports, feature suggestions, documentation improvements, and code contributions.

Before you begin, please read this guide to understand how to collaborate effectively.

---

## Found a Bug?

- **Check existing issues first**  
  Search the [Issues](https://github.com/XingYuSSS/slurm--/issues) to see if it’s already reported.

- **Open a new issue if needed**  
  Use the appropriate [issue template](https://github.com/XingYuSSS/slurm--/issues/new/choose):
  - **Bug Report**: for unexpected behavior
  - **Feature Request**: for new ideas

  Be sure to include:
  - A clear title and description
  - Steps to reproduce
  - Expected vs. actual behavior

---

## Have a Feature Idea?

- **Discuss first!**  
  Before coding, open a **Feature Request** issue to propose your idea and get feedback. This avoids wasted effort on changes that may not align with the project’s direction.

- **Small, focused changes are preferred**  
  Large or breaking changes should be discussed thoroughly before implementation.

---

## Setting Up the Development Environment

### 1. Fork and Clone
- Click **Fork** on the top-right of [this repository](https://github.com/XingYuSSS/slurm--).
- Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/slurm--.git
cd slurm--
```

### 2. Open in VS Code
```bash
code .
```
> This opens the project as a VS Code workspace.

### 3. Install Dependencies
- Ensure you have **Node.js (v20+)** and **npm** installed.
- Run:
```bash
npm install
```

### 4. Start the Build Watcher
```bash
webpack --mode development --watch
```
> This automatically rebuilds the extension when you edit source files.

### 5. Install the Test Runner
- In VS Code, install the official **[Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)**.

> You only need to do this once per machine.

### 6. Run the Extension
- Open the **Run and Debug** sidebar (`Ctrl+Shift+D` or `Cmd+Shift+D`).
- Select **"Run Extension"** from the dropdown.
- Click ▶️ to launch a new **Extension Development Host** window.
- The extension is now loaded — test it in real time!

> Learn more: [VS Code Extension API Documentation](https://code.visualstudio.com/api)

---

## Submitting Your Changes

Once your changes work locally:

### 1. Commit with a clear message
Use clear, concise commit messages. If possible, follow [Conventional Commits](https://www.conventionalcommits.org/  ) (e.g., `fix:`, `feat:`, `docs:`).
```bash
git add .
git commit -m "feat: add..."
```

### 2. Push to your fork
```bash
git push origin your-branch-name
```

### 3. Open a Pull Request
- Go to your fork on GitHub
- Click **"Compare & pull request"**
- Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
- Reference related issues (e.g., “Closes #123”)

We’ll review your PR as soon as possible! ❤️

---

## Documentation & Minor Fixes

- Typos, grammar fixes, and documentation improvements are **always welcome**!
- Purely cosmetic code changes (e.g., reformatting without functional impact) will generally **not be accepted** unless they fix a real readability or consistency issue.

---

## Thank You!

This project thrives because of contributors like you.  
Every bug report, suggestion, or line of code makes a difference.

Happy coding!
