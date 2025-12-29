import { describe, it, expect } from 'vitest'
import convertFromFlagdFormat from "./convertFromFlagdFormat"

describe("convertFromFlagdFormat", () => {
    describe("basic parsing", () => {
        it("should return null for empty input", () => {
            const actual = convertFromFlagdFormat({})
            expect(actual).toBeNull()
        })

        it("should return null for invalid JSON structure", () => {
            const actual = convertFromFlagdFormat("not an object")
            expect(actual).toBeNull()
        })

        it("should extract flagKey from the first property", () => {
            const actual = convertFromFlagdFormat({
                "my-feature": { state: "ENABLED", variants: {}, defaultVariant: "" }
            })
            expect(actual.flagKey).toBe("my-feature")
        })
    })

    describe("state conversion", () => {
        it("should convert ENABLED to true", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": { state: "ENABLED", variants: {}, defaultVariant: "" }
            })
            expect(actual.state).toBe(true)
        })

        it("should convert DISABLED to false", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": { state: "DISABLED", variants: {}, defaultVariant: "" }
            })
            expect(actual.state).toBe(false)
        })
    })

    describe("type inference", () => {
        it("should infer boolean type from variant values", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off"
                }
            })
            expect(actual.type).toBe("boolean")
        })

        it("should infer string type from variant values", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "foo": "hello", "bar": "world" },
                    defaultVariant: "foo"
                }
            })
            expect(actual.type).toBe("string")
        })

        it("should infer number type from variant values", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "one": 1, "two": 2 },
                    defaultVariant: "one"
                }
            })
            expect(actual.type).toBe("number")
        })

        it("should infer object type from variant values", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "config": { key: "value" } },
                    defaultVariant: "config"
                }
            })
            expect(actual.type).toBe("object")
        })

        it("should default to string type for empty variants", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: {},
                    defaultVariant: ""
                }
            })
            expect(actual.type).toBe("string")
        })
    })

    describe("variants conversion", () => {
        it("should convert variants object to array", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off"
                }
            })
            expect(actual.variants).toBeInstanceOf(Array)
            expect(actual.variants).toHaveLength(2)
        })

        it("should have name and value for each variant", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on"
                }
            })
            expect(actual.variants[0]).toHaveProperty("name", "on")
            expect(actual.variants[0]).toHaveProperty("value", true)
        })

        it("should stringify object variants", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "config": { key: "value" } },
                    defaultVariant: "config"
                }
            })
            expect(actual.variants[0].value).toBe('{"key":"value"}')
        })
    })

    describe("defaultVariant", () => {
        it("should preserve defaultVariant", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off"
                }
            })
            expect(actual.defaultVariant).toBe("off")
        })
    })

    describe("targeting conversion", () => {
        it("should set hasTargeting to false for empty targeting", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: {},
                    defaultVariant: "",
                    targeting: {}
                }
            })
            expect(actual.hasTargeting).toBe(false)
        })

        it("should set hasTargeting to true when targeting has if array", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
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
            expect(actual.hasTargeting).toBe(true)
        })

        it("should parse ends_with operator", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { ends_with: [{ var: "email" }, "@test.com"] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("ends_with")
            expect(actual.rules[0].condition.name).toBe("email")
            expect(actual.rules[0].condition.value).toBe("@test.com")
            expect(actual.rules[0].targetVariant).toBe("on")
        })

        it("should parse starts_with operator", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { starts_with: [{ var: "name" }, "admin"] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("starts_with")
        })

        it("should parse in operator as in_list when value is array", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { in: [{ var: "country" }, ["us", "ca"]] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("in_list")
            expect(actual.rules[0].condition.value).toBe("us, ca")
        })

        it("should parse in operator as in_string when value is string", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { in: [{ var: "email" }, "test string"] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("in_string")
            expect(actual.rules[0].condition.value).toBe("test string")
        })

        it("should parse negated in operator as not_in_list", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { "!": { in: [{ var: "country" }, ["us", "ca"]] } },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("not_in_list")
        })

        it("should parse negated in operator as not_in_string", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { "!": { in: [{ var: "email" }, "blocked"] } },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("not_in_string")
        })

        it("should parse sem_ver operator", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true },
                    defaultVariant: "on",
                    targeting: {
                        if: [
                            { sem_ver: [{ var: "version" }, ">=", "1.0.0"] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules[0].condition.operator).toBe("sem_ver")
            expect(actual.rules[0].condition.subOperator).toBe(">=")
            expect(actual.rules[0].condition.value).toBe("1.0.0")
        })

        it("should parse comparison operators", () => {
            const operators = ["==", "===", "!=", "!==", ">", ">=", "<", "<="]
            operators.forEach(op => {
                const actual = convertFromFlagdFormat({
                    "test-feature": {
                        state: "ENABLED",
                        variants: { "on": true },
                        defaultVariant: "on",
                        targeting: {
                            if: [
                                { [op]: [{ var: "count" }, 10] },
                                "on"
                            ]
                        }
                    }
                })
                expect(actual.rules[0].condition.operator).toBe(op)
            })
        })

        it("should parse multiple rules", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off",
                    targeting: {
                        if: [
                            { ends_with: [{ var: "email" }, "@admin.com"] },
                            "on",
                            { ends_with: [{ var: "email" }, "@test.com"] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.rules).toHaveLength(2)
        })

        it("should parse default rule when present (odd number of if elements)", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off",
                    targeting: {
                        if: [
                            { ends_with: [{ var: "email" }, "@admin.com"] },
                            "on",
                            "off"
                        ]
                    }
                }
            })
            expect(actual.hasDefaultRule).toBe(true)
            expect(actual.defaultRule).toBe("off")
        })

        it("should not have default rule when even number of if elements", () => {
            const actual = convertFromFlagdFormat({
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off",
                    targeting: {
                        if: [
                            { ends_with: [{ var: "email" }, "@admin.com"] },
                            "on"
                        ]
                    }
                }
            })
            expect(actual.hasDefaultRule).toBe(false)
        })
    })

    describe("error handling", () => {
        it("should return error for null input", () => {
            const actual = convertFromFlagdFormat(null)
            expect(actual).toBeNull()
        })

        it("should return error for undefined input", () => {
            const actual = convertFromFlagdFormat(undefined)
            expect(actual).toBeNull()
        })
    })

    describe("round-trip conversion", () => {
        it("should produce equivalent output when round-tripped", () => {
            const flagdFormat = {
                "test-feature": {
                    state: "ENABLED",
                    variants: { "on": true, "off": false },
                    defaultVariant: "off",
                    targeting: {}
                }
            }
            const uiState = convertFromFlagdFormat(flagdFormat)
            expect(uiState.flagKey).toBe("test-feature")
            expect(uiState.state).toBe(true)
            expect(uiState.defaultVariant).toBe("off")
            expect(uiState.type).toBe("boolean")
        })
    })
})
