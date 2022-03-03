/* @flow */
import fs from 'fs';
import path from 'path';
const templates = {};

fs.readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const key = file.slice(0, -3)
        templates[key] = require(`./${file}`)[key]
    })

export default templates