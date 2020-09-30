/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';
export default class Rects extends React.Component {

    componentDidMount(){
       this.changeheight(this.props);
    }
    UNSAFE_componentWillReceiveProps(nextProps)  {
      if(this.props.y!==nextProps.y || this.props.height!==nextProps.height)
      this.changeheight(nextProps);
    }
  changeheight(nextProps)
  {
    if(nextProps.y > Math.trunc(nextProps.height)-Math.trunc(25))
    {
      nextProps.increaseheight("bigbeds");
    }
  }

       render()
       {
        var data=this.props.data;
        var y =this.props.y;
        var rects;
        var x=((Math.trunc(this.props.x(Math.trunc(this.props.min)))+ Math.trunc(this.props.x(Math.trunc(this.props.max)))/ Math.trunc(2)))- Math.trunc(200);

        if(data)
        {
            rects=data.map((d,i) => {
            if(Math.trunc(this.props.x(d.min)) >= Math.trunc(this.props.leftMargin) && (Math.trunc(this.props.x(d.max)) <= this.props.width) )
            return ( <rect  x={this.props.x(d.min)} y={y} width={Math.trunc(this.props.x(d.max))-Math.trunc(this.props.x(d.min))} height="8" fill={d.itemRgb}
             stroke="none" strokeWidth="1px" key={i}  data-value={d.label} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>);
            else
            return []
        });
        }

        return(
            <g>
                {rects}
                <text x={x} y={y-5} style={{fontSize: 10 }} >{this.props.text}</text>
                <text x={0}  y={y+5} style={{fontSize: 10 }} >{this.props.shortLabel}</text>
            </g>
        );
      }
    }
