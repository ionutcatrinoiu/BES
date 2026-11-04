const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function apiFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?apiFiles(path.join(dir,x.name)):[path.join(dir,x.name)]).filter(x=>x.endsWith('.js'))}
test('deployment stays within the 12-function Hobby limit',()=>{const functions=apiFiles(path.join(root,'api'));assert.ok(functions.length<=12,functions.length+' functions exceeds Hobby limit');});
test('function configuration does not reference removed endpoints',()=>{const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));for(const file of Object.keys(config.functions))assert.ok(fs.existsSync(path.join(root,file)),file);});
