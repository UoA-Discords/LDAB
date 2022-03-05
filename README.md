# LDAB

_**L**inked **D**iscord **A**dministrative **B**ot_

LDAB uses a Google sheets banlist to detect blacklisted users in other servers and act accordingly. It can perform any of the following actions when a blacklist user joins a server:

-   Ban them
-   Time them out
-   Give them a role
-   Notify admins
-   Make a discussion channel

It can also perform multiple actions, e.g. timing out and notifying admins. By default it will do nothing however, so be sure to check out the [command guide](#command-guide) to configure LDAB for your server.

Its recommended you:

-   **Don't** auto ban users.
-   Have any notification/feed channels be admin-only.
-   Use the `/scan` command once you've added LDAB to your server.

## Command Guide

Once you've invited LDAB to you server, you'll need to do some configuration so it knows how to act when a blacklisted user joins, along with some other stuff:

-   `/actions`

    -   Manage the actions taken when a blacklisted user joins the server.

-   `/notifications`

    -   If a notifications channel is specified, LDAB will send messages there whenever a user is added or removed from the global banlist.
    -   Will not send messages about users who aren't in the server.

-   `/adminrole`

    -   Manage the role allowed to use the `/scan`, `/ping` and `/query` commands.
    -   See [command permissions](#command-permissions) for more details.

-   `/scan`

    -   Checks if any of the people in the server are also in the blacklist.

-   `/query`

    -   Check if a single user is in the banlist.

-   `/ping`
    -   Check if the bot is up.

### Command Permissions

-   Users with the **administrator** permission can use all commands.
-   Users with the designated admin role (check this with `/adminrole`) can use the following commands:
    -   /scan
    -   /query
    -   /ping

## Limitations

LDAB is built to be a simple bot, more complicated actions are left to the server moderators to handle. Such actions may include:

-   Initiating a vote between admins
-   Acting based on the "severity" of the offense
-   Pre-emptively banning everyone on the banlist
-   Unban users

## Permissions

LDAB uses the following permissions, scopes, and intents for administrative tasks.

<details>

<summary>Permissions</summary>

<br />

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

</details>

<details>
<summary>Scopes</summary>

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

</details>

<details>

<summary>Intents</summary>

<br />

<table>
    <tr>
        <th>Intent</th>
        <th>Reason</th>
    </tr>
    <tr>
        <td>Server Members</td>
        <td>Scan existing members for blacklisted users</td>
    </tr>
</table>

</details>

# Installation

If you want to set up your own version of the bot, please follow these steps.

<details>

<summary>Instructions</summary>

<br />

1. Create an application on Discord with the permissions, scopes, and intents listed in [permissions](#permissions).
2. Make an [`auth.json`](./auth.json) file with the entries filled out as per [`the example`](./auth.example.json).
3. Install dependencies using `yarn` or `npm install`.
4. Start the bot in development mode using `yarn dev` or `npm run dev`.
5. Make a production-ready build using `yarn build` or `npm run build`.
6. Start the bot in production mode using `yarn start` or `node .`

</details>
