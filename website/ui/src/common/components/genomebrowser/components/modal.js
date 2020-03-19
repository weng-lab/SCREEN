/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
export default class Modal extends React.Component {
  close(e) {
    e.preventDefault()

    if (this.props.onClose) {
      this.props.onClose()
    }
  }
  render() {

   let modalStyle = {
     position: 'absolute',
     top: '350px',
     left: '300px',
     transform: 'translate(-20%, -20%)',
     zIndex: '9999',
     background: '#fff'
   }
   return (
     <div>
       <div style={modalStyle}> {this.props.children}</div>
     </div>
   )
  }
}
