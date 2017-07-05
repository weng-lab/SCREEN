 
import React from 'react';

import { connect } from 'react-redux';
import { Button, Glyphicon } from 'react-bootstrap';

import { Link } from 'react-router';

class UserListElement extends React.Component 
{


    constructor(props)
    {
        super(props);

        // bind <this> to the event methods
        this.modalDeleteShow = this.modalDeleteShow.bind(this);
    }





render()
{
const user = this.props.user;
return( <tr>
                                <td>#{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.job}</td>
                                <td>
                                    <Link to={'/user-edit/' + user.id}>
                                        Edit
                                    </Link>
                                </td>
                                <td>
                                                        <Button bsSize="xsmall" data-id={user.id} data-username={user.username}
                        onClick={this.modalDeleteShow}>
                        Delete <Glyphicon glyph="remove-circle"/>
                    </Button>
                                </td>
                            </tr>  );

}











    modalDeleteShow(event)
    {
        const user_id = Number(event.target.dataset.id);
        const username = event.target.dataset.username;
        this.props.dispatch({
            type: 'users.modalDeleteShow',
            id: user_id,
            username: username,
        });
    }




}



UserListElement.propTypes = {
user: React.PropTypes.object.isRequired

}


export default connect()(UserListElement);  

