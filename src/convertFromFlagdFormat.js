/**
 * Converts a flagd JSON format back to UI state format
 * This is the inverse of convertToFlagdFormat
 */
export default function convertFromFlagdFormat(flagdJson) {
    // Validate input
    if (!flagdJson || typeof flagdJson !== 'object') {
        return null
    }

    const keys = Object.keys(flagdJson)
    if (keys.length === 0) {
        return null
    }

    const flagKey = keys[0]
    const flagData = flagdJson[flagKey]

    if (!flagData || typeof flagData !== 'object') {
        return null
    }

    // Convert state
    const state = flagData.state === "ENABLED"

    // Convert variants and infer type
    const variantsObj = flagData.variants || {}
    const variantEntries = Object.entries(variantsObj)
    const type = inferType(variantEntries)

    const variants = variantEntries.map(([name, value]) => ({
        name,
        value: type === "object" ? JSON.stringify(value) : value
    }))

    // Default variant
    const defaultVariant = flagData.defaultVariant || ""

    // Parse targeting
    const targeting = flagData.targeting || {}
    const hasIf = targeting.if && Array.isArray(targeting.if) && targeting.if.length > 0
    const hasTargeting = !!hasIf

    let rules = []
    let hasDefaultRule = false
    let defaultRule = variants[0]?.name || ""

    if (hasTargeting) {
        const ifArray = targeting.if
        const parsedRules = parseIfArray(ifArray)
        rules = parsedRules.rules
        hasDefaultRule = parsedRules.hasDefaultRule
        if (hasDefaultRule) {
            defaultRule = parsedRules.defaultRule
        }
    }

    // Set default rule structure if no rules
    if (rules.length === 0) {
        rules = [{
            condition: { name: "", operator: "ends_with", subOperator: ">=", value: "" },
            targetVariant: variants[0]?.name || "true"
        }]
    }

    return {
        flagKey,
        state,
        type,
        variants,
        defaultVariant,
        hasTargeting,
        rules,
        hasDefaultRule,
        defaultRule
    }
}

function inferType(variantEntries) {
    if (variantEntries.length === 0) {
        return "string"
    }

    const firstValue = variantEntries[0][1]

    if (typeof firstValue === "boolean") {
        return "boolean"
    }
    if (typeof firstValue === "number") {
        return "number"
    }
    if (typeof firstValue === "object" && firstValue !== null) {
        return "object"
    }
    return "string"
}

function parseIfArray(ifArray) {
    const rules = []
    let hasDefaultRule = false
    let defaultRule = ""

    // Check if we have an odd number of elements (meaning there's a default rule)
    const hasOddElements = ifArray.length % 2 === 1

    // Process pairs of (condition, target)
    const pairsToProcess = hasOddElements ? ifArray.length - 1 : ifArray.length

    for (let i = 0; i < pairsToProcess; i += 2) {
        const condition = ifArray[i]
        const targetVariant = ifArray[i + 1]

        const parsedCondition = parseCondition(condition)
        rules.push({
            condition: parsedCondition,
            targetVariant
        })
    }

    // Check for default rule (last element in odd-length array)
    if (hasOddElements) {
        hasDefaultRule = true
        defaultRule = ifArray[ifArray.length - 1]
    }

    return { rules, hasDefaultRule, defaultRule }
}

function parseCondition(condition) {
    const result = {
        name: "",
        operator: "ends_with",
        subOperator: ">=",
        value: ""
    }

    if (!condition || typeof condition !== 'object') {
        return result
    }

    // Check for negation wrapper
    if (condition["!"]) {
        const innerCondition = condition["!"]
        const innerOperator = Object.keys(innerCondition)[0]
        const innerOperands = innerCondition[innerOperator]

        // Extract variable name
        if (innerOperands && Array.isArray(innerOperands) && innerOperands[0] && innerOperands[0].var) {
            result.name = innerOperands[0].var
        }

        // Convert to negated operator
        if (innerOperator === "in") {
            if (Array.isArray(innerOperands[1])) {
                result.operator = "not_in_list"
                result.value = innerOperands[1].join(", ")
            } else {
                result.operator = "not_in_string"
                result.value = innerOperands[1] || ""
            }
        }
        return result
    }

    return parseInnerCondition(condition)
}

function parseInnerCondition(condition) {
    const result = {
        name: "",
        operator: "ends_with",
        subOperator: ">=",
        value: ""
    }

    const operators = Object.keys(condition)
    if (operators.length === 0) {
        return result
    }

    const operator = operators[0]
    const operands = condition[operator]

    if (!Array.isArray(operands)) {
        return result
    }

    // Extract variable name
    if (operands[0] && operands[0].var) {
        result.name = operands[0].var
    }

    // Handle semantic version operator
    if (operator === "sem_ver") {
        result.operator = "sem_ver"
        result.subOperator = operands[1] || ">="
        result.value = operands[2] || ""
        return result
    }

    // Handle "in" operator - determine if it's in_list or in_string
    if (operator === "in") {
        if (Array.isArray(operands[1])) {
            result.operator = "in_list"
            result.value = operands[1].join(", ")
        } else {
            result.operator = "in_string"
            result.value = operands[1] || ""
        }
        return result
    }

    // Standard operators
    result.operator = operator
    result.value = operands[1] !== undefined ? String(operands[1]) : ""

    return result
}
