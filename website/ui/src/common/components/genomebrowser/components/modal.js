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
     top: '20%',
     left: '20%',
     transform: 'translate(-20%, -20%)',
     zIndex: '9999',
     background: '#fff'
   }

   let backdropStyle = {
     position: 'absolute',
     width: '100%',
     height: '100%',
     top: '0px',
     left: '0px',
     zIndex: '9998',
     background: 'rgba(0, 0, 0, 0.3)'
   }
   return (
     <div>
       <div style={modalStyle}> {this.props.children}</div>
       <div style={backdropStyle} onClick={e => this.close(e)}/>
     </div>
   )
  }
}
