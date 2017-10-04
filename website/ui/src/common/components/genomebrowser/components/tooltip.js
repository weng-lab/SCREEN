import React from 'react';

import '../App.css';
export default class ToolTip extends React.Component {

   render() {
       var visibility="hidden";
       var x=0,y=0;
       var width=0

       if(this.props.tooltip.display===true)
       {
           var position = this.props.tooltip.pos;
           width =this.props.tooltip.data.width;
           x= position.x;
           y=position.y;
           visibility="visible";
           var tp=parseInt(x);
       }
       else
       {
           visibility="hidden";
       }

       return (
           <g>
              <text visibility={visibility} x={tp} y={y} >{this.props.tooltip.data.value}</text>
           </g>
       );
   }
}
