import React from 'react'

const PrimaryButton = ({click,ButtonText}) => {
  return (
<button className="learn-more" onClick={click}>
  <span className="circle" aria-hidden="true">
  <span className="icon arrow"></span>
  </span>
  <span className="button-text">{ButtonText}</span>
</button>
  )
}

export default PrimaryButton