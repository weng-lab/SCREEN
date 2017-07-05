import React from 'react';

import UserList from '../userlist';

/**
 * Home page component
 */
export default class Home extends React.Component
{
    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return(
            <div>
                <UserList/>
            </div>
        );
    }
}
