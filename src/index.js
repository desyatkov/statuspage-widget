let poly = require("preact-cli/lib/lib/webpack/polyfills");

import { h } from "preact";
import habitat from "preact-habitat";

import Widget from "./components/app";

let _habitat = habitat(Widget);

const is_root = location.pathname === "/";

if(is_root) {
  _habitat.render({
    selector: '#status-app',
    clean: true
  });
}