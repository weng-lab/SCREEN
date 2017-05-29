import React from 'react';
import DraggableList from 'react-draggable-list';
import {ListItem} from './list';

export class DraggableListItem extends React.Component {
    constructor(props) {super(props);}
    render() {
	return <ListItem value={this.props.item.name}
	           selected="true"
	           n="0" onclick={this.props.item.onClick}
	           draggable={this.props.dragHandle} />
    }
};

class DraggableCtList extends React.Component {
    constructor(props) {super(props);}
    render() {
	return <DraggableList list={this.props.items}
	           itemKey="cellTypeName" template={DraggableListItem}
	           onMoveEnd={this.props.onMoveEnd}
	           container={() => this.props.container}
	           padding={0} />
    }
}
export default DraggableCtList;
