# Setup Guide

_How to set up LDAB on your own server._

By default LDAB **will not do anything**, you will need to configure how it acts when a blacklisted user (a user who is on the global banlist) joins.

Only people with the **administrator** permission can configure this.

To configure how it acts, use the `/actions` commands.

-   `/actions set <action name>` is used to add an action that runs when a blacklisted user joins the server.
-   `/actions get` is used to see what actions are currently set.
    ` /actions clear <action name>` is used to remove actions.
