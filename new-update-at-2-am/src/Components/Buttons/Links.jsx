import React from 'react'

const Links = ({link,linkText,size}) => {
  return (
    <a href={link} className="link" style={{fontSize:`${size}`}}>
  <span className="mask"style={{fontSize:`${size}`}}>
    <div className="link-container" style={{fontSize:`${size}`}}>
      <span className="link-title1 title" style={{fontSize:`${size}`}}>{linkText}</span>
      <span className="link-title2 title" style={{fontSize:`${size}`}}>{linkText}</span>
    </div>
  </span>
  </a>
  )
}

export default Links;