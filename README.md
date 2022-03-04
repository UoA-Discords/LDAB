# LDAB

_**L**inked **D**iscord **A**dministrative **B**ot_

LDAB uses a global, third-party banlist to detect banned users in other servers and act accordingly.

## Scope

LDAB limits itself to set of simple actions once a blacklisted user is detected. More complicated actions (initiating a vote between admins for example) are left to the admins of the server to handle.

## Permissions

<table>
    <tr>
        <th>Permission</th>
        <th>Reason</th>
    </tr>
    <tr>
        <td>Manage Roles</td>
        <td>Assign a role to blacklisted users</td>
    </tr>
    <tr>
        <td>Ban Members</td>
        <td>Ban blacklisted users</td>
    </tr>
    <tr>
        <td>Moderate Members</td>
        <td>Time out blacklisted users</td>
    </tr>
    <tr>
        <td>Send Messages</td>
        <td>Inform admins of a user</td>
    </tr>
    <tr>
        <td>Create Public Threads</td>
        <td>Enable discussion of a user</td>
    </tr>
    <tr>
        <td>Send Messages in Threads</td>
        <td>Same as send messages</td>
    </tr>
</table>

<table>
    <tr>
        <th>Gateway Intent</th>
        <th>Reason</th>
    </tr>
    <tr>
        <td>Server Members</td>
        <td>Scan existing members for blacklisted users.<sup>[1]</sup></td>
    </tr>
</table>

[1]: Only on initial join.

# Installation

If you want to run your own version of the bot:

1. Create an application on Discord with the following:
    - General Permissions:
        - Manage Roles
        - Ban Members
        - Moderate Members
    - Text Permissions:
        - Send Messages
        - Create Public Threads
        - Send Messages in Threads
        - Manage Threads
