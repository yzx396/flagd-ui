import { useState } from "react"
import Rule from "./Rule"
import convertToFlagdFormat from "./convertToFlagdFormat"
import convertFromFlagdFormat from "./convertFromFlagdFormat"
import validateFlagdSchema from "./validateFlagdSchema"
import "./App.css"

function App() {
  const [flagKey, setFlagKey] = useState("test-feature")
  const [state, setState] = useState(true)
  const [type, setType] = useState("boolean")
  const [variants, setVariants] = useState([
    { name: "true", value: true },
    { name: "false", value: false }
  ])
  const [defaultVariant, setDefaultVariant] = useState("false")

  const [hasTargeting, setHasTargeting] = useState(false)
  const [rules, setRules] = useState([{
    condition: { name: "", operator: "ends_with", subOperator: ">=", value: "" },
    targetVariant: "true"
  }])
  const [hasDefaultRule, setHasDefaultRule] = useState(false)
  const [defaultRule, setDefaultRule] = useState("false")

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState("")
  const [importError, setImportError] = useState("")
  const [validationResult, setValidationResult] = useState(null)

  const handleTypeChange = (newType) => {
    setType(newType)
    if (newType === "boolean") {
      setVariants([
        { name: "true", value: true },
        { name: "false", value: false }
      ])
      setDefaultVariant("false")
    } else if (newType === "string") {
      setVariants([
        { name: "foo", value: "foo" },
        { name: "bar", value: "bar" }
      ])
      setDefaultVariant("foo")
    } else if (newType === "number") {
      setVariants([
        { name: "1", value: 1 },
        { name: "2", value: 2 }
      ])
      setDefaultVariant("1")
    } else if (newType === "object") {
      setVariants([
        { name: "foo", value: JSON.stringify({ foo: "foo" }) },
        { name: "bar", value: JSON.stringify({ bar: "bar" }) }
      ])
      setDefaultVariant("foo")
    }
  }

  const handleVariantChange = (index, key, value) => {
    const newVariants = variants.map((variant, i) => {
      if (i === index) {
        return { ...variant, [key]: value }
      }
      return variant
    })
    setVariants(newVariants)
    newVariants.length === 1 ? setDefaultVariant(newVariants[0].name) : null
  }

  const addVariant = () => {
    const newVariant = { name: "" }
    if (type === "boolean") {
      newVariant.value = false
    } else if (type === "string") {
      newVariant.value = ""
    } else if (type === "number") {
      newVariant.value = 0
    } else if (type === "object") {
      newVariant.value = JSON.stringify({})
    }
    setVariants([...variants, newVariant])
  }

  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index)
    setVariants(newVariants)
    if (defaultVariant === variants[index].name) {
      setDefaultVariant(newVariants[0]?.name || "");
    }
  }

  const handleRuleChange = (index, key, value) => {
    const newRules = rules.map((rule, i) => {
      if (i === index) {
        if (key !== "") {
          return { condition: { ...rule.condition, [key]: value }, targetVariant: rule.targetVariant }
        } else {
          return { condition: rule.condition, targetVariant: value }
        }
      }
      return rule
    })
    setRules(newRules)
  }

  const addRule = () => {
    const newRule = {
      condition: { name: "", operator: "ends_with", subOperator: ">=", value: "" },
      targetVariant: "true"
    }
    setRules([...rules, newRule])
  }

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index)
    setRules(newRules)
  }

  const generateJSON = () => {
    const json = {
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
    const convertedJson = convertToFlagdFormat(json)
    return JSON.stringify(convertedJson, null, 2)
  }

  const handleImport = () => {
    setImportError("")
    try {
      const parsed = JSON.parse(importText)
      const result = convertFromFlagdFormat(parsed)

      if (!result) {
        setImportError("Invalid flagd format: Could not parse the definition")
        return
      }

      // Apply imported values to state
      setFlagKey(result.flagKey)
      setState(result.state)
      setType(result.type)
      setVariants(result.variants)
      setDefaultVariant(result.defaultVariant)
      setHasTargeting(result.hasTargeting)
      setRules(result.rules)
      setHasDefaultRule(result.hasDefaultRule)
      setDefaultRule(result.defaultRule)

      // Close modal and clear import text
      setShowImportModal(false)
      setImportText("")
    } catch (e) {
      setImportError(`JSON parse error: ${e.message}`)
    }
  }

  const handleValidate = () => {
    try {
      const json = JSON.parse(generateJSON())
      const result = validateFlagdSchema(json)
      setValidationResult(result)
    } catch (e) {
      setValidationResult({ valid: false, errors: [`JSON error: ${e.message}`] })
    }
  }

  const handleExport = () => {
    const json = generateJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${flagKey || "flag"}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getBooleanVariantBlock = (variant, index) => ( type === "boolean" ?
    <select id={`variant${index}Value`} className="select" value={variant.value.toString()}
      onChange={(e) => handleVariantChange(index, "value", e.target.value === "true")}>
      <option value="true">true</option>
      <option value="false">false</option>
    </select> : null )

  const getStringVariantBlock = (variant, index) => ( type === "string" ?
    <input id={`variant${index}Value`} className="input" placeholder="Value" value={variant.value}
      onChange={(e) => handleVariantChange(index, "value", e.target.value)} /> : null )

  const getNumberVariantBlock = (variant, index) => ( type === "number" ?
    <input id={`variant${index}Value`} className="input" type="number" value={variant.value}
      onChange={(e) => handleVariantChange(index, "value", Number(e.target.value))} /> : null )

  const getObjectVariantBlock = (variant, index) => ( type === "object" ?
    <input id={`variant${index}Value`} className="input" value={variant.value}
      onChange={(e) => handleVariantChange(index, "value", e.target.value)} /> : null )

  const variantsBlock = variants.map((variant, index) => (
    <div key={`variant${index}`} className="variant-item">
      <input id={`variant${index}Name`} className="input" placeholder="Name" value={variant.name}
        onChange={(e) => handleVariantChange(index, "name", e.target.value)} />
      {getBooleanVariantBlock(variant, index)}
      {getStringVariantBlock(variant, index)}
      {getNumberVariantBlock(variant, index)}
      {getObjectVariantBlock(variant, index)}
      <button id="removeVariant" className="button button-danger" onClick={() => removeVariant(index)}>Remove</button>
    </div>
  ))

  const variantOptionsBlock = variants.filter(variant => variant.name).map((variant, index) => (
    <option key={`variant-${index}`} value={variant.name}>{variant.name}</option>
  ))

  const rulesBlock = hasTargeting && rules.map((rule, index) => (
    <Rule key={index} index={index} variants={variants} rule={rule}
      handleRuleChange={handleRuleChange} removeRule={() => removeRule(index)} />
  ))

  const defaultRuleBlock = hasTargeting && hasDefaultRule && (
    <div className="default-rule-section">
      <label>Else</label>
      <select id="defaultRule" className="select"
        value={defaultRule}
        onChange={(e) => setDefaultRule(e.target.value)}>
        {variantOptionsBlock}
      </select>
    </div>
  )

  const addRuleButton = hasTargeting && (
    <button id="addRule" className="button button-primary" onClick={() => addRule()}>Add Rule</button>
  )

  const defaultRuleCheckbox = hasTargeting && (
    <label className="checkbox-wrapper">
      <input id="defaultRule" className="checkbox" type="checkbox" checked={hasDefaultRule}
        onClick={(e) => setHasDefaultRule(e.target.checked)} />
      <span>Default Rule</span>
    </label>
  )

  const importModal = showImportModal && (
    <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import flagd Definition</h2>
          <button className="modal-close" onClick={() => setShowImportModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="modal-description">Paste your flagd JSON definition below:</p>
          <textarea
            className="import-textarea"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"my-flag": {"state": "ENABLED", "variants": {...}}}'
            rows={12}
          />
          {importError && <div className="error-message">{importError}</div>}
        </div>
        <div className="modal-footer">
          <button className="button button-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
          <button className="button button-primary" onClick={handleImport}>Import</button>
        </div>
      </div>
    </div>
  )

  const validationBlock = validationResult && (
    <div className={`validation-result ${validationResult.valid ? 'validation-success' : 'validation-error'}`}>
      <div className="validation-header">
        {validationResult.valid ? 'Valid' : 'Invalid'}
      </div>
      {!validationResult.valid && validationResult.errors.length > 0 && (
        <ul className="validation-errors">
          {validationResult.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      <button className="validation-dismiss" onClick={() => setValidationResult(null)}>&times;</button>
    </div>
  )

  return (
    <div className="app-container">
      {importModal}
      <header className="app-header">
        <h1>flagd ui</h1>
        <div className="header-actions">
          <button className="button button-secondary" onClick={() => setShowImportModal(true)}>Import</button>
        </div>
      </header>
      <div className="app-layout">
        <div className="form-panel">
          <div className="form-section">
            <span className="section-header">Flag Configuration</span>
            <div className="form-group">
              <label htmlFor="flagKey" className="form-label">Flag Key</label>
              <input id="flagKey" className="input" value={flagKey}
                onChange={(e) => setFlagKey(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="checkbox-wrapper">
                <input id="state" className="checkbox" type="checkbox" checked={state}
                  onChange={(e) => setState(e.target.checked)} />
                <span>Enabled</span>
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="type" className="form-label">Type</label>
              <select id="type" className="select" value={type}
                onChange={(e) => handleTypeChange(e.target.value)}>
                <option value="boolean">boolean</option>
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="object">object</option>
              </select>
            </div>
          </div>
          <div className="form-section">
            <span className="section-header">Variants</span>
            <div className="variant-list">
              {variantsBlock}
            </div>
            <button id="addVariant" className="button button-secondary" onClick={addVariant}>Add Variant</button>
          </div>

          <div className="form-section">
            <span className="section-header">Default Variant</span>
            <div className="form-group">
              <select id="defaultVariant" className="select"
                value={defaultVariant}
                onChange={(e) => setDefaultVariant(e.target.value)}>
                {variantOptionsBlock}
              </select>
            </div>
          </div>
          <div className="form-section">
            <span className="section-header">Targeting</span>
            <div className="targeting-section">
              <label className="checkbox-wrapper">
                <input id="hasTargeting" className="checkbox" type="checkbox" checked={hasTargeting}
                  onChange={(e) => setHasTargeting(e.target.checked)} />
                <span>Enable Targeting</span>
              </label>
              {hasTargeting && (
                <>
                  <div className="rules-container">
                    {rulesBlock}
                  </div>
                  {defaultRuleBlock}
                  <div className="action-buttons">
                    {addRuleButton}
                    {defaultRuleCheckbox}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="json-panel">
          <div className="json-panel-header">
            <span className="json-panel-title">Output</span>
            <div className="json-panel-actions">
              <button className="button button-secondary" onClick={handleValidate}>Validate</button>
              <button className="button button-primary" onClick={handleExport}>Export</button>
            </div>
          </div>
          {validationBlock}
          <textarea id="json" className="json-textarea" readOnly value={generateJSON()} rows={30} />
        </div>
      </div>
    </div>
  )
}

export default App