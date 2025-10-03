# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

flagd-ui is a minimal React UI for generating [flagd](https://flagd.dev/) feature flag definitions in real-time. The app provides a visual interface for creating feature flags with variants, rules, and targeting conditions, then outputs the flagd-compatible JSON format.

## Commands

### Development
```bash
npm i                    # Install dependencies
npm run dev             # Start dev server (opens at http://localhost:5173/flagd-ui/)
```

### Testing & Quality
```bash
npm test                # Run tests with vitest
npm run coverage        # Run tests with coverage report
npm run lint            # Lint JS/JSX files with ESLint
```

### Build & Deploy
```bash
npm run build          # Production build
npm run preview        # Preview production build
```

## Architecture

### Component Structure

The app has a simple component hierarchy centered around feature flag configuration:

- **App.jsx** - Main component managing all flag configuration state (flag key, type, variants, targeting rules). Handles the conversion to flagd format and renders the UI with a live preview.
- **Rule.jsx** - Reusable component for individual targeting rules. Supports various operators (string matching, numeric comparison, semantic versioning, array membership).
- **convertToFlagdFormat.js** - Core conversion logic that transforms the UI form state into flagd JSON format.

### State Management

All state is managed in App.jsx with useState hooks:
- Flag metadata: key, state, type, defaultVariant
- Variants array with name/value pairs
- Targeting configuration: rules array, hasTargeting, hasDefaultRule, defaultRule

### Data Flow

1. User edits flag configuration in the left panel
2. State updates in App.jsx via handler functions
3. `generateJSON()` is called on every render, which invokes `convertToFlagdFormat()`
4. Resulting flagd JSON is displayed in the right panel textarea

### Flag Types & Operators

**Supported flag types**: boolean, string, number, object

**Rule operators** (in Rule.jsx):
- String: starts_with, ends_with, in_string, not_in_string
- Semantic version: sem_ver (with sub-operators: >=, <=, ~, ^, =, !=, >, <)
- Array: in_list, not_in_list
- Boolean: ==, ===, !=, !==, !!, !
- Numeric: >, >=, <, <=

### Conversion Logic (convertToFlagdFormat.js)

Key transformations:
- State: true → "ENABLED", false → "DISABLED"
- Variants: array of {name, value} → object with name keys
- Object variants: JSON string values are parsed
- Rules: converts to JsonLogic format with nested conditions
- Operators: in_list/not_in_list/in_string/not_in_string → "in" (with negation wrapper for "not_" variants)
- Semantic version rules: special handling with subOperator array format
- Comma-separated values in list operators are split into arrays

## Configuration Notes

- The vite.config.js sets `base: 'https://yzx396.github.io/flagd-ui/'` for GitHub Pages deployment
- For local development, the app runs at `/flagd-ui/` path
