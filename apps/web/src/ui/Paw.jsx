import React from 'react'
export const Paw = ({ className='', variant='default' }) => {
  const pawSrc = variant === 'white-outline' 
    ? '/brand/paw-white-outline.svg'
    : variant === 'charcoal'
    ? '/brand/paw-charcoal.svg'
    : '/brand/paw.svg';
  
  return (
    <img src={pawSrc} alt="Pawtimation paw logo" className={className} />
  );
}
