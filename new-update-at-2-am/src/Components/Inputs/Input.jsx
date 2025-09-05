import React from 'react'

const Input = ({inputText,change,inputType,inputName}) => {
  return (
<div className="input-container">
  <input name={inputName} type={inputType} onChange={change} className="input" placeholder={inputText}/>
</div>
  )
}

export default Input