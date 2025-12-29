/**
 * Validates a flagd JSON schema
 * Returns { valid: boolean, errors: string[] }
 */
export default function validateFlagdSchema(input) {
    const errors = []

    // Check basic structure
    if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
        return {
            valid: false,
            errors: ["Input must be a non-null object"]
        }
    }

    const flagKeys = Object.keys(input)

    // Check for at least one flag
    if (flagKeys.length === 0) {
        return {
            valid: false,
            errors: ["At least one flag definition is required"]
        }
    }

    // Validate each flag
    for (const flagKey of flagKeys) {
        const flag = input[flagKey]
        validateFlag(flagKey, flag, errors)
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

function validateFlag(flagKey, flag, errors) {
    // Check required fields
    if (flag.state === undefined) {
        errors.push(`Flag '${flagKey}': 'state' is required`)
    }
    if (flag.variants === undefined) {
        errors.push(`Flag '${flagKey}': 'variants' is required`)
    }
    if (flag.defaultVariant === undefined) {
        errors.push(`Flag '${flagKey}': 'defaultVariant' is required`)
    }

    // Validate state
    if (flag.state !== undefined && flag.state !== "ENABLED" && flag.state !== "DISABLED") {
        errors.push(`Flag '${flagKey}': 'state' must be 'ENABLED' or 'DISABLED'`)
    }

    // Validate variants
    if (flag.variants !== undefined) {
        if (typeof flag.variants !== 'object' || flag.variants === null || Array.isArray(flag.variants)) {
            errors.push(`Flag '${flagKey}': 'variants' must be an object`)
        } else if (Object.keys(flag.variants).length === 0) {
            errors.push(`Flag '${flagKey}': 'variants' must have at least one variant`)
        }
    }

    // Validate defaultVariant
    if (flag.defaultVariant !== undefined) {
        if (typeof flag.defaultVariant !== 'string') {
            errors.push(`Flag '${flagKey}': 'defaultVariant' must be a string`)
        } else if (flag.variants && typeof flag.variants === 'object' && !Array.isArray(flag.variants)) {
            const variantNames = Object.keys(flag.variants)
            if (variantNames.length > 0 && !variantNames.includes(flag.defaultVariant)) {
                errors.push(`Flag '${flagKey}': 'defaultVariant' must reference an existing variant`)
            }
        }
    }

    // Validate targeting (if present)
    if (flag.targeting !== undefined) {
        if (typeof flag.targeting !== 'object' || flag.targeting === null || Array.isArray(flag.targeting)) {
            errors.push(`Flag '${flagKey}': 'targeting' must be an object`)
        } else if (flag.targeting.if !== undefined && !Array.isArray(flag.targeting.if)) {
            errors.push(`Flag '${flagKey}': 'targeting.if' must be an array`)
        }
    }
}
