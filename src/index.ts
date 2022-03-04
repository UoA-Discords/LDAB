import { Bot } from './classes/Bot';
import getAuth from './helpers/getAuth';

const auth = getAuth();
const devmode = process.argv.slice(2).includes('--devmode');

new Bot(auth, devmode);
