import { describe, it, expect } from 'vitest'
import validateFlagdSchema from "./validateFlagdSchema"

describe("validateFlagdSchema", () => {
    describe("valid inputs", () => {
        it("should return valid for a minimal valid flag", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it("should return valid for a flag with targeting", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off",
                    targeting: {
                        if: [
                            { ends_with: [{ var: "email" }, "@test.com"] },
                            "on"
                        ]
                    }
                }
            })
            expect(result.valid).toBe(true)
        })

        it("should return valid for a flag with empty targeting", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {}
                }
            })
            expect(result.valid).toBe(true)
        })

        it("should return valid for DISABLED state", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "DISABLED",
                    variants: { "on": true },
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(true)
        })
    })

    describe("invalid inputs - structure", () => {
        it("should return invalid for null input", () => {
            const result = validateFlagdSchema(null)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Input must be a non-null object")
        })

        it("should return invalid for undefined input", () => {
            const result = validateFlagdSchema(undefined)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Input must be a non-null object")
        })

        it("should return invalid for empty object", () => {
            const result = validateFlagdSchema({})
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("At least one flag definition is required")
        })

        it("should return invalid for array input", () => {
            const result = validateFlagdSchema([])
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Input must be a non-null object")
        })

        it("should return invalid for string input", () => {
            const result = validateFlagdSchema("invalid")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Input must be a non-null object")
        })
    })

    describe("invalid inputs - missing required fields", () => {
        it("should return invalid when state is missing", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    variants: { "on": true },
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'state' is required")
        })

        it("should return invalid when variants is missing", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'variants' is required")
        })

        it("should return invalid when defaultVariant is missing", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true }
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'defaultVariant' is required")
        })
    })

    describe("invalid inputs - field types", () => {
        it("should return invalid when state is not ENABLED or DISABLED", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "INVALID",
                    variants: { "on": true },
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'state' must be 'ENABLED' or 'DISABLED'")
        })

        it("should return invalid when variants is not an object", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: ["on", "off"],
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'variants' must be an object")
        })

        it("should return invalid when variants is empty", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: {},
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'variants' must have at least one variant")
        })

        it("should return invalid when defaultVariant is not a string", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: 123
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'defaultVariant' must be a string")
        })

        it("should return invalid when defaultVariant is not in variants", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "off"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'defaultVariant' must reference an existing variant")
        })
    })

    describe("invalid inputs - targeting", () => {
        it("should return invalid when targeting is not an object", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: "invalid"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'targeting' must be an object")
        })

        it("should return invalid when targeting.if is not an array", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: { if: "not-an-array" }
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Flag 'my-flag': 'targeting.if' must be an array")
        })
    })

    describe("multiple flags", () => {
        it("should validate multiple flags", () => {
            const result = validateFlagdSchema({
                "flag-1": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on"
                },
                "flag-2": {
                    state: "DISABLED",
                    variants: { "a": "x", "b": "y" },
                    defaultVariant: "a"
                }
            })
            expect(result.valid).toBe(true)
        })

        it("should report errors for all invalid flags", () => {
            const result = validateFlagdSchema({
                "flag-1": {
                    state: "INVALID",
                    variants: { "on": true },
                    defaultVariant: "on"
                },
                "flag-2": {
                    state: "ENABLED",
                    variants: {},
                    defaultVariant: "missing"
                }
            })
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe("edge cases", () => {
        it("should accept flag key with special characters", () => {
            const result = validateFlagdSchema({
                "my-flag_v1.0": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on"
                }
            })
            expect(result.valid).toBe(true)
        })

        it("should accept various variant value types", () => {
            const result = validateFlagdSchema({
                "my-flag": {
                    state: "ENABLED",
                    variants: {
                        "bool": true,
                        "str": "hello",
                        "num": 42,
                        "obj": { key: "value" }
                    },
                    defaultVariant: "bool"
                }
            })
            expect(result.valid).toBe(true)
        })
    })
})
