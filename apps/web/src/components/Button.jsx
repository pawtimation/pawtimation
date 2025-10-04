import React from 'react'
export function Button({children,variant='primary',className='',...props}){const map={primary:'btn btn-primary',secondary:'btn btn-secondary',ghost:'btn btn-ghost'};return <button className={`${map[variant]||map.primary} ${className}`} {...props}>{children}</button>}
