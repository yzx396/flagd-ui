export default function flagFormConverter(formData) {
    if (!formData.flagKey) return {}

    return {
        [formData.flagKey]: {
            state: formData.state ? "ENABLED" : "DISABLED",
            variants: formData.variants?.reduce((acc, v) => {
                if (formData.type === "object") {
                    try {
                        acc[v.name] = JSON.parse(v.value)
                    } catch (e) {
                        acc[v.name] = ""
                    }
                } else {
                    acc[v.name] = v.value
                }
                return acc
            }, {}),
            defaultVariant: formData.defaultVariant
        }
    }
}