import React from 'react';
import { connect } from 'react-redux';
import { Table,  Pagination} from 'react-bootstrap';

import UserListElement from './userlistelement';
import UserDelete from './userdelete';

class UserList extends React.Component {

render()
{


return(          
<div>
 <Table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Job</th>
                        <th>Edit</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.users.map((user, index) => {



                        return(
                          
<UserListElement key={user.id} user={user}/>

                        );




                    })}
                </tbody>
            </Table>




<UserDelete/>
</div>
);

}






} 




function mapStateToProps(state){
return({users: state.users.list, 
 




});

}
export default connect(mapStateToProps)(UserList); 













