import Auth from '../types/Auth';
import Colours from '../types/Colours';

function getAuth(): Auth {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const auth = require('../../auth.json');
        return auth;
    } catch (error) {
        if (error instanceof Error && error.message.includes('auth.json')) {
            console.log(`missing ${Colours.FgMagenta}auth.json${Colours.Reset} file in root directory`);
        } else console.log(error);
        process.exit(1);
    }
}

export default getAuth;
