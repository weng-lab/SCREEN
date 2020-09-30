/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

export default class ToolTip extends React.Component {

   render() {
       var visibility="hidden";
       var x=0,y=0;

       if(this.props.tooltip.display===true)
       {
           var position = this.props.tooltip.pos;
           x= position.x;
           y=Math.trunc(position.y);
           visibility="visible";
           var tp=Math.trunc(x);
       }
       else
       {
           visibility="hidden";
       }

       return (
           <g>
              <text visibility={visibility} x={tp} y={y} style={{fontSize:10}} >{this.props.tooltip.data.value}</text>
           </g>
       );
   }
}
