import 'react-native-gesture-handler';
import 'react-native-get-random-values';

// Polyfills pour ethers v5/v6
import { decode, encode } from 'base-64';
if (!global.btoa) { global.btoa = encode; }
if (!global.atob) { global.atob = decode; }

// Polyfill pour Buffer si nécessaire (souvent requis par ethers/crypto)
import { Buffer } from 'buffer';
if (!global.Buffer) { global.Buffer = Buffer; }

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
