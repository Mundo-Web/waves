import React from 'react'

const MenuItem = ({id, href, icon, children, badge }) => {
  return (
    <li className={location.pathname == href ? 'menuitem-active' : ''}>
      <a id={id} href={href} className={location.pathname == href ? 'active' : ''}>
        <i className={icon}></i>
        {
          badge && <span className="badge bg-info float-end">{badge}</span>
        }
        <span> {children} </span>
      </a>
    </li>
  )
}

export default MenuItem