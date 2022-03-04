export interface Config {
    /** Max time to wait for a certain action (in seconds) before erroring.
     *
     * Set to 0 to have unlimited wait time.
     */
    timeoutThresholds: {
        /** Log in to Discord. */
        login: number;
    };

    /** Time between checking for updates on the google sheet in seconds. */
    checkInterval: number;
}

export const config: Config = {
    timeoutThresholds: {
        login: 5,
    },
    checkInterval: 3,
};
