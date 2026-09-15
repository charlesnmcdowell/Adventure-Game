'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.display,'standalone');assert.deepEqual(manifest.display_override,['fullscreen','standalone']);assert.equal(manifest.orientation,'any');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
for(const size of [180,192,512]){const data=fs.readFileSync(path.join(root,`assets/app/icon-${size}.png`));assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16),size);assert.equal(data.readUInt32BE(20),size);assert(data.length>1000);}
for(const file of ['index.html','tools/mobile_site/index.html']){const html=read(file);assert(html.includes('viewport-fit=cover'));assert(html.includes('apple-mobile-web-app-capable'));assert(html.includes('black-translucent'));assert(html.includes('assets/app/icon-180.png'));assert(html.includes('manifest.webmanifest'));}
const shell=read('tools/mobile_site/index.html');assert(shell.includes('src="https://charlesnmcdowell.github.io/Adventure-Game/"'),'preserve existing game/save origin');assert(!read('assets/mobile.css').includes('100vh'),'dynamic viewport units');
console.log('Mobile assets: valid manifest, scoped launch URL, 180/192/512 PNGs, Apple metadata and preserved iframe origin passed.');
