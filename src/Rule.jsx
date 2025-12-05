import './Rule.css'

const Rule = ({ index, variants, rule, handleRuleChange, removeRule }) => {

    const label = index === 0 ? "If" : "Else If"

    const semVerSubOperatorBlock = rule.condition.operator === "sem_ver" && (
      <select id={`subOperator${index}`} className="select suboperator-select"
        value={rule.condition.subOperator}
        onChange={(e) => handleRuleChange(index, "subOperator", e.target.value)}>
        <option value=">=">&gt;=</option>
        {/* Range specifiers: "=", "!=", ">", "<", ">=", "<=", "~" (match minor version), "^" (match major version). */}
        <option value="<=">&lt;=</option>
        <option value="~">~(minor)</option>
        <option value="^">^(major)</option>
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
      </select>
    )

    const variantOptionsBlock = variants.filter(variant => variant.name).map((variant, index) => (
      <option key={`targetVariant-${index}`} value={variant.name}>{variant.name}</option>
    ))

    return (
      <div className="rule-item">
        <span className="rule-label">{label}</span>
        <div className="rule-condition">
          <input id={`condition${index}Name`} className="input" placeholder="Name"
            value={rule.condition.name}
            onChange={(e) => handleRuleChange(index, "name", e.target.value)} />
          <select id={`operator${index}`} className="select"
            value={rule.condition.operator}
            onChange={(e) => handleRuleChange(index, "operator", e.target.value)}>
            {/* String */}
            <option value="starts_with">Starts with</option>
            <option value="ends_with">Ends with</option>
            <option value="in_string">Contains in string</option>
            <option value="not_in_string">Not contains in string</option>
            <option value="sem_ver">Semantic version</option>
            {/* Array */}
            <option value="in_list">In a list</option>
            <option value="not_in_list">Not in a list</option>
            {/* Boolean */}
            <option value="==">Equals</option>
            <option value="===">Strict equals</option>
            <option value="!=">Not equals</option>
            <option value="!==">Not strict equals</option>
            <option value="!!">Exists</option>
            <option value="!">Not exists</option>
            {/* Numeric */}
            <option value=">">Greater than</option>
            <option value=">=">Greater than or equals</option>
            <option value="<">Less than</option>
            <option value="<=">Less than or equals</option>
          </select>
          {semVerSubOperatorBlock}
          <input id={`condition${index}Value`} className="input" placeholder="Value"
            value={rule.condition.value}
            onChange={(e) => handleRuleChange(index, "value", e.target.value)} />
        </div>
        <div className="rule-action">
          <span className="rule-action-label">Then</span>
          <select id={`targetVariant${index}`} className="select"
            value={rule.targetVariant}
            onChange={(e) => handleRuleChange(index, "", e.target.value)}>
            {variantOptionsBlock}
          </select>
          <button id={`removeRule${index}`} className="button button-danger" onClick={() => removeRule(index)}>Remove</button>
        </div>
      </div>
    )
  }

  export default Rule