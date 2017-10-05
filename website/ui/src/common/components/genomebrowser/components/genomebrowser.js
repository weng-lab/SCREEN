  import React from 'react';
  import ReactDOM from 'react-dom';
  import * as d3 from "d3";
  import '../../../../css.css'
  import Modal from './modal'
  //var bigwig = require('../external/igvjs/bigwig');
  //var bin = require('../external/igvjs/bin.js');
  class Polylines extends React.Component {

     render() {
          var _self=this;
          if(_self.props.range===undefined  || _self.props.viewLimits===undefined  )
          {
            return null;
          }
          var viewl=this.props.viewLimits,vl;

          if(viewl!==undefined)
             vl=viewl.split(":");
          var y =  d3.scaleLinear().domain([vl[1],vl[0]]).range([_self.props.range ,_self.props.range+50]);
          var yAxis = d3.axisLeft().scale(y);
          yAxis.tickValues(y.ticks(1).concat(y.domain()));
          var data=this.props.data;
          var color ="rgb("+this.props.color+")";
          var x=((_self.props.x(_self.props.min)+_self.props.x(_self.props.max)/parseInt(2)))-parseInt(100);
          var points=_self.props.x(_self.props.min)+","+y(0)+" ";
          var text = _self.props.text;
          if(data===undefined)
          {
            text=""
          }
            if(data)
            {
                data.map(function(d,i)
                {
                  if(d.score > vl[1])
                    d.score =vl[1];

                  for(var j= _self.props.x(d.min);j<=_self.props.x(d.max);j++)
                  {
                    if(j>=_self.props.leftMargin && j <=_self.props.width)
                    points=points + j+","+y(d.score)+" ";
                  }
                });
           }
              points=points +_self.props.x(_self.props.max)+","+y(0);
          return(
              <g>
                  <g transform="translate(100,0)">
                    <Axis  axis={yAxis}/>
                  </g>
                  <polygon points={points} stroke={color} fill={color} strokeWidth="0.1"/>
                  <text x={x} y={_self.props.range-10} fill={color} >{text}</text>
                  <text x={0} y={y(0)}>{_self.props.shortLabel}</text>
              </g>
          );
      }
  }
  class MoveZoom extends React.Component {

     render() {

        var _self=this;
         return (
               <div>
                   Move &nbsp;
                  <input type="submit"  id="backwardbtn95" onClick={_self.props.backward} title="Move 95% to the left" value="<<<"/>
                  <input type="submit"  id="backwardbtn47.5" onClick={_self.props.backward} title="Move 47.5% to the left" value="<<"/>
                  <input type="submit"  id="backwardbtn10" onClick={_self.props.backward} title="Move 10% to the left" value="<"/>
                  <input type="submit" id="forwardbtn10" onClick={_self.props.forward} title="Move 10% to the right" value=">"/>
                  <input type="submit" id="forwardbtn47.5" onClick={_self.props.forward} title="Move 47.5% to the right" value=">>"/>
                  <input type="submit" id="forwardbtn95" onClick={_self.props.forward} title="Move 95% to the right" value=">>>"/>
                  &nbsp;&nbsp;
                  Zoom in&nbsp;
                  <input type="submit"  id="zoomin1.5x" onClick={_self.props.zoomin} value="1.5x"/>
                  <input type="submit"  id="zoomin3x"   onClick={_self.props.zoomin} value="3x"/>
                  <input type="submit"  id="zoomin10x"  onClick={_self.props.zoomin} value="10x"/>
                  &nbsp;&nbsp;
                  Zoom out&nbsp;
                  <input type="submit"  id="zoomout1.5x" onClick={_self.props.zoomout} value="1.5x"/>
                  <input type="submit"  id="zoomout3x" onClick={_self.props.zoomout} value="3x"/>
                  <input type="submit"  id="zoomout10x" onClick={_self.props.zoomout} value="10x"/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <input type="submit" id="loadtrackhb" onClick={_self.props.loadTrackhub} value="Load Trackhub"/>
               </div>
         );
     }
  }
  class Axis extends React.Component {
     componentDidUpdate() { this.renderAxis(); }
     componentDidMount() { this.renderAxis(); }
     renderAxis() {
         var node = ReactDOM.findDOMNode(this);
         d3.select(node).call(this.props.axis);
     }
     render() {
         return (
             <g className="axis"> </g>
         );
     }
  }
  class Grid extends React.Component {

      componentDidUpdate() { this.renderGrid(); }
      componentDidMount() { this.renderGrid(); }
      renderGrid() {
          var node = ReactDOM.findDOMNode(this);
          d3.select(node).call(this.props.grid);

      }
      render() {
          var translate = "translate(0,"+(this.props.h)+")";
          return (
              <g className="y-grid" transform={this.props.gridType==='x'?translate:""}>
              </g>
          );
      }

  }
  class GenomeBrowser extends React.Component {

       static defaultProps = { width: 1200, height: 200, marginleft:100,marginright: 100};
       constructor(props)
       {
         super(props)
         this.state = {
                        tooltip: {display:false,data:{width:'',height:'',value:''},pos:{x:'',y:''}},
                        xminrange:this.props.minrange,xmaxrange:this.props.maxrange,
                        chrom : 'chr11', bp : (this.props.maxrange -this.props.minrange),
                        x : d3.scaleLinear().domain([this.props.minrange,this.props.maxrange]).range([this.props.marginleft , this.props.width ]),
                        bbdata: {},bwdata :{} ,bwinput : [],bbinput: [],checkedstatus: {},exons : [],
                        isModalOpen: false, showK562: false,height:50,signaltype : {}
                      }
       }
       componentWillReceiveProps(nextProps)  {
         this.changerange(nextProps);
       }
       componentWillMount(nextProps)
       {
         this.changerange(nextProps);
       }
       changerange(nextProps)
       {
         this.setState({ x : d3.scaleLinear().domain([this.props.minrange,this.props.maxrange]).range([this.props.marginleft , this.props.width ])})
       }

       componentDidMount()
       {

       }
       closeModal = () =>
       {
          this.setState({ isModalOpen: false })
       }
       loadTrackhub = () =>
       {
          this.setState({ isModalOpen: true })
       }
       updateforwardSize = (e) =>
       {
                  var range =0;
                  if (e.target.id==='forwardbtn10')
                  {
                     range=Math.round(this.state.bp *0.10);
                  }
                  else if(e.target.id==='forwardbtn47.5')
                  {
                    range=Math.round(this.state.bp *0.475);
                  }
                  else if (e.target.id==='forwardbtn95')
                  {
                      range=Math.round(this.state.bp *0.95);
                  }
                 this.setState((prevState) =>
                  {
                    return {xminrange: parseInt(prevState.xminrange) + parseInt(range),xmaxrange: parseInt(prevState.xmaxrange) + parseInt(range)};
                  },() => {
                       let xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width ]);
                       this.setState({x:xrange},() => { //this.readBigBed();this.readBigWig();
                       })
                  });
       }
       updatebackwardSize = (e) =>
       {
            var range =0;
            if (e.target.id==='backwardbtn10')
            {
                     range=Math.round(this.state.bp *0.10);
            }
            else if(e.target.id==='backwardbtn47.5')
            {
                    range=Math.round(this.state.bp *0.475);
            }
            else if (e.target.id==='backwardbtn95')
            {
                    range=Math.round(this.state.bp *0.95);
            }
            this.setState((prevState) => {
                      return {xminrange: parseInt(prevState.xminrange) - parseInt(range,10),xmaxrange: parseInt(prevState.xmaxrange) - parseInt(range,10)};
                    },() => {
                      var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width]);
                       this.setState({x:xrange},() => {//this.readBigBed(); this.readBigWig();
                        })
                      });
       }
       zoomin = (e) =>
       {
         var mean= Math.round((parseInt(this.state.xminrange,10) + parseInt(this.state.xmaxrange,10))/2);
         var range =0,diff=0;
         if (e.target.id==='zoomin1.5x')
         {
             diff= Math.round((this.state.bp)/1.5);
             range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomin3x')
         {
             diff= Math.round((this.state.bp)/3);
             range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomin10x')
         {
             diff= Math.round((this.state.bp)/10);
             range =Math.round(diff/2);
         }
         this.setState({xminrange:parseInt(mean,10)-parseInt(range,10)},
         () => {
           this.setState({xmaxrange:parseInt(this.state.xminrange,10)+parseInt(diff,10)},
           () => {
             this.setState({bp:(parseInt(this.state.xmaxrange,10)-parseInt(this.state.xminrange,10))});
             let xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
             this.setState({x:xrange},()=>{ //this.readBigBed(); this.readBigWig();
             });
              })
            });
       }
       zoomout = (e) =>
       {
         var mean= Math.round((parseInt(this.state.xminrange,10) + parseInt(this.state.xmaxrange,10))/2);
         var range =0,diff=0;
         if (e.target.id==='zoomout1.5x')
         {
             diff= Math.round(this.state.bp*1.5);
             range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomout3x')
         {
           diff= Math.round(this.state.bp*3);
           range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomout10x')
         {
           diff= Math.round(this.state.bp*10);
           range =Math.round(diff/2);
         }
         this.setState({xminrange:parseInt(mean,10)-parseInt(range,10)},
         () => {
           this.setState({xmaxrange:parseInt(this.state.xminrange,10)+parseInt(diff,10)},
           () => {
             this.setState({bp:(parseInt(this.state.xmaxrange,10)-parseInt(this.state.xminrange,10))});
             var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
             this.setState({x:xrange},() =>{ //this.readBigBed(); this.readBigWig();
             });
           })
         });
       }
       buttonclick = () =>
       {
         var inp =this.refs.itext.value,ivc,iv=null;
         if(inp==="")
         {
           alert("Invalid Input");
         }
         else {
            ivc = inp.split(":");
            iv = ivc[1].split("-");
         }
         if(iv!=null)
         {
           this.setState({xminrange:iv[0],xmaxrange:iv[1]},() =>{
             var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
           this.setState({x:xrange},() =>{
            // this.readBigBed();
            // this.readBigWig();
           });
         })
         this.setState({chrom:ivc[0]});
         this.setState({bp:(iv[1]-iv[0])});
         }

       }
       render()
       {
         let currentrange = this.state.chrom+":"+this.state.xminrange+"-"+this.state.xmaxrange;
          let bp = parseInt(this.state.bp,10)+1;
          let  xAxis = d3.axisBottom().scale(this.state.x);
          let xGrid = d3.axisBottom().scale(this.state.x).ticks(100).tickSize(this.state.height, 0, 0).tickFormat("");


          return (
              <div>
              <div className="search">
                <input type="text" size="30"  onSelect={this.pasteonselect} value={currentrange} readOnly/>&nbsp; {bp} bp &nbsp;
                <input type="text" ref="itext" size="50" placeholder="enter position"/>&nbsp;
                <input type="submit" onClick={this.buttonclick} value="Search" />
                <br/>
                <br/>
                <MoveZoom loadTrackhub={this.loadTrackhub} backward={this.updatebackwardSize} forward={this.updateforwardSize} zoomin={this.zoomin} zoomout={this.zoomout}/>
              </div>
              { this.state.isModalOpen && <Modal onClose={this.closeModal}>
                <div >
                  nishi
                  </div>
              </Modal> }
              <svg width={this.props.width+50} height={this.state.height}>
                  <g transform="translate(0,20)">
                    <Axis axis={xAxis} />
                    <Grid h={this.props.height} grid={xGrid} gridType="y"/>
                  </g>
              </svg>
              </div>
          );
      }
  }
  export default GenomeBrowser;
