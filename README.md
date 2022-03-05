# LDAB

_**L**inked **D**iscord **A**dministrative **B**ot_

LDAB uses a global, third-party banlist to detect blacklisted users in other servers and act accordingly.

## Limitations

LDAB limits itself to set of simple actions once a blacklisted user is detected. More complicated actions (e.g. initiating a vote between admins, or acting based on "severity" of offense) are left to the admins of the server to handle.

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

<details>

<summary>
    Experimental please ignore
</summary>

<table>
    <tr>
        <th>Intent</th>
        <th>Reason</th>
    </tr>
    <tr>
        <td>Server Members</td>
        <td>Scan existing members for blacklisted users<sup>[1]</sup></td>
    </tr>
</table>

[1]: Only on initial join.

</details>

<br />

<table>
    <tr>
        <th>Scope</th>
        <th>Reason</th>
    </tr>
    <tr>
        <td>bot</td>
        <td>Utilize bot functionality</td>
    </tr>
    <tr>
        <td>applications.commands</td>
        <td>Respond to slash commands</td>
    </tr>
</table>

# Installation

If you want to run your own version of the bot:

1. Create an application on Discord with the permissions, scopes, and intents listed in [permissions](#permissions).
2. Make an [`auth.json`](./auth.json) file with the entries filled out as per [`the example`](./auth.example.json).
3. Install dependencies using `yarn` or `npm install`.
4. Start the bot in development mode using `yarn dev` or `npm run dev`.
5. Make a production-ready build using `yarn build` or `npm run build`.
6. Start the bot in production mode using `yarn start` or `node .`
