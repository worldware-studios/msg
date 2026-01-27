# Contributing to msg

Thank you for your interest in contributing to `msg`! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js (version compatible with the project)
- npm
- Git

### Setting Up the Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/msg.git
   cd msg
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify the setup**
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following the coding standards below

3. **Run tests** to ensure everything works
   ```bash
   npm test
   ```

4. **Check test coverage** (optional but recommended)
   ```bash
   npm run coverage
   ```

5. **Build the project** to ensure TypeScript compiles correctly
   ```bash
   npm run build
   ```

### Code Style

- **TypeScript**: The project uses strict TypeScript configuration
- **Formatting**: Follow existing code style and patterns
- **Naming**: Use clear, descriptive names for variables, functions, and classes
- **Type Safety**: Leverage TypeScript's type system - avoid `any` when possible
- **Imports**: Use ES module syntax (`import`/`export`)

### Project Structure

```
src/
  classes/          # Core classes (MsgProject, MsgResource, MsgMessage, MsgInterface)
  tests/            # Test files (using Vitest)
  index.ts          # Main entry point
```

### Testing

- **Test Framework**: Vitest
- **Test Location**: Tests are co-located with source files in `src/tests/`
- **Test Naming**: Test files should be named `*.test.ts`
- **Running Tests**:
  - `npm test` - Run tests once
  - `npm run test:watch` - Run tests in watch mode
  - `npm run coverage` - Run tests with coverage report

**Testing Requirements:**
- All new features should include tests
- Bug fixes should include tests that verify the fix
- Aim for high test coverage
- Tests should be clear, focused, and well-documented

### TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- Target: ES2020
- Module: NodeNext

Ensure your code compiles without errors:
```bash
npm run build
```

## Submitting Changes

### Commit Messages

Write clear, descriptive commit messages:
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add support for custom message formatters

This change allows users to provide custom formatting functions
for messages, enabling more flexible message handling.

Fixes #123
```

### Pull Request Process

1. **Update your branch** with the latest changes from `main`
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Ensure all tests pass**
   ```bash
   npm test
   ```

3. **Ensure the build succeeds**
   ```bash
   npm run build
   ```

4. **Create a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include examples or screenshots if applicable
   - Ensure your PR description explains the "why" as well as the "what"

5. **Respond to feedback**
   - Address review comments promptly
   - Make requested changes
   - Keep discussions focused and constructive

### Pull Request Checklist

Before submitting your PR, ensure:

- [ ] All tests pass (`npm test`)
- [ ] The project builds successfully (`npm run build`)
- [ ] Code follows existing style and patterns
- [ ] New features include tests
- [ ] Bug fixes include tests that verify the fix
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive

## Code Review Guidelines

### For Contributors

- Be open to feedback and suggestions
- Respond to review comments in a timely manner
- Keep PRs focused and reasonably sized
- Break large changes into smaller, reviewable PRs when possible

### For Reviewers

- Be constructive and respectful in feedback
- Focus on code quality, correctness, and maintainability
- Approve PRs that meet the project's standards
- Request changes when improvements are needed

## Reporting Issues

When reporting bugs or requesting features:

1. **Check existing issues** to avoid duplicates
2. **Use a clear, descriptive title**
3. **Provide context**:
   - What you're trying to do
   - What you expected to happen
   - What actually happened
   - Steps to reproduce (for bugs)
4. **Include relevant information**:
   - Node.js version
   - npm version
   - Operating system
   - Error messages or stack traces

## Questions?

If you have questions about contributing:
- Open an issue with the `question` label
- Check the README.md for project documentation
- Review existing code and tests for examples

## License

By contributing to `msg`, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to `msg`! 🎉
