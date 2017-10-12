import React from 'react';

export default class ToolTip extends React.Component {

   render() {
       var visibility="hidden";
       var x=0,y=0;

       if(this.props.tooltip.display===true)
       {
           var position = this.props.tooltip.pos;
           x= position.x;
           y=parseInt(position.y) + parseInt(5);
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
