# Contributing to HelpNow

Thank you for contributing to HelpNow! This document provides guidelines for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

---

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and professional in all interactions.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

---

## Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/HelpNow.git
cd HelpNow
```

### 2. Install Dependencies
```bash
npm install

# iOS only
cd ios && pod install && cd ..
```

### 3. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your development credentials
```

### 4. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### Branch Naming Convention
- `feature/` - New features (e.g., `feature/emergency-request-screen`)
- `bugfix/` - Bug fixes (e.g., `bugfix/location-permission-crash`)
- `hotfix/` - Urgent production fixes (e.g., `hotfix/payment-error`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)
- `docs/` - Documentation updates (e.g., `docs/api-documentation`)
- `test/` - Test additions (e.g., `test/emergency-service`)

### Branch Strategy
```
main (production-ready)
  ↑
develop (integration branch)
  ↑
feature/*, bugfix/*, etc. (working branches)
```

### Workflow Steps
1. Always branch from `develop`
2. Make your changes
3. Test thoroughly
4. Create pull request to `develop`
5. After review and approval, merge
6. `develop` is merged to `main` for releases

---

## Coding Standards

### TypeScript
- Use TypeScript for all new files
- Define proper types/interfaces
- Avoid `any` type unless absolutely necessary
- Use strict mode

### React Native / React
- Use functional components with hooks
- Follow React hooks rules
- Keep components small and focused (single responsibility)
- Use meaningful component and variable names

### File Structure
```typescript
// Component file structure
import React from 'react';
import { View, Text } from 'react-native';
// Other imports in alphabetical order

// Types/interfaces
interface Props {
  // ...
}

// Component
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Functions
  const handleAction = () => {
    // ...
  };
  
  // Render
  return (
    <View>
      {/* Component JSX */}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // ...
});

export default ComponentName;
```

### Naming Conventions
- **Components:** PascalCase (e.g., `EmergencyButton.tsx`)
- **Functions:** camelCase (e.g., `handleEmergencyRequest`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Files:** PascalCase for components, camelCase for utilities
- **Folders:** camelCase (e.g., `screens/emergency/`)

### Code Style
```typescript
// ✅ Good
const handleSubmit = async () => {
  try {
    const result = await apiCall();
    setData(result);
  } catch (error) {
    console.error('Error:', error);
  }
};

// ❌ Bad
const handleSubmit = async () => {
  const result = await apiCall()
  setData(result)
}
```

### Import Organization
```typescript
// 1. React and React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 3. Local imports - contexts, services, utils
import { useAuth } from '../contexts/AuthContext';
import { emergencyService } from '../services/emergencyService';

// 4. Types
import { EmergencyRequest } from '../types';
```

---

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
# Good commit messages
git commit -m "feat(emergency): add voice recording to emergency request"
git commit -m "fix(auth): resolve Firebase authentication timeout"
git commit -m "docs: update API documentation for helper endpoints"
git commit -m "refactor(services): simplify emergency service error handling"

# Bad commit messages (avoid these)
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "WIP"
```

### Commit Message Guidelines
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues: "fix(auth): resolve login crash (fixes #123)"

---

## Pull Request Process

### Before Creating PR
1. ✅ Code builds without errors
2. ✅ All tests pass
3. ✅ No linting errors (`npm run lint`)
4. ✅ Code is properly formatted
5. ✅ Changes are tested on both iOS and Android
6. ✅ Documentation is updated if needed

### Creating a Pull Request
1. Push your branch to GitHub
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create Pull Request

3. Fill in PR template:
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tested on iOS
   - [ ] Tested on Android
   - [ ] Unit tests added/updated
   
   ## Screenshots (if applicable)
   
   ## Related Issues
   Closes #123
   ```

4. Request review from team members

5. Address review comments

6. Once approved, squash and merge

### PR Review Checklist (for reviewers)
- [ ] Code follows project conventions
- [ ] Changes are well-tested
- [ ] No unnecessary code changes
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Backwards compatibility maintained

---

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- EmergencyService.test.ts
```

### Writing Tests
```typescript
// Example test
import { emergencyService } from '../services/emergencyService';

describe('EmergencyService', () => {
  describe('createRequest', () => {
    it('should create emergency request with valid data', async () => {
      const requestData = {
        type: 'heart_attack',
        location: { latitude: 48.8566, longitude: 2.3522 },
      };
      
      const result = await emergencyService.createRequest(requestData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
    });
    
    it('should throw error with invalid location', async () => {
      const requestData = {
        type: 'heart_attack',
        location: { latitude: null, longitude: null },
      };
      
      await expect(
        emergencyService.createRequest(requestData)
      ).rejects.toThrow('Invalid location');
    });
  });
});
```

### Test Coverage Requirements
- Aim for 80%+ code coverage
- All critical paths must be tested
- Services must have comprehensive unit tests
- Components should have integration tests

---

## Style Guide

### React Native Styling
```typescript
// Use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
});

// Group related styles
const styles = StyleSheet.create({
  // Layout
  container: { ... },
  row: { ... },
  
  // Text
  title: { ... },
  subtitle: { ... },
  
  // Buttons
  primaryButton: { ... },
  secondaryButton: { ... },
});
```

### Colors
Use consistent color palette:
```typescript
// src/utils/colors.ts
export const Colors = {
  // Primary
  primary: '#E53E3E',
  primaryDark: '#C53030',
  primaryLight: '#FC8181',
  
  // Secondary
  secondary: '#4299E1',
  
  // Success/Error
  success: '#48BB78',
  error: '#F56565',
  warning: '#F59E0B',
  
  // Neutrals
  black: '#1A202C',
  gray900: '#2D3748',
  gray700: '#4A5568',
  gray500: '#718096',
  gray300: '#CBD5E0',
  gray100: '#F7FAFC',
  white: '#FFFFFF',
};
```

### Spacing
Use consistent spacing scale:
```typescript
// 4px base unit
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

---

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search closed issues/PRs
3. Ask in team chat
4. Create a GitHub discussion

---

## License

By contributing to HelpNow, you agree that your contributions will be licensed under the project's proprietary license.

---

Thank you for contributing to HelpNow! Together we're building an app that saves lives. 🚑❤️
