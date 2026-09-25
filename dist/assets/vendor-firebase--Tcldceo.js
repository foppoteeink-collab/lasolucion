import{o as h_,R as Qu}from"./vendor-Ce58CTtY.js";const d_=()=>{};var ph={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rf=function(r){const e=[];let t=0;for(let n=0;n<r.length;n++){let s=r.charCodeAt(n);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(s=65536+((s&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},f_=function(r){const e=[];let t=0,n=0;for(;t<r.length;){const s=r[t++];if(s<128)e[n++]=String.fromCharCode(s);else if(s>191&&s<224){const i=r[t++];e[n++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=r[t++],o=r[t++],u=r[t++],c=((s&7)<<18|(i&63)<<12|(o&63)<<6|u&63)-65536;e[n++]=String.fromCharCode(55296+(c>>10)),e[n++]=String.fromCharCode(56320+(c&1023))}else{const i=r[t++],o=r[t++];e[n++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},sf={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let s=0;s<r.length;s+=3){const i=r[s],o=s+1<r.length,u=o?r[s+1]:0,c=s+2<r.length,h=c?r[s+2]:0,f=i>>2,m=(i&3)<<4|u>>4;let _=(u&15)<<2|h>>6,R=h&63;c||(R=64,o||(_=64)),n.push(t[f],t[m],t[_],t[R])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(rf(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):f_(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let s=0;s<r.length;){const i=t[r.charAt(s++)],u=s<r.length?t[r.charAt(s)]:0;++s;const h=s<r.length?t[r.charAt(s)]:64;++s;const m=s<r.length?t[r.charAt(s)]:64;if(++s,i==null||u==null||h==null||m==null)throw new m_;const _=i<<2|u>>4;if(n.push(_),h!==64){const R=u<<4&240|h>>2;if(n.push(R),m!==64){const C=h<<6&192|m;n.push(C)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class m_ extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const p_=function(r){const e=rf(r);return sf.encodeByteArray(e,!0)},To=function(r){return p_(r).replace(/\./g,"")},of=function(r){try{return sf.decodeString(r,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function af(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const g_=()=>af().__FIREBASE_DEFAULTS__,__=()=>{if(typeof process>"u"||typeof ph>"u")return;const r=ph.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},y_=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=r&&of(r[1]);return e&&JSON.parse(e)},Ho=()=>{try{return d_()||g_()||__()||y_()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},uf=r=>{var e,t;return(t=(e=Ho())==null?void 0:e.emulatorHosts)==null?void 0:t[r]},I_=r=>{const e=uf(r);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const n=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),n]:[e.substring(0,t),n]},cf=()=>{var r;return(r=Ho())==null?void 0:r.config},lf=r=>{var e;return(e=Ho())==null?void 0:e[`_${r}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class T_{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function w_(r,e){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},n=e||"demo-project",s=r.iat||0,i=r.sub||r.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${n}`,aud:n,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...r};return[To(JSON.stringify(t)),To(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ve(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function E_(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(ve())}function hf(){var e;const r=(e=Ho())==null?void 0:e.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function v_(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function A_(){const r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function P_(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function R_(){const r=ve();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function df(){return!hf()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function ff(){return!hf()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function mf(){try{return typeof indexedDB=="object"}catch{return!1}}function b_(){return new Promise((r,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(n);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const S_="FirebaseError";class Ut extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=S_,Object.setPrototypeOf(this,Ut.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,mi.prototype.create)}}class mi{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?V_(i,n):"Error",u=`${this.serviceName}: ${o} (${s}).`;return new Ut(s,u,n)}}function V_(r,e){try{let t=0,n="";for(;t<r.length;){const s=r.indexOf("{$",t);if(s===-1){n+=r.substring(t);break}const i=r.indexOf("}",s+2);if(i===-1){n+=r.substring(t);break}const o=r.substring(s+2,i),u=e[o];n+=r.substring(t,s)+(u!=null?String(u):`<${o}?>`),t=i+1}return n}catch{return r}}function C_(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function dn(r,e){if(r===e)return!0;const t=Object.keys(r),n=Object.keys(e);for(const s of t){if(!n.includes(s))return!1;const i=r[s],o=e[s];if(gh(i)&&gh(o)){if(!dn(i,o))return!1}else if(i!==o)return!1}for(const s of n)if(!t.includes(s))return!1;return!0}function gh(r){return r!==null&&typeof r=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pi(r){const e=[];for(const[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function x_(r,e){const t=new N_(r,e);return t.subscribe.bind(t)}class N_{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let s;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");D_(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:n},s.next===void 0&&(s.next=Xa),s.error===void 0&&(s.error=Xa),s.complete===void 0&&(s.complete=Xa);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function D_(r,e){if(typeof r!="object"||r===null)return!1;for(const t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function Xa(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fe(r){return r&&r._delegate?r._delegate:r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jr(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Ju(r){return(await fetch(r,{credentials:"include"})).ok}class Jn{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xn="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k_{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new T_;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&n.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(n)return null;throw s}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(L_(e))try{this.getOrInitializeService({instanceIdentifier:xn})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});n.resolve(i)}catch{}}}}clearInstance(e=xn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=xn){return this.instances.has(e)}getOptions(e=xn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[i,o]of this.instancesDeferred.entries()){const u=this.normalizeInstanceIdentifier(i);n===u&&o.resolve(s)}return s}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);const i=this.instances.get(n);return i&&e(i,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:O_(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=xn){return this.component?this.component.multipleInstances?e:xn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function O_(r){return r===xn?void 0:r}function L_(r){return r.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class M_{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new k_(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Y;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(Y||(Y={}));const F_={debug:Y.DEBUG,verbose:Y.VERBOSE,info:Y.INFO,warn:Y.WARN,error:Y.ERROR,silent:Y.SILENT},U_=Y.INFO,B_={[Y.DEBUG]:"log",[Y.VERBOSE]:"log",[Y.INFO]:"info",[Y.WARN]:"warn",[Y.ERROR]:"error"},q_=(r,e,...t)=>{if(e<r.logLevel)return;const n=new Date().toISOString(),s=B_[e];if(s)console[s](`[${n}]  ${r.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Yu{constructor(e){this.name=e,this._logLevel=U_,this._logHandler=q_,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in Y))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?F_[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,Y.DEBUG,...e),this._logHandler(this,Y.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,Y.VERBOSE,...e),this._logHandler(this,Y.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,Y.INFO,...e),this._logHandler(this,Y.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,Y.WARN,...e),this._logHandler(this,Y.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,Y.ERROR,...e),this._logHandler(this,Y.ERROR,...e)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j_{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if($_(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function $_(r){const e=r.getComponent();return(e==null?void 0:e.type)==="VERSION"}const fu="@firebase/app",_h="0.16.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dt=new Yu("@firebase/app"),z_="@firebase/app-compat",K_="@firebase/analytics-compat",G_="@firebase/analytics",W_="@firebase/app-check-compat",H_="@firebase/app-check",Q_="@firebase/auth",J_="@firebase/auth-compat",Y_="@firebase/database",X_="@firebase/data-connect",Z_="@firebase/database-compat",ey="@firebase/functions",ty="@firebase/functions-compat",ny="@firebase/installations",ry="@firebase/installations-compat",sy="@firebase/messaging",iy="@firebase/messaging-compat",oy="@firebase/performance",ay="@firebase/performance-compat",uy="@firebase/remote-config",cy="@firebase/remote-config-compat",ly="@firebase/storage",hy="@firebase/storage-compat",dy="@firebase/firestore",fy="@firebase/ai",my="@firebase/firestore-compat",py="firebase",gy="12.18.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mu="[DEFAULT]",_y={[fu]:"fire-core",[z_]:"fire-core-compat",[G_]:"fire-analytics",[K_]:"fire-analytics-compat",[H_]:"fire-app-check",[W_]:"fire-app-check-compat",[Q_]:"fire-auth",[J_]:"fire-auth-compat",[Y_]:"fire-rtdb",[X_]:"fire-data-connect",[Z_]:"fire-rtdb-compat",[ey]:"fire-fn",[ty]:"fire-fn-compat",[ny]:"fire-iid",[ry]:"fire-iid-compat",[sy]:"fire-fcm",[iy]:"fire-fcm-compat",[oy]:"fire-perf",[ay]:"fire-perf-compat",[uy]:"fire-rc",[cy]:"fire-rc-compat",[ly]:"fire-gcs",[hy]:"fire-gcs-compat",[dy]:"fire-fst",[my]:"fire-fst-compat",[fy]:"fire-vertex","fire-js":"fire-js",[py]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ws=new Map,yy=new Map,pu=new Map;function yh(r,e){try{r.container.addComponent(e)}catch(t){Dt.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function Sr(r){const e=r.name;if(pu.has(e))return Dt.debug(`There were multiple attempts to register component ${e}.`),!1;pu.set(e,r);for(const t of Ws.values())yh(t,r);for(const t of yy.values())yh(t,r);return!0}function Qo(r,e){const t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function ut(r){return r==null?!1:r.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Iy={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},bt=new mi("app","Firebase",Iy);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ty{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new Jn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw bt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yr=gy;function wy(r,e={}){let t=r;typeof e!="object"&&(e={name:e});const n={name:mu,automaticDataCollectionEnabled:!0,...e},s=n.name;if(typeof s!="string"||!s)throw bt.create("bad-app-name",{appName:String(s)});if(t||(t=cf()),!t)throw bt.create("no-options");const i=Ws.get(s);if(i)if(dn(t,i.options)){if(dn(n,i.config))return i;throw bt.create("duplicate-app",{appName:s,mismatchedParam:"config",oldValue:JSON.stringify(i.config),newValue:JSON.stringify(n)})}else throw bt.create("duplicate-app",{appName:s,mismatchedParam:"options",oldValue:JSON.stringify(i.options),newValue:JSON.stringify(t)});const o=new M_(s);for(const c of pu.values())o.addComponent(c);const u=new Ty(t,n,o);return Ws.set(s,u),u}function pf(r=mu){const e=Ws.get(r);if(!e&&r===mu&&cf())return wy();if(!e)throw bt.create("no-app",{appName:r});return e}function WP(){return Array.from(Ws.values())}function on(r,e,t){let n=_y[r]??r;t&&(n+=`-${t}`);const s=n.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${n}" with version "${e}":`];s&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Dt.warn(o.join(" "));return}Sr(new Jn(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ey="firebase-heartbeat-database",vy=1,Hs="firebase-heartbeat-store";let Za=null;function gf(){return Za||(Za=h_(Ey,vy,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(Hs)}catch(t){console.warn(t)}}}}).catch(r=>{throw bt.create("idb-open",{originalErrorMessage:r.message})})),Za}async function Ay(r){try{const t=(await gf()).transaction(Hs),n=await t.objectStore(Hs).get(_f(r));return await t.done,n}catch(e){if(e instanceof Ut)Dt.warn(e.message);else{const t=bt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Dt.warn(t.message)}}}async function Ih(r,e){try{const n=(await gf()).transaction(Hs,"readwrite");await n.objectStore(Hs).put(e,_f(r)),await n.done}catch(t){if(t instanceof Ut)Dt.warn(t.message);else{const n=bt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Dt.warn(n.message)}}}function _f(r){return`${r.name}!${r.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Py=1024,Ry=30;class by{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Vy(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=Th();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>Ry){const o=Cy(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){Dt.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Th(),{heartbeatsToSend:n,unsentEntries:s}=Sy(this._heartbeatsCache.heartbeats),i=To(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Dt.warn(t),""}}}function Th(){return new Date().toISOString().substring(0,10)}function Sy(r,e=Py){const t=[];let n=r.slice();for(const s of r){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),wh(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),wh(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class Vy{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return mf()?b_().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Ay(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return Ih(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return Ih(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function wh(r){return To(JSON.stringify({version:2,heartbeats:r})).length}function Cy(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xy(r){Sr(new Jn("platform-logger",e=>new j_(e),"PRIVATE")),Sr(new Jn("heartbeat",e=>new by(e),"PRIVATE")),on(fu,_h,r),on(fu,_h,"esm2020"),on("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */xy("");var Ny="firebase",Dy="12.18.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */on(Ny,Dy,"app");function yf(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const ky=yf,If=new mi("auth","Firebase",yf());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wo=new Yu("@firebase/auth");function Tf(r,...e){wo.logLevel<=Y.WARN&&wo.warn(`Auth (${Yr}): ${r}`,...e)}function ro(r,...e){wo.logLevel<=Y.ERROR&&wo.error(`Auth (${Yr}): ${r}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vt(r,...e){throw Zu(r,...e)}function lt(r,...e){return Zu(r,...e)}function Xu(r,e,t){const n={...ky(),[e]:t};return new mi("auth","Firebase",n).create(e,{appName:r.name})}function jn(r){return Xu(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Oy(r,e,t){const n=t;if(!(e instanceof n))throw n.name!==e.constructor.name&&vt(r,"argument-error"),Xu(r,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function Zu(r,...e){if(typeof r!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return If.create(r,...e)}function K(r,e,...t){if(!r)throw Zu(e,...t)}function St(r){const e="INTERNAL ASSERTION FAILED: "+r;throw ro(e),new Error(e)}function kt(r,e){r||St(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gu(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.href)||""}function Ly(){return Eh()==="http:"||Eh()==="https:"}function Eh(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function My(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Ly()||A_()||"connection"in navigator)?navigator.onLine:!0}function Fy(){if(typeof navigator>"u")return null;const r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gi{constructor(e,t){this.shortDelay=e,this.longDelay=t,kt(t>e,"Short delay should be less than long delay!"),this.isMobile=E_()||P_()}get(){return My()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ec(r,e){kt(r.emulator,"Emulator should always be set here");const{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wf{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;St("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;St("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;St("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uy={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const By=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],qy=new gi(3e4,6e4);function tc(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function Xr(r,e,t,n,s={}){return Ef(r,s,async()=>{let i={},o={};n&&(e==="GET"?o=n:i={body:JSON.stringify(n)});const u=pi({...o,key:r.config.apiKey}).slice(1),c=await r._getAdditionalHeaders();c["Content-Type"]="application/json",r.languageCode&&(c["X-Firebase-Locale"]=r.languageCode);const h={method:e,headers:c,...i};return v_()||(h.referrerPolicy="strict-origin-when-cross-origin"),r.emulatorConfig&&Jr(r.emulatorConfig.host)&&(h.credentials="include"),wf.fetch()(await vf(r,r.config.apiHost,t,u),h)})}async function Ef(r,e,t){r._canInitEmulator=!1;const n={...Uy,...e};try{const s=new $y(r),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw Wi(r,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const u=i.ok?o.errorMessage:o.error.message,[c,h]=u.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw Wi(r,"credential-already-in-use",o);if(c==="EMAIL_EXISTS")throw Wi(r,"email-already-in-use",o);if(c==="USER_DISABLED")throw Wi(r,"user-disabled",o);const f=n[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(h)throw Xu(r,f,h);vt(r,f)}}catch(s){if(s instanceof Ut)throw s;vt(r,"network-request-failed",{message:String(s)})}}async function jy(r,e,t,n,s={}){const i=await Xr(r,e,t,n,s);return"mfaPendingCredential"in i&&vt(r,"multi-factor-auth-required",{_serverResponse:i}),i}async function vf(r,e,t,n){const s=`${e}${t}?${n}`,i=r,o=i.config.emulator?ec(r.config,s):`${r.config.apiScheme}://${s}`;return By.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}class $y{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(lt(this.auth,"network-request-failed")),qy.get())})}}function Wi(r,e,t){const n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const s=lt(r,e,n);return s.customData._tokenResponse=t,s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function zy(r,e){return Xr(r,"POST","/v1/accounts:delete",e)}async function Eo(r,e){return Xr(r,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ks(r){if(r)try{const e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function Ky(r,e=!1){const t=Fe(r),n=await t.getIdToken(e),s=nc(n);K(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:n,authTime:ks(eu(s.auth_time)),issuedAtTime:ks(eu(s.iat)),expirationTime:ks(eu(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function eu(r){return Number(r)*1e3}function nc(r){const[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return ro("JWT malformed, contained fewer than 3 sections"),null;try{const s=of(t);return s?JSON.parse(s):(ro("Failed to decode base64 JWT payload"),null)}catch(s){return ro("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function vh(r){const e=nc(r);return K(e,"internal-error"),K(typeof e.exp<"u","internal-error"),K(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Qs(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof Ut&&Gy(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function Gy({code:r}){return r==="auth/user-disabled"||r==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wy{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _u{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=ks(this.lastLoginAt),this.creationTime=ks(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function vo(r){var m;const e=r.auth,t=await r.getIdToken(),n=await Qs(r,Eo(e,{idToken:t}));K(n==null?void 0:n.users.length,e,"internal-error");const s=n.users[0];r._notifyReloadListener(s);const i=(m=s.providerUserInfo)!=null&&m.length?Af(s.providerUserInfo):[],o=Qy(r.providerData,i),u=r.isAnonymous,c=!(r.email&&s.passwordHash)&&!(o!=null&&o.length),h=u?c:!1,f={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new _u(s.createdAt,s.lastLoginAt),isAnonymous:h};Object.assign(r,f)}async function Hy(r){const e=Fe(r);await vo(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Qy(r,e){return[...r.filter(n=>!e.some(s=>s.providerId===n.providerId)),...e]}function Af(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Jy(r,e){const t=await Ef(r,{},async()=>{const n=pi({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=r.config,o=await vf(r,s,"/v1/token",`key=${i}`),u=await r._getAdditionalHeaders();u["Content-Type"]="application/x-www-form-urlencoded";const c={method:"POST",headers:u,body:n};return r.emulatorConfig&&Jr(r.emulatorConfig.host)&&(c.credentials="include"),wf.fetch()(o,c)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function Yy(r,e){return Xr(r,"POST","/v2/accounts:revokeToken",tc(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ar{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){K(e.idToken,"internal-error"),K(typeof e.idToken<"u","internal-error"),K(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):vh(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){K(e.length!==0,"internal-error");const t=vh(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(K(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:s,expiresIn:i}=await Jy(e,t);this.updateTokensAndExpiration(n,s,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:s,expirationTime:i}=t,o=new Ar;return n&&(K(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),s&&(K(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&(K(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Ar,this.toJSON())}_performRefresh(){return St("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ht(r,e){K(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}class ct{constructor({uid:e,auth:t,stsTokenManager:n,...s}){this.providerId="firebase",this.proactiveRefresh=new Wy(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new _u(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await Qs(this,this.stsTokenManager.getToken(this.auth,e));return K(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Ky(this,e)}reload(){return Hy(this)}_assign(e){this!==e&&(K(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new ct({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){K(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await vo(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(ut(this.auth.app))return Promise.reject(jn(this.auth));const e=await this.getIdToken();return await Qs(this,zy(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,u=t.tenantId??void 0,c=t._redirectEventId??void 0,h=t.createdAt??void 0,f=t.lastLoginAt??void 0,{uid:m,emailVerified:_,isAnonymous:R,providerData:C,stsTokenManager:U}=t;K(m&&U,e,"internal-error");const L=Ar.fromJSON(this.name,U);K(typeof m=="string",e,"internal-error"),Ht(n,e.name),Ht(s,e.name),K(typeof _=="boolean",e,"internal-error"),K(typeof R=="boolean",e,"internal-error"),Ht(i,e.name),Ht(o,e.name),Ht(u,e.name),Ht(c,e.name),Ht(h,e.name),Ht(f,e.name);const z=new ct({uid:m,auth:e,email:s,emailVerified:_,displayName:n,isAnonymous:R,photoURL:o,phoneNumber:i,tenantId:u,stsTokenManager:L,createdAt:h,lastLoginAt:f});return C&&Array.isArray(C)&&(z.providerData=C.map(W=>({...W}))),c&&(z._redirectEventId=c),z}static async _fromIdTokenResponse(e,t,n=!1){const s=new Ar;s.updateFromServerResponse(t);const i=new ct({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:n});return await vo(i),i}static async _fromGetAccountInfoResponse(e,t,n){const s=t.users[0];K(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?Af(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),u=new Ar;u.updateFromIdToken(n);const c=new ct({uid:s.localId,auth:e,stsTokenManager:u,isAnonymous:o}),h={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new _u(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(c,h),c}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ah=new Map;function Vt(r){kt(r instanceof Function,"Expected a class definition");let e=Ah.get(r);return e?(kt(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,Ah.set(r,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pf{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Pf.type="NONE";const Ph=Pf;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function so(r,e,t){return`firebase:${r}:${e}:${t}`}class Pr{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:s,name:i}=this.auth;this.fullUserKey=so(this.userKey,s.apiKey,i),this.fullPersistenceKey=so("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Eo(this.auth,{idToken:e}).catch(()=>{});return t?ct._fromGetAccountInfoResponse(this.auth,t,e):null}return ct._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,n="authUser"){if(!t.length)return new Pr(Vt(Ph),e,n);const s=(await Promise.all(t.map(async h=>{if(await h._isAvailable())return h}))).filter(h=>h);let i=s[0]||Vt(Ph);const o=so(n,e.config.apiKey,e.name);let u=null;for(const h of t)try{const f=await h._get(o);if(f){let m;if(typeof f=="string"){const _=await Eo(e,{idToken:f}).catch(()=>{});if(!_)break;m=await ct._fromGetAccountInfoResponse(e,_,f)}else m=ct._fromJSON(e,f);h!==i&&(u=m),i=h;break}}catch{}const c=s.filter(h=>h._shouldAllowMigration);return!i._shouldAllowMigration||!c.length?new Pr(i,e,n):(i=c[0],u&&await i._set(o,u.toJSON()),await Promise.all(t.map(async h=>{if(h!==i)try{await h._remove(o)}catch{}})),new Pr(i,e,n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rh(r){const e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Vf(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Rf(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(xf(e))return"Blackberry";if(Nf(e))return"Webos";if(bf(e))return"Safari";if((e.includes("chrome/")||Sf(e))&&!e.includes("edge/"))return"Chrome";if(Cf(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function Rf(r=ve()){return/firefox\//i.test(r)}function bf(r=ve()){const e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Sf(r=ve()){return/crios\//i.test(r)}function Vf(r=ve()){return/iemobile/i.test(r)}function Cf(r=ve()){return/android/i.test(r)}function xf(r=ve()){return/blackberry/i.test(r)}function Nf(r=ve()){return/webos/i.test(r)}function rc(r=ve()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function Xy(r=ve()){var e;return rc(r)&&!!((e=window.navigator)!=null&&e.standalone)}function Zy(){return R_()&&document.documentMode===10}function Df(r=ve()){return rc(r)||Cf(r)||Nf(r)||xf(r)||/windows phone/i.test(r)||Vf(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kf(r,e=[]){let t;switch(r){case"Browser":t=Rh(ve());break;case"Worker":t=`${Rh(ve())}-${r}`;break;default:t=r}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Yr}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eI{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=i=>new Promise((o,u)=>{try{const c=e(i);o(c)}catch(c){u(c)}});n.onAbort=t,this.queue.push(n);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function tI(r,e={}){return Xr(r,"GET","/v2/passwordPolicy",tc(r,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nI=6;class rI{constructor(e){var n;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??nI,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let s=0;s<e.length;s++)n=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sI{constructor(e,t,n,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new bh(this),this.idTokenSubscription=new bh(this),this.beforeStateQueue=new eI(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=If,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=Vt(t)),this._initializationPromise=this.queue(async()=>{var n,s,i;if(!this._deleted&&(this.persistenceManager=await Pr.create(this,e),(n=this._resolvePersistenceManagerAvailable)==null||n.call(this),!this._deleted)){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Eo(this,{idToken:e}),n=await ct._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(ut(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(u=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(u,u))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,u=n==null?void 0:n._redirectEventId,c=await this.tryRedirectSignIn(e);(!o||o===u)&&(c!=null&&c.user)&&(n=c.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(o){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return K(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await vo(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=Fy()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(ut(this.app))return Promise.reject(jn(this));const t=e?Fe(e):null;return t&&K(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&K(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return ut(this.app)?Promise.reject(jn(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return ut(this.app)?Promise.reject(jn(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(Vt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await tI(this),t=new rI(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new mi("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await Yy(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&Vt(e)||this._popupRedirectResolver;K(t,this,"argument-error"),this.redirectPersistenceManager=await Pr.create(this,[Vt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const u=this._isInitialized?Promise.resolve():this._initializationPromise;if(K(u,this,"internal-error"),u.then(()=>{o||i(this.currentUser)}),typeof t=="function"){const c=e.addObserver(t,n,s);return()=>{o=!0,c()}}else{const c=e.addObserver(t);return()=>{o=!0,c()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return K(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=kf(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(ut(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&Tf(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Jo(r){return Fe(r)}class bh{constructor(e){this.auth=e,this.observer=null,this.addObserver=x_(t=>this.observer=t)}get next(){return K(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let sc={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function iI(r){sc=r}function oI(r){return sc.loadJS(r)}function aI(){return sc.gapiScript}function uI(r){return`__${r}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cI(r,e){const t=Qo(r,"auth");if(t.isInitialized()){const s=t.getImmediate(),i=t.getOptions();if(dn(i,e??{}))return s;vt(s,"already-initialized")}return t.initialize({options:e})}function lI(r,e){const t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(Vt);e!=null&&e.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function hI(r,e,t){const n=Jo(r);K(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const s=!1,i=Of(e),{host:o,port:u}=dI(e),c=u===null?"":`:${u}`,h={url:`${i}//${o}${c}/`},f=Object.freeze({host:o,port:u,protocol:i.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!n._canInitEmulator){K(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),K(dn(h,n.config.emulator)&&dn(f,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=h,n.emulatorConfig=f,n.settings.appVerificationDisabledForTesting=!0,Jr(o)?Ju(`${i}//${o}${c}`):fI()}function Of(r){const e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function dI(r){const e=Of(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(n);if(s){const i=s[1];return{host:i,port:Sh(n.substr(i.length+1))}}else{const[i,o]=n.split(":");return{host:i,port:Sh(o)}}}function Sh(r){if(!r)return null;const e=Number(r);return isNaN(e)?null:e}function fI(){function r(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lf{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return St("not implemented")}_getIdTokenResponse(e){return St("not implemented")}_linkToIdToken(e,t){return St("not implemented")}_getReauthenticationResolver(e){return St("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rr(r,e){return jy(r,"POST","/v1/accounts:signInWithIdp",tc(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mI="http://localhost";class Yn extends Lf{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new Yn(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):vt("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,...i}=t;if(!n||!s)return null;const o=new Yn(n,s);return o.idToken=i.idToken||void 0,o.accessToken=i.accessToken||void 0,o.secret=i.secret,o.nonce=i.nonce,o.pendingToken=i.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return Rr(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,Rr(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Rr(e,t)}buildRequest(){const e={requestUri:mI,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=pi(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ic{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _i extends ic{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zt extends _i{constructor(){super("facebook.com")}static credential(e){return Yn._fromParams({providerId:Zt.PROVIDER_ID,signInMethod:Zt.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Zt.credentialFromTaggedObject(e)}static credentialFromError(e){return Zt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Zt.credential(e.oauthAccessToken)}catch{return null}}}Zt.FACEBOOK_SIGN_IN_METHOD="facebook.com";Zt.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en extends _i{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return Yn._fromParams({providerId:en.PROVIDER_ID,signInMethod:en.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return en.credentialFromTaggedObject(e)}static credentialFromError(e){return en.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return en.credential(t,n)}catch{return null}}}en.GOOGLE_SIGN_IN_METHOD="google.com";en.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tn extends _i{constructor(){super("github.com")}static credential(e){return Yn._fromParams({providerId:tn.PROVIDER_ID,signInMethod:tn.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return tn.credentialFromTaggedObject(e)}static credentialFromError(e){return tn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return tn.credential(e.oauthAccessToken)}catch{return null}}}tn.GITHUB_SIGN_IN_METHOD="github.com";tn.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nn extends _i{constructor(){super("twitter.com")}static credential(e,t){return Yn._fromParams({providerId:nn.PROVIDER_ID,signInMethod:nn.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return nn.credentialFromTaggedObject(e)}static credentialFromError(e){return nn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return nn.credential(t,n)}catch{return null}}}nn.TWITTER_SIGN_IN_METHOD="twitter.com";nn.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vr{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,s=!1){const i=await ct._fromIdTokenResponse(e,n,s),o=Vh(n);return new Vr({user:i,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const s=Vh(n);return new Vr({user:e,providerId:s,_tokenResponse:n,operationType:t})}}function Vh(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ao extends Ut{constructor(e,t,n,s){super(t.code,t.message),this.operationType=n,this.user=s,Object.setPrototypeOf(this,Ao.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,s){return new Ao(e,t,n,s)}}function Mf(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(i=>{throw i.code==="auth/multi-factor-auth-required"?Ao._fromErrorAndOperation(r,i,e,n):i})}async function pI(r,e,t=!1){const n=await Qs(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return Vr._forOperation(r,"link",n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function gI(r,e,t=!1){const{auth:n}=r;if(ut(n.app))return Promise.reject(jn(n));const s="reauthenticate";try{const i=await Qs(r,Mf(n,s,e,r),t);K(i.idToken,n,"internal-error");const o=nc(i.idToken);K(o,n,"internal-error");const{sub:u}=o;return K(r.uid===u,n,"user-mismatch"),Vr._forOperation(r,s,i)}catch(i){throw(i==null?void 0:i.code)==="auth/user-not-found"&&vt(n,"user-mismatch"),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _I(r,e,t=!1){if(ut(r.app))return Promise.reject(jn(r));const n="signIn",s=await Mf(r,n,e),i=await Vr._fromIdTokenResponse(r,n,s);return t||await r._updateCurrentUser(i.user),i}function yI(r,e,t,n){return Fe(r).onIdTokenChanged(e,t,n)}function II(r,e,t){return Fe(r).beforeAuthStateChanged(e,t)}const Po="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ff{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Po,"1"),this.storage.removeItem(Po),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const TI=1e3,wI=10;class Uf extends Ff{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Df(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),s=this.localCache[t];n!==s&&e(t,s,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,u,c)=>{this.notifyListeners(o,c)});return}const n=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},i=this.storage.getItem(n);Zy()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,wI):s()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},TI)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Uf.type="LOCAL";const EI=Uf;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bf extends Ff{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Bf.type="SESSION";const qf=Bf;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vI(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yo{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const n=new Yo(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:s,data:i}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:s});const u=Array.from(o).map(async h=>h(t.origin,i)),c=await vI(u);t.ports[0].postMessage({status:"done",eventId:n,eventType:s,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Yo.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oc(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class AI{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let i,o;return new Promise((u,c)=>{const h=oc("",20);s.port1.start();const f=setTimeout(()=>{c(new Error("unsupported_event"))},n);o={messageChannel:s,onMessage(m){const _=m;if(_.data.eventId===h)switch(_.data.status){case"ack":clearTimeout(f),i=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(i),u(_.data.response);break;default:clearTimeout(f),clearTimeout(i),c(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:h,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tt(){return window}function PI(r){Tt().location.href=r}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jf(){return typeof Tt().WorkerGlobalScope<"u"&&typeof Tt().importScripts=="function"}async function RI(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function bI(){var r;return((r=navigator==null?void 0:navigator.serviceWorker)==null?void 0:r.controller)||null}function SI(){return jf()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $f="firebaseLocalStorageDb",VI=1,Ro="firebaseLocalStorage",zf="fbase_key";class yi{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Xo(r,e){return r.transaction([Ro],e?"readwrite":"readonly").objectStore(Ro)}function CI(){const r=indexedDB.deleteDatabase($f);return new yi(r).toPromise()}function Kf(){const r=indexedDB.open($f,VI);return new Promise((e,t)=>{r.addEventListener("error",()=>{t(r.error)}),r.addEventListener("upgradeneeded",()=>{const n=r.result;try{n.createObjectStore(Ro,{keyPath:zf})}catch(s){t(s)}}),r.addEventListener("success",async()=>{const n=r.result;n.objectStoreNames.contains(Ro)?e(n):(n.close(),await CI(),e(await Kf()))})})}async function Ch(r,e,t){const n=Xo(r,!0).put({[zf]:e,value:t});return new yi(n).toPromise()}async function xI(r,e){const t=Xo(r,!1).get(e),n=await new yi(t).toPromise();return n===void 0?null:n.value}function xh(r,e){const t=Xo(r,!0).delete(e);return new yi(t).toPromise()}const NI=800,DI=3;class Gf{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow))}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow))}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isClosing=!1,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isClosing=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isClosing&&(this.isClosing=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){if(this.isClosing)throw new Error("Database is closing");return this.dbPromise?this.dbPromise:(this.dbPromise=Kf(),this.dbPromise.catch(()=>{this.dbPromise=null}),this.dbPromise)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(this.isClosing||t++>DI)throw n;this.dbPromise&&((await this.dbPromise).close(),this.dbPromise=null)}}async initializeServiceWorkerMessaging(){return jf()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Yo._getInstance(SI()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await RI(),!this.activeServiceWorker)return;this.sender=new AI(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||bI()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{return indexedDB?(await this._withRetries(async e=>{await Ch(e,Po,"1"),await xh(e,Po)}),!0):!1}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>Ch(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>xI(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>xh(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isClosing)return[];try{const e=await this._withRetries(s=>{const i=Xo(s,!1).getAll();return new yi(i).toPromise()});if(this.isClosing)return[];if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:s,value:i}of e)n.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(i)&&(this.notifyListeners(s,i),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!n.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}catch(e){return this.isClosing||Tf(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),NI)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}}Gf.type="LOCAL";const kI=Gf;new gi(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wf(r,e){return e?Vt(e):(K(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ac extends Lf{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Rr(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Rr(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Rr(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function OI(r){return _I(r.auth,new ac(r),r.bypassAuthState)}function LI(r){const{auth:e,user:t}=r;return K(t,e,"internal-error"),gI(t,new ac(r),r.bypassAuthState)}async function MI(r){const{auth:e,user:t}=r;return K(t,e,"internal-error"),pI(t,new ac(r),r.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hf{constructor(e,t,n,s,i=!1){this.auth=e,this.resolver=n,this.user=s,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:s,tenantId:i,error:o,type:u}=e;if(o){this.reject(o);return}const c={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(u)(c))}catch(h){this.reject(h)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return OI;case"linkViaPopup":case"linkViaRedirect":return MI;case"reauthViaPopup":case"reauthViaRedirect":return LI;default:vt(this.auth,"internal-error")}}resolve(e){kt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){kt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const FI=new gi(2e3,1e4);async function HP(r,e,t){if(ut(r.app))return Promise.reject(lt(r,"operation-not-supported-in-this-environment"));const n=Jo(r);Oy(r,e,ic);const s=Wf(n,t);return new Un(n,"signInViaPopup",e,s).executeNotNull()}class Un extends Hf{constructor(e,t,n,s,i){super(e,t,s,i),this.provider=n,this.authWindow=null,this.pollId=null,Un.currentPopupAction&&Un.currentPopupAction.cancel(),Un.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return K(e,this.auth,"internal-error"),e}async onExecution(){kt(this.filter.length===1,"Popup operations only handle one event");const e=oc();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(lt(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(lt(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Un.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(lt(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,FI.get())};e()}}Un.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const UI="pendingRedirect",io=new Map;class BI extends Hf{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=io.get(this.auth._key());if(!e){try{const n=await qI(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}io.set(this.auth._key(),e)}return this.bypassAuthState||io.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function qI(r,e){const t=zI(e),n=$I(r);if(!await n._isAvailable())return!1;const s=await n._get(t)==="true";return await n._remove(t),s}function jI(r,e){io.set(r._key(),e)}function $I(r){return Vt(r._redirectPersistence)}function zI(r){return so(UI,r.config.apiKey,r.name)}async function KI(r,e,t=!1){if(ut(r.app))return Promise.reject(jn(r));const n=Jo(r),s=Wf(n,e),o=await new BI(n,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const GI=600*1e3;class WI{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!HI(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!Qf(e)){const s=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(lt(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=GI&&this.cachedEventUids.clear(),this.cachedEventUids.has(Nh(e))}saveEventToCache(e){this.cachedEventUids.add(Nh(e)),this.lastProcessedEventTime=Date.now()}}function Nh(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function Qf({type:r,error:e}){return r==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function HI(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Qf(r);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function QI(r,e={}){return Xr(r,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const JI=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,YI=/^https?/;async function XI(r){if(r.config.emulator)return;const{authorizedDomains:e}=await QI(r);for(const t of e)try{if(ZI(t))return}catch{}vt(r,"unauthorized-domain")}function ZI(r){const e=gu(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){const o=new URL(r);return o.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!YI.test(t))return!1;if(JI.test(r))return n===r;const s=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eT=new gi(3e4,6e4);function Dh(){const r=Tt().___jsl;if(r!=null&&r.H){for(const e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function tT(r){return new Promise((e,t)=>{var s,i,o;function n(){Dh(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Dh(),t(lt(r,"network-request-failed"))},timeout:eT.get()})}if((i=(s=Tt().gapi)==null?void 0:s.iframes)!=null&&i.Iframe)e(gapi.iframes.getContext());else if((o=Tt().gapi)!=null&&o.load)n();else{const u=uI("iframefcb");return Tt()[u]=()=>{gapi.load?n():t(lt(r,"network-request-failed"))},oI(`${aI()}?onload=${u}`).catch(c=>t(c))}}).catch(e=>{throw oo=null,e})}let oo=null;function nT(r){return oo=oo||tT(r),oo}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rT=new gi(5e3,15e3),sT="__/auth/iframe",iT="emulator/auth/iframe",oT={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},aT=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function uT(r){const e=r.config;K(e.authDomain,r,"auth-domain-config-required");const t=e.emulator?ec(e,iT):`https://${r.config.authDomain}/${sT}`,n={apiKey:e.apiKey,appName:r.name,v:Yr},s=aT.get(r.config.apiHost);s&&(n.eid=s);const i=r._getFrameworks();return i.length&&(n.fw=i.join(",")),`${t}?${pi(n).slice(1)}`}async function cT(r){const e=await nT(r),t=Tt().gapi;return K(t,r,"internal-error"),e.open({where:document.body,url:uT(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:oT,dontclear:!0},n=>new Promise(async(s,i)=>{await n.restyle({setHideOnLeave:!1});const o=lt(r,"network-request-failed"),u=Tt().setTimeout(()=>{i(o)},rT.get());function c(){Tt().clearTimeout(u),s(n)}n.ping(c).then(c,()=>{i(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lT={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},hT=500,dT=600,fT="_blank",mT="http://localhost";class kh{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function pT(r,e,t,n=hT,s=dT){const i=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let u="";const c={...lT,width:n.toString(),height:s.toString(),top:i,left:o},h=ve().toLowerCase();t&&(u=Sf(h)?fT:t),Rf(h)&&(e=e||mT,c.scrollbars="yes");const f=Object.entries(c).reduce((_,[R,C])=>`${_}${R}=${C},`,"");if(Xy(h)&&u!=="_self")return gT(e||"",u),new kh(null);const m=window.open(e||"",u,f);K(m,r,"popup-blocked");try{m.focus()}catch{}return new kh(m)}function gT(r,e){const t=document.createElement("a");t.href=r,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _T="__/auth/handler",yT="emulator/auth/handler",IT=encodeURIComponent("fac");async function Oh(r,e,t,n,s,i){K(r.config.authDomain,r,"auth-domain-config-required"),K(r.config.apiKey,r,"invalid-api-key");const o={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:Yr,eventId:s};if(e instanceof ic){e.setDefaultLanguage(r.languageCode),o.providerId=e.providerId||"",C_(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[f,m]of Object.entries({}))o[f]=m}if(e instanceof _i){const f=e.getScopes().filter(m=>m!=="");f.length>0&&(o.scopes=f.join(","))}r.tenantId&&(o.tid=r.tenantId);const u=o;for(const f of Object.keys(u))u[f]===void 0&&delete u[f];const c=await r._getAppCheckToken(),h=c?`#${IT}=${encodeURIComponent(c)}`:"";return`${TT(r)}?${pi(u).slice(1)}${h}`}function TT({config:r}){return r.emulator?ec(r,yT):`https://${r.authDomain}/${_T}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tu="webStorageSupport";class wT{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=qf,this._completeRedirectFn=KI,this._overrideRedirectResult=jI}async _openPopup(e,t,n,s){var o;kt((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const i=await Oh(e,t,n,gu(),s);return pT(e,i,oc())}async _openRedirect(e,t,n,s){await this._originValidation(e);const i=await Oh(e,t,n,gu(),s);return PI(i),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:i}=this.eventManagers[t];return s?Promise.resolve(s):(kt(i,"If manager is not set, promise should be"),i)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await cT(e),n=new WI(e);return t.register("authEvent",s=>(K(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:n.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(tu,{type:tu},s=>{var o;const i=(o=s==null?void 0:s[0])==null?void 0:o[tu];i!==void 0&&t(!!i),vt(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=XI(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Df()||bf()||rc()}}const ET=wT;var Lh="@firebase/auth",Mh="1.13.5";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vT{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){K(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function AT(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function PT(r){Sr(new Jn("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:u}=n.options;K(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const c={apiKey:o,authDomain:u,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:kf(r)},h=new sI(n,s,i,c);return lI(h,t),h},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),Sr(new Jn("auth-internal",e=>{const t=Jo(e.getProvider("auth").getImmediate());return(n=>new vT(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),on(Lh,Mh,AT(r)),on(Lh,Mh,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const RT=300,bT=lf("authIdTokenMaxAge")||RT;let Fh=null;const ST=r=>async e=>{const t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>bT)return;const s=t==null?void 0:t.token;Fh!==s&&(Fh=s,await fetch(r,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function QP(r=pf()){const e=Qo(r,"auth");if(e.isInitialized())return e.getImmediate();const t=cI(r,{popupRedirectResolver:ET,persistence:[kI,EI,qf]}),n=lf("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){const i=new URL(n,location.origin);if(location.origin===i.origin){const o=ST(i.toString());II(t,o,()=>o(t.currentUser)),yI(t,u=>o(u))}}const s=uf("auth");return s&&hI(t,`http://${s}`),t}function VT(){var r;return((r=document.getElementsByTagName("head"))==null?void 0:r[0])??document}iI({loadJS(r){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",r),n.onload=e,n.onerror=s=>{const i=lt("internal-error");i.customData=s,t(i)},n.type="text/javascript",n.charset="UTF-8",VT().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});PT("Browser");var Uh=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var an,Jf;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,g){function I(){}I.prototype=g.prototype,w.F=g.prototype,w.prototype=new I,w.prototype.constructor=w,w.D=function(v,E,b){for(var y=Array(arguments.length-2),ze=2;ze<arguments.length;ze++)y[ze-2]=arguments[ze];return g.prototype[E].apply(v,y)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(w,g,I){I||(I=0);const v=Array(16);if(typeof g=="string")for(var E=0;E<16;++E)v[E]=g.charCodeAt(I++)|g.charCodeAt(I++)<<8|g.charCodeAt(I++)<<16|g.charCodeAt(I++)<<24;else for(E=0;E<16;++E)v[E]=g[I++]|g[I++]<<8|g[I++]<<16|g[I++]<<24;g=w.g[0],I=w.g[1],E=w.g[2];let b=w.g[3],y;y=g+(b^I&(E^b))+v[0]+3614090360&4294967295,g=I+(y<<7&4294967295|y>>>25),y=b+(E^g&(I^E))+v[1]+3905402710&4294967295,b=g+(y<<12&4294967295|y>>>20),y=E+(I^b&(g^I))+v[2]+606105819&4294967295,E=b+(y<<17&4294967295|y>>>15),y=I+(g^E&(b^g))+v[3]+3250441966&4294967295,I=E+(y<<22&4294967295|y>>>10),y=g+(b^I&(E^b))+v[4]+4118548399&4294967295,g=I+(y<<7&4294967295|y>>>25),y=b+(E^g&(I^E))+v[5]+1200080426&4294967295,b=g+(y<<12&4294967295|y>>>20),y=E+(I^b&(g^I))+v[6]+2821735955&4294967295,E=b+(y<<17&4294967295|y>>>15),y=I+(g^E&(b^g))+v[7]+4249261313&4294967295,I=E+(y<<22&4294967295|y>>>10),y=g+(b^I&(E^b))+v[8]+1770035416&4294967295,g=I+(y<<7&4294967295|y>>>25),y=b+(E^g&(I^E))+v[9]+2336552879&4294967295,b=g+(y<<12&4294967295|y>>>20),y=E+(I^b&(g^I))+v[10]+4294925233&4294967295,E=b+(y<<17&4294967295|y>>>15),y=I+(g^E&(b^g))+v[11]+2304563134&4294967295,I=E+(y<<22&4294967295|y>>>10),y=g+(b^I&(E^b))+v[12]+1804603682&4294967295,g=I+(y<<7&4294967295|y>>>25),y=b+(E^g&(I^E))+v[13]+4254626195&4294967295,b=g+(y<<12&4294967295|y>>>20),y=E+(I^b&(g^I))+v[14]+2792965006&4294967295,E=b+(y<<17&4294967295|y>>>15),y=I+(g^E&(b^g))+v[15]+1236535329&4294967295,I=E+(y<<22&4294967295|y>>>10),y=g+(E^b&(I^E))+v[1]+4129170786&4294967295,g=I+(y<<5&4294967295|y>>>27),y=b+(I^E&(g^I))+v[6]+3225465664&4294967295,b=g+(y<<9&4294967295|y>>>23),y=E+(g^I&(b^g))+v[11]+643717713&4294967295,E=b+(y<<14&4294967295|y>>>18),y=I+(b^g&(E^b))+v[0]+3921069994&4294967295,I=E+(y<<20&4294967295|y>>>12),y=g+(E^b&(I^E))+v[5]+3593408605&4294967295,g=I+(y<<5&4294967295|y>>>27),y=b+(I^E&(g^I))+v[10]+38016083&4294967295,b=g+(y<<9&4294967295|y>>>23),y=E+(g^I&(b^g))+v[15]+3634488961&4294967295,E=b+(y<<14&4294967295|y>>>18),y=I+(b^g&(E^b))+v[4]+3889429448&4294967295,I=E+(y<<20&4294967295|y>>>12),y=g+(E^b&(I^E))+v[9]+568446438&4294967295,g=I+(y<<5&4294967295|y>>>27),y=b+(I^E&(g^I))+v[14]+3275163606&4294967295,b=g+(y<<9&4294967295|y>>>23),y=E+(g^I&(b^g))+v[3]+4107603335&4294967295,E=b+(y<<14&4294967295|y>>>18),y=I+(b^g&(E^b))+v[8]+1163531501&4294967295,I=E+(y<<20&4294967295|y>>>12),y=g+(E^b&(I^E))+v[13]+2850285829&4294967295,g=I+(y<<5&4294967295|y>>>27),y=b+(I^E&(g^I))+v[2]+4243563512&4294967295,b=g+(y<<9&4294967295|y>>>23),y=E+(g^I&(b^g))+v[7]+1735328473&4294967295,E=b+(y<<14&4294967295|y>>>18),y=I+(b^g&(E^b))+v[12]+2368359562&4294967295,I=E+(y<<20&4294967295|y>>>12),y=g+(I^E^b)+v[5]+4294588738&4294967295,g=I+(y<<4&4294967295|y>>>28),y=b+(g^I^E)+v[8]+2272392833&4294967295,b=g+(y<<11&4294967295|y>>>21),y=E+(b^g^I)+v[11]+1839030562&4294967295,E=b+(y<<16&4294967295|y>>>16),y=I+(E^b^g)+v[14]+4259657740&4294967295,I=E+(y<<23&4294967295|y>>>9),y=g+(I^E^b)+v[1]+2763975236&4294967295,g=I+(y<<4&4294967295|y>>>28),y=b+(g^I^E)+v[4]+1272893353&4294967295,b=g+(y<<11&4294967295|y>>>21),y=E+(b^g^I)+v[7]+4139469664&4294967295,E=b+(y<<16&4294967295|y>>>16),y=I+(E^b^g)+v[10]+3200236656&4294967295,I=E+(y<<23&4294967295|y>>>9),y=g+(I^E^b)+v[13]+681279174&4294967295,g=I+(y<<4&4294967295|y>>>28),y=b+(g^I^E)+v[0]+3936430074&4294967295,b=g+(y<<11&4294967295|y>>>21),y=E+(b^g^I)+v[3]+3572445317&4294967295,E=b+(y<<16&4294967295|y>>>16),y=I+(E^b^g)+v[6]+76029189&4294967295,I=E+(y<<23&4294967295|y>>>9),y=g+(I^E^b)+v[9]+3654602809&4294967295,g=I+(y<<4&4294967295|y>>>28),y=b+(g^I^E)+v[12]+3873151461&4294967295,b=g+(y<<11&4294967295|y>>>21),y=E+(b^g^I)+v[15]+530742520&4294967295,E=b+(y<<16&4294967295|y>>>16),y=I+(E^b^g)+v[2]+3299628645&4294967295,I=E+(y<<23&4294967295|y>>>9),y=g+(E^(I|~b))+v[0]+4096336452&4294967295,g=I+(y<<6&4294967295|y>>>26),y=b+(I^(g|~E))+v[7]+1126891415&4294967295,b=g+(y<<10&4294967295|y>>>22),y=E+(g^(b|~I))+v[14]+2878612391&4294967295,E=b+(y<<15&4294967295|y>>>17),y=I+(b^(E|~g))+v[5]+4237533241&4294967295,I=E+(y<<21&4294967295|y>>>11),y=g+(E^(I|~b))+v[12]+1700485571&4294967295,g=I+(y<<6&4294967295|y>>>26),y=b+(I^(g|~E))+v[3]+2399980690&4294967295,b=g+(y<<10&4294967295|y>>>22),y=E+(g^(b|~I))+v[10]+4293915773&4294967295,E=b+(y<<15&4294967295|y>>>17),y=I+(b^(E|~g))+v[1]+2240044497&4294967295,I=E+(y<<21&4294967295|y>>>11),y=g+(E^(I|~b))+v[8]+1873313359&4294967295,g=I+(y<<6&4294967295|y>>>26),y=b+(I^(g|~E))+v[15]+4264355552&4294967295,b=g+(y<<10&4294967295|y>>>22),y=E+(g^(b|~I))+v[6]+2734768916&4294967295,E=b+(y<<15&4294967295|y>>>17),y=I+(b^(E|~g))+v[13]+1309151649&4294967295,I=E+(y<<21&4294967295|y>>>11),y=g+(E^(I|~b))+v[4]+4149444226&4294967295,g=I+(y<<6&4294967295|y>>>26),y=b+(I^(g|~E))+v[11]+3174756917&4294967295,b=g+(y<<10&4294967295|y>>>22),y=E+(g^(b|~I))+v[2]+718787259&4294967295,E=b+(y<<15&4294967295|y>>>17),y=I+(b^(E|~g))+v[9]+3951481745&4294967295,w.g[0]=w.g[0]+g&4294967295,w.g[1]=w.g[1]+(E+(y<<21&4294967295|y>>>11))&4294967295,w.g[2]=w.g[2]+E&4294967295,w.g[3]=w.g[3]+b&4294967295}n.prototype.v=function(w,g){g===void 0&&(g=w.length);const I=g-this.blockSize,v=this.C;let E=this.h,b=0;for(;b<g;){if(E==0)for(;b<=I;)s(this,w,b),b+=this.blockSize;if(typeof w=="string"){for(;b<g;)if(v[E++]=w.charCodeAt(b++),E==this.blockSize){s(this,v),E=0;break}}else for(;b<g;)if(v[E++]=w[b++],E==this.blockSize){s(this,v),E=0;break}}this.h=E,this.o+=g},n.prototype.A=function(){var w=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);w[0]=128;for(var g=1;g<w.length-8;++g)w[g]=0;g=this.o*8;for(var I=w.length-8;I<w.length;++I)w[I]=g&255,g/=256;for(this.v(w),w=Array(16),g=0,I=0;I<4;++I)for(let v=0;v<32;v+=8)w[g++]=this.g[I]>>>v&255;return w};function i(w,g){var I=u;return Object.prototype.hasOwnProperty.call(I,w)?I[w]:I[w]=g(w)}function o(w,g){this.h=g;const I=[];let v=!0;for(let E=w.length-1;E>=0;E--){const b=w[E]|0;v&&b==g||(I[E]=b,v=!1)}this.g=I}var u={};function c(w){return-128<=w&&w<128?i(w,function(g){return new o([g|0],g<0?-1:0)}):new o([w|0],w<0?-1:0)}function h(w){if(isNaN(w)||!isFinite(w))return m;if(w<0)return L(h(-w));const g=[];let I=1;for(let v=0;w>=I;v++)g[v]=w/I|0,I*=4294967296;return new o(g,0)}function f(w,g){if(w.length==0)throw Error("number format error: empty string");if(g=g||10,g<2||36<g)throw Error("radix out of range: "+g);if(w.charAt(0)=="-")return L(f(w.substring(1),g));if(w.indexOf("-")>=0)throw Error('number format error: interior "-" character');const I=h(Math.pow(g,8));let v=m;for(let b=0;b<w.length;b+=8){var E=Math.min(8,w.length-b);const y=parseInt(w.substring(b,b+E),g);E<8?(E=h(Math.pow(g,E)),v=v.j(E).add(h(y))):(v=v.j(I),v=v.add(h(y)))}return v}var m=c(0),_=c(1),R=c(16777216);r=o.prototype,r.m=function(){if(U(this))return-L(this).m();let w=0,g=1;for(let I=0;I<this.g.length;I++){const v=this.i(I);w+=(v>=0?v:4294967296+v)*g,g*=4294967296}return w},r.toString=function(w){if(w=w||10,w<2||36<w)throw Error("radix out of range: "+w);if(C(this))return"0";if(U(this))return"-"+L(this).toString(w);const g=h(Math.pow(w,6));var I=this;let v="";for(;;){const E=ce(I,g).g;I=z(I,E.j(g));let b=((I.g.length>0?I.g[0]:I.h)>>>0).toString(w);if(I=E,C(I))return b+v;for(;b.length<6;)b="0"+b;v=b+v}},r.i=function(w){return w<0?0:w<this.g.length?this.g[w]:this.h};function C(w){if(w.h!=0)return!1;for(let g=0;g<w.g.length;g++)if(w.g[g]!=0)return!1;return!0}function U(w){return w.h==-1}r.l=function(w){return w=z(this,w),U(w)?-1:C(w)?0:1};function L(w){const g=w.g.length,I=[];for(let v=0;v<g;v++)I[v]=~w.g[v];return new o(I,~w.h).add(_)}r.abs=function(){return U(this)?L(this):this},r.add=function(w){const g=Math.max(this.g.length,w.g.length),I=[];let v=0;for(let E=0;E<=g;E++){let b=v+(this.i(E)&65535)+(w.i(E)&65535),y=(b>>>16)+(this.i(E)>>>16)+(w.i(E)>>>16);v=y>>>16,b&=65535,y&=65535,I[E]=y<<16|b}return new o(I,I[I.length-1]&-2147483648?-1:0)};function z(w,g){return w.add(L(g))}r.j=function(w){if(C(this)||C(w))return m;if(U(this))return U(w)?L(this).j(L(w)):L(L(this).j(w));if(U(w))return L(this.j(L(w)));if(this.l(R)<0&&w.l(R)<0)return h(this.m()*w.m());const g=this.g.length+w.g.length,I=[];for(var v=0;v<2*g;v++)I[v]=0;for(v=0;v<this.g.length;v++)for(let E=0;E<w.g.length;E++){const b=this.i(v)>>>16,y=this.i(v)&65535,ze=w.i(E)>>>16,Pn=w.i(E)&65535;I[2*v+2*E]+=y*Pn,W(I,2*v+2*E),I[2*v+2*E+1]+=b*Pn,W(I,2*v+2*E+1),I[2*v+2*E+1]+=y*ze,W(I,2*v+2*E+1),I[2*v+2*E+2]+=b*ze,W(I,2*v+2*E+2)}for(w=0;w<g;w++)I[w]=I[2*w+1]<<16|I[2*w];for(w=g;w<2*g;w++)I[w]=0;return new o(I,0)};function W(w,g){for(;(w[g]&65535)!=w[g];)w[g+1]+=w[g]>>>16,w[g]&=65535,g++}function H(w,g){this.g=w,this.h=g}function ce(w,g){if(C(g))throw Error("division by zero");if(C(w))return new H(m,m);if(U(w))return g=ce(L(w),g),new H(L(g.g),L(g.h));if(U(g))return g=ce(w,L(g)),new H(L(g.g),g.h);if(w.g.length>30){if(U(w)||U(g))throw Error("slowDivide_ only works with positive integers.");for(var I=_,v=g;v.l(w)<=0;)I=te(I),v=te(v);var E=ne(I,1),b=ne(v,1);for(v=ne(v,2),I=ne(I,2);!C(v);){var y=b.add(v);y.l(w)<=0&&(E=E.add(I),b=y),v=ne(v,1),I=ne(I,1)}return g=z(w,E.j(g)),new H(E,g)}for(E=m;w.l(g)>=0;){for(I=Math.max(1,Math.floor(w.m()/g.m())),v=Math.ceil(Math.log(I)/Math.LN2),v=v<=48?1:Math.pow(2,v-48),b=h(I),y=b.j(g);U(y)||y.l(w)>0;)I-=v,b=h(I),y=b.j(g);C(b)&&(b=_),E=E.add(b),w=z(w,y)}return new H(E,w)}r.B=function(w){return ce(this,w).h},r.and=function(w){const g=Math.max(this.g.length,w.g.length),I=[];for(let v=0;v<g;v++)I[v]=this.i(v)&w.i(v);return new o(I,this.h&w.h)},r.or=function(w){const g=Math.max(this.g.length,w.g.length),I=[];for(let v=0;v<g;v++)I[v]=this.i(v)|w.i(v);return new o(I,this.h|w.h)},r.xor=function(w){const g=Math.max(this.g.length,w.g.length),I=[];for(let v=0;v<g;v++)I[v]=this.i(v)^w.i(v);return new o(I,this.h^w.h)};function te(w){const g=w.g.length+1,I=[];for(let v=0;v<g;v++)I[v]=w.i(v)<<1|w.i(v-1)>>>31;return new o(I,w.h)}function ne(w,g){const I=g>>5;g%=32;const v=w.g.length-I,E=[];for(let b=0;b<v;b++)E[b]=g>0?w.i(b+I)>>>g|w.i(b+I+1)<<32-g:w.i(b+I);return new o(E,w.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,Jf=n,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=h,o.fromString=f,an=o}).apply(typeof Uh<"u"?Uh:typeof self<"u"?self:typeof window<"u"?window:{});var Hi=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Yf,Vs,Xf,ao,yu,Zf,em,tm;(function(){var r,e=Object.defineProperty;function t(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof Hi=="object"&&Hi];for(var l=0;l<a.length;++l){var d=a[l];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var n=t(this);function s(a,l){if(l)e:{var d=n;a=a.split(".");for(var p=0;p<a.length-1;p++){var P=a[p];if(!(P in d))break e;d=d[P]}a=a[a.length-1],p=d[a],l=l(p),l!=p&&l!=null&&e(d,a,{configurable:!0,writable:!0,value:l})}}s("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(a){return a||function(l){var d=[],p;for(p in l)Object.prototype.hasOwnProperty.call(l,p)&&d.push([p,l[p]]);return d}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function u(a){var l=typeof a;return l=="object"&&a!=null||l=="function"}function c(a,l,d){return a.call.apply(a.bind,arguments)}function h(a,l,d){return h=c,h.apply(null,arguments)}function f(a,l){var d=Array.prototype.slice.call(arguments,1);return function(){var p=d.slice();return p.push.apply(p,arguments),a.apply(this,p)}}function m(a,l){function d(){}d.prototype=l.prototype,a.Z=l.prototype,a.prototype=new d,a.prototype.constructor=a,a.Ob=function(p,P,S){for(var M=Array(arguments.length-2),J=2;J<arguments.length;J++)M[J-2]=arguments[J];return l.prototype[P].apply(p,M)}}var _=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function R(a){const l=a.length;if(l>0){const d=Array(l);for(let p=0;p<l;p++)d[p]=a[p];return d}return[]}function C(a,l){for(let p=1;p<arguments.length;p++){const P=arguments[p];var d=typeof P;if(d=d!="object"?d:P?Array.isArray(P)?"array":d:"null",d=="array"||d=="object"&&typeof P.length=="number"){d=a.length||0;const S=P.length||0;a.length=d+S;for(let M=0;M<S;M++)a[d+M]=P[M]}else a.push(P)}}class U{constructor(l,d){this.i=l,this.j=d,this.h=0,this.g=null}get(){let l;return this.h>0?(this.h--,l=this.g,this.g=l.next,l.next=null):l=this.i(),l}}function L(a){o.setTimeout(()=>{throw a},0)}function z(){var a=w;let l=null;return a.g&&(l=a.g,a.g=a.g.next,a.g||(a.h=null),l.next=null),l}class W{constructor(){this.h=this.g=null}add(l,d){const p=H.get();p.set(l,d),this.h?this.h.next=p:this.g=p,this.h=p}}var H=new U(()=>new ce,a=>a.reset());class ce{constructor(){this.next=this.g=this.h=null}set(l,d){this.h=l,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let te,ne=!1,w=new W,g=()=>{const a=Promise.resolve(void 0);te=()=>{a.then(I)}};function I(){for(var a;a=z();){try{a.h.call(a.g)}catch(d){L(d)}var l=H;l.j(a),l.h<100&&(l.h++,a.next=l.g,l.g=a)}ne=!1}function v(){this.u=this.u,this.C=this.C}v.prototype.u=!1,v.prototype.dispose=function(){this.u||(this.u=!0,this.N())},v.prototype[Symbol.dispose]=function(){this.dispose()},v.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function E(a,l){this.type=a,this.g=this.target=l,this.defaultPrevented=!1}E.prototype.h=function(){this.defaultPrevented=!0};var b=(function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,l=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const d=()=>{};o.addEventListener("test",d,l),o.removeEventListener("test",d,l)}catch{}return a})();function y(a){return/^[\s\xa0]*$/.test(a)}function ze(a,l){E.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,l)}m(ze,E),ze.prototype.init=function(a,l){const d=this.type=a.type,p=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=l,l=a.relatedTarget,l||(d=="mouseover"?l=a.fromElement:d=="mouseout"&&(l=a.toElement)),this.relatedTarget=l,p?(this.clientX=p.clientX!==void 0?p.clientX:p.pageX,this.clientY=p.clientY!==void 0?p.clientY:p.pageY,this.screenX=p.screenX||0,this.screenY=p.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&ze.Z.h.call(this)},ze.prototype.h=function(){ze.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var Pn="closure_listenable_"+(Math.random()*1e6|0),Dg=0;function kg(a,l,d,p,P){this.listener=a,this.proxy=null,this.src=l,this.type=d,this.capture=!!p,this.ha=P,this.key=++Dg,this.da=this.fa=!1}function Ni(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function Di(a,l,d){for(const p in a)l.call(d,a[p],p,a)}function Og(a,l){for(const d in a)l.call(void 0,a[d],d,a)}function ml(a){const l={};for(const d in a)l[d]=a[d];return l}const pl="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function gl(a,l){let d,p;for(let P=1;P<arguments.length;P++){p=arguments[P];for(d in p)a[d]=p[d];for(let S=0;S<pl.length;S++)d=pl[S],Object.prototype.hasOwnProperty.call(p,d)&&(a[d]=p[d])}}function ki(a){this.src=a,this.g={},this.h=0}ki.prototype.add=function(a,l,d,p,P){const S=a.toString();a=this.g[S],a||(a=this.g[S]=[],this.h++);const M=Va(a,l,p,P);return M>-1?(l=a[M],d||(l.fa=!1)):(l=new kg(l,this.src,S,!!p,P),l.fa=d,a.push(l)),l};function Sa(a,l){const d=l.type;if(d in a.g){var p=a.g[d],P=Array.prototype.indexOf.call(p,l,void 0),S;(S=P>=0)&&Array.prototype.splice.call(p,P,1),S&&(Ni(l),a.g[d].length==0&&(delete a.g[d],a.h--))}}function Va(a,l,d,p){for(let P=0;P<a.length;++P){const S=a[P];if(!S.da&&S.listener==l&&S.capture==!!d&&S.ha==p)return P}return-1}var Ca="closure_lm_"+(Math.random()*1e6|0),xa={};function _l(a,l,d,p,P){if(Array.isArray(l)){for(let S=0;S<l.length;S++)_l(a,l[S],d,p,P);return null}return d=Tl(d),a&&a[Pn]?a.J(l,d,u(p)?!!p.capture:!1,P):Lg(a,l,d,!1,p,P)}function Lg(a,l,d,p,P,S){if(!l)throw Error("Invalid event type");const M=u(P)?!!P.capture:!!P;let J=Da(a);if(J||(a[Ca]=J=new ki(a)),d=J.add(l,d,p,M,S),d.proxy)return d;if(p=Mg(),d.proxy=p,p.src=a,p.listener=d,a.addEventListener)b||(P=M),P===void 0&&(P=!1),a.addEventListener(l.toString(),p,P);else if(a.attachEvent)a.attachEvent(Il(l.toString()),p);else if(a.addListener&&a.removeListener)a.addListener(p);else throw Error("addEventListener and attachEvent are unavailable.");return d}function Mg(){function a(d){return l.call(a.src,a.listener,d)}const l=Fg;return a}function yl(a,l,d,p,P){if(Array.isArray(l))for(var S=0;S<l.length;S++)yl(a,l[S],d,p,P);else p=u(p)?!!p.capture:!!p,d=Tl(d),a&&a[Pn]?(a=a.i,S=String(l).toString(),S in a.g&&(l=a.g[S],d=Va(l,d,p,P),d>-1&&(Ni(l[d]),Array.prototype.splice.call(l,d,1),l.length==0&&(delete a.g[S],a.h--)))):a&&(a=Da(a))&&(l=a.g[l.toString()],a=-1,l&&(a=Va(l,d,p,P)),(d=a>-1?l[a]:null)&&Na(d))}function Na(a){if(typeof a!="number"&&a&&!a.da){var l=a.src;if(l&&l[Pn])Sa(l.i,a);else{var d=a.type,p=a.proxy;l.removeEventListener?l.removeEventListener(d,p,a.capture):l.detachEvent?l.detachEvent(Il(d),p):l.addListener&&l.removeListener&&l.removeListener(p),(d=Da(l))?(Sa(d,a),d.h==0&&(d.src=null,l[Ca]=null)):Ni(a)}}}function Il(a){return a in xa?xa[a]:xa[a]="on"+a}function Fg(a,l){if(a.da)a=!0;else{l=new ze(l,this);const d=a.listener,p=a.ha||a.src;a.fa&&Na(a),a=d.call(p,l)}return a}function Da(a){return a=a[Ca],a instanceof ki?a:null}var ka="__closure_events_fn_"+(Math.random()*1e9>>>0);function Tl(a){return typeof a=="function"?a:(a[ka]||(a[ka]=function(l){return a.handleEvent(l)}),a[ka])}function Ne(){v.call(this),this.i=new ki(this),this.M=this,this.G=null}m(Ne,v),Ne.prototype[Pn]=!0,Ne.prototype.removeEventListener=function(a,l,d,p){yl(this,a,l,d,p)};function qe(a,l){var d,p=a.G;if(p)for(d=[];p;p=p.G)d.push(p);if(a=a.M,p=l.type||l,typeof l=="string")l=new E(l,a);else if(l instanceof E)l.target=l.target||a;else{var P=l;l=new E(p,a),gl(l,P)}P=!0;let S,M;if(d)for(M=d.length-1;M>=0;M--)S=l.g=d[M],P=Oi(S,p,!0,l)&&P;if(S=l.g=a,P=Oi(S,p,!0,l)&&P,P=Oi(S,p,!1,l)&&P,d)for(M=0;M<d.length;M++)S=l.g=d[M],P=Oi(S,p,!1,l)&&P}Ne.prototype.N=function(){if(Ne.Z.N.call(this),this.i){var a=this.i;for(const l in a.g){const d=a.g[l];for(let p=0;p<d.length;p++)Ni(d[p]);delete a.g[l],a.h--}}this.G=null},Ne.prototype.J=function(a,l,d,p){return this.i.add(String(a),l,!1,d,p)},Ne.prototype.K=function(a,l,d,p){return this.i.add(String(a),l,!0,d,p)};function Oi(a,l,d,p){if(l=a.i.g[String(l)],!l)return!0;l=l.concat();let P=!0;for(let S=0;S<l.length;++S){const M=l[S];if(M&&!M.da&&M.capture==d){const J=M.listener,Ie=M.ha||M.src;M.fa&&Sa(a.i,M),P=J.call(Ie,p)!==!1&&P}}return P&&!p.defaultPrevented}function Ug(a,l){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=h(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(l)>2147483647?-1:o.setTimeout(a,l||0)}function wl(a){a.g=Ug(()=>{a.g=null,a.i&&(a.i=!1,wl(a))},a.l);const l=a.h;a.h=null,a.m.apply(null,l)}class Bg extends v{constructor(l,d){super(),this.m=l,this.l=d,this.h=null,this.i=!1,this.g=null}j(l){this.h=arguments,this.g?this.i=!0:wl(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function as(a){v.call(this),this.h=a,this.g={}}m(as,v);var El=[];function vl(a){Di(a.g,function(l,d){this.g.hasOwnProperty(d)&&Na(l)},a),a.g={}}as.prototype.N=function(){as.Z.N.call(this),vl(this)},as.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Oa=o.JSON.stringify,qg=o.JSON.parse,jg=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function Al(){}function Pl(){}var us={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function La(){E.call(this,"d")}m(La,E);function Ma(){E.call(this,"c")}m(Ma,E);var Rn={},Rl=null;function Li(){return Rl=Rl||new Ne}Rn.Ia="serverreachability";function bl(a){E.call(this,Rn.Ia,a)}m(bl,E);function cs(a){const l=Li();qe(l,new bl(l))}Rn.STAT_EVENT="statevent";function Sl(a,l){E.call(this,Rn.STAT_EVENT,a),this.stat=l}m(Sl,E);function je(a){const l=Li();qe(l,new Sl(l,a))}Rn.Ja="timingevent";function Vl(a,l){E.call(this,Rn.Ja,a),this.size=l}m(Vl,E);function ls(a,l){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},l)}function hs(){this.g=!0}hs.prototype.ua=function(){this.g=!1};function $g(a,l,d,p,P,S){a.info(function(){if(a.g)if(S){var M="",J=S.split("&");for(let oe=0;oe<J.length;oe++){var Ie=J[oe].split("=");if(Ie.length>1){const Pe=Ie[0];Ie=Ie[1];const dt=Pe.split("_");M=dt.length>=2&&dt[1]=="type"?M+(Pe+"="+Ie+"&"):M+(Pe+"=redacted&")}}}else M=null;else M=S;return"XMLHTTP REQ ("+p+") [attempt "+P+"]: "+l+`
`+d+`
`+M})}function zg(a,l,d,p,P,S,M){a.info(function(){return"XMLHTTP RESP ("+p+") [ attempt "+P+"]: "+l+`
`+d+`
`+S+" "+M})}function cr(a,l,d,p){a.info(function(){return"XMLHTTP TEXT ("+l+"): "+Gg(a,d)+(p?" "+p:"")})}function Kg(a,l){a.info(function(){return"TIMEOUT: "+l})}hs.prototype.info=function(){};function Gg(a,l){if(!a.g)return l;if(!l)return null;try{const S=JSON.parse(l);if(S){for(a=0;a<S.length;a++)if(Array.isArray(S[a])){var d=S[a];if(!(d.length<2)){var p=d[1];if(Array.isArray(p)&&!(p.length<1)){var P=p[0];if(P!="noop"&&P!="stop"&&P!="close")for(let M=1;M<p.length;M++)p[M]=""}}}}return Oa(S)}catch{return l}}var Mi={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Cl={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},xl;function Fa(){}m(Fa,Al),Fa.prototype.g=function(){return new XMLHttpRequest},xl=new Fa;function ds(a){return encodeURIComponent(String(a))}function Wg(a){var l=1;a=a.split(":");const d=[];for(;l>0&&a.length;)d.push(a.shift()),l--;return a.length&&d.push(a.join(":")),d}function jt(a,l,d,p){this.j=a,this.i=l,this.l=d,this.S=p||1,this.V=new as(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Nl}function Nl(){this.i=null,this.g="",this.h=!1}var Dl={},Ua={};function Ba(a,l,d){a.M=1,a.A=Ui(ht(l)),a.u=d,a.R=!0,kl(a,null)}function kl(a,l){a.F=Date.now(),Fi(a),a.B=ht(a.A);var d=a.B,p=a.S;Array.isArray(p)||(p=[String(p)]),Wl(d.i,"t",p),a.C=0,d=a.j.L,a.h=new Nl,a.g=hh(a.j,d?l:null,!a.u),a.P>0&&(a.O=new Bg(h(a.Y,a,a.g),a.P)),l=a.V,d=a.g,p=a.ba;var P="readystatechange";Array.isArray(P)||(P&&(El[0]=P.toString()),P=El);for(let S=0;S<P.length;S++){const M=_l(d,P[S],p||l.handleEvent,!1,l.h||l);if(!M)break;l.g[M.key]=M}l=a.J?ml(a.J):{},a.u?(a.v||(a.v="POST"),l["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,l)):(a.v="GET",a.g.ea(a.B,a.v,null,l)),cs(),$g(a.i,a.v,a.B,a.l,a.S,a.u)}jt.prototype.ba=function(a){a=a.target;const l=this.O;l&&Kt(a)==3?l.j():this.Y(a)},jt.prototype.Y=function(a){try{if(a==this.g)e:{const J=Kt(this.g),Ie=this.g.ya(),oe=this.g.ca();if(!(J<3)&&(J!=3||this.g&&(this.h.h||this.g.la()||eh(this.g)))){this.K||J!=4||Ie==7||(Ie==8||oe<=0?cs(3):cs(2)),qa(this);var l=this.g.ca();this.X=l;var d=Hg(this);if(this.o=l==200,zg(this.i,this.v,this.B,this.l,this.S,J,l),this.o){if(this.U&&!this.L){t:{if(this.g){var p,P=this.g;if((p=P.g?P.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!y(p)){var S=p;break t}}S=null}if(a=S)cr(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,ja(this,a);else{this.o=!1,this.m=3,je(12),bn(this),fs(this);break e}}if(this.R){a=!0;let Pe;for(;!this.K&&this.C<d.length;)if(Pe=Qg(this,d),Pe==Ua){J==4&&(this.m=4,je(14),a=!1),cr(this.i,this.l,null,"[Incomplete Response]");break}else if(Pe==Dl){this.m=4,je(15),cr(this.i,this.l,d,"[Invalid Chunk]"),a=!1;break}else cr(this.i,this.l,Pe,null),ja(this,Pe);if(Ol(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),J!=4||d.length!=0||this.h.h||(this.m=1,je(16),a=!1),this.o=this.o&&a,!a)cr(this.i,this.l,d,"[Invalid Chunked Response]"),bn(this),fs(this);else if(d.length>0&&!this.W){this.W=!0;var M=this.j;M.g==this&&M.aa&&!M.P&&(M.j.info("Great, no buffering proxy detected. Bytes received: "+d.length),Ja(M),M.P=!0,je(11))}}else cr(this.i,this.l,d,null),ja(this,d);J==4&&bn(this),this.o&&!this.K&&(J==4?ah(this.j,this):(this.o=!1,Fi(this)))}else c_(this.g),l==400&&d.indexOf("Unknown SID")>0?(this.m=3,je(12)):(this.m=0,je(13)),bn(this),fs(this)}}}catch{}finally{}};function Hg(a){if(!Ol(a))return a.g.la();const l=eh(a.g);if(l==="")return"";let d="";const p=l.length,P=Kt(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return bn(a),fs(a),"";a.h.i=new o.TextDecoder}for(let S=0;S<p;S++)a.h.h=!0,d+=a.h.i.decode(l[S],{stream:!(P&&S==p-1)});return l.length=0,a.h.g+=d,a.C=0,a.h.g}function Ol(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function Qg(a,l){var d=a.C,p=l.indexOf(`
`,d);return p==-1?Ua:(d=Number(l.substring(d,p)),isNaN(d)?Dl:(p+=1,p+d>l.length?Ua:(l=l.slice(p,p+d),a.C=p+d,l)))}jt.prototype.cancel=function(){this.K=!0,bn(this)};function Fi(a){a.T=Date.now()+a.H,Ll(a,a.H)}function Ll(a,l){if(a.D!=null)throw Error("WatchDog timer not null");a.D=ls(h(a.aa,a),l)}function qa(a){a.D&&(o.clearTimeout(a.D),a.D=null)}jt.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(Kg(this.i,this.B),this.M!=2&&(cs(),je(17)),bn(this),this.m=2,fs(this)):Ll(this,this.T-a)};function fs(a){a.j.I==0||a.K||ah(a.j,a)}function bn(a){qa(a);var l=a.O;l&&typeof l.dispose=="function"&&l.dispose(),a.O=null,vl(a.V),a.g&&(l=a.g,a.g=null,l.abort(),l.dispose())}function ja(a,l){try{var d=a.j;if(d.I!=0&&(d.g==a||$a(d.h,a))){if(!a.L&&$a(d.h,a)&&d.I==3){try{var p=d.Ba.g.parse(l)}catch{p=null}if(Array.isArray(p)&&p.length==3){var P=p;if(P[0]==0){e:if(!d.v){if(d.g)if(d.g.F+3e3<a.F)zi(d),ji(d);else break e;Qa(d),je(18)}}else d.xa=P[1],0<d.xa-d.K&&P[2]<37500&&d.F&&d.A==0&&!d.C&&(d.C=ls(h(d.Va,d),6e3));Ul(d.h)<=1&&d.ta&&(d.ta=void 0)}else Vn(d,11)}else if((a.L||d.g==a)&&zi(d),!y(l))for(P=d.Ba.g.parse(l),l=0;l<P.length;l++){let oe=P[l];const Pe=oe[0];if(!(Pe<=d.K))if(d.K=Pe,oe=oe[1],d.I==2)if(oe[0]=="c"){d.M=oe[1],d.ba=oe[2];const dt=oe[3];dt!=null&&(d.ka=dt,d.j.info("VER="+d.ka));const Cn=oe[4];Cn!=null&&(d.za=Cn,d.j.info("SVER="+d.za));const Gt=oe[5];Gt!=null&&typeof Gt=="number"&&Gt>0&&(p=1.5*Gt,d.O=p,d.j.info("backChannelRequestTimeoutMs_="+p)),p=d;const Wt=a.g;if(Wt){const Gi=Wt.g?Wt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Gi){var S=p.h;S.g||Gi.indexOf("spdy")==-1&&Gi.indexOf("quic")==-1&&Gi.indexOf("h2")==-1||(S.j=S.l,S.g=new Set,S.h&&(za(S,S.h),S.h=null))}if(p.G){const Ya=Wt.g?Wt.g.getResponseHeader("X-HTTP-Session-Id"):null;Ya&&(p.wa=Ya,le(p.J,p.G,Ya))}}d.I=3,d.l&&d.l.ra(),d.aa&&(d.T=Date.now()-a.F,d.j.info("Handshake RTT: "+d.T+"ms")),p=d;var M=a;if(p.na=lh(p,p.L?p.ba:null,p.W),M.L){Bl(p.h,M);var J=M,Ie=p.O;Ie&&(J.H=Ie),J.D&&(qa(J),Fi(J)),p.g=M}else ih(p);d.i.length>0&&$i(d)}else oe[0]!="stop"&&oe[0]!="close"||Vn(d,7);else d.I==3&&(oe[0]=="stop"||oe[0]=="close"?oe[0]=="stop"?Vn(d,7):Ha(d):oe[0]!="noop"&&d.l&&d.l.qa(oe),d.A=0)}}cs(4)}catch{}}var Jg=class{constructor(a,l){this.g=a,this.map=l}};function Ml(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Fl(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function Ul(a){return a.h?1:a.g?a.g.size:0}function $a(a,l){return a.h?a.h==l:a.g?a.g.has(l):!1}function za(a,l){a.g?a.g.add(l):a.h=l}function Bl(a,l){a.h&&a.h==l?a.h=null:a.g&&a.g.has(l)&&a.g.delete(l)}Ml.prototype.cancel=function(){if(this.i=ql(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function ql(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let l=a.i;for(const d of a.g.values())l=l.concat(d.G);return l}return R(a.i)}var jl=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Yg(a,l){if(a){a=a.split("&");for(let d=0;d<a.length;d++){const p=a[d].indexOf("=");let P,S=null;p>=0?(P=a[d].substring(0,p),S=a[d].substring(p+1)):P=a[d],l(P,S?decodeURIComponent(S.replace(/\+/g," ")):"")}}}function $t(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let l;a instanceof $t?(this.l=a.l,ms(this,a.j),this.o=a.o,this.g=a.g,ps(this,a.u),this.h=a.h,Ka(this,Hl(a.i)),this.m=a.m):a&&(l=String(a).match(jl))?(this.l=!1,ms(this,l[1]||"",!0),this.o=gs(l[2]||""),this.g=gs(l[3]||"",!0),ps(this,l[4]),this.h=gs(l[5]||"",!0),Ka(this,l[6]||"",!0),this.m=gs(l[7]||"")):(this.l=!1,this.i=new ys(null,this.l))}$t.prototype.toString=function(){const a=[];var l=this.j;l&&a.push(_s(l,$l,!0),":");var d=this.g;return(d||l=="file")&&(a.push("//"),(l=this.o)&&a.push(_s(l,$l,!0),"@"),a.push(ds(d).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.u,d!=null&&a.push(":",String(d))),(d=this.h)&&(this.g&&d.charAt(0)!="/"&&a.push("/"),a.push(_s(d,d.charAt(0)=="/"?e_:Zg,!0))),(d=this.i.toString())&&a.push("?",d),(d=this.m)&&a.push("#",_s(d,n_)),a.join("")},$t.prototype.resolve=function(a){const l=ht(this);let d=!!a.j;d?ms(l,a.j):d=!!a.o,d?l.o=a.o:d=!!a.g,d?l.g=a.g:d=a.u!=null;var p=a.h;if(d)ps(l,a.u);else if(d=!!a.h){if(p.charAt(0)!="/")if(this.g&&!this.h)p="/"+p;else{var P=l.h.lastIndexOf("/");P!=-1&&(p=l.h.slice(0,P+1)+p)}if(P=p,P==".."||P==".")p="";else if(P.indexOf("./")!=-1||P.indexOf("/.")!=-1){p=P.lastIndexOf("/",0)==0,P=P.split("/");const S=[];for(let M=0;M<P.length;){const J=P[M++];J=="."?p&&M==P.length&&S.push(""):J==".."?((S.length>1||S.length==1&&S[0]!="")&&S.pop(),p&&M==P.length&&S.push("")):(S.push(J),p=!0)}p=S.join("/")}else p=P}return d?l.h=p:d=a.i.toString()!=="",d?Ka(l,Hl(a.i)):d=!!a.m,d&&(l.m=a.m),l};function ht(a){return new $t(a)}function ms(a,l,d){a.j=d?gs(l,!0):l,a.j&&(a.j=a.j.replace(/:$/,""))}function ps(a,l){if(l){if(l=Number(l),isNaN(l)||l<0)throw Error("Bad port number "+l);a.u=l}else a.u=null}function Ka(a,l,d){l instanceof ys?(a.i=l,r_(a.i,a.l)):(d||(l=_s(l,t_)),a.i=new ys(l,a.l))}function le(a,l,d){a.i.set(l,d)}function Ui(a){return le(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function gs(a,l){return a?l?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function _s(a,l,d){return typeof a=="string"?(a=encodeURI(a).replace(l,Xg),d&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function Xg(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var $l=/[#\/\?@]/g,Zg=/[#\?:]/g,e_=/[#\?]/g,t_=/[#\?@]/g,n_=/#/g;function ys(a,l){this.h=this.g=null,this.i=a||null,this.j=!!l}function Sn(a){a.g||(a.g=new Map,a.h=0,a.i&&Yg(a.i,function(l,d){a.add(decodeURIComponent(l.replace(/\+/g," ")),d)}))}r=ys.prototype,r.add=function(a,l){Sn(this),this.i=null,a=lr(this,a);let d=this.g.get(a);return d||this.g.set(a,d=[]),d.push(l),this.h+=1,this};function zl(a,l){Sn(a),l=lr(a,l),a.g.has(l)&&(a.i=null,a.h-=a.g.get(l).length,a.g.delete(l))}function Kl(a,l){return Sn(a),l=lr(a,l),a.g.has(l)}r.forEach=function(a,l){Sn(this),this.g.forEach(function(d,p){d.forEach(function(P){a.call(l,P,p,this)},this)},this)};function Gl(a,l){Sn(a);let d=[];if(typeof l=="string")Kl(a,l)&&(d=d.concat(a.g.get(lr(a,l))));else for(a=Array.from(a.g.values()),l=0;l<a.length;l++)d=d.concat(a[l]);return d}r.set=function(a,l){return Sn(this),this.i=null,a=lr(this,a),Kl(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[l]),this.h+=1,this},r.get=function(a,l){return a?(a=Gl(this,a),a.length>0?String(a[0]):l):l};function Wl(a,l,d){zl(a,l),d.length>0&&(a.i=null,a.g.set(lr(a,l),R(d)),a.h+=d.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],l=Array.from(this.g.keys());for(let p=0;p<l.length;p++){var d=l[p];const P=ds(d);d=Gl(this,d);for(let S=0;S<d.length;S++){let M=P;d[S]!==""&&(M+="="+ds(d[S])),a.push(M)}}return this.i=a.join("&")};function Hl(a){const l=new ys;return l.i=a.i,a.g&&(l.g=new Map(a.g),l.h=a.h),l}function lr(a,l){return l=String(l),a.j&&(l=l.toLowerCase()),l}function r_(a,l){l&&!a.j&&(Sn(a),a.i=null,a.g.forEach(function(d,p){const P=p.toLowerCase();p!=P&&(zl(this,p),Wl(this,P,d))},a)),a.j=l}function s_(a,l){const d=new hs;if(o.Image){const p=new Image;p.onload=f(zt,d,"TestLoadImage: loaded",!0,l,p),p.onerror=f(zt,d,"TestLoadImage: error",!1,l,p),p.onabort=f(zt,d,"TestLoadImage: abort",!1,l,p),p.ontimeout=f(zt,d,"TestLoadImage: timeout",!1,l,p),o.setTimeout(function(){p.ontimeout&&p.ontimeout()},1e4),p.src=a}else l(!1)}function i_(a,l){const d=new hs,p=new AbortController,P=setTimeout(()=>{p.abort(),zt(d,"TestPingServer: timeout",!1,l)},1e4);fetch(a,{signal:p.signal}).then(S=>{clearTimeout(P),S.ok?zt(d,"TestPingServer: ok",!0,l):zt(d,"TestPingServer: server error",!1,l)}).catch(()=>{clearTimeout(P),zt(d,"TestPingServer: error",!1,l)})}function zt(a,l,d,p,P){try{P&&(P.onload=null,P.onerror=null,P.onabort=null,P.ontimeout=null),p(d)}catch{}}function o_(){this.g=new jg}function Ga(a){this.i=a.Sb||null,this.h=a.ab||!1}m(Ga,Al),Ga.prototype.g=function(){return new Bi(this.i,this.h)};function Bi(a,l){Ne.call(this),this.H=a,this.o=l,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}m(Bi,Ne),r=Bi.prototype,r.open=function(a,l){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=l,this.readyState=1,Ts(this)},r.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const l={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(l.body=a),(this.H||o).fetch(new Request(this.D,l)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Is(this)),this.readyState=0},r.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Ts(this)),this.g&&(this.readyState=3,Ts(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Ql(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function Ql(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}r.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var l=a.value?a.value:new Uint8Array(0);(l=this.B.decode(l,{stream:!a.done}))&&(this.response=this.responseText+=l)}a.done?Is(this):Ts(this),this.readyState==3&&Ql(this)}},r.Oa=function(a){this.g&&(this.response=this.responseText=a,Is(this))},r.Na=function(a){this.g&&(this.response=a,Is(this))},r.ga=function(){this.g&&Is(this)};function Is(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Ts(a)}r.setRequestHeader=function(a,l){this.A.append(a,l)},r.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],l=this.h.entries();for(var d=l.next();!d.done;)d=d.value,a.push(d[0]+": "+d[1]),d=l.next();return a.join(`\r
`)};function Ts(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(Bi.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function Jl(a){let l="";return Di(a,function(d,p){l+=p,l+=":",l+=d,l+=`\r
`}),l}function Wa(a,l,d){e:{for(p in d){var p=!1;break e}p=!0}p||(d=Jl(d),typeof a=="string"?d!=null&&ds(d):le(a,l,d))}function de(a){Ne.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}m(de,Ne);var a_=/^https?$/i,u_=["POST","PUT"];r=de.prototype,r.Fa=function(a){this.H=a},r.ea=function(a,l,d,p){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);l=l?l.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():xl.g(),this.g.onreadystatechange=_(h(this.Ca,this));try{this.B=!0,this.g.open(l,String(a),!0),this.B=!1}catch(S){Yl(this,S);return}if(a=d||"",d=new Map(this.headers),p)if(Object.getPrototypeOf(p)===Object.prototype)for(var P in p)d.set(P,p[P]);else if(typeof p.keys=="function"&&typeof p.get=="function")for(const S of p.keys())d.set(S,p.get(S));else throw Error("Unknown input type for opt_headers: "+String(p));p=Array.from(d.keys()).find(S=>S.toLowerCase()=="content-type"),P=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(u_,l,void 0)>=0)||p||P||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[S,M]of d)this.g.setRequestHeader(S,M);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(S){Yl(this,S)}};function Yl(a,l){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=l,a.o=5,Xl(a),qi(a)}function Xl(a){a.A||(a.A=!0,qe(a,"complete"),qe(a,"error"))}r.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,qe(this,"complete"),qe(this,"abort"),qi(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),qi(this,!0)),de.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?Zl(this):this.Xa())},r.Xa=function(){Zl(this)};function Zl(a){if(a.h&&typeof i<"u"){if(a.v&&Kt(a)==4)setTimeout(a.Ca.bind(a),0);else if(qe(a,"readystatechange"),Kt(a)==4){a.h=!1;try{const S=a.ca();e:switch(S){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var l=!0;break e;default:l=!1}var d;if(!(d=l)){var p;if(p=S===0){let M=String(a.D).match(jl)[1]||null;!M&&o.self&&o.self.location&&(M=o.self.location.protocol.slice(0,-1)),p=!a_.test(M?M.toLowerCase():"")}d=p}if(d)qe(a,"complete"),qe(a,"success");else{a.o=6;try{var P=Kt(a)>2?a.g.statusText:""}catch{P=""}a.l=P+" ["+a.ca()+"]",Xl(a)}}finally{qi(a)}}}}function qi(a,l){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const d=a.g;a.g=null,l||qe(a,"ready");try{d.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function Kt(a){return a.g?a.g.readyState:0}r.ca=function(){try{return Kt(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(a){if(this.g){var l=this.g.responseText;return a&&l.indexOf(a)==0&&(l=l.substring(a.length)),qg(l)}};function eh(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function c_(a){const l={};a=(a.g&&Kt(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let p=0;p<a.length;p++){if(y(a[p]))continue;var d=Wg(a[p]);const P=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const S=l[P]||[];l[P]=S,S.push(d)}Og(l,function(p){return p.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function ws(a,l,d){return d&&d.internalChannelParams&&d.internalChannelParams[a]||l}function th(a){this.za=0,this.i=[],this.j=new hs,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=ws("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=ws("baseRetryDelayMs",5e3,a),this.Za=ws("retryDelaySeedMs",1e4,a),this.Ta=ws("forwardChannelMaxRetries",2,a),this.va=ws("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new Ml(a&&a.concurrentRequestLimit),this.Ba=new o_,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=th.prototype,r.ka=8,r.I=1,r.connect=function(a,l,d,p){je(0),this.W=a,this.H=l||{},d&&p!==void 0&&(this.H.OSID=d,this.H.OAID=p),this.F=this.X,this.J=lh(this,null,this.W),$i(this)};function Ha(a){if(nh(a),a.I==3){var l=a.V++,d=ht(a.J);if(le(d,"SID",a.M),le(d,"RID",l),le(d,"TYPE","terminate"),Es(a,d),l=new jt(a,a.j,l),l.M=2,l.A=Ui(ht(d)),d=!1,o.navigator&&o.navigator.sendBeacon)try{d=o.navigator.sendBeacon(l.A.toString(),"")}catch{}!d&&o.Image&&(new Image().src=l.A,d=!0),d||(l.g=hh(l.j,null),l.g.ea(l.A)),l.F=Date.now(),Fi(l)}ch(a)}function ji(a){a.g&&(Ja(a),a.g.cancel(),a.g=null)}function nh(a){ji(a),a.v&&(o.clearTimeout(a.v),a.v=null),zi(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function $i(a){if(!Fl(a.h)&&!a.m){a.m=!0;var l=a.Ea;te||g(),ne||(te(),ne=!0),w.add(l,a),a.D=0}}function l_(a,l){return Ul(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=l.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=ls(h(a.Ea,a,l),uh(a,a.D)),a.D++,!0)}r.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const P=new jt(this,this.j,a);let S=this.o;if(this.U&&(S?(S=ml(S),gl(S,this.U)):S=this.U),this.u!==null||this.R||(P.J=S,S=null),this.S)e:{for(var l=0,d=0;d<this.i.length;d++){t:{var p=this.i[d];if("__data__"in p.map&&(p=p.map.__data__,typeof p=="string")){p=p.length;break t}p=void 0}if(p===void 0)break;if(l+=p,l>4096){l=d;break e}if(l===4096||d===this.i.length-1){l=d+1;break e}}l=1e3}else l=1e3;l=sh(this,P,l),d=ht(this.J),le(d,"RID",a),le(d,"CVER",22),this.G&&le(d,"X-HTTP-Session-Id",this.G),Es(this,d),S&&(this.R?l="headers="+ds(Jl(S))+"&"+l:this.u&&Wa(d,this.u,S)),za(this.h,P),this.Ra&&le(d,"TYPE","init"),this.S?(le(d,"$req",l),le(d,"SID","null"),P.U=!0,Ba(P,d,null)):Ba(P,d,l),this.I=2}}else this.I==3&&(a?rh(this,a):this.i.length==0||Fl(this.h)||rh(this))};function rh(a,l){var d;l?d=l.l:d=a.V++;const p=ht(a.J);le(p,"SID",a.M),le(p,"RID",d),le(p,"AID",a.K),Es(a,p),a.u&&a.o&&Wa(p,a.u,a.o),d=new jt(a,a.j,d,a.D+1),a.u===null&&(d.J=a.o),l&&(a.i=l.G.concat(a.i)),l=sh(a,d,1e3),d.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),za(a.h,d),Ba(d,p,l)}function Es(a,l){a.H&&Di(a.H,function(d,p){le(l,p,d)}),a.l&&Di({},function(d,p){le(l,p,d)})}function sh(a,l,d){d=Math.min(a.i.length,d);const p=a.l?h(a.l.Ka,a.l,a):null;e:{var P=a.i;let J=-1;for(;;){const Ie=["count="+d];J==-1?d>0?(J=P[0].g,Ie.push("ofs="+J)):J=0:Ie.push("ofs="+J);let oe=!0;for(let Pe=0;Pe<d;Pe++){var S=P[Pe].g;const dt=P[Pe].map;if(S-=J,S<0)J=Math.max(0,P[Pe].g-100),oe=!1;else try{S="req"+S+"_"||"";try{var M=dt instanceof Map?dt:Object.entries(dt);for(const[Cn,Gt]of M){let Wt=Gt;u(Gt)&&(Wt=Oa(Gt)),Ie.push(S+Cn+"="+encodeURIComponent(Wt))}}catch(Cn){throw Ie.push(S+"type="+encodeURIComponent("_badmap")),Cn}}catch{p&&p(dt)}}if(oe){M=Ie.join("&");break e}}M=void 0}return a=a.i.splice(0,d),l.G=a,M}function ih(a){if(!a.g&&!a.v){a.Y=1;var l=a.Da;te||g(),ne||(te(),ne=!0),w.add(l,a),a.A=0}}function Qa(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=ls(h(a.Da,a),uh(a,a.A)),a.A++,!0)}r.Da=function(){if(this.v=null,oh(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=ls(h(this.Wa,this),a)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,je(10),ji(this),oh(this))};function Ja(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function oh(a){a.g=new jt(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var l=ht(a.na);le(l,"RID","rpc"),le(l,"SID",a.M),le(l,"AID",a.K),le(l,"CI",a.F?"0":"1"),!a.F&&a.ia&&le(l,"TO",a.ia),le(l,"TYPE","xmlhttp"),Es(a,l),a.u&&a.o&&Wa(l,a.u,a.o),a.O&&(a.g.H=a.O);var d=a.g;a=a.ba,d.M=1,d.A=Ui(ht(l)),d.u=null,d.R=!0,kl(d,a)}r.Va=function(){this.C!=null&&(this.C=null,ji(this),Qa(this),je(19))};function zi(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function ah(a,l){var d=null;if(a.g==l){zi(a),Ja(a),a.g=null;var p=2}else if($a(a.h,l))d=l.G,Bl(a.h,l),p=1;else return;if(a.I!=0){if(l.o)if(p==1){d=l.u?l.u.length:0,l=Date.now()-l.F;var P=a.D;p=Li(),qe(p,new Vl(p,d)),$i(a)}else ih(a);else if(P=l.m,P==3||P==0&&l.X>0||!(p==1&&l_(a,l)||p==2&&Qa(a)))switch(d&&d.length>0&&(l=a.h,l.i=l.i.concat(d)),P){case 1:Vn(a,5);break;case 4:Vn(a,10);break;case 3:Vn(a,6);break;default:Vn(a,2)}}}function uh(a,l){let d=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(d*=2),d*l}function Vn(a,l){if(a.j.info("Error code "+l),l==2){var d=h(a.bb,a),p=a.Ua;const P=!p;p=new $t(p||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||ms(p,"https"),Ui(p),P?s_(p.toString(),d):i_(p.toString(),d)}else je(2);a.I=0,a.l&&a.l.pa(l),ch(a),nh(a)}r.bb=function(a){a?(this.j.info("Successfully pinged google.com"),je(2)):(this.j.info("Failed to ping google.com"),je(1))};function ch(a){if(a.I=0,a.ja=[],a.l){const l=ql(a.h);(l.length!=0||a.i.length!=0)&&(C(a.ja,l),C(a.ja,a.i),a.h.i.length=0,R(a.i),a.i.length=0),a.l.oa()}}function lh(a,l,d){var p=d instanceof $t?ht(d):new $t(d);if(p.g!="")l&&(p.g=l+"."+p.g),ps(p,p.u);else{var P=o.location;p=P.protocol,l=l?l+"."+P.hostname:P.hostname,P=+P.port;const S=new $t(null);p&&ms(S,p),l&&(S.g=l),P&&ps(S,P),d&&(S.h=d),p=S}return d=a.G,l=a.wa,d&&l&&le(p,d,l),le(p,"VER",a.ka),Es(a,p),p}function hh(a,l,d){if(l&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return l=a.Aa&&!a.ma?new de(new Ga({ab:d})):new de(a.ma),l.Fa(a.L),l}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function dh(){}r=dh.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function Ki(){}Ki.prototype.g=function(a,l){return new Je(a,l)};function Je(a,l){Ne.call(this),this.g=new th(l),this.l=a,this.h=l&&l.messageUrlParams||null,a=l&&l.messageHeaders||null,l&&l.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=l&&l.initMessageHeaders||null,l&&l.messageContentType&&(a?a["X-WebChannel-Content-Type"]=l.messageContentType:a={"X-WebChannel-Content-Type":l.messageContentType}),l&&l.sa&&(a?a["X-WebChannel-Client-Profile"]=l.sa:a={"X-WebChannel-Client-Profile":l.sa}),this.g.U=a,(a=l&&l.Qb)&&!y(a)&&(this.g.u=a),this.A=l&&l.supportsCrossDomainXhr||!1,this.v=l&&l.sendRawJson||!1,(l=l&&l.httpSessionIdParam)&&!y(l)&&(this.g.G=l,a=this.h,a!==null&&l in a&&(a=this.h,l in a&&delete a[l])),this.j=new hr(this)}m(Je,Ne),Je.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Je.prototype.close=function(){Ha(this.g)},Je.prototype.o=function(a){var l=this.g;if(typeof a=="string"){var d={};d.__data__=a,a=d}else this.v&&(d={},d.__data__=Oa(a),a=d);l.i.push(new Jg(l.Ya++,a)),l.I==3&&$i(l)},Je.prototype.N=function(){this.g.l=null,delete this.j,Ha(this.g),delete this.g,Je.Z.N.call(this)};function fh(a){La.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var l=a.__sm__;if(l){e:{for(const d in l){a=d;break e}a=void 0}(this.i=a)&&(a=this.i,l=l!==null&&a in l?l[a]:void 0),this.data=l}else this.data=a}m(fh,La);function mh(){Ma.call(this),this.status=1}m(mh,Ma);function hr(a){this.g=a}m(hr,dh),hr.prototype.ra=function(){qe(this.g,"a")},hr.prototype.qa=function(a){qe(this.g,new fh(a))},hr.prototype.pa=function(a){qe(this.g,new mh)},hr.prototype.oa=function(){qe(this.g,"b")},Ki.prototype.createWebChannel=Ki.prototype.g,Je.prototype.send=Je.prototype.o,Je.prototype.open=Je.prototype.m,Je.prototype.close=Je.prototype.close,tm=function(){return new Ki},em=function(){return Li()},Zf=Rn,yu={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Mi.NO_ERROR=0,Mi.TIMEOUT=8,Mi.HTTP_ERROR=6,ao=Mi,Cl.COMPLETE="complete",Xf=Cl,Pl.EventType=us,us.OPEN="a",us.CLOSE="b",us.ERROR="c",us.MESSAGE="d",Ne.prototype.listen=Ne.prototype.J,Vs=Pl,de.prototype.listenOnce=de.prototype.K,de.prototype.getLastError=de.prototype.Ha,de.prototype.getLastErrorCode=de.prototype.ya,de.prototype.getStatus=de.prototype.ca,de.prototype.getResponseJson=de.prototype.La,de.prototype.getResponseText=de.prototype.la,de.prototype.send=de.prototype.ea,de.prototype.setWithCredentials=de.prototype.Fa,Yf=de}).apply(typeof Hi<"u"?Hi:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Zr="12.18.0";function CT(r){Zr=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fn=new Yu("@firebase/firestore");function Ir(){return fn.logLevel}function JP(r){fn.setLogLevel(r)}function N(r,...e){if(fn.logLevel<=Y.DEBUG){const t=e.map(uc);fn.debug(`Firestore (${Zr}): ${r}`,...t)}}function pe(r,...e){if(fn.logLevel<=Y.ERROR){const t=e.map(uc);fn.error(`Firestore (${Zr}): ${r}`,...t)}}function it(r,...e){if(fn.logLevel<=Y.WARN){const t=e.map(uc);fn.warn(`Firestore (${Zr}): ${r}`,...t)}}function uc(r){if(typeof r=="string")return r;try{return(function(t){return JSON.stringify(t)})(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function B(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,nm(r,n,t)}function nm(r,e,t){let n=`FIRESTORE (${Zr}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw pe(n),new Error(n)}function D(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||nm(e,s,n)}function q(r,e){return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xT(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cc{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=xT(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function G(r,e){return r<e?-1:r>e?1:0}function Iu(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return nu(s)===nu(i)?G(s,i):nu(s)?1:-1}return G(r.length,e.length)}const NT=55296,DT=57343;function nu(r){const e=r.charCodeAt(0);return e>=NT&&e<=DT}function Cr(r,e,t){return r.length===e.length&&r.every(((n,s)=>t(n,e[s])))}function rm(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ae{constructor(e,t){this.comparator=e,this.root=t||Ve.EMPTY}insert(e,t){return new ae(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Ve.BLACK,null,null))}remove(e){return new ae(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Ve.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,n)=>(e(t,n),!1)))}toString(){const e=[];return this.inorderTraversal(((t,n)=>(e.push(`${t}:${n}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Qi(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Qi(this.root,e,this.comparator,!1)}getReverseIterator(){return new Qi(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Qi(this.root,e,this.comparator,!0)}}class Qi{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class Ve{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??Ve.RED,this.left=s??Ve.EMPTY,this.right=i??Ve.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new Ve(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return Ve.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return Ve.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,Ve.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,Ve.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw B(43730,{key:this.key,value:this.value});if(this.right.isRed())throw B(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw B(27949);return e+(this.isRed()?0:1)}}Ve.EMPTY=null,Ve.RED=!0,Ve.BLACK=!1;Ve.EMPTY=new class{constructor(){this.size=0}get key(){throw B(57766)}get value(){throw B(16141)}get color(){throw B(16727)}get left(){throw B(29726)}get right(){throw B(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new Ve(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class re{constructor(e){this.comparator=e,this.data=new ae(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,n)=>(e(t),!1)))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Bh(this.data.getIterator())}getIteratorFrom(e){return new Bh(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((n=>{t=t.add(n)})),t}isEqual(e){if(!(e instanceof re)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new re(this.comparator);return t.data=e,t}}class Bh{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function dr(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const x={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class O extends Ut{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pt="__name__";class ft{constructor(e,t,n){t===void 0?t=0:t>e.length&&B(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&B(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return ft.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ft?e.forEach((n=>{t.push(n)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=ft.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return G(e.length,t.length)}static compareSegments(e,t){const n=ft.isNumericId(e),s=ft.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?ft.extractNumericId(e).compare(ft.extractNumericId(t)):Iu(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return an.fromString(e.substring(4,e.length-2))}}class X extends ft{construct(e,t,n){return new X(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new O(x.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter((s=>s.length>0)))}return new X(t)}static emptyPath(){return new X([])}}const kT=/^[_a-zA-Z][_a-zA-Z0-9]*$/;let Ee=class Tr extends ft{construct(e,t,n){return new Tr(e,t,n)}static isValidIdentifier(e){return kT.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Tr.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===pt}static keyField(){return new Tr([pt])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new O(x.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;s<e.length;){const u=e[s];if(u==="\\"){if(s+1===e.length)throw new O(x.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const c=e[s+1];if(c!=="\\"&&c!=="."&&c!=="`")throw new O(x.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=c,s+=2}else u==="`"?(o=!o,s++):u!=="."||o?(n+=u,s++):(i(),s++)}if(i(),o)throw new O(x.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Tr(t)}static emptyPath(){return new Tr([])}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ke{constructor(e){this.fields=e,e.sort(Ee.comparator)}static empty(){return new Ke([])}unionWith(e){let t=new re(Ee.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new Ke(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Cr(this.fields,e.fields,((t,n)=>t.isEqual(n)))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bo(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function wn(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function OT(r,e){const t=[];for(const n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function sm(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class F{constructor(e){this.path=e}static fromPath(e){return new F(X.fromString(e))}static fromName(e){return new F(X.fromString(e).popFirst(5))}static empty(){return new F(X.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&X.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return X.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new F(new X(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function im(r,e,t){if(!t)throw new O(x.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function LT(r,e,t,n){if(e===!0&&n===!0)throw new O(x.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function qh(r){if(!F.isDocumentKey(r))throw new O(x.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function jh(r){if(F.isDocumentKey(r))throw new O(x.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function Ii(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function lc(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=(function(n){return n.constructor?n.constructor.name:null})(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":B(12329,{type:typeof r})}function un(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new O(x.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=lc(r);throw new O(x.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _e(r,e){const t={typeString:r};return e&&(t.value=e),t}function Ti(r,e){if(!Ii(r))throw new O(x.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new O(x.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $h=-62135596800,zh=1e6;class se{static now(){return se.fromMillis(Date.now())}static fromDate(e){return se.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*zh);return new se(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new O(x.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new O(x.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<$h)throw new O(x.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new O(x.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/zh}_compareTo(e){return this.seconds===e.seconds?G(this.nanoseconds,e.nanoseconds):G(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:se._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Ti(e,se._jsonSchema))return new se(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-$h;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}se._jsonSchemaVersion="firestore/timestamp/1.0",se._jsonSchema={type:_e("string",se._jsonSchemaVersion),seconds:_e("number"),nanoseconds:_e("number")};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class om extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class he{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new om("Invalid base64 string: "+i):i}})(e);return new he(t)}static fromUint8Array(e){const t=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(e);return new he(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return G(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}he.EMPTY_BYTE_STRING=new he("");const MT=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Ot(r){if(D(!!r,39018),typeof r=="string"){let e=0;const t=MT.exec(r);if(D(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:ue(r.seconds),nanos:ue(r.nanos)}}function ue(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function Lt(r){return typeof r=="string"?he.fromBase64String(r):he.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const am="server_timestamp",um="__type__",cm="__previous_value__",lm="__local_write_time__";function Zo(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[um])==null?void 0:n.stringValue)===am}function wi(r){const e=r.mapValue.fields[cm];return Zo(e)?wi(e):e}function xr(r){const e=Ot(r.mapValue.fields[lm].timestampValue);return new se(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class FT{constructor(e,t,n,s,i,o,u,c,h,f,m,_,R){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=u,this.longPollingOptions=c,this.useFetchStreams=h,this.isUsingEmulator=f,this.apiKey=m,this._customHeaders=_,this.grpcFlowControlWindow=R}}const Js="(default)";class Xn{constructor(e,t){this.projectId=e,this.database=t||Js}static empty(){return new Xn("","")}get isDefaultDatabase(){return this.database===Js}isEqual(e){return e instanceof Xn&&e.projectId===this.projectId&&e.database===this.database}}function UT(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new O(x.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Xn(r.options.projectId,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $n=-1;function ea(r){return r==null}function Nr(r){return r===0&&1/r==-1/0}function hm(r){return typeof r=="number"&&Number.isInteger(r)&&!Nr(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}function BT(r){return typeof r=="string"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hc="__type__",dm="__max__",sn={mapValue:{fields:{__type__:{stringValue:dm}}}},dc="__vector__",Zn="value",wt={nullValue:"NULL_VALUE"},He={booleanValue:!0},Se={booleanValue:!1};function ye(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?Zo(r)?4:fm(r)?9007199254740991:er(r)?10:11:B(28295,{value:r})}function ot(r,e,t){if(r===e)return!0;const n=ye(r);if(n!==ye(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return xr(r).isEqual(xr(e));case 3:return(function(i,o){if(typeof i.timestampValue=="string"&&typeof o.timestampValue=="string"&&i.timestampValue.length===o.timestampValue.length)return i.timestampValue===o.timestampValue;const u=Ot(i.timestampValue),c=Ot(o.timestampValue);return u.seconds===c.seconds&&u.nanos===c.nanos})(r,e);case 5:return r.stringValue===e.stringValue;case 6:return(function(i,o){return Lt(i.bytesValue).isEqual(Lt(o.bytesValue))})(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return(function(i,o){return ue(i.geoPointValue.latitude)===ue(o.geoPointValue.latitude)&&ue(i.geoPointValue.longitude)===ue(o.geoPointValue.longitude)})(r,e);case 2:return(function(i,o,u){if("integerValue"in i&&"integerValue"in o)return ue(i.integerValue)===ue(o.integerValue);let c,h;if("doubleValue"in i&&"doubleValue"in o)c=ue(i.doubleValue),h=ue(o.doubleValue);else{if(!(u!=null&&u.t))return!1;c=ue(i.integerValue??i.doubleValue),h=ue(o.integerValue??o.doubleValue)}return c===h?!!(u!=null&&u.i)||Nr(c)===Nr(h):!!(u===void 0||u.o)&&isNaN(c)&&isNaN(h)})(r,e,t);case 9:return Cr(r.arrayValue.values||[],e.arrayValue.values||[],((s,i)=>ot(s,i,t)));case 10:case 11:return(function(i,o,u){const c=i.mapValue.fields||{},h=o.mapValue.fields||{};if(bo(c)!==bo(h))return!1;for(const f in c)if(c.hasOwnProperty(f)&&(h[f]===void 0||!ot(c[f],h[f],u)))return!1;return!0})(r,e,t);default:return B(52216,{left:r})}}function Ys(r,e){return(r.values||[]).find((t=>ot(t,e)))!==void 0}function Ue(r,e){if(r===e)return 0;const t=ye(r),n=ye(e);if(t!==n)return G(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return G(r.booleanValue,e.booleanValue);case 2:return(function(i,o){const u=ue(i.integerValue||i.doubleValue),c=ue(o.integerValue||o.doubleValue);return u<c?-1:u>c?1:u===c?0:isNaN(u)?isNaN(c)?0:-1:1})(r,e);case 3:return Kh(r.timestampValue,e.timestampValue);case 4:return Kh(xr(r),xr(e));case 5:return Iu(r.stringValue,e.stringValue);case 6:return(function(i,o){const u=Lt(i),c=Lt(o);return u.compareTo(c)})(r.bytesValue,e.bytesValue);case 7:return(function(i,o){const u=i.split("/"),c=o.split("/");for(let h=0;h<u.length&&h<c.length;h++){const f=G(u[h],c[h]);if(f!==0)return f}return G(u.length,c.length)})(r.referenceValue,e.referenceValue);case 8:return(function(i,o){const u=G(ue(i.latitude),ue(o.latitude));return u!==0?u:G(ue(i.longitude),ue(o.longitude))})(r.geoPointValue,e.geoPointValue);case 9:return Gh(r.arrayValue,e.arrayValue);case 10:return(function(i,o){var _,R,C,U;const u=i.fields||{},c=o.fields||{},h=(_=u[Zn])==null?void 0:_.arrayValue,f=(R=c[Zn])==null?void 0:R.arrayValue,m=G(((C=h==null?void 0:h.values)==null?void 0:C.length)||0,((U=f==null?void 0:f.values)==null?void 0:U.length)||0);return m!==0?m:Gh(h,f)})(r.mapValue,e.mapValue);case 11:return(function(i,o){if(i===sn.mapValue&&o===sn.mapValue)return 0;if(i===sn.mapValue)return 1;if(o===sn.mapValue)return-1;const u=i.fields||{},c=Object.keys(u),h=o.fields||{},f=Object.keys(h);c.sort(),f.sort();for(let m=0;m<c.length&&m<f.length;++m){const _=Iu(c[m],f[m]);if(_!==0)return _;const R=Ue(u[c[m]],h[f[m]]);if(R!==0)return R}return G(c.length,f.length)})(r.mapValue,e.mapValue);default:throw B(23264,{u:t})}}function Kh(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return G(r,e);const t=Ot(r),n=Ot(e),s=G(t.seconds,n.seconds);return s!==0?s:G(t.nanos,n.nanos)}function Gh(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=Ue(t[s],n[s]);if(i!==void 0&&i!==0)return i}return G(t.length,n.length)}function Dr(r){return Tu(r)}function Tu(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(t){const n=Ot(t);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(t){return Lt(t).toBase64()})(r.bytesValue):"referenceValue"in r?(function(t){return F.fromName(t).toString()})(r.referenceValue):"geoPointValue"in r?(function(t){return`geo(${t.latitude},${t.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=Tu(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${Tu(t.fields[o])}`;return s+"}"})(r.mapValue):B(61005,{value:r})}function uo(r){switch(ye(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=wi(r);return e?16+uo(e):16;case 5:return 2*r.stringValue.length;case 6:return Lt(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return(function(n){return(n.values||[]).reduce(((s,i)=>s+uo(i)),0)})(r.arrayValue);case 10:case 11:return(function(n){let s=0;return wn(n.fields,((i,o)=>{s+=i.length+uo(o)})),s})(r.mapValue);default:throw B(13486,{value:r})}}function fc(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function gt(r){return!!r&&"integerValue"in r}function Bn(r){return!!r&&"doubleValue"in r}function mn(r){return gt(r)||Bn(r)}function pn(r){return!!r&&"arrayValue"in r}function Ze(r){return!!r&&"nullValue"in r}function Qe(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function zn(r){return!!r&&"mapValue"in r}function er(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[hc])==null?void 0:n.stringValue)===dc}function wu(r){var e,t;return(t=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Zn])==null?void 0:t.arrayValue}function Os(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return wn(r.mapValue.fields,((t,n)=>e.mapValue.fields[t]=Os(n))),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Os(r.arrayValue.values[t]);return e}return{...r}}function fm(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===dm}const mm={mapValue:{fields:{[hc]:{stringValue:dc},[Zn]:{arrayValue:{}}}}};function qT(r){return"nullValue"in r?wt:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?fc(Xn.empty(),F.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?er(r)?mm:{mapValue:{}}:B(35942,{value:r})}function jT(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?fc(Xn.empty(),F.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?mm:"mapValue"in r?er(r)?{mapValue:{}}:sn:B(61959,{value:r})}function Wh(r,e){const t=Ue(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function Hh(r,e){const t=Ue(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ce{constructor(e){this.value=e}static empty(){return new Ce({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!zn(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Os(t)}setAll(e){let t=Ee.emptyPath(),n={},s=[];e.forEach(((o,u)=>{if(!t.isImmediateParentOf(u)){const c=this.getFieldsMap(t);this.applyChanges(c,n,s),n={},s=[],t=u.popLast()}o?n[u.lastSegment()]=Os(o):s.push(u.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());zn(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return ot(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];zn(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){wn(t,((s,i)=>e[s]=i));for(const s of n)delete e[s]}clone(){return new Ce(Os(this.value))}}function pm(r){const e=[];return wn(r.fields,((t,n)=>{const s=new Ee([t]);if(zn(n)){const i=pm(n.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)})),new Ke(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ta(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Nr(e)?"-0":e}}function mc(r){return{integerValue:""+r}}function pc(r,e,t){return hm(e)?mc(e):ta(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class na{constructor(){this._=void 0}}function $T(r,e,t){return r instanceof Xs?(function(s,i){const o={fields:{[um]:{stringValue:am},[lm]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Zo(i)&&(i=wi(i)),i&&(o.fields[cm]=i),{mapValue:o}})(t,e):r instanceof kr?_m(r,e):r instanceof Or?ym(r,e):r instanceof Lr?(function(s,i){const o=gm(s,i),u=So(o)+So(s.l);return gt(o)&&gt(s.l)?mc(u):ta(s.serializer,u)})(r,e):r instanceof Zs?(function(s,i){return Qh(s,i,Math.min)})(r,e):r instanceof ei?(function(s,i){return Qh(s,i,Math.max)})(r,e):void 0}function zT(r,e,t){return r instanceof kr?_m(r,e):r instanceof Or?ym(r,e):t}function gm(r,e){return r instanceof Lr?mn(e)?e:{integerValue:0}:null}class Xs extends na{}class kr extends na{constructor(e){super(),this.elements=e}}function _m(r,e){const t=Im(e);for(const n of r.elements)t.some((s=>ot(s,n)))||t.push(n);return{arrayValue:{values:t}}}class Or extends na{constructor(e){super(),this.elements=e}}function ym(r,e){let t=Im(e);for(const n of r.elements)t=t.filter((s=>!ot(s,n)));return{arrayValue:{values:t}}}class gc extends na{constructor(e,t){super(),this.serializer=e,this.l=t}}class Lr extends gc{}class Zs extends gc{}class ei extends gc{}function Qh(r,e,t){if(!mn(e))return r.l;const n=t(So(e),So(r.l));return gt(e)&&gt(r.l)?mc(n):ta(r.serializer,n)}function So(r){return ue(r.integerValue||r.doubleValue)}function Im(r){return pn(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class KT{constructor(e,t){this.field=e,this.transform=t}}function GT(r,e){return r.field.isEqual(e.field)&&(function(n,s){return n instanceof kr&&s instanceof kr||n instanceof Or&&s instanceof Or?Cr(n.elements,s.elements,ot):n instanceof Lr&&s instanceof Lr||n instanceof Zs&&s instanceof Zs||n instanceof ei&&s instanceof ei?ot(n.l,s.l):n instanceof Xs&&s instanceof Xs})(r.transform,e.transform)}class WT{constructor(e,t){this.version=e,this.transformResults=t}}class Le{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new Le}static exists(e){return new Le(void 0,e)}static updateTime(e){return new Le(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function co(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class ra{}function Tm(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new Ei(r.key,Le.none()):new es(r.key,r.data,Le.none());{const t=r.data,n=Ce.empty();let s=new re(Ee.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new Bt(r.key,n,new Ke(s.toArray()),Le.none())}}function HT(r,e,t){r instanceof es?(function(s,i,o){const u=s.value.clone(),c=Yh(s.fieldTransforms,i,o.transformResults);u.setAll(c),i.convertToFoundDocument(o.version,u).setHasCommittedMutations()})(r,e,t):r instanceof Bt?(function(s,i,o){if(!co(s.precondition,i))return void i.convertToUnknownDocument(o.version);const u=Yh(s.fieldTransforms,i,o.transformResults),c=i.data;c.setAll(wm(s)),c.setAll(u),i.convertToFoundDocument(o.version,c).setHasCommittedMutations()})(r,e,t):(function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,e,t)}function Ls(r,e,t,n){return r instanceof es?(function(i,o,u,c){if(!co(i.precondition,o))return u;const h=i.value.clone(),f=Xh(i.fieldTransforms,c,o);return h.setAll(f),o.convertToFoundDocument(o.version,h).setHasLocalMutations(),null})(r,e,t,n):r instanceof Bt?(function(i,o,u,c){if(!co(i.precondition,o))return u;const h=Xh(i.fieldTransforms,c,o),f=o.data;return f.setAll(wm(i)),f.setAll(h),o.convertToFoundDocument(o.version,f).setHasLocalMutations(),u===null?null:u.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((m=>m.field)))})(r,e,t,n):(function(i,o,u){return co(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):u})(r,e,t)}function QT(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=gm(n.transform,s||null);i!=null&&(t===null&&(t=Ce.empty()),t.set(n.field,i))}return t||null}function Jh(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&Cr(n,s,((i,o)=>GT(i,o)))})(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class es extends ra{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Bt extends ra{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function wm(r){const e=new Map;return r.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}})),e}function Yh(r,e,t){const n=new Map;D(r.length===t.length,32656,{h:t.length,T:r.length});for(let s=0;s<t.length;s++){const i=r[s],o=i.transform,u=e.data.field(i.field);n.set(i.field,zT(o,u,t[s]))}return n}function Xh(r,e,t){const n=new Map;for(const s of r){const i=s.transform,o=t.data.field(s.field);n.set(s.field,$T(i,o,e))}return n}class Ei extends ra{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Em extends ra{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mr{constructor(e,t){this.position=e,this.inclusive=t}}function Zh(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],o=r.position[s];if(i.field.isKeyField()?n=F.comparator(F.fromName(o.referenceValue),t.key):n=Ue(o,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function ed(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!ot(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vm{}class Z extends vm{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new JT(e,t,n):t==="array-contains"?new ZT(e,n):t==="in"?new Vm(e,n):t==="not-in"?new ew(e,n):t==="array-contains-any"?new tw(e,n):new Z(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new YT(e,n):new XT(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Ue(t,this.value)):t!==null&&ye(this.value)===ye(t)&&this.matchesComparison(Ue(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return B(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class ie extends vm{constructor(e,t){super(),this.filters=e,this.op=t,this.P=null}static create(e,t){return new ie(e,t)}matches(e){return Fr(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.P!==null||(this.P=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.P}getFilters(){return Object.assign([],this.filters)}}function Fr(r){return r.op==="and"}function Eu(r){return r.op==="or"}function _c(r){return Am(r)&&Fr(r)}function Am(r){for(const e of r.filters)if(e instanceof ie)return!1;return!0}function vu(r){if(r instanceof Z)return r.field.canonicalString()+r.op.toString()+Dr(r.value);if(_c(r))return r.filters.map((e=>vu(e))).join(",");{const e=r.filters.map((t=>vu(t))).join(",");return`${r.op}(${e})`}}function Pm(r,e){return r instanceof Z?(function(n,s){return s instanceof Z&&n.op===s.op&&n.field.isEqual(s.field)&&ot(n.value,s.value)})(r,e):r instanceof ie?(function(n,s){return s instanceof ie&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,o,u)=>i&&Pm(o,s.filters[u])),!0):!1})(r,e):void B(19439)}function Rm(r,e){const t=r.filters.concat(e);return ie.create(t,r.op)}function bm(r){return r instanceof Z?(function(t){return`${t.field.canonicalString()} ${t.op} ${Dr(t.value)}`})(r):r instanceof ie?(function(t){return t.op.toString()+" {"+t.getFilters().map(bm).join(" ,")+"}"})(r):"Filter"}class JT extends Z{constructor(e,t,n){super(e,t,n),this.key=F.fromName(n.referenceValue)}matches(e){const t=F.comparator(e.key,this.key);return this.matchesComparison(t)}}class YT extends Z{constructor(e,t){super(e,"in",t),this.keys=Sm("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class XT extends Z{constructor(e,t){super(e,"not-in",t),this.keys=Sm("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function Sm(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((n=>F.fromName(n.referenceValue)))}class ZT extends Z{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return pn(t)&&Ys(t.arrayValue,this.value)}}class Vm extends Z{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&Ys(this.value.arrayValue,t)}}class ew extends Z{constructor(e,t){super(e,"not-in",t)}matches(e){if(Ys(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!Ys(this.value.arrayValue,t)}}class tw extends Z{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!pn(t)||!t.arrayValue.values)&&t.arrayValue.values.some((n=>Ys(this.value.arrayValue,n)))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vo{constructor(e,t="asc"){this.field=e,this.dir=t}}function nw(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j{static fromTimestamp(e){return new j(e)}static min(){return new j(new se(0,0))}static max(){return new j(new se(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fe{constructor(e,t,n,s,i,o,u){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=u}static newInvalidDocument(e){return new fe(e,0,j.min(),j.min(),j.min(),Ce.empty(),0)}static newFoundDocument(e,t,n,s){return new fe(e,1,t,j.min(),n,s,0)}static newNoDocument(e,t){return new fe(e,2,t,j.min(),j.min(),Ce.empty(),0)}static newUnknownDocument(e,t){return new fe(e,3,t,j.min(),j.min(),Ce.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(j.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Ce.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Ce.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=j.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof fe&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new fe(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ur=-1;class Co{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}}function Au(r){return r.fields.find((e=>e.kind===2))}function Nn(r){return r.fields.filter((e=>e.kind!==2))}Co.UNKNOWN_ID=-1;class lo{constructor(e,t){this.fieldPath=e,this.kind=t}}class ti{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new ti(0,tt.min())}}function Cm(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=j.fromTimestamp(n===1e9?new se(t+1,0):new se(t,n));return new tt(s,F.empty(),e)}function xm(r){return new tt(r.readTime,r.key,Ur)}class tt{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new tt(j.min(),F.empty(),Ur)}static max(){return new tt(j.max(),F.empty(),Ur)}}function yc(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=F.comparator(r.documentKey,e.documentKey),t!==0?t:G(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rw{constructor(e,t=null,n=[],s=[],i=null,o=null,u=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=u,this.R=null}}function Pu(r,e=null,t=[],n=[],s=null,i=null,o=null){return new rw(r,e,t,n,s,i,o)}function xo(r){const e=q(r);if(e.R===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((n=>vu(n))).join(","),t+="|ob:",t+=e.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),ea(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((n=>Dr(n))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((n=>Dr(n))).join(",")),e.R=t}return e.R}function Ic(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!nw(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!Pm(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!ed(r.startAt,e.startAt)&&ed(r.endAt,e.endAt)}function Rt(r){return!!r.isCorePipeline}function Tc(r){return!!r.path&&F.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function No(r,e){return r.filters.filter((t=>t instanceof Z&&t.field.isEqual(e)))}function td(r,e,t){let n=wt,s=!0;for(const i of No(r,e)){let o=wt,u=!0;switch(i.op){case"<":case"<=":o=qT(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,u=!1;break;case"!=":case"not-in":o=wt}Wh({value:n,inclusive:s},{value:o,inclusive:u})<0&&(n=o,s=u)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];Wh({value:n,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}function nd(r,e,t){let n=sn,s=!0;for(const i of No(r,e)){let o=sn,u=!0;switch(i.op){case">=":case">":o=jT(i.value),u=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,u=!1;break;case"!=":case"not-in":o=sn}Hh({value:n,inclusive:s},{value:o,inclusive:u})>0&&(n=o,s=u)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];Hh({value:n,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sa{constructor(e,t=null,n=[],s=[],i=null,o="F",u=null,c=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=u,this.endAt=c,this.I=null,this.A=null,this.V=null,this.startAt,this.endAt}}function Nm(r,e,t,n,s,i,o,u){return new sa(r,e,t,n,s,i,o,u)}function ia(r){return new sa(r)}function rd(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function sw(r){return F.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function iw(r){return r.collectionGroup!==null}function Ms(r){const e=q(r);if(e.I===null){e.I=[];const t=new Set;for(const i of e.explicitOrderBy)e.I.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let u=new re(Ee.comparator);return o.filters.forEach((c=>{c.getFlattenedFilters().forEach((h=>{h.isInequality()&&(u=u.add(h.field))}))})),u})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.I.push(new Vo(i,n))})),t.has(Ee.keyField().canonicalString())||e.I.push(new Vo(Ee.keyField(),n))}return e.I}function et(r){const e=q(r);return e.A||(e.A=ow(e,Ms(r))),e.A}function ow(r,e){if(r.limitType==="F")return Pu(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new Vo(s.field,i)}));const t=r.endAt?new Mr(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Mr(r.startAt.position,r.startAt.inclusive):null;return Pu(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function Ru(r,e,t){return new sa(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function aw(r,e){return Ic(et(r),et(e))&&r.limitType===e.limitType}function Fs(r){return`Query(target=${(function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map((s=>bm(s))).join(", ")}]`),ea(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map((s=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(s))).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map((s=>Dr(s))).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map((s=>Dr(s))).join(",")),`Target(${n})`})(et(r))}; limitType=${r.limitType})`}function oa(r,e){return e.isFoundDocument()&&(function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):F.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,e)&&(function(n,s){for(const i of Ms(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,e)&&(function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0})(r,e)&&(function(n,s){return!(n.startAt&&!(function(o,u,c){const h=Zh(o,u,c);return o.inclusive?h<=0:h<0})(n.startAt,Ms(n),s)||n.endAt&&!(function(o,u,c){const h=Zh(o,u,c);return o.inclusive?h>=0:h>0})(n.endAt,Ms(n),s))})(r,e)}function wc(r){return(e,t)=>{let n=!1;for(const s of Ms(r)){const i=uw(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function uw(r,e,t){const n=r.field.isKeyField()?F.comparator(e.key,t.key):(function(i,o,u){const c=o.data.field(i),h=u.data.field(i);return c!==null&&h!==null?Ue(c,h):B(42886)})(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return B(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cw{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ge,ee;function lw(r){switch(r){case x.OK:return B(64938);case x.CANCELLED:case x.UNKNOWN:case x.DEADLINE_EXCEEDED:case x.RESOURCE_EXHAUSTED:case x.INTERNAL:case x.UNAVAILABLE:case x.UNAUTHENTICATED:return!1;case x.INVALID_ARGUMENT:case x.NOT_FOUND:case x.ALREADY_EXISTS:case x.PERMISSION_DENIED:case x.FAILED_PRECONDITION:case x.ABORTED:case x.OUT_OF_RANGE:case x.UNIMPLEMENTED:case x.DATA_LOSS:return!0;default:return B(15467,{code:r})}}function Dm(r){if(r===void 0)return pe("GRPC error has no .code"),x.UNKNOWN;switch(r){case ge.OK:return x.OK;case ge.CANCELLED:return x.CANCELLED;case ge.UNKNOWN:return x.UNKNOWN;case ge.DEADLINE_EXCEEDED:return x.DEADLINE_EXCEEDED;case ge.RESOURCE_EXHAUSTED:return x.RESOURCE_EXHAUSTED;case ge.INTERNAL:return x.INTERNAL;case ge.UNAVAILABLE:return x.UNAVAILABLE;case ge.UNAUTHENTICATED:return x.UNAUTHENTICATED;case ge.INVALID_ARGUMENT:return x.INVALID_ARGUMENT;case ge.NOT_FOUND:return x.NOT_FOUND;case ge.ALREADY_EXISTS:return x.ALREADY_EXISTS;case ge.PERMISSION_DENIED:return x.PERMISSION_DENIED;case ge.FAILED_PRECONDITION:return x.FAILED_PRECONDITION;case ge.ABORTED:return x.ABORTED;case ge.OUT_OF_RANGE:return x.OUT_OF_RANGE;case ge.UNIMPLEMENTED:return x.UNIMPLEMENTED;case ge.DATA_LOSS:return x.DATA_LOSS;default:return B(39323,{code:r})}}(ee=ge||(ge={}))[ee.OK=0]="OK",ee[ee.CANCELLED=1]="CANCELLED",ee[ee.UNKNOWN=2]="UNKNOWN",ee[ee.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",ee[ee.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",ee[ee.NOT_FOUND=5]="NOT_FOUND",ee[ee.ALREADY_EXISTS=6]="ALREADY_EXISTS",ee[ee.PERMISSION_DENIED=7]="PERMISSION_DENIED",ee[ee.UNAUTHENTICATED=16]="UNAUTHENTICATED",ee[ee.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",ee[ee.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",ee[ee.ABORTED=10]="ABORTED",ee[ee.OUT_OF_RANGE=11]="OUT_OF_RANGE",ee[ee.UNIMPLEMENTED=12]="UNIMPLEMENTED",ee[ee.INTERNAL=13]="INTERNAL",ee[ee.UNAVAILABLE=14]="UNAVAILABLE",ee[ee.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){wn(this.inner,((t,n)=>{for(const[s,i]of n)e(s,i)}))}isEmpty(){return sm(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hw=new ae(F.comparator);function Te(){return hw}const km=new ae(F.comparator);function kn(...r){let e=km;for(const t of r)e=e.insert(t.key,t);return e}function Om(r){let e=km;return r.forEach(((t,n)=>e=e.insert(t,n.overlayedDocument))),e}function rt(){return Us()}function Lm(){return Us()}function Us(){return new qt((r=>r.toString()),((r,e)=>r.isEqual(e)))}const dw=new ae(F.comparator),fw=new re(F.comparator);function Q(...r){let e=fw;for(const t of r)e=e.add(t);return e}const mw=new re(G);function Ec(){return mw}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pw(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gw=new an([4294967295,4294967295],0);function sd(r){const e=pw().encode(r),t=new Jf;return t.update(e),new Uint8Array(t.digest())}function id(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new an([t,n],0),new an([s,i],0)]}class vc{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new Cs(`Invalid padding: ${t}`);if(n<0)throw new Cs(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new Cs(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new Cs(`Invalid padding when bitmap length is 0: ${t}`);this.m=8*e.length-t,this.p=an.fromNumber(this.m)}S(e,t,n){let s=e.add(t.multiply(an.fromNumber(n)));return s.compare(gw)===1&&(s=new an([s.getBits(0),s.getBits(1)],0)),s.modulo(this.p).toNumber()}v(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.m===0)return!1;const t=sd(e),[n,s]=id(t);for(let i=0;i<this.hashCount;i++){const o=this.S(n,s,i);if(!this.v(o))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new vc(i,s,t);return n.forEach((u=>o.insert(u))),o}insert(e){if(this.m===0)return;const t=sd(e),[n,s]=id(t);for(let i=0;i<this.hashCount;i++){const o=this.S(n,s,i);this.D(o)}}D(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class Cs extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ts{constructor(e,t,n,s,i,o){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.augmentedDocumentUpdates=i,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,vi.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new ts(j.min(),s,new ae(G),Te(),Te(),Q())}}class vi{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new vi(n,t,Q(),Q(),Q())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ho{constructor(e,t,n,s){this.C=e,this.removedTargetIds=t,this.key=n,this.F=s}}class Mm{constructor(e,t){this.targetId=e,this.O=t}}class Fm{constructor(e,t,n=he.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class od{constructor(e){this.targetId=e,this.M=0,this.N=ad(),this.L=he.EMPTY_BYTE_STRING,this.B=!1,this.U=!0}get current(){return this.B}get resumeToken(){return this.L}get k(){return this.M!==0}get q(){return this.U}$(e){e.approximateByteSize()>0&&(this.U=!0,this.L=e)}K(){let e=Q(),t=Q(),n=Q();return this.N.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:B(38017,{changeType:i})}})),new vi(this.L,this.B,e,t,n)}W(){this.U=!1,this.N=ad()}G(e,t){this.U=!0,this.N=this.N.insert(e,t)}j(e){this.U=!0,this.N=this.N.remove(e)}H(){this.M+=1}J(){this.M-=1,D(this.M>=0,3241,{M:this.M,targetId:this.targetId})}Y(){this.U=!0,this.B=!0}}const vs="WatchChangeAggregator";class _w{constructor(e){this.Z=e,this.X=new Map,this.ee=Te(),this.te=Ji(),this.ne=Te(),this.re=Ji(),this.ie=new ae(G)}se(e){for(const t of e.C)e.F&&e.F.isFoundDocument()?this._e(t,e.F):this.oe(t,e.key,e.F);for(const t of e.removedTargetIds)this.oe(t,e.key,e.F)}ae(e){this.forEachTarget(e,(t=>{const n=this.X.get(t);if(n)switch(e.state){case 0:this.ue(t)&&n.$(e.resumeToken);break;case 1:n.J(),n.k||n.W(),n.$(e.resumeToken);break;case 2:n.J(),n.k||this.removeTarget(t);break;case 3:this.ue(t)&&(n.Y(),n.$(e.resumeToken));break;case 4:this.ue(t)&&(this.ce(t),n.$(e.resumeToken));break;default:B(56790,{state:e.state})}else N(vs,`handleTargetChange received targetChange for untracked target ID (${t}) with state (${e.state})`)}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.X.forEach(((n,s)=>{this.ue(s)&&t(s)}))}le(e){var t;return Rt(e)?e.getPipelineSourceType()==="documents"&&((t=e.getPipelineDocuments())==null?void 0:t.length)===1:Tc(e)}Ee(e){const t=e.targetId,n=e.O.count,s=this.he(t);if(s){const i=s.target;if(this.le(i))if(n===0){const o=new F(Rt(i)?X.fromString(i.getPipelineDocuments()[0]):i.path);this.oe(t,o,fe.newNoDocument(o,j.min()))}else D(n===1,20013,"Single document existence filter with count: "+n);else{const o=this.Te(t);if(o!==n){const u=this.Pe(e),c=u?this.Re(u,e,o):1;if(c!==0){this.ce(t);const h=c===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.ie=this.ie.insert(t,h)}}}}}Pe(e){const t=e.O.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let o,u;try{o=Lt(n).toUint8Array()}catch(c){if(c instanceof om)return it("Decoding the base64 bloom filter in existence filter failed ("+c.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw c}try{u=new vc(o,s,i)}catch(c){return it(c instanceof Cs?"BloomFilter error: ":"Applying bloom filter failed: ",c),null}return u.m===0?null:u}Re(e,t,n){return t.O.count===n-this.Ve(e,t.targetId)?0:2}Ve(e,t){const n=this.Z.getRemoteKeysForTarget(t);let s=0;return n.forEach((i=>{const o=this.Z.Ae(),u=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(u)||(this.oe(t,i,null),s++)})),s}de(e){const t=new Map;this.X.forEach(((i,o)=>{const u=this.he(o);if(u){if(i.current&&this.le(u.target)){const c=Rt(u.target)?X.fromString(u.target.getPipelineDocuments()[0]):u.target.path,h=new F(c);this.fe(h).has(o)||this.me(o,h)||this.oe(o,h,fe.newNoDocument(h,e))}i.q&&(t.set(o,i.K()),i.W())}}));let n=Q();this.re.forEach(((i,o)=>{let u=!0;o.forEachWhile((c=>{const h=this.he(c);return!h||h.purpose==="TargetPurposeLimboResolution"||(u=!1,!1)})),u&&(n=n.add(i))})),this.ee.forEach(((i,o)=>o.setReadTime(e))),this.ne.forEach(((i,o)=>o.setReadTime(e)));const s=new ts(e,t,this.ie,this.ee,this.ne,n);return this.ee=Te(),this.te=Ji(),this.ne=Te(),this.re=Ji(),this.ie=new ae(G),s}_e(e,t){const n=this.X.get(e);if(!n||!this.ue(e))return void N(vs,`addDocumentToTarget received document for unknown inactive target (${e})`);const s=this.me(e,t.key)?2:0;n.G(t.key,s),Rt(this.he(e).target)&&this.he(e).target.getPipelineFlavor()!=="exact"?this.ne=this.ne.insert(t.key,t):this.ee=this.ee.insert(t.key,t),this.te=this.te.insert(t.key,this.fe(t.key).add(e)),this.re=this.re.insert(t.key,this.pe(t.key).add(e))}oe(e,t,n){const s=this.X.get(e);s&&this.ue(e)?(this.me(e,t)?s.G(t,1):s.j(t),this.re=this.re.insert(t,this.pe(t).delete(e)),this.re=this.re.insert(t,this.pe(t).add(e)),n&&(Rt(this.he(e).target)&&this.he(e).target.getPipelineFlavor()!=="exact"?this.ne=this.ne.insert(t,n):this.ee=this.ee.insert(t,n))):N(vs,`removeDocumentFromTarget received document for unknown or inactive target (${e})`)}removeTarget(e){this.X.delete(e)}Te(e){const t=this.X.get(e);if(!t)return 0;const n=t.K();return this.Z.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}H(e){let t=this.X.get(e);t||(N(vs,`recordPendingTargetRequest set up tracking for target ID ${e}`),t=new od(e),this.X.set(e,t)),t.H()}pe(e){let t=this.re.get(e);return t||(t=new re(G),this.re=this.re.insert(e,t)),t}fe(e){let t=this.te.get(e);return t||(t=new re(G),this.te=this.te.insert(e,t)),t}ue(e){const t=this.he(e)!==null;return t||N(vs,"Detected inactive target",e),t}he(e){const t=this.X.get(e);return t===void 0||t.k?null:this.Z.ge(e)}ce(e){this.X.set(e,new od(e)),this.Z.getRemoteKeysForTarget(e).forEach((t=>{this.oe(e,t,null)}))}me(e,t){return this.Z.getRemoteKeysForTarget(e).has(t)}}function Ji(){return new ae(F.comparator)}function ad(){return new ae(F.comparator)}const yw={asc:"ASCENDING",desc:"DESCENDING"},Iw={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Tw={and:"AND",or:"OR"};class ww{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function bu(r,e){return r.useProto3Json||ea(e)?e:{value:e}}function Br(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Ac(r){const e=Ot(r);return new se(e.seconds,e.nanos)}function Um(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function fo(r,e){return Br(r,e.toTimestamp())}function $e(r){return D(!!r,49232),j.fromTimestamp(Ac(r))}function Pc(r,e){return Su(r,e).canonicalString()}function Su(r,e){const t=(function(s){return new X(["projects",s.projectId,"databases",s.database])})(r).child("documents");return e===void 0?t:t.child(e)}function Bm(r){const e=X.fromString(r);return D(Jm(e),10190,{key:e.toString()}),e}function ni(r,e){return Pc(r.databaseId,e.path)}function Kn(r,e){const t=Bm(e);if(t.get(1)!==r.databaseId.projectId)throw new O(x.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new O(x.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new F($m(t))}function qm(r,e){return Pc(r.databaseId,e)}function jm(r){const e=Bm(r);return e.length===4?X.emptyPath():$m(e)}function Vu(r){return new X(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function $m(r){return D(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function ud(r,e,t){return{name:ni(r,e),fields:t.value.mapValue.fields}}function Ew(r,e,t){const n=Kn(r,e.name),s=$e(e.updateTime),i=e.createTime?$e(e.createTime):j.min(),o=new Ce({mapValue:{fields:e.fields}}),u=fe.newFoundDocument(n,s,i,o);return t&&u.setHasCommittedMutations(),t?u.setHasCommittedMutations():u}function vw(r,e){let t;if("targetChange"in e){e.targetChange;const n=(function(h){return h==="NO_CHANGE"?0:h==="ADD"?1:h==="REMOVE"?2:h==="CURRENT"?3:h==="RESET"?4:B(39313,{state:h})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(h,f){return h.useProto3Json?(D(f===void 0||typeof f=="string",58123),he.fromBase64String(f||"")):(D(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),he.fromUint8Array(f||new Uint8Array))})(r,e.targetChange.resumeToken),o=e.targetChange.cause,u=o&&(function(h){const f=h.code===void 0?x.UNKNOWN:Dm(h.code);return new O(f,h.message||"")})(o);t=new Fm(n,s,i,u||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=Kn(r,n.document.name),i=$e(n.document.updateTime),o=n.document.createTime?$e(n.document.createTime):j.min(),u=new Ce({mapValue:{fields:n.document.fields}}),c=fe.newFoundDocument(s,i,o,u),h=n.targetIds||[],f=n.removedTargetIds||[];t=new ho(h,f,c.key,c)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=Kn(r,n.document),i=n.readTime?$e(n.readTime):j.min(),o=fe.newNoDocument(s,i),u=n.removedTargetIds||[];t=new ho([],u,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=Kn(r,n.document),i=n.removedTargetIds||[];t=new ho([],i,s,null)}else{if(!("filter"in e))return B(11601,{ye:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new cw(s,i),u=n.targetId;t=new Mm(u,o)}}return t}function Do(r,e){let t;if(e instanceof es)t={update:ud(r,e.key,e.value)};else if(e instanceof Ei)t={delete:ni(r,e.key)};else if(e instanceof Bt)t={update:ud(r,e.key,e.data),updateMask:Vw(e.fieldMask)};else{if(!(e instanceof Em))return B(16599,{we:e.type});t={verify:ni(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((n=>(function(i,o){const u=o.transform;if(u instanceof Xs)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(u instanceof kr)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:u.elements}};if(u instanceof Or)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:u.elements}};if(u instanceof Lr)return{fieldPath:o.field.canonicalString(),increment:u.l};if(u instanceof Zs)return{fieldPath:o.field.canonicalString(),minimum:u.l};if(u instanceof ei)return{fieldPath:o.field.canonicalString(),maximum:u.l};throw B(20930,{transform:o.transform})})(0,n)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:fo(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:B(27497)})(r,e.precondition)),t}function Cu(r,e){const t=e.currentDocument?(function(i){return i.updateTime!==void 0?Le.updateTime($e(i.updateTime)):i.exists!==void 0?Le.exists(i.exists):Le.none()})(e.currentDocument):Le.none(),n=e.updateTransforms?e.updateTransforms.map((s=>(function(o,u){let c=null;if("setToServerValue"in u)D(u.setToServerValue==="REQUEST_TIME",16630,{proto:u}),c=new Xs;else if("appendMissingElements"in u){const f=u.appendMissingElements.values||[];c=new kr(f)}else if("removeAllFromArray"in u){const f=u.removeAllFromArray.values||[];c=new Or(f)}else"increment"in u?c=new Lr(o,u.increment):"minimum"in u?c=new Zs(o,u.minimum):"maximum"in u?c=new ei(o,u.maximum):B(16584,{proto:u});const h=Ee.fromServerFormat(u.fieldPath);return new KT(h,c)})(r,s))):[];if(e.update){e.update.name;const s=Kn(r,e.update.name),i=new Ce({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=(function(c){const h=c.fieldPaths||[];return new Ke(h.map((f=>Ee.fromServerFormat(f))))})(e.updateMask);return new Bt(s,i,o,t,n)}return new es(s,i,t,n)}if(e.delete){const s=Kn(r,e.delete);return new Ei(s,t)}if(e.verify){const s=Kn(r,e.verify);return new Em(s,t)}return B(1463,{proto:e})}function Aw(r,e){return r&&r.length>0?(D(e!==void 0,14353),r.map((t=>(function(s,i){let o=s.updateTime?$e(s.updateTime):$e(i);return o.isEqual(j.min())&&(o=$e(i)),new WT(o,s.transformResults||[])})(t,e)))):[]}function zm(r,e){return{documents:[qm(r,e.path)]}}function Km(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=qm(r,s);const i=(function(h){if(h.length!==0)return Qm(ie.create(h,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const o=(function(h){if(h.length!==0)return h.map((f=>(function(_){return{field:wr(_.field),direction:Rw(_.dir)}})(f)))})(e.orderBy);o&&(t.structuredQuery.orderBy=o);const u=bu(r,e.limit);return u!==null&&(t.structuredQuery.limit=u),e.startAt&&(t.structuredQuery.startAt=(function(h){return{before:h.inclusive,values:h.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(h){return{before:!h.inclusive,values:h.position}})(e.endAt)),{be:t,parent:s}}function Gm(r){let e=jm(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){D(n===1,65062);const f=t.from[0];f.allDescendants?s=f.collectionId:e=e.child(f.collectionId)}let i=[];t.where&&(i=(function(m){const _=Hm(m);return _ instanceof ie&&_c(_)?_.getFilters():[_]})(t.where));let o=[];t.orderBy&&(o=(function(m){return m.map((_=>(function(C){return new Vo(Er(C.field),(function(L){switch(L){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(C.direction))})(_)))})(t.orderBy));let u=null;t.limit&&(u=(function(m){let _;return _=typeof m=="object"?m.value:m,ea(_)?null:_})(t.limit));let c=null;t.startAt&&(c=(function(m){const _=!!m.before,R=m.values||[];return new Mr(R,_)})(t.startAt));let h=null;return t.endAt&&(h=(function(m){const _=!m.before,R=m.values||[];return new Mr(R,_)})(t.endAt)),Nm(e,s,o,i,u,"F",c,h)}function Pw(r,e){const t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return B(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function Wm(r,e){return{structuredPipeline:{pipeline:{stages:e.stages.map((t=>t._toProto(r)))}}}}function Hm(r){return r.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=Er(t.unaryFilter.field);return Z.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=Er(t.unaryFilter.field);return Z.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Er(t.unaryFilter.field);return Z.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Er(t.unaryFilter.field);return Z.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return B(61313);default:return B(60726)}})(r):r.fieldFilter!==void 0?(function(t){return Z.create(Er(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return B(58110);default:return B(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(t){return ie.create(t.compositeFilter.filters.map((n=>Hm(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return B(1026)}})(t.compositeFilter.op))})(r):B(30097,{filter:r})}function Rw(r){return yw[r]}function bw(r){return Iw[r]}function Sw(r){return Tw[r]}function wr(r){return{fieldPath:r.canonicalString()}}function Er(r){return Ee.fromServerFormat(r.fieldPath)}function Qm(r){return r instanceof Z?(function(t){if(t.op==="=="){if(Qe(t.value))return{unaryFilter:{field:wr(t.field),op:"IS_NAN"}};if(Ze(t.value))return{unaryFilter:{field:wr(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Qe(t.value))return{unaryFilter:{field:wr(t.field),op:"IS_NOT_NAN"}};if(Ze(t.value))return{unaryFilter:{field:wr(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:wr(t.field),op:bw(t.op),value:t.value}}})(r):r instanceof ie?(function(t){const n=t.getFilters().map((s=>Qm(s)));return n.length===1?n[0]:{compositeFilter:{op:Sw(t.op),filters:n}}})(r):B(54877,{filter:r})}function Vw(r){const e=[];return r.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function Jm(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function Ym(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}function ri(r,e){const t={fields:{}};return e.forEach(((n,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);t.fields[s]=n._toProto(r)})),{mapValue:t}}function Xm(r){return{stringValue:r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aa(r){return new ww(r,!0)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class st{constructor(e){this._byteString=e}static fromBase64String(e){try{return new st(he.fromBase64String(e))}catch(t){throw new O(x.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new st(he.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:st._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Ti(e,st._jsonSchema))return st.fromBase64String(e.bytes)}}st._jsonSchemaVersion="firestore/bytes/1.0",st._jsonSchema={type:_e("string",st._jsonSchemaVersion),bytes:_e("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ua{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new O(x.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Ee(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function Cw(){return new ua(pt)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rc{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Et{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new O(x.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new O(x.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return G(this._lat,e._lat)||G(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Et._jsonSchemaVersion}}static fromJSON(e){if(Ti(e,Et._jsonSchema))return new Et(e.latitude,e.longitude)}}Et._jsonSchemaVersion="firestore/geoPoint/1.0",Et._jsonSchema={type:_e("string",Et._jsonSchemaVersion),latitude:_e("number"),longitude:_e("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class be{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}be.UNAUTHENTICATED=new be(null),be.GOOGLE_CREDENTIALS=new be("google-credentials-uid"),be.FIRST_PARTY=new be("first-party-uid"),be.MOCK_USER=new be("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zm{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class xw{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(be.UNAUTHENTICATED)))}shutdown(){}}class Nw{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class Dw{constructor(e){this.ve=e,this.currentUser=be.UNAUTHENTICATED,this.De=0,this.forceRefresh=!1,this.auth=null}start(e,t){D(this.xe===void 0,42304);let n=this.De;const s=c=>this.De!==n?(n=this.De,t(c)):Promise.resolve();let i=new Ct;this.xe=()=>{this.De++,this.currentUser=this.Ce(),i.resolve(),i=new Ct,e.enqueueRetryable((()=>s(this.currentUser)))};const o=()=>{const c=i;e.enqueueRetryable((async()=>{await c.promise,await s(this.currentUser)}))},u=c=>{N("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=c,this.xe&&(this.auth.addAuthTokenListener(this.xe),o())};this.ve.onInit((c=>u(c))),setTimeout((()=>{if(!this.auth){const c=this.ve.getImmediate({optional:!0});c?u(c):(N("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Ct)}}),0),o()}getToken(){const e=this.De,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((n=>this.De!==e?(N("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(D(typeof n.accessToken=="string",31837,{Fe:n}),new Zm(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.xe&&this.auth.removeAuthTokenListener(this.xe),this.xe=void 0}Ce(){const e=this.auth&&this.auth.getUid();return D(e===null||typeof e=="string",2055,{Oe:e}),new be(e)}}class kw{constructor(e,t,n){this.Me=e,this.Ne=t,this.Le=n,this.type="FirstParty",this.user=be.FIRST_PARTY,this.Be=new Map}Ue(){return this.Le?this.Le():null}get headers(){this.Be.set("X-Goog-AuthUser",this.Me);const e=this.Ue();return e&&this.Be.set("Authorization",e),this.Ne&&this.Be.set("X-Goog-Iam-Authorization-Token",this.Ne),this.Be}}class Ow{constructor(e,t,n){this.Me=e,this.Ne=t,this.Le=n}getToken(){return Promise.resolve(new kw(this.Me,this.Ne,this.Le))}start(e,t){e.enqueueRetryable((()=>t(be.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class cd{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Lw{constructor(e,t){this.ke=t,this.forceRefresh=!1,this.appCheck=null,this.qe=null,this.$e=null,ut(e)&&e.settings.appCheckToken&&(this.$e=e.settings.appCheckToken)}start(e,t){D(this.xe===void 0,3512);const n=i=>{i.error!=null&&N("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.qe;return this.qe=i.token,N("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.xe=i=>{e.enqueueRetryable((()=>n(i)))};const s=i=>{N("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.xe&&this.appCheck.addTokenListener(this.xe)};this.ke.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.ke.getImmediate({optional:!0});i?s(i):N("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.$e)return Promise.resolve(new cd(this.$e));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(D(typeof t.token=="string",44558,{tokenResult:t}),this.qe=t.token,new cd(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.xe&&this.appCheck.removeTokenListener(this.xe),this.xe=void 0}}function ep(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mw{Ke(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ld="ConnectivityMonitor";class hd{constructor(){this.Qe=()=>this.We(),this.Ge=()=>this.ze(),this.je=[],this.He()}Ke(e){this.je.push(e)}shutdown(){window.removeEventListener("online",this.Qe),window.removeEventListener("offline",this.Ge)}He(){window.addEventListener("online",this.Qe),window.addEventListener("offline",this.Ge)}We(){N(ld,"Network connectivity changed: AVAILABLE");for(const e of this.je)e(0)}ze(){N(ld,"Network connectivity changed: UNAVAILABLE");for(const e of this.je)e(1)}static Je(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Yi=null;function xu(){return Yi===null?Yi=(function(){return 268435456+Math.round(2147483648*Math.random())})():Yi++,"0x"+Yi.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ru="RestConnection",Fw={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class Uw{get Ye(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Ze=t+"://"+e.host,this.Xe=`projects/${n}/databases/${s}`,this.et=this.databaseId.database===Js?`project_id=${n}`:`project_id=${n}&database_id=${s}`}tt(e,t,n,s,i){const o=xu(),u=this.nt(e,t.toUriEncodedString());N(ru,`Sending RPC '${e}' ${o}:`,u,n);const c={"google-cloud-resource-prefix":this.Xe,"x-goog-request-params":this.et};this.rt(c,s,i);const{host:h}=new URL(u),f=Jr(h);return this.it(e,u,c,n,f).then((m=>(N(ru,`Received RPC '${e}' ${o}: `,m),m)),(m=>{throw it(ru,`RPC '${e}' ${o} failed with error: `,m,"url: ",u,"request:",n),m}))}st(e,t,n,s,i,o){return this.tt(e,t,n,s,i)}rt(e,t,n){if(e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Zr})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),n&&n.headers.forEach(((s,i)=>e[i]=s)),this.databaseInfo._customHeaders)for(const s of Object.keys(this.databaseInfo._customHeaders))e[s]=this.databaseInfo._customHeaders[s]}nt(e,t){const n=Fw[e];let s=`${this.Ze}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bw{constructor(e){this._t=e._t,this.ot=e.ot}ut(e){this.ct=e}lt(e){this.Et=e}ht(e){this.Tt=e}onMessage(e){this.Pt=e}close(){this.ot()}send(e){this._t(e)}Rt(){this.ct()}It(){this.Et()}At(e){this.Tt(e)}Vt(e){this.Pt(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const De="WebChannelConnection",As=(r,e,t)=>{r.listen(e,(n=>{try{t(n)}catch(s){setTimeout((()=>{throw s}),0)}}))};class br extends Uw{constructor(e){super(e),this.dt=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static ft(){if(!br.gt){const e=em();As(e,Zf.STAT_EVENT,(t=>{t.stat===yu.PROXY?N(De,"STAT_EVENT: detected buffering proxy"):t.stat===yu.NOPROXY&&N(De,"STAT_EVENT: detected no buffering proxy")})),br.gt=!0}}it(e,t,n,s,i){const o=xu();return new Promise(((u,c)=>{const h=new Yf;h.setWithCredentials(!0),h.listenOnce(Xf.COMPLETE,(()=>{try{switch(h.getLastErrorCode()){case ao.NO_ERROR:const m=h.getResponseJson();N(De,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(m)),u(m);break;case ao.TIMEOUT:N(De,`RPC '${e}' ${o} timed out`),c(new O(x.DEADLINE_EXCEEDED,"Request time out"));break;case ao.HTTP_ERROR:const _=h.getStatus();if(N(De,`RPC '${e}' ${o} failed with status:`,_,"response text:",h.getResponseText()),_>0){let R=h.getResponseJson();Array.isArray(R)&&(R=R[0]);const C=R==null?void 0:R.error;if(C&&C.status&&C.message){const U=(function(z){const W=z.toLowerCase().replace(/_/g,"-");return Object.values(x).indexOf(W)>=0?W:x.UNKNOWN})(C.status);c(new O(U,C.message))}else c(new O(x.UNKNOWN,"Server responded with status "+h.getStatus()))}else c(new O(x.UNAVAILABLE,"Connection failed."));break;default:B(9055,{yt:e,streamId:o,wt:h.getLastErrorCode(),bt:h.getLastError()})}}finally{N(De,`RPC '${e}' ${o} completed.`)}}));const f=JSON.stringify(s);N(De,`RPC '${e}' ${o} sending request:`,s),h.send(t,"POST",f,n,15)}))}St(e,t,n){const s=xu(),i=[this.Ze,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;c!==void 0&&(u.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(u.useFetchStreams=!0),this.rt(u.initMessageHeaders,t,n),u.encodeInitMessageHeaders=!0;const h=i.join("");N(De,`Creating RPC '${e}' stream ${s}: ${h}`,u);const f=o.createWebChannel(h,u);this.vt(f);let m=!1,_=!1;const R=new Bw({_t:C=>{_?N(De,`Not sending because RPC '${e}' stream ${s} is closed:`,C):(m||(N(De,`Opening RPC '${e}' stream ${s} transport.`),f.open(),m=!0),N(De,`RPC '${e}' stream ${s} sending:`,C),f.send(C))},ot:()=>f.close()});return As(f,Vs.EventType.OPEN,(()=>{_||(N(De,`RPC '${e}' stream ${s} transport opened.`),R.Rt())})),As(f,Vs.EventType.CLOSE,(()=>{_||(_=!0,N(De,`RPC '${e}' stream ${s} transport closed`),R.At(),this.Dt(f))})),As(f,Vs.EventType.ERROR,(C=>{_||(_=!0,it(De,`RPC '${e}' stream ${s} transport errored. Name:`,C.name,"Message:",C.message),R.At(new O(x.UNAVAILABLE,"The operation could not be completed")))})),As(f,Vs.EventType.MESSAGE,(C=>{var U;if(!_){const L=C.data[0];D(!!L,16349);const z=L,W=(z==null?void 0:z.error)||((U=z[0])==null?void 0:U.error);if(W){N(De,`RPC '${e}' stream ${s} received error:`,W);const H=W.status;let ce=(function(w){const g=ge[w];if(g!==void 0)return Dm(g)})(H),te=W.message;H==="NOT_FOUND"&&te.includes("database")&&te.includes("does not exist")&&te.includes(this.databaseId.database)&&it(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),ce===void 0&&(ce=x.INTERNAL,te="Unknown error status: "+H+" with message "+W.message),_=!0,R.At(new O(ce,te)),f.close()}else N(De,`RPC '${e}' stream ${s} received:`,L),R.Vt(L)}})),br.ft(),setTimeout((()=>{R.It()}),0),R}terminate(){this.dt.forEach((e=>e.close())),this.dt=[]}vt(e){this.dt.push(e)}Dt(e){this.dt=this.dt.filter((t=>t===e))}rt(e,t,n){super.rt(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return tm()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qw(r){return new br(r)}br.gt=!1;class tp{constructor(e,t,n=1e3,s=1.5,i=6e4){this.xt=e,this.timerId=t,this.Ct=n,this.Ft=s,this.Ot=i,this.Mt=0,this.Nt=null,this.Lt=Date.now(),this.reset()}reset(){this.Mt=0}Bt(){this.Mt=this.Ot}Ut(e){this.cancel();const t=Math.floor(this.Mt+this.kt()),n=Math.max(0,Date.now()-this.Lt),s=Math.max(0,t-n);s>0&&N("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Mt} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.Nt=this.xt.enqueueAfterDelay(this.timerId,s,(()=>(this.Lt=Date.now(),e()))),this.Mt*=this.Ft,this.Mt<this.Ct&&(this.Mt=this.Ct),this.Mt>this.Ot&&(this.Mt=this.Ot)}qt(){this.Nt!==null&&(this.Nt.skipDelay(),this.Nt=null)}cancel(){this.Nt!==null&&(this.Nt.cancel(),this.Nt=null)}kt(){return(Math.random()-.5)*this.Mt}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dd="PersistentStream";class np{constructor(e,t,n,s,i,o,u,c){this.xt=e,this.$t=n,this.Kt=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=u,this.listener=c,this.state=0,this.Qt=0,this.Wt=null,this.Gt=null,this.stream=null,this.zt=0,this.jt=new tp(e,t)}Ht(){return this.state===1||this.state===5||this.Jt()}Jt(){return this.state===2||this.state===3}start(){this.zt=0,this.state!==4?this.auth():this.Yt()}async stop(){this.Ht()&&await this.close(0)}Zt(){this.state=0,this.jt.reset()}Xt(){this.Jt()&&this.Wt===null&&(this.Wt=this.xt.enqueueAfterDelay(this.$t,6e4,(()=>this.en())))}tn(e){this.nn(),this.stream.send(e)}async en(){if(this.Jt())return this.close(0)}nn(){this.Wt&&(this.Wt.cancel(),this.Wt=null)}rn(){this.Gt&&(this.Gt.cancel(),this.Gt=null)}async close(e,t){this.nn(),this.rn(),this.jt.cancel(),this.Qt++,e!==4?this.jt.reset():t&&t.code===x.RESOURCE_EXHAUSTED?(pe(t.toString()),pe("Using maximum backoff delay to prevent overloading the backend."),this.jt.Bt()):t&&t.code===x.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.sn(),this.stream.close(),this.stream=null),this.state=e,await this.listener.ht(t)}sn(){}auth(){this.state=1;const e=this._n(this.Qt),t=this.Qt;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.Qt===t&&this.an(n,s)}),(n=>{e((()=>{const s=new O(x.UNKNOWN,"Fetching auth token failed: "+n.message);return this.un(s)}))}))}an(e,t){const n=this._n(this.Qt);this.stream=this.cn(e,t),this.stream.ut((()=>{n((()=>this.listener.ut()))})),this.stream.lt((()=>{n((()=>(this.state=2,this.Gt=this.xt.enqueueAfterDelay(this.Kt,1e4,(()=>(this.Jt()&&(this.state=3),Promise.resolve()))),this.listener.lt())))})),this.stream.ht((s=>{n((()=>this.un(s)))})),this.stream.onMessage((s=>{n((()=>++this.zt==1?this.En(s):this.onNext(s)))}))}Yt(){this.state=5,this.jt.Ut((async()=>{this.state=0,this.start()}))}un(e){return N(dd,`close with error: ${e}`),this.stream=null,this.close(4,e)}_n(e){return t=>{this.xt.enqueueAndForget((()=>this.Qt===e?t():(N(dd,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class jw extends np{constructor(e,t,n,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}cn(e,t){return this.connection.St("Listen",e,t)}En(e){return this.onNext(e)}onNext(e){this.jt.reset();const t=vw(this.serializer,e),n=(function(i){if(!("targetChange"in i))return j.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?j.min():o.readTime?$e(o.readTime):j.min()})(e);return this.listener.hn(t,n)}Tn(e){const t={};t.database=Vu(this.serializer),t.addTarget=(function(i,o){let u;const c=o.target;if(u=Rt(c)?{pipelineQuery:Wm(i,c)}:Tc(c)?{documents:zm(i,c)}:{query:Km(i,c).be},u.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){u.resumeToken=Um(i,o.resumeToken);const h=bu(i,o.expectedCount);h!==null&&(u.expectedCount=h)}else if(o.snapshotVersion.compareTo(j.min())>0){u.readTime=Br(i,o.snapshotVersion.toTimestamp());const h=bu(i,o.expectedCount);h!==null&&(u.expectedCount=h)}return u})(this.serializer,e);const n=Pw(this.serializer,e);n&&(t.labels=n),this.tn(t)}Pn(e){const t={};t.database=Vu(this.serializer),t.removeTarget=e,this.tn(t)}}class $w extends np{constructor(e,t,n,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}get Rn(){return this.zt>0}start(){this.lastStreamToken=void 0,super.start()}sn(){this.Rn&&this.In([])}cn(e,t){return this.connection.St("Write",e,t)}En(e){return D(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,D(!e.writeResults||e.writeResults.length===0,55816),this.listener.An()}onNext(e){D(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.jt.reset();const t=Aw(e.writeResults,e.commitTime),n=$e(e.commitTime);return this.listener.Vn(n,t)}dn(){const e={};e.database=Vu(this.serializer),this.tn(e)}In(e){const t={streamToken:this.lastStreamToken,writes:e.map((n=>Do(this.serializer,n)))};this.tn(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zw{}class Kw extends zw{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.fn=!1}mn(){if(this.fn)throw new O(x.FAILED_PRECONDITION,"The client has already been terminated.")}tt(e,t,n,s){return this.mn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.tt(e,Su(t,n),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===x.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new O(x.UNKNOWN,i.toString())}))}st(e,t,n,s,i){return this.mn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,u])=>this.connection.st(e,Su(t,n),s,o,u,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===x.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new O(x.UNKNOWN,o.toString())}))}terminate(){this.fn=!0,this.connection.terminate()}}function Gw(r,e,t,n){return new Kw(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ww="ComponentProvider",fd=new Map;function Hw(r,e,t,n,s){return new FT(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,ep(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n,s._customHeaders,s.grpcFlowControlWindow)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const md={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},rp=41943040;class ke{static withCacheSize(e){return new ke(e,ke.DEFAULT_COLLECTION_PERCENTILE,ke.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}ke.DEFAULT_COLLECTION_PERCENTILE=10,ke.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,ke.DEFAULT=new ke(rp,ke.DEFAULT_COLLECTION_PERCENTILE,ke.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),ke.DISABLED=new ke(-1,0,0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ge{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.pn(n),this.gn=n=>t.writeSequenceNumber(n))}pn(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.gn&&this.gn(e),e}}Ge.yn=-1;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sp="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class ip{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function En(r){if(r.code!==x.FAILED_PRECONDITION||r.message!==sp)throw r;N("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&B(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new A(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof A?t:A.resolve(t)}catch(t){return A.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):A.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):A.reject(t)}static resolve(e){return new A(((t,n)=>{t(e)}))}static reject(e){return new A(((t,n)=>{n(e)}))}static waitFor(e){return new A(((t,n)=>{let s=0,i=0,o=!1;e.forEach((u=>{++s,u.next((()=>{++i,o&&i===s&&t()}),(c=>n(c)))})),o=!0,i===s&&t()}))}static or(e){let t=A.resolve(!1);for(const n of e)t=t.next((s=>s?A.resolve(s):n()));return t}static forEach(e,t){const n=[];return e.forEach(((s,i)=>{n.push(t.call(this,s,i))})),this.waitFor(n)}static mapArray(e,t){return new A(((n,s)=>{const i=e.length,o=new Array(i);let u=0;for(let c=0;c<i;c++){const h=c;t(e[h]).next((f=>{o[h]=f,++u,u===i&&n(o)}),(f=>s(f)))}}))}static doWhile(e,t){return new A(((n,s)=>{const i=()=>{e()===!0?t().next((()=>{i()}),s):n()};i()}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe="SimpleDb";class ca{static open(e,t,n,s){try{return new ca(t,e.transaction(s,n))}catch(i){throw new Bs(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.wn=new Ct,this.transaction.oncomplete=()=>{this.wn.resolve()},this.transaction.onabort=()=>{t.error?this.wn.reject(new Bs(e,t.error)):this.wn.resolve()},this.transaction.onerror=n=>{const s=bc(n.target.error);this.wn.reject(new Bs(e,s))}}get bn(){return this.wn.promise}abort(e){e&&this.wn.reject(e),this.aborted||(N(Xe,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}Sn(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new Jw(t)}}class cn{static delete(e){return N(Xe,"Removing database:",e),On(af().indexedDB.deleteDatabase(e)).toPromise()}static Je(){if(!mf())return!1;if(cn.vn())return!0;const e=ve(),t=cn.Dn(e),n=0<t&&t<10,s=op(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||i)}static vn(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static xn(e,t){return e.store(t)}static Dn(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.Cn=n,this.Fn=null,cn.Dn(ve())===12.2&&pe("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async On(e){return this.db||(N(Xe,"Opening database:",this.name),this.db=await new Promise(((t,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{n(new Bs(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?n(new O(x.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?n(new O(x.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):n(new Bs(e,o))},s.onupgradeneeded=i=>{N(Xe,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.Cn.Mn(o,s.transaction,i.oldVersion,this.version).next((()=>{N(Xe,"Database upgrade to version "+this.version+" complete")}))}}))),this.Nn&&(this.db.onversionchange=t=>this.Nn(t)),this.db}Ln(e){this.Nn=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.On(e);const u=ca.open(this.db,e,i?"readonly":"readwrite",n),c=s(u).next((h=>(u.Sn(),h))).catch((h=>(u.abort(h),A.reject(h)))).toPromise();return c.catch((()=>{})),await u.bn,c}catch(u){const c=u,h=c.name!=="FirebaseError"&&o<3;if(N(Xe,"Transaction failed with error:",c.message,"Retrying:",h),this.close(),!h)return Promise.reject(c)}}}close(){this.db&&this.db.close(),this.db=void 0}}function op(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class Qw{constructor(e){this.Bn=e,this.Un=!1,this.kn=null}get isDone(){return this.Un}get qn(){return this.kn}set cursor(e){this.Bn=e}done(){this.Un=!0}$n(e){this.kn=e}delete(){return On(this.Bn.delete())}}class Bs extends O{constructor(e,t){super(x.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function vn(r){return r.name==="IndexedDbTransactionError"}class Jw{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(N(Xe,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(N(Xe,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),On(n)}add(e){return N(Xe,"ADD",this.store.name,e,e),On(this.store.add(e))}get(e){return On(this.store.get(e)).next((t=>(t===void 0&&(t=null),N(Xe,"GET",this.store.name,e,t),t)))}delete(e){return N(Xe,"DELETE",this.store.name,e),On(this.store.delete(e))}count(){return N(Xe,"COUNT",this.store.name),On(this.store.count())}Kn(e,t){const n=this.options(e,t),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new A(((o,u)=>{i.onerror=c=>{u(c.target.error)},i.onsuccess=c=>{o(c.target.result)}}))}{const i=this.cursor(n),o=[];return this.Qn(i,((u,c)=>{o.push(c)})).next((()=>o))}}Wn(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new A(((s,i)=>{n.onerror=o=>{i(o.target.error)},n.onsuccess=o=>{s(o.target.result)}}))}Gn(e,t){N(Xe,"DELETE ALL",this.store.name);const n=this.options(e,t);n.zn=!1;const s=this.cursor(n);return this.Qn(s,((i,o,u)=>u.delete()))}jn(e,t){let n;t?n=e:(n={},t=e);const s=this.cursor(n);return this.Qn(s,t)}Hn(e){const t=this.cursor({});return new A(((n,s)=>{t.onerror=i=>{const o=bc(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next((u=>{u?o.continue():n()})):n()}}))}Qn(e,t){const n=[];return new A(((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const u=o.target.result;if(!u)return void s();const c=new Qw(u),h=t(u.primaryKey,u.value,c);if(h instanceof A){const f=h.catch((m=>(c.done(),A.reject(m))));n.push(f)}c.isDone?s():c.qn===null?u.continue():u.continue(c.qn)}})).next((()=>A.waitFor(n)))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.zn?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function On(r){return new A(((e,t)=>{r.onsuccess=n=>{const s=n.target.result;e(s)},r.onerror=n=>{const s=bc(n.target.error);t(s)}}))}let pd=!1;function bc(r){const e=cn.Dn(ve());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new O("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return pd||(pd=!0,setTimeout((()=>{throw n}),0)),n}}return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gd="LruGarbageCollector",ap=1048576;function _d([r,e],[t,n]){const s=G(r,t);return s===0?G(e,n):s}class Yw{constructor(e){this.Jn=e,this.buffer=new re(_d),this.Yn=0}Zn(){return++this.Yn}Xn(e){const t=[e,this.Zn()];if(this.buffer.size<this.Jn)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();_d(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class up{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.er=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.tr(6e4)}stop(){this.er&&(this.er.cancel(),this.er=null)}get started(){return this.er!==null}tr(e){N(gd,`Garbage collection scheduled in ${e}ms`),this.er=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.er=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){vn(t)?N(gd,"Ignoring IndexedDB error during garbage collection: ",t):await En(t)}await this.tr(3e5)}))}}class Xw{constructor(e,t){this.nr=e,this.params=t}calculateTargetCount(e,t){return this.nr.rr(e).next((n=>Math.floor(t/100*n)))}nthSequenceNumber(e,t){if(t===0)return A.resolve(Ge.yn);const n=new Yw(t);return this.nr.forEachTarget(e,(s=>n.Xn(s.sequenceNumber))).next((()=>this.nr.ir(e,(s=>n.Xn(s))))).next((()=>n.maxValue))}removeTargets(e,t,n){return this.nr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.nr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(N("LruGarbageCollector","Garbage collection skipped; disabled"),A.resolve(md)):this.getCacheSize(e).next((n=>n<this.params.cacheSizeCollectionThreshold?(N("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),md):this.sr(e,t)))}getCacheSize(e){return this.nr.getCacheSize(e)}sr(e,t){let n,s,i,o,u,c,h;const f=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((m=>(m>this.params.maximumSequenceNumbersToCollect?(N("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${m}`),s=this.params.maximumSequenceNumbersToCollect):s=m,o=Date.now(),this.nthSequenceNumber(e,s)))).next((m=>(n=m,u=Date.now(),this.removeTargets(e,n,t)))).next((m=>(i=m,c=Date.now(),this.removeOrphanedDocuments(e,n)))).next((m=>(h=Date.now(),Ir()<=Y.DEBUG&&N("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-f}ms
	Determined least recently used ${s} in `+(u-o)+`ms
	Removed ${i} targets in `+(c-u)+`ms
	Removed ${m} documents in `+(h-c)+`ms
Total Duration: ${h-f}ms`),A.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:m}))))}}function cp(r,e){return new Xw(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lp="firestore.googleapis.com",yd=!0;class Id{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new O(x.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=lp,this.ssl=yd}else this.host=e.host,this.ssl=e.ssl??yd;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e._customHeaders&&(this._customHeaders={...e._customHeaders}),e.cacheSizeBytes===void 0)this.cacheSizeBytes=rp;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<ap)throw new O(x.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}if(LT("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=ep(e.experimentalLongPollingOptions??{}),(function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new O(x.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new O(x.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new O(x.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams,e.grpcFlowControlWindow!==void 0){if(typeof e.grpcFlowControlWindow!="number"||e.grpcFlowControlWindow<=0||e.grpcFlowControlWindow>2147483647||!Number.isInteger(e.grpcFlowControlWindow))throw new O(x.INVALID_ARGUMENT,"grpcFlowControlWindow must be a positive integer and cannot exceed 2147483647");this.grpcFlowControlWindow=e.grpcFlowControlWindow}}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams&&this.grpcFlowControlWindow===e.grpcFlowControlWindow&&(function(n,s){if(n===s)return!0;if(!n||!s)return!1;const i=Object.keys(n),o=Object.keys(s);if(i.length!==o.length)return!1;for(const u of i)if(n[u]!==s[u])return!1;return!0})(this._customHeaders,e._customHeaders)}}let la=class{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Id({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new O(x.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new O(x.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Id(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new xw;switch(n.type){case"firstParty":return new Ow(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new O(x.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const n=fd.get(t);n&&(N(Ww,"Removing Datastore"),fd.delete(t),n.terminate())})(this),Promise.resolve()}};function Zw(r,e,t,n={}){var h;r=un(r,la);const s=Jr(e),i=r._getSettings(),o={...i,emulatorOptions:r._getEmulatorOptions()},u=`${e}:${t}`;s&&Ju(`https://${u}`),i.host!==lp&&i.host!==u&&it("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const c={...i,host:u,ssl:s,emulatorOptions:n};if(!dn(c,o)&&(r._setSettings(c),n.mockUserToken)){let f,m;if(typeof n.mockUserToken=="string")f=n.mockUserToken,m=be.MOCK_USER;else{f=w_(n.mockUserToken,(h=r._app)==null?void 0:h.options.projectId);const _=n.mockUserToken.sub||n.mockUserToken.user_id;if(!_)throw new O(x.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");m=new be(_)}r._authCredentials=new Nw(new Zm(f,m))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ai{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new Ai(this.firestore,e,this._query)}}class we{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new ln(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new we(this.firestore,e,this._key)}toJSON(){return{type:we._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(Ti(t,we._jsonSchema))return new we(e,n||null,new F(X.fromString(t.referencePath)))}}we._jsonSchemaVersion="firestore/documentReference/1.0",we._jsonSchema={type:_e("string",we._jsonSchemaVersion),referencePath:_e("string")};class ln extends Ai{constructor(e,t,n){super(e,t,ia(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new we(this.firestore,null,new F(e))}withConverter(e){return new ln(this.firestore,e,this._path)}}function ZP(r,e,...t){if(r=Fe(r),im("collection","path",e),r instanceof la){const n=X.fromString(e,...t);return jh(n),new ln(r,null,n)}{if(!(r instanceof we||r instanceof ln))throw new O(x.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(X.fromString(e,...t));return jh(n),new ln(r.firestore,null,n)}}function eR(r,e,...t){if(r=Fe(r),arguments.length===1&&(e=cc.newId()),im("doc","path",e),r instanceof la){const n=X.fromString(e,...t);return qh(n),new we(r,null,new F(n))}{if(!(r instanceof we||r instanceof ln))throw new O(x.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(X.fromString(e,...t));return qh(n),new we(r.firestore,r instanceof ln?r.converter:null,new F(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class We{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:We._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Ti(e,We._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new We(e.vectorValues);throw new O(x.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}We._jsonSchemaVersion="firestore/vectorValue/1.0",We._jsonSchema={type:_e("string",We._jsonSchemaVersion),vectorValues:_e("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eE=/^__.*__$/;class tE{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new Bt(e,this.data,this.fieldMask,t,this.fieldTransforms):new es(e,this.data,t,this.fieldTransforms)}}class hp{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Bt(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function dp(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw B(40011,{dataSource:r})}}class Sc{constructor(e,t,n,s,i,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new Sc({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return ko(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if(dp(this.dataSource)&&eE.test(e))throw this.createError('Document fields cannot begin and end with "__"')}}class nE{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||aa(e)}createContext(e,t,n,s=!1){return new Sc({dataSource:e,methodName:t,targetDoc:n,path:Ee.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function rE(r){const e=r._freezeSettings(),t=aa(r._databaseId);return new nE(r._databaseId,!!e.ignoreUndefinedProperties,t)}function sE(r,e,t,n,s,i={}){const o=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);Vc("Data must be an object, but it was:",o,n);const u=fp(n,o);let c,h;if(i.merge)c=new Ke(o.fieldMask),h=o.fieldTransforms;else if(i.mergeFields){const f=[];for(const m of i.mergeFields){const _=nr(e,m,t);if(!o.contains(_))throw new O(x.INVALID_ARGUMENT,`Field '${_}' is specified in your field mask but missing from your input data.`);gp(f,_)||f.push(_)}c=new Ke(f),h=o.fieldTransforms.filter((m=>c.covers(m.field)))}else c=null,h=o.fieldTransforms;return new tE(new Ce(u),c,h)}class ha extends Rc{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof ha}}function iE(r,e,t,n){const s=r.createContext(1,e,t);Vc("Data must be an object, but it was:",s,n);const i=[],o=Ce.empty();wn(n,((c,h)=>{const f=pp(e,c,t);h=Fe(h);const m=s.childContextForFieldPath(f);if(h instanceof ha)i.push(f);else{const _=tr(h,m);_!=null&&(i.push(f),o.set(f,_))}}));const u=new Ke(i);return new hp(o,u,s.fieldTransforms)}function oE(r,e,t,n,s,i){const o=r.createContext(1,e,t),u=[nr(e,n,t)],c=[s];if(i.length%2!=0)throw new O(x.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let _=0;_<i.length;_+=2)u.push(nr(e,i[_])),c.push(i[_+1]);const h=[],f=Ce.empty();for(let _=u.length-1;_>=0;--_)if(!gp(h,u[_])){const R=u[_];let C=c[_];C=Fe(C);const U=o.childContextForFieldPath(R);if(C instanceof ha)h.push(R);else{const L=tr(C,U);L!=null&&(h.push(R),f.set(R,L))}}const m=new Ke(h);return new hp(f,m,o.fieldTransforms)}function tr(r,e,t){if(mp(r=Fe(r)))return Vc("Unsupported field value:",e,r),fp(r,e);if(r instanceof Rc)return(function(s,i){if(!dp(i.dataSource))throw i.createError(`${s._methodName}() can only be used with update() and set()`);if(!i.path)throw i.createError(`${s._methodName}() is not currently supported inside arrays`);const o=s._toFieldTransform(i);o&&i.fieldTransforms.push(o)})(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return(function(s,i){const o=[];let u=0;for(const c of s){let h=tr(c,i.childContextForArray(u));h==null&&(h={nullValue:"NULL_VALUE"}),o.push(h),u++}return{arrayValue:{values:o}}})(r,e)}return(function(s,i,o){if((s=Fe(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return pc(i.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const u=se.fromDate(s);return{timestampValue:Br(i.serializer,u)}}if(s instanceof se){const u=new se(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:Br(i.serializer,u)}}if(s instanceof Et)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof st)return{bytesValue:Um(i.serializer,s._byteString)};if(s instanceof we){const u=i.databaseId,c=s.firestore._databaseId;if(!c.isEqual(u))throw i.createError(`Document reference is for database ${c.projectId}/${c.database} but should be for database ${u.projectId}/${u.database}`);return{referenceValue:Pc(s.firestore._databaseId||i.databaseId,s._key.path)}}if(s instanceof We)return(function(c,h){const f=c instanceof We?c.toArray():c;return{mapValue:{fields:{[hc]:{stringValue:dc},[Zn]:{arrayValue:{values:f.map((_=>{if(typeof _!="number")throw h.createError("VectorValues must only contain numeric values.");return ta(h.serializer,_)}))}}}}}})(s,i);if(Ym(s))return s._toProto(i.serializer);throw i.createError(`Unsupported field value: ${lc(s)}`)})(r,e)}function fp(r,e){const t={};return sm(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):wn(r,((n,s)=>{const i=tr(s,e.childContextForField(n));i!=null&&(t[n]=i)})),{mapValue:{fields:t}}}function mp(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof se||r instanceof Et||r instanceof st||r instanceof we||r instanceof Rc||r instanceof We||Ym(r))}function Vc(r,e,t){if(!mp(t)||!Ii(t)){const n=lc(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function nr(r,e,t){if((e=Fe(e))instanceof ua)return e._internalPath;if(typeof e=="string")return pp(r,e);throw ko("Field path arguments must be of type string or ",r,!1,void 0,t)}const aE=new RegExp("[~\\*/\\[\\]]");function pp(r,e,t){if(e.search(aE)>=0)throw ko(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new ua(...e.split("."))._internalPath}catch{throw ko(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function ko(r,e,t,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let u=`Function ${e}() called with invalid data`;t&&(u+=" (via `toFirestore()`)"),u+=". ";let c="";return(i||o)&&(c+=" (found",i&&(c+=` in field ${n}`),o&&(c+=` in document ${s}`),c+=")"),new O(x.INVALID_ARGUMENT,u+r+c)}function gp(r,e){return r.some((t=>t.isEqual(e)))}function _p(r){return typeof r._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Be{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){const n=Ce.empty();for(const s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){const i=this.optionDefinitions[s];if(s in e){const o=e[s];let u;i.nestedOptions&&Ii(o)?u={mapValue:{fields:new Be(i.nestedOptions).getOptionsProto(t,o)}}:o&&(u=tr(o,t)??void 0),u&&n.set(Ee.fromServerFormat(i.serverName),u)}}return n}getOptionsProto(e,t,n){const s=this._getKnownOptions(t,e);if(n){const i=new Map(OT(n,((o,u)=>[Ee.fromServerFormat(u),o!==void 0?tr(o,e):null])));s.setAll(i)}return s.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uE(r){return typeof r=="object"&&r!==null&&!!("nullValue"in r&&(r.nullValue===null||r.nullValue==="NULL_VALUE")||"booleanValue"in r&&(r.booleanValue===null||typeof r.booleanValue=="boolean")||"integerValue"in r&&(r.integerValue===null||typeof r.integerValue=="number"||typeof r.integerValue=="string")||"doubleValue"in r&&(r.doubleValue===null||typeof r.doubleValue=="number")||"timestampValue"in r&&(r.timestampValue===null||(function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")})(r.timestampValue))||"stringValue"in r&&(r.stringValue===null||typeof r.stringValue=="string")||"bytesValue"in r&&(r.bytesValue===null||r.bytesValue instanceof Uint8Array)||"referenceValue"in r&&(r.referenceValue===null||typeof r.referenceValue=="string")||"geoPointValue"in r&&(r.geoPointValue===null||(function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")})(r.geoPointValue))||"arrayValue"in r&&(r.arrayValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))})(r.arrayValue))||"mapValue"in r&&(r.mapValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!Ii(t.fields))})(r.mapValue))||"fieldReferenceValue"in r&&(r.fieldReferenceValue===null||typeof r.fieldReferenceValue=="string")||"functionValue"in r&&(r.functionValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))})(r.functionValue))||"pipelineValue"in r&&(r.pipelineValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))})(r.pipelineValue)))}function cE(r){return new We(r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function k(r){let e;return r instanceof ir?r:(e=Ii(r)?mE(r):r instanceof Array?pE(r):yp(r,void 0),e)}function su(r){if(r instanceof ir)return r;if(r instanceof We)return si(r);if(Array.isArray(r))return si(cE(r));throw new Error("Unsupported value: "+typeof r)}function Cc(r){return BT(r)?mo(r):k(r)}class ir{constructor(){this._protoValueType="ProtoValue"}add(e){return new V("add",[this,k(e)],"add")}asBoolean(){if(this instanceof gn)return this;if(this instanceof ar)return new Tp(this);if(this instanceof or)return new fE(this);if(this instanceof V)return new Ip(this);throw new O("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new V("subtract",[this,k(e)],"subtract")}multiply(e){return new V("multiply",[this,k(e)],"multiply")}divide(e){return new V("divide",[this,k(e)],"divide")}mod(e){return new V("mod",[this,k(e)],"mod")}equal(e){return new V("equal",[this,k(e)],"equal").asBoolean()}notEqual(e){return new V("not_equal",[this,k(e)],"notEqual").asBoolean()}lessThan(e){return new V("less_than",[this,k(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new V("less_than_or_equal",[this,k(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new V("greater_than",[this,k(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new V("greater_than_or_equal",[this,k(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){const n=[e,...t].map((s=>k(s)));return new V("array_concat",[this,...n],"arrayConcat")}arrayContains(e){return new V("array_contains",[this,k(e)],"arrayContains").asBoolean()}arrayContainsAll(e){const t=Array.isArray(e)?new xs(e.map(k),"arrayContainsAll"):e;return new V("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){const t=Array.isArray(e)?new xs(e.map(k),"arrayContainsAny"):e;return new V("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new V("array_reverse",[this])}arrayLength(){return new V("array_length",[this],"arrayLength")}equalAny(e){const t=Array.isArray(e)?new xs(e.map(k),"equalAny"):e;return new V("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){const t=Array.isArray(e)?new xs(e.map(k),"notEqualAny"):e;return new V("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new V("exists",[this],"exists").asBoolean()}charLength(){return new V("char_length",[this],"charLength")}like(e){return new V("like",[this,k(e)],"like").asBoolean()}regexContains(e){return new V("regex_contains",[this,k(e)],"regexContains").asBoolean()}regexFind(e){return new V("regex_find",[this,k(e)],"regexFind")}regexFindAll(e){return new V("regex_find_all",[this,k(e)],"regexFindAll")}regexMatch(e){return new V("regex_match",[this,k(e)],"regexMatch").asBoolean()}stringContains(e){return new V("string_contains",[this,k(e)],"stringContains").asBoolean()}startsWith(e){return new V("starts_with",[this,k(e)],"startsWith").asBoolean()}endsWith(e){return new V("ends_with",[this,k(e)],"endsWith").asBoolean()}toLower(){return new V("to_lower",[this],"toLower")}toUpper(){return new V("to_upper",[this],"toUpper")}trim(e){const t=[this];return e&&t.push(k(e)),new V("trim",t,"trim")}ltrim(e){const t=[this];return e&&t.push(k(e)),new V("ltrim",t,"ltrim")}rtrim(e){const t=[this];return e&&t.push(k(e)),new V("rtrim",t,"rtrim")}type(){return new V("type",[this])}isType(e){return new V("is_type",[this,si(e)],"isType").asBoolean()}stringConcat(e,...t){const n=[e,...t].map(k);return new V("string_concat",[this,...n],"stringConcat")}stringIndexOf(e){return new V("string_index_of",[this,k(e)],"stringIndexOf")}stringRepeat(e){return new V("string_repeat",[this,k(e)],"stringRepeat")}stringReplaceAll(e,t){return new V("string_replace_all",[this,k(e),k(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new V("string_replace_one",[this,k(e),k(t)],"stringReplaceOne")}concat(e,...t){const n=[e,...t].map(k);return new V("concat",[this,...n],"concat")}reverse(){return new V("reverse",[this],"reverse")}arrayFilter(e,t){return new V("array_filter",[this,k(e),t],"arrayFilter")}arrayTransform(e,t){return new V("array_transform",[this,k(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,n){return new V("array_transform",[this,k(e),k(t),n],"arrayTransformWithIndex")}arraySlice(e,t){const n=[this,k(e)];return t!==void 0&&n.push(k(t)),new V("array_slice",n,"arraySlice")}arrayFirst(){return new V("array_first",[this],"arrayFirst")}arrayFirstN(e){return new V("array_first_n",[this,k(e)],"arrayFirstN")}arrayLast(){return new V("array_last",[this],"arrayLast")}arrayLastN(e){return new V("array_last_n",[this,k(e)],"arrayLastN")}arrayMaximum(){return new V("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new V("maximum_n",[this,k(e)],"arrayMaximumN")}arrayMinimum(){return new V("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new V("minimum_n",[this,k(e)],"arrayMinimumN")}arrayIndexOf(e){return new V("array_index_of",[this,k(e),k("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new V("array_index_of",[this,k(e),k("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new V("array_index_of_all",[this,k(e)],"arrayIndexOfAll")}byteLength(){return new V("byte_length",[this],"byteLength")}ceil(){return new V("ceil",[this])}floor(){return new V("floor",[this])}abs(){return new V("abs",[this])}exp(){return new V("exp",[this])}mapGet(e){return new V("map_get",[this,si(e)],"mapGet")}mapSet(e,t,...n){const s=[this,k(e),k(t),...n.map(k)];return new V("map_set",s,"mapSet")}mapKeys(){return new V("map_keys",[this],"mapKeys")}mapValues(){return new V("map_values",[this],"mapValues")}mapEntries(){return new V("map_entries",[this],"mapEntries")}getField(e){return new V("get_field",[this,k(e)],"get_field")}count(){return Ye._create("count",[this],"count")}sum(){return Ye._create("sum",[this],"sum")}average(){return Ye._create("average",[this],"average")}minimum(){return Ye._create("minimum",[this],"minimum")}maximum(){return Ye._create("maximum",[this],"maximum")}first(){return Ye._create("first",[this],"first")}last(){return Ye._create("last",[this],"last")}arrayAgg(){return Ye._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return Ye._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return Ye._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){const n=[e,...t];return new V("maximum",[this,...n.map(k)],"logicalMaximum")}logicalMinimum(e,...t){const n=[e,...t];return new V("minimum",[this,...n.map(k)],"minimum")}vectorLength(){return new V("vector_length",[this],"vectorLength")}cosineDistance(e){return new V("cosine_distance",[this,su(e)],"cosineDistance")}dotProduct(e){return new V("dot_product",[this,su(e)],"dotProduct")}euclideanDistance(e){return new V("euclidean_distance",[this,su(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new V("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new V("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new V("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new V("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new V("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new V("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new V("timestamp_add",[this,k(e),k(t)],"timestampAdd")}timestampSubtract(e,t){return new V("timestamp_subtract",[this,k(e),k(t)],"timestampSubtract")}timestampDiff(e,t){return new V("timestamp_diff",[this,Cc(e),k(t)],"timestampDiff")}timestampExtract(e,t){const n=[this,k(e)];return t&&n.push(k(t)),new V("timestamp_extract",n,"timestampExtract")}documentId(){return new V("document_id",[this],"documentId")}parent(){return new V("parent",[this],"parent")}substring(e,t){const n=k(e);return new V("substring",t===void 0?[this,n]:[this,n,k(t)],"substring")}arrayGet(e){return new V("array_get",[this,k(e)],"arrayGet")}isError(){return new V("is_error",[this],"isError").asBoolean()}ifError(e){const t=new V("if_error",[this,k(e)],"ifError");return e instanceof gn?t.asBoolean():t}isAbsent(){return new V("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new V("map_remove",[this,k(e)],"mapRemove")}mapMerge(e,...t){const n=k(e),s=t.map(k);return new V("map_merge",[this,n,...s],"mapMerge")}pow(e){return new V("pow",[this,k(e)])}trunc(e){return e===void 0?new V("trunc",[this]):new V("trunc",[this,k(e)],"trunc")}round(e){return e===void 0?new V("round",[this]):new V("round",[this,k(e)],"round")}collectionId(){return new V("collection_id",[this])}length(){return new V("length",[this])}ln(){return new V("ln",[this])}sqrt(){return new V("sqrt",[this])}stringReverse(){return new V("string_reverse",[this])}ifAbsent(e){return new V("if_absent",[this,k(e)],"ifAbsent")}ifNull(e){return new V("if_null",[this,k(e)],"ifNull")}coalesce(e,...t){return new V("coalesce",[this,k(e),...t.map(k)],"coalesce")}join(e){return new V("join",[this,k(e)],"join")}log10(){return new V("log10",[this])}arraySum(){return new V("sum",[this])}split(e){return new V("split",[this,k(e)])}timestampTruncate(e,t){const n=[this,k(e)];return t&&n.push(k(t)),new V("timestamp_trunc",n)}ascending(){return gE(this)}descending(){return _E(this)}as(e){return new hE(this,e,"as")}}class Ye{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,n){const s=new Ye(e,t);return s._methodName=n,s}as(e){return new lE(this,e,"as")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map((t=>t._toProto(e)))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e)))}}class lE{constructor(e,t,n){this.aggregate=e,this.alias=t,this._methodName=n}_readUserData(e){this.aggregate._readUserData(e)}}class hE{constructor(e,t,n){this.expr=e,this.alias=t,this._methodName=n,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}}class xs extends ir{constructor(e,t){super(),this.ur=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.ur.map((t=>t._toProto(e)))}}}_readUserData(e){this.ur.forEach((t=>t._readUserData(e)))}}class or extends ir{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new V("geo_distance",[this,k(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}}function mo(r){return dE(r,"field")}function dE(r,e){return new or(typeof r=="string"?pt===r?Cw()._internalPath:nr("field",r):r._internalPath,e)}class ar extends ir{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){const t=new ar(e,void 0);return t._protoValue=e,t}_toProto(e){return D(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,uE(this._protoValue)||(this._protoValue=tr(this.value,e))}}function si(r,e){return yp(r,"constant")}function yp(r,e){const t=new ar(r,e);return typeof r=="boolean"?new Tp(t):t}class V extends ir{constructor(e,t,n,s){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,n!==void 0&&(this._methodName=n),s!==void 0&&(this._options=s)}get _optionsUtil(){return new Be({})}_toProto(e){const t={functionValue:{name:this.name,args:this.params.map((n=>n._toProto(e)))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e))),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}}class gn extends ir{get _methodName(){return this._expr._methodName}countIf(){return Ye._create("count_if",[this],"countIf")}not(){return new V("not",[this],"not").asBoolean()}conditional(e,t){return new V("conditional",[this,e,t],"conditional")}ifError(e){const t=k(e),n=new V("if_error",[this,t],"ifError");return t instanceof gn?n.asBoolean():n}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}}class Ip extends gn{constructor(e){super(),this._expr=e,this.expressionType="Function"}}class Tp extends gn{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class fE extends gn{constructor(e){super(),this._expr=e,this.expressionType="Field"}}function mE(r,e){const t=[];for(const n in r)if(Object.prototype.hasOwnProperty.call(r,n)){const s=r[n];t.push(si(n)),t.push(k(s))}return new V("map",t,"map")}function pE(r){return(function(t,n){return new V("array",t.map((s=>k(s))),n)})(r,"array")}function gE(r){return new xc(Cc(r),"ascending","ascending")}function _E(r){return new xc(Cc(r),"descending","descending")}class xc{constructor(e,t,n){this.expr=e,this.direction=t,this._methodName=n,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:Xm(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nt{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}}class wp extends nt{get _name(){return"add_fields"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[ri(e,this.fields)]}}_readUserData(e){super._readUserData(e),yn(this.fields,e)}}class Ep extends nt{get _name(){return"aggregate"}get _optionsUtil(){return new Be({})}constructor(e,t,n){super(n),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[ri(e,this.accumulators),ri(e,this.groups)]}}_readUserData(e){super._readUserData(e),yn(this.groups,e),yn(this.accumulators,e)}}class vp extends nt{get _name(){return"distinct"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[ri(e,this.groups)]}}_readUserData(e){super._readUserData(e),yn(this.groups,e)}}class Pi extends nt{get _name(){return"collection"}get _optionsUtil(){return new Be({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.Er=e.startsWith("/")?e:"/"+e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.Er}]}}_readUserData(e){super._readUserData(e)}}class Ri extends nt{get _name(){return"collection_group"}get _optionsUtil(){return new Be({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}}class da extends nt{get _name(){return"database"}get _optionsUtil(){return new Be({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}}class fa extends nt{get _name(){return"documents"}get _optionsUtil(){return new Be({})}constructor(e,t){if(super(t),!e||e.length===0)throw new O(x.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const n=e.map((i=>i.startsWith("/")?i:"/"+i)),s=new Set(n);if(s.size!==n.length)throw new O(x.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.hr=n,this.Tr=s}_toProto(e){return{...super._toProto(e),args:this.hr.map((t=>({referenceValue:t})))}}_readUserData(e){super._readUserData(e)}}class bi extends nt{get _name(){return"where"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.condition=e}_toProto(e){return{...super._toProto(e),args:[this.condition._toProto(e)]}}_readUserData(e){super._readUserData(e),yn(this.condition,e)}}class _n extends nt{get _name(){return"limit"}get _optionsUtil(){return new Be({})}constructor(e,t){D(!isNaN(e)&&e!==1/0&&e!==-1/0,34860),super(t),this.limit=e}_toProto(e){return{...super._toProto(e),args:[pc(e,this.limit)]}}}class Td extends nt{get _name(){return"offset"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.offset=e}_toProto(e){return{...super._toProto(e),args:[pc(e,this.offset)]}}}class yE extends nt{get _name(){return"select"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[ri(e,this.selections)]}}_readUserData(e){super._readUserData(e),yn(this.selections,e)}}class _t extends nt{get _name(){return"sort"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map((t=>t._toProto(e)))}}_readUserData(e){super._readUserData(e),yn(this.orderings,e)}}class Nc extends nt{get _name(){return"replace_with"}get _optionsUtil(){return new Be({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),Xm(Nc.Pr)]}}_readUserData(e){super._readUserData(e),yn(this.map,e)}}Nc.Pr="full_replace";function yn(r,e){return _p(r)?r._readUserData(e):Array.isArray(r)?r.forEach((t=>t._readUserData(e))):r instanceof Map?r.forEach((t=>t._readUserData(e))):Object.values(r).forEach((t=>t._readUserData(e))),r}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qs{constructor(e,t,n,s){this._db=e,this.userDataReader=t,this._userDataWriter=n,this.stages=s}Ar(e,t){const n=this.userDataReader.createContext(3,e);return _p(t)?t._readUserData(n):Array.isArray(t)?t.forEach((s=>s._readUserData(n))):t.forEach((s=>s._readUserData(n))),t}where(e){const t=this.stages.map((n=>n));return this.Ar("where",e),t.push(new bi(e,{})),new qs(this._db,this.userDataReader,this._userDataWriter,t)}limit(e){const t=this.stages.map((n=>n));return t.push(new _n(e,{})),new qs(this._db,this.userDataReader,this._userDataWriter,t)}sort(e,...t){const n=this.stages.map((s=>s));return"orderings"in e?n.push(new _t(this.Ar("sort",e.orderings),{})):n.push(new _t(this.Ar("sort",[e,...t]),{})),new qs(this._db,this.userDataReader,this._userDataWriter,n)}Vr(e){return{pipeline:{stages:this.stages.map((t=>t._toProto(e)))}}}}// Copyright 2024 Google LLC* @license
class Oe{constructor(e,t,n){this.serializer=e,this.stages=t,this.listenOptions=n,this.isCorePipeline=!0}getPipelineCollection(){return Si(this)}getPipelineCollectionGroup(){return Dc(this)}getPipelineCollectionId(){return Ap(this)}getPipelineDocuments(){return Oo(this)}getPipelineFlavor(){return(function(t){let n="exact";return t.stages.forEach(((s,i)=>{s._name!==vp.name&&s._name!==Ep.name||(n="keyless"),s._name===yE.name&&n==="exact"&&(n="augmented"),s._name===wp.name&&i<t.stages.length-1&&n==="exact"&&(n="augmented")})),n})(this)}getPipelineSourceType(){return xt(this)}}function xt(r){const e=r.stages[0];return e instanceof Pi||e instanceof Ri||e instanceof da||e instanceof fa?e._name:"unknown"}function Si(r){if(xt(r)==="collection")return r.stages[0].Er}function Dc(r){if(xt(r)==="collection_group")return r.stages[0].collectionId}function Ap(r){switch(xt(r)){case"collection":return X.fromString(Si(r)).lastSegment();case"collection_group":return Dc(r);default:return}}function Oo(r){if(xt(r)==="documents")return r.stages[0].hr}class T{constructor(e,t){this.type=e,this.value=t}static dr(){return new T("ERROR",void 0)}static mr(){return new T("UNSET",void 0)}static pr(){return new T("NULL",wt)}static newValue(e){return Ze(e)?new T("NULL",wt):(function(n){return!!n&&"booleanValue"in n})(e)?new T("BOOLEAN",e):gt(e)?new T("INT",e):Bn(e)?new T("DOUBLE",e):(function(n){return!!n&&"timestampValue"in n&&!!n.timestampValue})(e)?new T("TIMESTAMP",e):(function(n){return!!n&&"stringValue"in n})(e)?new T("STRING",e):(function(n){return!!n&&"bytesValue"in n})(e)?new T("BYTES",e):e.referenceValue?new T("REFERENCE",e):e.geoPointValue?new T("GEO_POINT",e):pn(e)?new T("ARRAY",e):er(e)?new T("VECTOR",e):zn(e)?new T("MAP",e):new T("ERROR",void 0)}gr(){return this.type==="ERROR"||this.type==="UNSET"}yr(){return this.type==="NULL"}}function js(r){if(!r.gr())return r.value}function Pp(r){return r instanceof gn?r._expr:r}function $(r){if((r=Pp(r))instanceof or)return new IE(r);if(r instanceof ar)return new TE(r);if(r instanceof xs)return new wE(r);if(r instanceof V){if(r.name==="add")return new AE(r);if(r.name==="subtract")return new PE(r);if(r.name==="multiply")return new RE(r);if(r.name==="divide")return new bE(r);if(r.name==="mod")return new SE(r);if(r.name==="and")return new VE(r);if(r.name==="equal")return new qE(r);if(r.name==="not_equal")return new jE(r);if(r.name==="less_than")return new $E(r);if(r.name==="less_than_or_equal")return new zE(r);if(r.name==="greater_than")return new KE(r);if(r.name==="greater_than_or_equal")return new GE(r);if(r.name==="array_concat")return new WE(r);if(r.name==="array_reverse")return new HE(r);if(r.name==="array_contains")return new QE(r);if(r.name==="array_contains_all")return new JE(r);if(r.name==="array_contains_any")return new YE(r);if(r.name==="array_length")return new XE(r);if(r.name==="array_element")return new ZE(r);if(r.name==="equal_any")return new Rp(r);if(r.name==="not_equal_any")return new xE(r);if(r.name==="is_nan")return new NE(r);if(r.name==="is_not_nan")return new DE(r);if(r.name==="is_null")return new kE(r);if(r.name==="is_not_null")return new OE(r);if(r.name==="is_error")return new LE(r);if(r.name==="exists")return new ME(r);if(r.name==="not")return new ma(r);if(r.name==="or")return new CE(r);if(r.name==="xor")return new kc(r);if(r.name==="conditional")return new FE(r);if(r.name==="maximum")return new UE(r);if(r.name==="minimum")return new BE(r);if(r.name==="reverse")return new ev(r);if(r.name==="replace_first")return new tv(r);if(r.name==="replace_all")return new nv(r);if(r.name==="char_length")return new rv(r);if(r.name==="byte_length")return new sv(r);if(r.name==="like")return new iv(r);if(r.name==="regex_contains")return new ov(r);if(r.name==="regex_match")return new av(r);if(r.name==="string_contains")return new uv(r);if(r.name==="starts_with")return new cv(r);if(r.name==="ends_with")return new lv(r);if(r.name==="to_lower")return new hv(r);if(r.name==="to_upper")return new dv(r);if(r.name==="trim")return new fv(r);if(r.name==="string_concat")return new mv(r);if(r.name==="map_get")return new pv(r);if(r.name==="cosine_distance")return new gv(r);if(r.name==="dot_product")return new _v(r);if(r.name==="euclidean_distance")return new yv(r);if(r.name==="vector_length")return new Iv(r);if(r.name==="unix_micros_to_timestamp")return new Av(r);if(r.name==="timestamp_to_unix_micros")return new bv(r);if(r.name==="unix_millis_to_timestamp")return new Pv(r);if(r.name==="timestamp_to_unix_millis")return new Sv(r);if(r.name==="unix_seconds_to_timestamp")return new Rv(r);if(r.name==="timestamp_to_unix_seconds")return new Vv(r);if(r.name==="timestamp_add")return new Cv(r);if(r.name==="timestamp_subtract")return new xv(r)}throw new Error(`Unknown Expr : ${r}`)}class IE{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===pt)return T.newValue({referenceValue:ni(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return T.newValue({timestampValue:fo(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return T.newValue({timestampValue:fo(e.serializer,t.createTime)});const n=t.data.field(this.expr._fieldPath);return n?Zo(n)?T.newValue((function(i,o){if(i.serverTimestampBehavior==="estimate")return{timestampValue:fo(i.serializer,j.fromTimestamp(xr(o)))};if(i.serverTimestampBehavior==="previous"){const u=wi(o);if(u)return u}return{nullValue:"NULL_VALUE"}})(e,n)):T.newValue(n):T.mr()}}class TE{constructor(e){this.expr=e}evaluate(e,t){return T.newValue(this.expr._getValue())}}class wE{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.ur.map((s=>$(s).evaluate(e,t)));return n.some((s=>s.gr()))?T.dr():T.newValue({arrayValue:{values:n.map((s=>s.value))}})}}function xe(r){return Bn(r)?Number(r.doubleValue):Number(r.integerValue)}function At(r){return BigInt(r.integerValue)}const EE=BigInt("0x7fffffffffffffff"),vE=-BigInt("0x8000000000000000");class Vi{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length>=2,24778);const n=$(this.expr.params[0]).evaluate(e,t),s=$(this.expr.params[1]).evaluate(e,t);let i=this.wr(n,s);for(const o of this.expr.params.slice(2)){const u=$(o).evaluate(e,t);i=this.wr(i,u)}return i}wr(e,t){if(e.gr()||t.gr())return T.dr();if(e.yr()||t.yr())return T.pr();const n=e.value,s=t.value;if(!Bn(n)&&!gt(n)||!Bn(s)&&!gt(s))return T.dr();if(Bn(n)||Bn(s)){const i=this.br(n,s);return i?T.newValue(i):T.dr()}if(gt(n)&&gt(s)){const i=this.Sr(n,s);return i===void 0?T.dr():typeof i=="number"?T.newValue({doubleValue:i}):i<vE||i>EE?T.dr():T.newValue({integerValue:`${i}`})}return T.dr()}}function Mt(r,e){return ye(r)!==ye(e)?"TYPE_MISMATCH":Qe(r)||Qe(e)?"NOT_EQ":Ze(r)&&Ze(e)?"EQ":Ze(r)||Ze(e)?"NULL":pn(r)&&pn(e)?(function(n,s){var o,u,c;if(((o=n.values)==null?void 0:o.length)!==((u=s.values)==null?void 0:u.length))return"NOT_EQ";let i=!1;for(let h=0;h<(((c=n.values)==null?void 0:c.length)??0);h++){const f=n.values[h],m=s.values[h];switch(Mt(f,m)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":i=!0;break;default:B(44609,{vr:f,Dr:m})}}return i?"NULL":"EQ"})(r.arrayValue,e.arrayValue):er(r)&&er(e)||zn(r)&&zn(e)?(function(n,s){const i=n.fields||{},o=s.fields||{};if(bo(i)!==bo(o))return"NOT_EQ";let u=!1;for(const c in i)if(i.hasOwnProperty(c)){if(o[c]===void 0)return"NOT_EQ";switch(Mt(i[c],o[c])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":u=!0}}return u?"NULL":"EQ"})(r.mapValue,e.mapValue):(function(n,s){return ot(n,s,{o:!1,t:!0,i:!0})})(r,e)?"EQ":"NOT_EQ"}class AE extends Vi{Sr(e,t){return At(e)+At(t)}br(e,t){return{doubleValue:xe(e)+xe(t)}}}class PE extends Vi{constructor(e){super(e),this.expr=e}Sr(e,t){return At(e)-At(t)}br(e,t){return{doubleValue:xe(e)-xe(t)}}}class RE extends Vi{constructor(e){super(e),this.expr=e}Sr(e,t){return At(e)*At(t)}br(e,t){return{doubleValue:xe(e)*xe(t)}}}class bE extends Vi{constructor(e){super(e),this.expr=e}Sr(e,t){const n=At(t);if(n!==BigInt(0))return At(e)/n}br(e,t){const n=xe(t);return n===0?{doubleValue:Nr(n)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:xe(e)/n}}}class SE extends Vi{constructor(e){super(e),this.expr=e}Sr(e,t){const n=At(t);if(n!==BigInt(0))return At(e)%n}br(e,t){const n=xe(t);if(n!==0)return{doubleValue:xe(e)%n}}}class VE{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const u=$(o).evaluate(e,t);switch(u.type){case"BOOLEAN":if(!((i=u.value)!=null&&i.booleanValue))return T.newValue(Se);break;case"NULL":s=!0;break;default:n=!0}}return n?T.dr():s?T.pr():T.newValue(He)}}class ma{constructor(e){this.expr=e}evaluate(e,t){var s;D(this.expr.params.length===1,9634);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return T.newValue({booleanValue:!((s=n.value)!=null&&s.booleanValue)});case"NULL":return T.pr();default:return T.dr()}}}class CE{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const u=$(o).evaluate(e,t);switch(u.type){case"BOOLEAN":if((i=u.value)!=null&&i.booleanValue)return T.newValue(He);break;case"NULL":s=!0;break;default:n=!0}}return n?T.dr():s?T.pr():T.newValue(Se)}}class kc{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const u=$(o).evaluate(e,t);switch(u.type){case"BOOLEAN":n=kc.xor(n,!!((i=u.value)!=null&&i.booleanValue));break;case"NULL":s=!0;break;default:return T.dr()}}return s?T.pr():T.newValue({booleanValue:n})}static xor(e,t){return(e||t)&&!(e&&t)}}class Rp{constructor(e){this.expr=e}evaluate(e,t){var o,u;D(this.expr.params.length===2,55094);let n=!1;const s=$(this.expr.params[0]).evaluate(e,t);switch(s.type){case"NULL":n=!0;break;case"ERROR":case"UNSET":return T.dr()}const i=$(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.dr()}if(n)return T.pr();for(const c of((u=(o=i.value)==null?void 0:o.arrayValue)==null?void 0:u.values)??[])switch(Ze(s.value)&&Ze(c)?"EQ":Mt(s.value,c)){case"EQ":return T.newValue(He);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:B(44608,{value:s.value,candidate:c})}return n?T.pr():T.newValue(Se)}}class xE{constructor(e){this.expr=e}evaluate(e,t){return new ma(new V("not",[new V("equal_any",this.expr.params)])).evaluate(e,t)}}class NE{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length===1,23322);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return T.newValue(Se);case"DOUBLE":return T.newValue({booleanValue:isNaN(xe(n.value))});case"NULL":return T.pr();default:return T.dr()}}}class DE{constructor(e){this.expr=e}evaluate(e,t){return D(this.expr.params.length===1,50406),new ma(new V("not",[new V("is_nan",this.expr.params)])).evaluate(e,t)}}class kE{constructor(e){this.expr=e}evaluate(e,t){switch(D(this.expr.params.length===1,23123),$(this.expr.params[0]).evaluate(e,t).type){case"NULL":return T.newValue(He);case"UNSET":case"ERROR":return T.dr();default:return T.newValue(Se)}}}class OE{constructor(e){this.expr=e}evaluate(e,t){return D(this.expr.params.length===1,23167),new ma(new V("not",[new V("is_null",this.expr.params)])).evaluate(e,t)}}class LE{constructor(e){this.expr=e}evaluate(e,t){return D(this.expr.params.length===1,5228),$(this.expr.params[0]).evaluate(e,t).type==="ERROR"?T.newValue(He):T.newValue(Se)}}class ME{constructor(e){this.expr=e}evaluate(e,t){switch(D(this.expr.params.length===1,6877),$(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return T.dr();case"UNSET":return T.newValue(Se);default:return T.newValue(He)}}}class FE{constructor(e){this.expr=e}evaluate(e,t){var s;D(this.expr.params.length===3,11706);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return(s=n.value)!=null&&s.booleanValue?$(this.expr.params[1]).evaluate(e,t):$(this.expr.params[2]).evaluate(e,t);case"NULL":return $(this.expr.params[2]).evaluate(e,t);default:return T.dr()}}}class UE{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map((i=>$(i).evaluate(e,t)));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Ue(i.value,s.value)>0?i:s}return s===void 0?T.pr():s}}class BE{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map((i=>$(i).evaluate(e,t)));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Ue(i.value,s.value)<0?i:s}return s===void 0?T.pr():s}}class ns{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"ERROR":case"UNSET":return T.dr()}const s=$(this.expr.params[1]).evaluate(e,t);switch(s.type){case"ERROR":case"UNSET":return T.dr()}return this.Cr(n,s)}}class qE extends ns{constructor(e){super(e),this.expr=e}Cr(e,t){if(e.yr()&&t.yr())return T.newValue(He);if(e.yr()||t.yr()||Qe(e.value)||Qe(t.value)||ye(e.value)!==ye(t.value))return T.newValue(Se);switch(Mt(e.value,t.value)){case"EQ":return T.newValue(He);case"NOT_EQ":return T.newValue(Se);case"NULL":return T.pr();default:B(44615,{left:e,right:t})}}}class jE extends ns{constructor(e){super(e),this.expr=e}Cr(e,t){switch(Mt(e.value,t.value)){case"EQ":return T.newValue(Se);case"NOT_EQ":case"TYPE_MISMATCH":return T.newValue(He);case"NULL":return T.pr();default:B(44614,{left:e,right:t})}}}class $E extends ns{constructor(e){super(e),this.expr=e}Cr(e,t){return ye(e.value)!==ye(t.value)||Qe(e.value)||Qe(t.value)?T.newValue(Se):T.newValue({booleanValue:Ue(e.value,t.value)<0})}}class zE extends ns{constructor(e){super(e),this.expr=e}Cr(e,t){return ye(e.value)!==ye(t.value)||Qe(e.value)||Qe(t.value)?T.newValue(Se):Mt(e.value,t.value)==="EQ"?T.newValue(He):T.newValue({booleanValue:Ue(e.value,t.value)<0})}}class KE extends ns{constructor(e){super(e),this.expr=e}Cr(e,t){return ye(e.value)!==ye(t.value)||Qe(e.value)||Qe(t.value)?T.newValue(Se):T.newValue({booleanValue:Ue(e.value,t.value)>0})}}class GE extends ns{constructor(e){super(e),this.expr=e}Cr(e,t){return ye(e.value)!==ye(t.value)||Qe(e.value)||Qe(t.value)?T.newValue(Se):Mt(e.value,t.value)==="EQ"?T.newValue(He):T.newValue({booleanValue:Ue(e.value,t.value)>0})}}class WE{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class HE{constructor(e){this.expr=e}evaluate(e,t){var s;D(this.expr.params.length===1,216);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.pr();case"ARRAY":{const i=((s=n.value.arrayValue)==null?void 0:s.values)??[];return T.newValue({arrayValue:{values:[...i].reverse()}})}default:return T.dr()}}}class QE{constructor(e){this.expr=e}evaluate(e,t){return D(this.expr.params.length===2,52884),new Rp(new V("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}}class JE{constructor(e){this.expr=e}evaluate(e,t){var c,h,f,m;D(this.expr.params.length===2,1392);let n=!1;const s=$(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.dr()}const i=$(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.dr()}if(n)return T.pr();const o=((h=(c=i.value)==null?void 0:c.arrayValue)==null?void 0:h.values)??[],u=((m=(f=s.value)==null?void 0:f.arrayValue)==null?void 0:m.values)??[];for(const _ of o){let R=!1;n=!1;for(const C of u){switch(Ze(_)&&Ze(C)?"EQ":Mt(_,C)){case"EQ":R=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:B(44613,{value:C,search:_})}if(R)break}if(!R)return T.newValue(Se)}return T.newValue(He)}}class YE{constructor(e){this.expr=e}evaluate(e,t){var c,h,f,m;D(this.expr.params.length===2,2680);let n=!1;const s=$(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.dr()}const i=$(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.dr()}if(n)return T.pr();const o=((h=(c=i.value)==null?void 0:c.arrayValue)==null?void 0:h.values)??[],u=((m=(f=s.value)==null?void 0:f.arrayValue)==null?void 0:m.values)??[];for(const _ of u)for(const R of o)switch(Ze(_)&&Ze(R)?"EQ":Mt(_,R)){case"EQ":return T.newValue(He);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:B(60403,{value:_,search:R})}return n?T.pr():T.newValue(Se)}}class XE{constructor(e){this.expr=e}evaluate(e,t){var s,i,o;D(this.expr.params.length===1,38605);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.pr();case"ARRAY":return T.newValue({integerValue:`${((o=(i=(s=n.value)==null?void 0:s.arrayValue)==null?void 0:i.values)==null?void 0:o.length)??0}`});default:return T.dr()}}}class ZE{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class ev{constructor(e){this.expr=e}evaluate(e,t){var s,i;D(this.expr.params.length===1,1508);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.pr();case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;if(typeof o=="string"){const u=he.fromBase64String(o).toUint8Array();return u.reverse(),T.newValue({bytesValue:he.fromUint8Array(u).toBase64()})}return T.newValue({bytesValue:new Uint8Array(o).reverse()})}case"STRING":{const o=(i=n.value)==null?void 0:i.stringValue,u=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(o),c=Array.from(u,(h=>h.segment)).reverse();return T.newValue({stringValue:c.join("")})}default:return T.dr()}}}class tv{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class nv{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class rv{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length===1,19400);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.pr();case"STRING":{const s=(function(o){let u=0;for(let c=0;c<o.length;c++){const h=o.codePointAt(c);if(h===void 0)return;if(h<=65535)if(h>=55296&&h<=57343)if(h<=56319){const f=o.codePointAt(c+1);f!==void 0&&f>=56320&&f<=57343?(u+=1,c++):u+=1}else u+=1;else u+=1;else{if(!(h<=1114111))return;u+=1,c++}}return u})(n.value.stringValue);return s===void 0?T.dr():T.newValue({integerValue:s})}default:return T.dr()}}}class sv{constructor(e){this.expr=e}evaluate(e,t){var s,i;D(this.expr.params.length===1,8486);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;return typeof o=="string"?T.newValue({integerValue:he.fromBase64String(o).toUint8Array().length}):T.newValue({integerValue:new Uint8Array(o).length})}case"STRING":{const o=(function(c){let h=0;for(let f=0;f<c.length;f++){const m=c.codePointAt(f);if(m===void 0)return;if(m>=55296&&m<=57343){if(!(m<=56319))return;{const _=c.codePointAt(f+1);if(_===void 0||!(_>=56320&&_<=57343))return;h+=4,f++}}else if(m<=127)h+=1;else if(m<=2047)h+=2;else if(m<=65535)h+=3;else{if(!(m<=1114111))return;h+=4,f++}}return h})((i=n.value)==null?void 0:i.stringValue);return o===void 0?T.dr():T.newValue({integerValue:o})}case"NULL":return T.pr();default:return T.dr()}}}class rs{constructor(e){this.expr=e}evaluate(e,t){var o,u;D(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let n=!1;const s=$(this.expr.params[0]).evaluate(e,t);switch(s.type){case"STRING":break;case"NULL":n=!0;break;default:return T.dr()}const i=$(this.expr.params[1]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":n=!0;break;default:return T.dr()}return n?T.pr():this.Fr((o=s.value)==null?void 0:o.stringValue,(u=i.value)==null?void 0:u.stringValue)}}class iv extends rs{Fr(e,t){try{const n=(function(o){let u="";for(let c=0;c<o.length;c++){const h=o.charAt(c);switch(h){case"_":u+=".";break;case"%":u+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":u+="\\"+h;break;default:u+=h}}return"^"+u+"$"})(t),s=Qu.compile(n);return T.newValue({booleanValue:s.matches(e)})}catch(n){return it(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${n}`),T.dr()}}}class ov extends rs{Fr(e,t){try{const n=Qu.compile(t);return T.newValue({booleanValue:n.test(e)})}catch{return it(`Invalid regex pattern found in regex_contains: ${t}, returning error`),T.dr()}}}class av extends rs{Fr(e,t){try{return T.newValue({booleanValue:Qu.compile(t).matches(e)})}catch{return it(`Invalid regex pattern found in regex_match: ${t}, returning error`),T.dr()}}}class uv extends rs{Fr(e,t){return T.newValue({booleanValue:e.includes(t)})}}class cv extends rs{Fr(e,t){return T.newValue({booleanValue:e.startsWith(t)})}}class lv extends rs{Fr(e,t){return T.newValue({booleanValue:e.endsWith(t)})}}class hv{constructor(e){this.expr=e}evaluate(e,t){var s,i;D(this.expr.params.length===1,29079);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return T.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toLowerCase()});case"NULL":return T.pr();default:return T.dr()}}}class dv{constructor(e){this.expr=e}evaluate(e,t){var s,i;D(this.expr.params.length===1,60487);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return T.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toUpperCase()});case"NULL":return T.pr();default:return T.dr()}}}class fv{constructor(e){this.expr=e}evaluate(e,t){var s,i;D(this.expr.params.length===1,28544);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return T.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.trim()});case"NULL":return T.pr();default:return T.dr()}}}class mv{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map((o=>$(o).evaluate(e,t)));let s="",i=!1;for(const o of n)switch(o.type){case"STRING":s+=o.value.stringValue;break;case"NULL":i=!0;break;default:return T.dr()}return i?T.pr():T.newValue({stringValue:s})}}class pv{constructor(e){this.expr=e}evaluate(e,t){var o,u,c,h;D(this.expr.params.length===2,4483);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"UNSET":return T.mr();case"MAP":break;default:return T.dr()}const s=$(this.expr.params[1]).evaluate(e,t);if(s.type!=="STRING")return T.dr();const i=(h=(u=(o=n.value)==null?void 0:o.mapValue)==null?void 0:u.fields)==null?void 0:h[(c=s.value)==null?void 0:c.stringValue];return i===void 0?T.mr():T.newValue(i)}}class Oc{constructor(e){this.expr=e}evaluate(e,t){var h,f;D(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let n=!1;const s=$(this.expr.params[0]).evaluate(e,t);switch(s.type){case"VECTOR":break;case"NULL":n=!0;break;default:return T.dr()}const i=$(this.expr.params[1]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":n=!0;break;default:return T.dr()}if(n)return T.pr();const o=wu(s.value),u=wu(i.value);if(o===void 0||u===void 0||((h=o.values)==null?void 0:h.length)!==((f=u.values)==null?void 0:f.length))return T.dr();const c=this.Or(o,u);return c===void 0||isNaN(c)?T.dr():T.newValue({doubleValue:c})}}class gv extends Oc{Or(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return;let i=0,o=0,u=0;for(let h=0;h<n.length;h++){if(!mn(n[h])||!mn(s[h]))return;const f=xe(n[h]),m=xe(s[h]);i+=f*m,o+=f*f,u+=m*m}const c=Math.sqrt(o)*Math.sqrt(u);if(c!==0)return 1-Math.max(-1,Math.min(1,i/c))}}class _v extends Oc{Or(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!mn(n[o])||!mn(s[o]))return;i+=xe(n[o])*xe(s[o])}return i}}class yv extends Oc{Or(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!mn(n[o])||!mn(s[o]))return;const u=xe(n[o]),c=xe(s[o]);i+=Math.pow(u-c,2)}return Math.sqrt(i)}}class Iv{constructor(e){this.expr=e}evaluate(e,t){var s;D(this.expr.params.length===1,39044);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"VECTOR":{const i=wu(n.value);return T.newValue({integerValue:((s=i==null?void 0:i.values)==null?void 0:s.length)??0})}case"NULL":return T.pr();default:return T.dr()}}}const ii=BigInt(-62135596800),oi=BigInt(253402300799),Lo=BigInt(1e3),hn=BigInt(1e6),Tv=ii*Lo,wv=oi*Lo+BigInt(999),Ev=ii*hn,vv=oi*hn+BigInt(999999);function Lc(r){return r>=Ev&&r<=vv}function bp(r){return r>=ii&&r<=oi}function ai(r,e){const t=BigInt(r);return!(t<ii||t>oi)&&!(e<0||e>=1e9)&&(t!==ii||e===0)&&!(t===oi&&e>999999999)}function Sp(r,e){return e<0?{seconds:r-1,nanos:e+1e9}:{seconds:r,nanos:e}}function Mc(r){return BigInt(r.seconds)*hn+BigInt(Math.trunc(r.nanoseconds/1e3))}class Fc{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return this.toTimestamp(BigInt(n.value.integerValue));case"NULL":return T.pr();default:return T.dr()}}}class Av extends Fc{toTimestamp(e){if(!Lc(e))return T.dr();let t=Number(e/hn),n=Number(e%hn*BigInt(1e3));const s=Sp(t,n);return t=s.seconds,n=s.nanos,ai(t,n)?T.newValue({timestampValue:{seconds:t,nanos:n}}):T.dr()}}class Pv extends Fc{toTimestamp(e){if(!(function(o){return o>=Tv&&o<=wv})(e))return T.dr();let t=Number(e/Lo),n=Number(e%Lo*BigInt(1e6));const s=Sp(t,n);return t=s.seconds,n=s.nanos,ai(t,n)?T.newValue({timestampValue:{seconds:t,nanos:n}}):T.dr()}}class Rv extends Fc{toTimestamp(e){if(!bp(e))return T.dr();const t=Number(e);return T.newValue({timestampValue:{seconds:t,nanos:0}})}}class Uc{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const n=$(this.expr.params[0]).evaluate(e,t);switch(n.type){case"TIMESTAMP":break;case"NULL":return T.pr();default:return T.dr()}const s=Ac(n.value.timestampValue);return ai(s.seconds,s.nanoseconds)?this.Mr(s):T.dr()}}class bv extends Uc{Mr(e){const t=Mc(e);return Lc(t)?T.newValue({integerValue:`${t.toString()}`}):T.dr()}}class Sv extends Uc{Mr(e){const t=Mc(e),n=t/BigInt(1e3),s=t%BigInt(1e3);return n>BigInt(0)||s===BigInt(0)?T.newValue({integerValue:n.toString()}):T.newValue({integerValue:(n-BigInt(1)).toString()})}}class Vv extends Uc{Mr(e){const t=BigInt(e.seconds);return bp(t)?T.newValue({integerValue:t.toString()}):T.dr()}}class Vp{constructor(e){this.expr=e}evaluate(e,t){D(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let n=!1;const s=$(this.expr.params[0]).evaluate(e,t);switch(s.type){case"TIMESTAMP":break;case"NULL":n=!0;break;default:return T.dr()}const i=$(this.expr.params[1]).evaluate(e,t);let o;switch(i.type){case"STRING":if(o=(function(W){switch(W){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}})(i.value.stringValue),o===void 0)return T.dr();break;case"NULL":n=!0;break;default:return T.dr()}const u=$(this.expr.params[2]).evaluate(e,t);switch(u.type){case"INT":break;case"NULL":n=!0;break;default:return T.dr()}if(n)return T.pr();const c=BigInt(u.value.integerValue);let h;try{switch(o){case"microsecond":h=c;break;case"millisecond":h=c*BigInt(1e3);break;case"second":h=c*BigInt(1e6);break;case"minute":h=c*BigInt(6e7);break;case"hour":h=c*BigInt(36e8);break;case"day":h=c*BigInt(864e8);break;default:return T.dr()}if(o!=="microsecond"&&c!==BigInt(0)&&h/c!==BigInt(this.Nr(o)))return T.dr()}catch(z){return it(`Error during timestamp arithmetic: ${z}`),T.dr()}const f=Ac(s.value.timestampValue);if(!ai(f.seconds,f.nanoseconds))return T.dr();const m=Mc(f),_=this.Lr(m,h);if(!Lc(_))return T.dr();const R=Number(_/hn),C=_%hn,U=Number((C<0?C+hn:C)*BigInt(1e3)),L=C<0?R-1:R;return ai(L,U)?T.newValue({timestampValue:{seconds:L,nanos:U}}):T.dr()}Nr(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class Cv extends Vp{Lr(e,t){return e+t}}class xv extends Vp{Lr(e,t){return e-t}}function ui(r){if((r=Pp(r))instanceof or)return`fld(${r.fieldName})`;if(r instanceof ar)return`cst(${(function(t){return t===null?"null":typeof t=="number"?t.toString():typeof t=="string"?`"${t}"`:t instanceof we?`ref(${t.path})`:t instanceof We?`vec(${JSON.stringify(t)})`:JSON.stringify(t)})(r.value)})`;if(r instanceof V)return`fn(${r.name},[${r.params.map(ui).join(",")}])`;if(r.expressionType==="ListOfExpressions")return`list([${r.ur.map(ui).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(r,null,2)}`)}function Nv(r){if(r instanceof wp)return`${r._name}(${Xi(r.fields)})`;if(r instanceof Ep){let e=`${r._name}(${Xi(r.accumulators)})`;return r.groups.size>0&&(e+=`grouping(${Xi(r.groups)})`),e}if(r instanceof vp)return`${r._name}(${Xi(r.groups)})`;if(r instanceof Pi)return`${r._name}(${r.Er})`;if(r instanceof Ri)return`${r._name}(${r.collectionId})`;if(r instanceof da)return`${r._name}()`;if(r instanceof fa)return`${r._name}(${r.hr.sort()})`;if(r instanceof bi)return`${r._name}(${ui(r.condition)})`;if(r instanceof _n)return`${r._name}(${r.limit})`;if(r instanceof _t)return`${r._name}(${(function(t){return t.map((n=>`${ui(n.expr)}${n.direction}`)).join(",")})(r.orderings)})`;throw new Error(`Unrecognized stage ${r._name}`)}function Xi(r){return`${Array.from(r.entries()).sort().map((([e,t])=>`${e}=${ui(t)}`)).join(",")}`}function Nt(r){return r.stages.map((e=>Nv(e))).join("|")}function Cp(r,e){return Nt(r)===Nt(e)}function me(r){return r instanceof Oe}function wd(r){return me(r)?Nt(r):Fs(r)}function xp(r){return me(r)?Nt(r):(function(t){return`${xo(et(t))}|lt:${t.limitType}`})(r)}function pa(r,e){return r instanceof Oe&&e instanceof Oe?Cp(r,e):!(r instanceof Oe&&!(e instanceof Oe)||!(r instanceof Oe)&&e instanceof Oe)&&aw(r,e)}function ga(r){return Rt(r)?Nt(r):xo(r)}function Bc(r,e){return r instanceof Oe&&e instanceof Oe?Cp(r,e):!(r instanceof Oe&&!(e instanceof Oe)||!(r instanceof Oe)&&e instanceof Oe)&&Ic(r,e)}function Dv(r,e){const t=(function(s){let i=!1;const o=[];for(const u of s)if(u instanceof _t)if(i=!0,u.orderings.some((c=>c.expr instanceof or&&c.expr.fieldName===pt)))o.push(u);else{const c=u.orderings.map((h=>h));c.push(mo(pt).ascending()),o.push(new _t(c,{}))}else u instanceof _n&&(i||(o.push(new _t([mo(pt).ascending()],{})),i=!0)),o.push(u);return i||o.push(new _t([mo(pt).ascending()],{})),o})(r.stages);if(r.userDataReader){const n=r.userDataReader.createContext(3,"toCorePipeline");t.forEach((s=>s._readUserData(n)))}return new Oe(r.userDataReader.serializer,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qc{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&HT(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=Ls(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=Ls(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=Lm();return this.mutations.forEach((s=>{const i=e.get(s.key),o=i.overlayedDocument;let u=this.applyToLocalView(o,i.mutatedFields);u=t.has(s.key)?null:u;const c=Tm(o,u);c!==null&&n.set(s.key,c),o.isValidDocument()||o.convertToNoDocument(j.min())})),n}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),Q())}isEqual(e){return this.batchId===e.batchId&&Cr(this.mutations,e.mutations,((t,n)=>Jh(t,n)))&&Cr(this.baseMutations,e.baseMutations,((t,n)=>Jh(t,n)))}}class jc{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){D(e.mutations.length===n.length,58842,{Br:e.mutations.length,Ur:n.length});let s=(function(){return dw})();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new jc(e,t,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mo="";function Me(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=Ed(e)),e=kv(r.get(t),e);return Ed(e)}function kv(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case Mo:t+="";break;default:t+=i}}return t}function Ed(r){return r+Mo+""}function yt(r){const e=r.length;if(D(e>=2,64408,{path:r}),e===2)return D(r.charAt(0)===Mo&&r.charAt(1)==="",56145,{path:r}),X.emptyPath();const t=e-2,n=[];let s="";for(let i=0;i<e;){const o=r.indexOf(Mo,i);switch((o<0||o>t)&&B(50515,{path:r}),r.charAt(o+1)){case"":const u=r.substring(i,o);let c;s.length===0?c=u:(s+=u,c=s,s=""),n.push(c);break;case"":s+=r.substring(i,o),s+="\0";break;case"":s+=r.substring(i,o+1);break;default:B(61167,{path:r})}i=o+2}return new X(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dn="remoteDocuments",Ci="owner",fr="owner",ci="mutationQueues",Ov="userId",at="mutations",vd="batchId",qn="userMutationsIndex",Ad=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function po(r,e){return[r,Me(e)]}function Np(r,e,t){return[r,Me(e),t]}const Lv={},qr="documentMutations",Fo="remoteDocumentsV14",Mv=["prefixPath","collectionGroup","readTime","documentId"],go="documentKeyIndex",Fv=["prefixPath","collectionGroup","documentId"],Dp="collectionGroupIndex",Uv=["collectionGroup","readTime","prefixPath","documentId"],li="remoteDocumentGlobal",Nu="remoteDocumentGlobalKey",jr="targets",kp="queryTargetsIndex",Bv=["canonicalId","targetId"],$r="targetDocuments",qv=["targetId","path"],$c="documentTargetsIndex",jv=["path","targetId"],Uo="targetGlobalKey",Gn="targetGlobal",hi="collectionParents",$v=["collectionId","parent"],zr="clientMetadata",zv="clientId",_a="bundles",Kv="bundleId",ya="namedQueries",Gv="name",zc="indexConfiguration",Wv="indexId",Du="collectionGroupIndex",Hv="collectionGroup",$s="indexState",Qv=["indexId","uid"],Op="sequenceNumberIndex",Jv=["uid","sequenceNumber"],zs="indexEntries",Yv=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Lp="documentKeyIndex",Xv=["indexId","uid","orderedDocumentKey"],Ia="documentOverlays",Zv=["userId","collectionPath","documentId"],ku="collectionPathOverlayIndex",eA=["userId","collectionPath","largestBatchId"],Mp="collectionGroupOverlayIndex",tA=["userId","collectionGroup","largestBatchId"],Kc="globals",nA="name",Fp=[ci,at,qr,Dn,jr,Ci,Gn,$r,zr,li,hi,_a,ya],rA=[...Fp,Ia],Up=[ci,at,qr,Fo,jr,Ci,Gn,$r,zr,li,hi,_a,ya,Ia],Bp=Up,Gc=[...Bp,zc,$s,zs],sA=Gc,qp=[...Gc,Kc],iA=qp;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jp(r,e,t){const n=r.store(at),s=r.store(qr),i=[],o=IDBKeyRange.only(t.batchId);let u=0;const c=n.jn({range:o},((f,m,_)=>(u++,_.delete())));i.push(c.next((()=>{D(u===1,47070,{batchId:t.batchId})})));const h=[];for(const f of t.mutations){const m=Np(e,f.key.path,t.batchId);i.push(s.delete(m)),h.push(f.key)}return A.waitFor(i).next((()=>h))}function Bo(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw B(14731);e=r.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ou extends ip{constructor(e,t){super(),this.kr=e,this.currentSequenceNumber=t}}function Ae(r,e){const t=q(r);return cn.xn(t.kr,e)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wc{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class It{constructor(e,t,n,s,i=j.min(),o=j.min(),u=he.EMPTY_BYTE_STRING,c=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=u,this.expectedCount=c}withSequenceNumber(e){return new It(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new It(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new It(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new It(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $p{constructor(e){this.qr=e}}function oA(r,e){let t;if(e.document)t=Ew(r.qr,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=F.fromSegments(e.noDocument.path),s=sr(e.noDocument.readTime);t=fe.newNoDocument(n,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return B(56709);{const n=F.fromSegments(e.unknownDocument.path),s=sr(e.unknownDocument.version);t=fe.newUnknownDocument(n,s)}}return e.readTime&&t.setReadTime((function(s){const i=new se(s[0],s[1]);return j.fromTimestamp(i)})(e.readTime)),t}function Pd(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:qo(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=(function(i,o){return{name:ni(i,o.key),fields:o.data.value.mapValue.fields,updateTime:Br(i,o.version.toTimestamp()),createTime:Br(i,o.createTime.toTimestamp())}})(r.qr,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:rr(e.version)};else{if(!e.isUnknownDocument())return B(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:rr(e.version)}}return n}function qo(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function rr(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function sr(r){const e=new se(r.seconds,r.nanoseconds);return j.fromTimestamp(e)}function Ln(r,e){const t=(e.baseMutations||[]).map((i=>Cu(r.qr,i)));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const u=e.mutations[i+1];o.updateTransforms=u.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const n=e.mutations.map((i=>Cu(r.qr,i))),s=se.fromMillis(e.localWriteTimeMs);return new qc(e.batchId,s,t,n)}function Ns(r,e){const t=sr(e.readTime),n=e.lastLimboFreeSnapshotVersion!==void 0?sr(e.lastLimboFreeSnapshotVersion):j.min();let s;return s=(function(o){return o.structuredPipeline!==void 0})(e.query)?(function(o,u){var f,m;const c=o.structuredPipeline;D((((f=c==null?void 0:c.pipeline)==null?void 0:f.stages)??[]).length>0,1845);const h=(m=c==null?void 0:c.pipeline)==null?void 0:m.stages.map(aA);return new Oe(u,h)})(e.query,r.qr):(function(o){return o.documents!==void 0})(e.query)?(function(o){const u=o.documents.length;return D(u===1,1966,{count:u}),et(ia(jm(o.documents[0])))})(e.query):(function(o){return et(Gm(o))})(e.query),new It(s,e.targetId,"TargetPurposeListen",e.lastListenSequenceNumber,t,n,he.fromBase64String(e.resumeToken))}function zp(r,e){const t=rr(e.snapshotVersion),n=rr(e.lastLimboFreeSnapshotVersion);let s;s=Rt(e.target)?Wm(r.qr,e.target):Tc(e.target)?zm(r.qr,e.target):Km(r.qr,e.target).be;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:ga(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function Kp(r){const e=Gm({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?Ru(e,e.limit,"L"):e}function Zi(r,e){return new Wc(e.largestBatchId,Cu(r.qr,e.overlayMutation))}function Rd(r,e){const t=e.path.lastSegment();return[r,Me(e.path.popLast()),t]}function bd(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:rr(n.readTime),documentKey:Me(n.documentKey.path),largestBatchId:n.largestBatchId}}function aA(r){switch(r.name){case"collection":return new Pi(r.args[0].referenceValue,{});case"collection_group":return new Ri(r.args[1].stringValue,{});case"database":return new da({});case"documents":return new fa(r.args.map((e=>e.referenceValue)),{});case"where":return new bi(Lu(r.args[0]),{});case"limit":{const e=r.args[0].integerValue??r.args[0].doubleValue;return new _n(typeof e=="number"?e:Number(e),{})}case"sort":return new _t(r.args.map((e=>(function(n){var i,o;const s=(i=n.mapValue)==null?void 0:i.fields;return new xc(Lu(s.expression),(o=s.direction)==null?void 0:o.stringValue,"orderingFromProto")})(e))),{});default:throw new Error(`Stage type: ${r.name} not supported.`)}}function Lu(r){return r.fieldReferenceValue?new or(nr("_exprFromProto",r.fieldReferenceValue),"_exprFromProto"):r.functionValue?(function(t){var n;return new V(t.functionValue.name,((n=t.functionValue.args)==null?void 0:n.map(Lu))||[])})(r):ar._fromProto(r)}class Ta{constructor(e,t,n,s){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=s,this.$r={}}static Kr(e,t,n,s){D(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new Ta(i,t,n,s)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return Qt(e).jn({index:qn,range:n},((s,i,o)=>{t=!1,o.done()})).next((()=>t))}addMutationBatch(e,t,n,s){const i=vr(e),o=Qt(e);return o.add({}).next((u=>{D(typeof u=="number",49019);const c=new qc(u,t,n,s),h=(function(R,C,U){const L=U.baseMutations.map((W=>Do(R.qr,W))),z=U.mutations.map((W=>Do(R.qr,W)));return{userId:C,batchId:U.batchId,localWriteTimeMs:U.localWriteTime.toMillis(),baseMutations:L,mutations:z}})(this.serializer,this.userId,c),f=[];let m=new re(((_,R)=>G(_.canonicalString(),R.canonicalString())));for(const _ of s){const R=Np(this.userId,_.key.path,u);m=m.add(_.key.path.popLast()),f.push(o.put(h)),f.push(i.put(R,Lv))}return m.forEach((_=>{f.push(this.indexManager.addToCollectionParentIndex(e,_))})),e.addOnCommittedListener((()=>{this.$r[u]=c.keys()})),A.waitFor(f).next((()=>c))}))}lookupMutationBatch(e,t){return Qt(e).get(t).next((n=>n?(D(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),Ln(this.serializer,n)):null))}Qr(e,t){return this.$r[t]?A.resolve(this.$r[t]):this.lookupMutationBatch(e,t).next((n=>{if(n){const s=n.keys();return this.$r[t]=s,s}return null}))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return Qt(e).jn({index:qn,range:s},((o,u,c)=>{u.userId===this.userId&&(D(u.batchId>=n,47524,{Wr:n}),i=Ln(this.serializer,u)),c.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=$n;return Qt(e).jn({index:qn,range:t,reverse:!0},((s,i,o)=>{n=i.batchId,o.done()})).next((()=>n))}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,$n],[this.userId,Number.POSITIVE_INFINITY]);return Qt(e).Kn(qn,t).next((n=>n.map((s=>Ln(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=po(this.userId,t.path),s=IDBKeyRange.lowerBound(n),i=[];return vr(e).jn({range:s},((o,u,c)=>{const[h,f,m]=o,_=yt(f);if(h===this.userId&&t.path.isEqual(_))return Qt(e).get(m).next((R=>{if(!R)throw B(61480,{Gr:o,batchId:m});D(R.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:R.userId,batchId:m}),i.push(Ln(this.serializer,R))}));c.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new re(G);const s=[];return t.forEach((i=>{const o=po(this.userId,i.path),u=IDBKeyRange.lowerBound(o),c=vr(e).jn({range:u},((h,f,m)=>{const[_,R,C]=h,U=yt(R);_===this.userId&&i.path.isEqual(U)?n=n.add(C):m.done()}));s.push(c)})),A.waitFor(s).next((()=>this.zr(e,n)))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1,i=po(this.userId,n),o=IDBKeyRange.lowerBound(i);let u=new re(G);return vr(e).jn({range:o},((c,h,f)=>{const[m,_,R]=c,C=yt(_);m===this.userId&&n.isPrefixOf(C)?C.length===s&&(u=u.add(R)):f.done()})).next((()=>this.zr(e,u)))}zr(e,t){const n=[],s=[];return t.forEach((i=>{s.push(Qt(e).get(i).next((o=>{if(o===null)throw B(35274,{batchId:i});D(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),n.push(Ln(this.serializer,o))})))})),A.waitFor(s).next((()=>n))}removeMutationBatch(e,t){return jp(e.kr,this.userId,t).next((n=>(e.addOnCommittedListener((()=>{this.jr(t.batchId)})),A.forEach(n,(s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))))}jr(e){delete this.$r[e]}performConsistencyCheck(e){return this.checkEmpty(e).next((t=>{if(!t)return A.resolve();const n=IDBKeyRange.lowerBound((function(o){return[o]})(this.userId)),s=[];return vr(e).jn({range:n},((i,o,u)=>{if(i[0]===this.userId){const c=yt(i[1]);s.push(c)}else u.done()})).next((()=>{D(s.length===0,56720,{Hr:s.map((i=>i.canonicalString()))})}))}))}containsKey(e,t){return Gp(e,this.userId,t)}Jr(e){return Wp(e).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:$n,lastStreamToken:""}))}}function Gp(r,e,t){const n=po(e,t.path),s=n[1],i=IDBKeyRange.lowerBound(n);let o=!1;return vr(r).jn({range:i,zn:!0},((u,c,h)=>{const[f,m,_]=u;f===e&&m===s&&(o=!0),h.done()})).next((()=>o))}function Qt(r){return Ae(r,at)}function vr(r){return Ae(r,qr)}function Wp(r){return Ae(r,ci)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uA{getBundleMetadata(e,t){return Sd(e).get(t).next((n=>{if(n)return(function(i){return{id:i.bundleId,createTime:sr(i.createTime),version:i.version}})(n)}))}saveBundleMetadata(e,t){return Sd(e).put((function(s){return{bundleId:s.id,createTime:rr($e(s.createTime)),version:s.version}})(t))}getNamedQuery(e,t){return Vd(e).get(t).next((n=>{if(n)return(function(i){return{name:i.name,query:Kp(i.bundledQuery),readTime:sr(i.readTime)}})(n)}))}saveNamedQuery(e,t){return Vd(e).put((function(s){return{name:s.name,readTime:rr($e(s.readTime)),bundledQuery:s.bundledQuery}})(t))}}function Sd(r){return Ae(r,_a)}function Vd(r){return Ae(r,ya)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wa{constructor(e,t){this.serializer=e,this.userId=t}static Kr(e,t){const n=t.uid||"";return new wa(e,n)}getOverlay(e,t){return mr(e).get(Rd(this.userId,t)).next((n=>n?Zi(this.serializer,n):null))}getOverlays(e,t){const n=rt();return A.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}getAllOverlays(e,t){const n=rt();return mr(e).jn(((s,i)=>{const o=Zi(this.serializer,i);o.largestBatchId>t&&n.set(o.getKey(),o)})).next((()=>n))}saveOverlays(e,t,n){const s=[];return n.forEach(((i,o)=>{const u=new Wc(t,o);s.push(this.Yr(e,u))})),A.waitFor(s)}removeOverlaysForBatchId(e,t,n){const s=new Set;t.forEach((o=>s.add(Me(o.getCollectionPath()))));const i=[];return s.forEach((o=>{const u=IDBKeyRange.bound([this.userId,o,n],[this.userId,o,n+1],!1,!0);i.push(mr(e).Gn(ku,u))})),A.waitFor(i)}getOverlaysForCollection(e,t,n){const s=rt(),i=Me(t),o=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return mr(e).Kn(ku,o).next((u=>{for(const c of u){const h=Zi(this.serializer,c);s.set(h.getKey(),h)}return s}))}getOverlaysForCollectionGroup(e,t,n,s){const i=rt();let o;const u=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return mr(e).jn({index:Mp,range:u},((c,h,f)=>{const m=Zi(this.serializer,h);i.size()<s||m.largestBatchId===o?(i.set(m.getKey(),m),o=m.largestBatchId):f.done()})).next((()=>i))}Yr(e,t){return mr(e).put((function(s,i,o){const[u,c,h]=Rd(i,o.mutation.key);return{userId:i,collectionPath:c,documentId:h,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:Do(s.qr,o.mutation)}})(this.serializer,this.userId,t))}}function mr(r){return Ae(r,Ia)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cA{Zr(e){return Ae(e,Kc)}getSessionToken(e){return this.Zr(e).get("sessionToken").next((t=>{const n=t==null?void 0:t.value;return n?he.fromUint8Array(n):he.EMPTY_BYTE_STRING}))}setSessionToken(e,t){return this.Zr(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mn{constructor(){}Xr(e,t){this.ei(e,t),t.ti()}ei(e,t){if("nullValue"in e)this.ni(t,5);else if("booleanValue"in e)this.ni(t,10),t.ri(e.booleanValue?1:0);else if("integerValue"in e)this.ni(t,15),t.ri(ue(e.integerValue));else if("doubleValue"in e){const n=ue(e.doubleValue);isNaN(n)?this.ni(t,13):(this.ni(t,15),Nr(n)?t.ri(0):t.ri(n))}else if("timestampValue"in e){let n=e.timestampValue;this.ni(t,20),typeof n=="string"&&(n=Ot(n)),t.ii(`${n.seconds||""}`),t.ri(n.nanos||0)}else if("stringValue"in e)this.si(e.stringValue,t),this._i(t);else if("bytesValue"in e)this.ni(t,30),t.oi(Lt(e.bytesValue)),this._i(t);else if("referenceValue"in e)this.ai(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.ni(t,45),t.ri(n.latitude||0),t.ri(n.longitude||0)}else"mapValue"in e?fm(e)?this.ni(t,Number.MAX_SAFE_INTEGER):er(e)?this.ui(e.mapValue,t):(this.ci(e.mapValue,t),this._i(t)):"arrayValue"in e?(this.li(e.arrayValue,t),this._i(t)):B(19022,{Ei:e})}si(e,t){this.ni(t,25),this.hi(e,t)}hi(e,t){t.ii(e)}ci(e,t){const n=e.fields||{};this.ni(t,55);for(const s of Object.keys(n))this.si(s,t),this.ei(n[s],t)}ui(e,t){var o,u;const n=e.fields||{};this.ni(t,53);const s=Zn,i=((u=(o=n[s].arrayValue)==null?void 0:o.values)==null?void 0:u.length)||0;this.ni(t,15),t.ri(ue(i)),this.si(s,t),this.ei(n[s],t)}li(e,t){const n=e.values||[];this.ni(t,50);for(const s of n)this.ei(s,t)}ai(e,t){this.ni(t,37),F.fromName(e).path.forEach((n=>{this.ni(t,60),this.hi(n,t)}))}ni(e,t){e.ri(t)}_i(e){e.ri(2)}}Mn.Ti=new Mn;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pr=255;function lA(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function Cd(r){const e=64-(function(n){let s=0;for(let i=0;i<8;++i){const o=lA(255&n[i]);if(s+=o,o!==8)break}return s})(r);return Math.ceil(e/8)}class hA{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Pi(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Ri(n.value),n=t.next();this.Ii()}Ai(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Vi(n.value),n=t.next();this.di()}fi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Ri(n);else if(n<2048)this.Ri(960|n>>>6),this.Ri(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Ri(480|n>>>12),this.Ri(128|63&n>>>6),this.Ri(128|63&n);else{const s=t.codePointAt(0);this.Ri(240|s>>>18),this.Ri(128|63&s>>>12),this.Ri(128|63&s>>>6),this.Ri(128|63&s)}}this.Ii()}mi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Vi(n);else if(n<2048)this.Vi(960|n>>>6),this.Vi(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Vi(480|n>>>12),this.Vi(128|63&n>>>6),this.Vi(128|63&n);else{const s=t.codePointAt(0);this.Vi(240|s>>>18),this.Vi(128|63&s>>>12),this.Vi(128|63&s>>>6),this.Vi(128|63&s)}}this.di()}pi(e){const t=this.gi(e),n=Cd(t);this.yi(1+n),this.buffer[this.position++]=255&n;for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=255&t[s]}wi(e){const t=this.gi(e),n=Cd(t);this.yi(1+n),this.buffer[this.position++]=~(255&n);for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}bi(){this.Si(pr),this.Si(255)}Di(){this.xi(pr),this.xi(255)}reset(){this.position=0}seed(e){this.yi(e.length),this.buffer.set(e,this.position),this.position+=e.length}Ci(){return this.buffer.slice(0,this.position)}gi(e){const t=(function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)})(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let s=1;s<t.length;++s)t[s]^=n?255:0;return t}Ri(e){const t=255&e;t===0?(this.Si(0),this.Si(255)):t===pr?(this.Si(pr),this.Si(0)):this.Si(t)}Vi(e){const t=255&e;t===0?(this.xi(0),this.xi(255)):t===pr?(this.xi(pr),this.xi(0)):this.xi(e)}Ii(){this.Si(0),this.Si(1)}di(){this.xi(0),this.xi(1)}Si(e){this.yi(1),this.buffer[this.position++]=e}xi(e){this.yi(1),this.buffer[this.position++]=~e}yi(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class dA{constructor(e){this.Fi=e}oi(e){this.Fi.Pi(e)}ii(e){this.Fi.fi(e)}ri(e){this.Fi.pi(e)}ti(){this.Fi.bi()}}class fA{constructor(e){this.Fi=e}oi(e){this.Fi.Ai(e)}ii(e){this.Fi.mi(e)}ri(e){this.Fi.wi(e)}ti(){this.Fi.Di()}}class Ps{constructor(){this.Fi=new hA,this.ascending=new dA(this.Fi),this.descending=new fA(this.Fi)}seed(e){this.Fi.seed(e)}Oi(e){return e===0?this.ascending:this.descending}Ci(){return this.Fi.Ci()}reset(){this.Fi.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fn{constructor(e,t,n,s){this.Mi=e,this.Ni=t,this.Li=n,this.Bi=s}Ui(){const e=this.Bi.length,t=e===0||this.Bi[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.Bi,0),t!==e?n.set([0],this.Bi.length):++n[n.length-1],new Fn(this.Mi,this.Ni,this.Li,n)}ki(e,t,n){return{indexId:this.Mi,uid:e,arrayValue:_o(this.Li),directionalValue:_o(this.Bi),orderedDocumentKey:_o(t),documentKey:n.path.toArray()}}qi(e,t,n){const s=this.ki(e,t,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function Jt(r,e){let t=r.Mi-e.Mi;return t!==0?t:(t=xd(r.Li,e.Li),t!==0?t:(t=xd(r.Bi,e.Bi),t!==0?t:F.comparator(r.Ni,e.Ni)))}function xd(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function _o(r){return ff()?(function(t){let n="";for(let s=0;s<t.length;s++)n+=String.fromCharCode(t[s]);return n})(r):r}function Nd(r){return typeof r!="string"?r:(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(r)}class Dd{constructor(e){this.$i=new re(((t,n)=>Ee.comparator(t.field,n.field))),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.Ki=e.orderBy,this.Qi=[];for(const t of e.filters){const n=t;n.isInequality()?this.$i=this.$i.add(n):this.Qi.push(n)}}get Wi(){return this.$i.size>1}Gi(e){if(D(e.collectionGroup===this.collectionId,49279),this.Wi)return!1;const t=Au(e);if(t!==void 0&&!this.zi(t))return!1;const n=Nn(e);let s=new Set,i=0,o=0;for(;i<n.length&&this.zi(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.$i.size>0){const u=this.$i.getIterator().getNext();if(!s.has(u.field.canonicalString())){const c=n[i];if(!this.ji(u,c)||!this.Hi(this.Ki[o++],c))return!1}++i}for(;i<n.length;++i){const u=n[i];if(o>=this.Ki.length||!this.Hi(this.Ki[o++],u))return!1}return!0}Ji(){if(this.Wi)return null;let e=new re(Ee.comparator);const t=[];for(const n of this.Qi)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new lo(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new lo(n.field,0))}for(const n of this.Ki)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new lo(n.field,n.dir==="asc"?0:1)));return new Co(Co.UNKNOWN_ID,this.collectionId,t,ti.empty())}zi(e){for(const t of this.Qi)if(this.ji(t,e))return!0;return!1}ji(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}Hi(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hp(r){var t,n;if(D(r instanceof Z||r instanceof ie,20012),r instanceof Z){if(r instanceof Vm){const s=((n=(t=r.value.arrayValue)==null?void 0:t.values)==null?void 0:n.map((i=>Z.create(r.field,"==",i))))||[];return ie.create(s,"or")}return r}const e=r.filters.map((s=>Hp(s)));return ie.create(e,r.op)}function mA(r){if(r.getFilters().length===0)return[];const e=Uu(Hp(r));return D(Qp(e),7391),Mu(e)||Fu(e)?[e]:e.getFilters()}function Mu(r){return r instanceof Z}function Fu(r){return r instanceof ie&&_c(r)}function Qp(r){return Mu(r)||Fu(r)||(function(t){if(t instanceof ie&&Eu(t)){for(const n of t.getFilters())if(!Mu(n)&&!Fu(n))return!1;return!0}return!1})(r)}function Uu(r){if(D(r instanceof Z||r instanceof ie,34018),r instanceof Z)return r;if(r.filters.length===1)return Uu(r.filters[0]);const e=r.filters.map((n=>Uu(n)));let t=ie.create(e,r.op);return t=jo(t),Qp(t)?t:(D(t instanceof ie,64498),D(Fr(t),40251),D(t.filters.length>1,57927),t.filters.reduce(((n,s)=>Hc(n,s))))}function Hc(r,e){let t;return D(r instanceof Z||r instanceof ie,38388),D(e instanceof Z||e instanceof ie,25473),t=r instanceof Z?e instanceof Z?(function(s,i){return ie.create([s,i],"and")})(r,e):kd(r,e):e instanceof Z?kd(e,r):(function(s,i){if(D(s.filters.length>0&&i.filters.length>0,48005),Fr(s)&&Fr(i))return Rm(s,i.getFilters());const o=Eu(s)?s:i,u=Eu(s)?i:s,c=o.filters.map((h=>Hc(h,u)));return ie.create(c,"or")})(r,e),jo(t)}function kd(r,e){if(Fr(e))return Rm(e,r.getFilters());{const t=e.filters.map((n=>Hc(r,n)));return ie.create(t,"or")}}function jo(r){if(D(r instanceof Z||r instanceof ie,11850),r instanceof Z)return r;const e=r.getFilters();if(e.length===1)return jo(e[0]);if(Am(r))return r;const t=e.map((s=>jo(s))),n=[];return t.forEach((s=>{s instanceof Z?n.push(s):s instanceof ie&&(s.op===r.op?n.push(...s.filters):n.push(s))})),n.length===1?n[0]:ie.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pA{constructor(){this.Yi=new Qc}addToCollectionParentIndex(e,t){return this.Yi.add(t),A.resolve()}getCollectionParents(e,t){return A.resolve(this.Yi.getEntries(t))}addFieldIndex(e,t){return A.resolve()}deleteFieldIndex(e,t){return A.resolve()}deleteAllFieldIndexes(e){return A.resolve()}createTargetIndexes(e,t){return A.resolve()}getDocumentsMatchingTarget(e,t){return A.resolve(null)}getIndexType(e,t){return A.resolve(0)}getFieldIndexes(e,t){return A.resolve([])}getNextCollectionGroupToUpdate(e){return A.resolve(null)}getMinOffset(e,t){return A.resolve(tt.min())}getMinOffsetFromCollectionGroup(e,t){return A.resolve(tt.min())}updateCollectionGroup(e,t,n){return A.resolve()}updateIndexEntries(e,t){return A.resolve()}}class Qc{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new re(X.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new re(X.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Od="IndexedDbIndexManager",eo=new Uint8Array(0);class gA{constructor(e,t){this.databaseId=t,this.Zi=new Qc,this.Xi=new qt((n=>xo(n)),((n,s)=>Ic(n,s))),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.Zi.has(t)){const n=t.lastSegment(),s=t.popLast();e.addOnCommittedListener((()=>{this.Zi.add(t)}));const i={collectionId:n,parent:Me(s)};return Ld(e).put(i)}return A.resolve()}getCollectionParents(e,t){const n=[],s=IDBKeyRange.bound([t,""],[rm(t),""],!1,!0);return Ld(e).Kn(s).next((i=>{for(const o of i){if(o.collectionId!==t)break;n.push(yt(o.parent))}return n}))}addFieldIndex(e,t){const n=Rs(e),s=(function(u){return{indexId:u.indexId,collectionGroup:u.collectionGroup,fields:u.fields.map((c=>[c.fieldPath.canonicalString(),c.kind]))}})(t);delete s.indexId;const i=n.add(s);if(t.indexState){const o=_r(e);return i.next((u=>{o.put(bd(u,this.uid,t.indexState.sequenceNumber,t.indexState.offset))}))}return i.next()}deleteFieldIndex(e,t){const n=Rs(e),s=_r(e),i=gr(e);return n.delete(t.indexId).next((()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))))}deleteAllFieldIndexes(e){const t=Rs(e),n=gr(e),s=_r(e);return t.Gn().next((()=>n.Gn())).next((()=>s.Gn()))}createTargetIndexes(e,t){return A.forEach(this.es(t),(n=>this.getIndexType(e,n).next((s=>{if(s===0||s===1){const i=new Dd(n).Ji();if(i!=null)return this.addFieldIndex(e,i)}}))))}getDocumentsMatchingTarget(e,t){const n=gr(e);let s=!0;const i=new Map;return A.forEach(this.es(t),(o=>this.ts(e,o).next((u=>{s&&(s=!!u),i.set(o,u)})))).next((()=>{if(s){let o=Q();const u=[];return A.forEach(i,((c,h)=>{N(Od,`Using index ${(function(H){return`id=${H.indexId}|cg=${H.collectionGroup}|f=${H.fields.map((ce=>`${ce.fieldPath}:${ce.kind}`)).join(",")}`})(c)} to execute ${xo(t)}`);const f=(function(H,ce){const te=Au(ce);if(te===void 0)return null;for(const ne of No(H,te.fieldPath))switch(ne.op){case"array-contains-any":return ne.value.arrayValue.values||[];case"array-contains":return[ne.value]}return null})(h,c),m=(function(H,ce){const te=new Map;for(const ne of Nn(ce))for(const w of No(H,ne.fieldPath))switch(w.op){case"==":case"in":te.set(ne.fieldPath.canonicalString(),w.value);break;case"not-in":case"!=":return te.set(ne.fieldPath.canonicalString(),w.value),Array.from(te.values())}return null})(h,c),_=(function(H,ce){const te=[];let ne=!0;for(const w of Nn(ce)){const g=w.kind===0?td(H,w.fieldPath,H.startAt):nd(H,w.fieldPath,H.startAt);te.push(g.value),ne&&(ne=g.inclusive)}return new Mr(te,ne)})(h,c),R=(function(H,ce){const te=[];let ne=!0;for(const w of Nn(ce)){const g=w.kind===0?nd(H,w.fieldPath,H.endAt):td(H,w.fieldPath,H.endAt);te.push(g.value),ne&&(ne=g.inclusive)}return new Mr(te,ne)})(h,c),C=this.ns(c,h,_),U=this.ns(c,h,R),L=this.rs(c,h,m),z=this.ss(c.indexId,f,C,_.inclusive,U,R.inclusive,L);return A.forEach(z,(W=>n.Wn(W,t.limit).next((H=>{H.forEach((ce=>{const te=F.fromSegments(ce.documentKey);o.has(te)||(o=o.add(te),u.push(te))}))}))))})).next((()=>u))}return A.resolve(null)}))}es(e){let t=this.Xi.get(e);return t||(e.filters.length===0?t=[e]:t=mA(ie.create(e.filters,"and")).map((n=>Pu(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt))),this.Xi.set(e,t),t)}ss(e,t,n,s,i,o,u){const c=(t!=null?t.length:1)*Math.max(n.length,i.length),h=c/(t!=null?t.length:1),f=[];for(let m=0;m<c;++m){const _=t?this._s(t[m/h]):eo,R=this.us(e,_,n[m%h],s),C=this.cs(e,_,i[m%h],o),U=u.map((L=>this.us(e,_,L,!0)));f.push(...this.createRange(R,C,U))}return f}us(e,t,n,s){const i=new Fn(e,F.empty(),t,n);return s?i:i.Ui()}cs(e,t,n,s){const i=new Fn(e,F.empty(),t,n);return s?i.Ui():i}ts(e,t){const n=new Dd(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next((i=>{let o=null;for(const u of i)n.Gi(u)&&(!o||u.fields.length>o.fields.length)&&(o=u);return o}))}getIndexType(e,t){let n=2;const s=this.es(t);return A.forEach(s,(i=>this.ts(e,i).next((o=>{o?n!==0&&o.fields.length<(function(c){let h=new re(Ee.comparator),f=!1;for(const m of c.filters)for(const _ of m.getFlattenedFilters())_.field.isKeyField()||(_.op==="array-contains"||_.op==="array-contains-any"?f=!0:h=h.add(_.field));for(const m of c.orderBy)m.field.isKeyField()||(h=h.add(m.field));return h.size+(f?1:0)})(i)&&(n=1):n=0})))).next((()=>(function(o){return o.limit!==null})(t)&&s.length>1&&n===2?1:n))}ls(e,t){const n=new Ps;for(const s of Nn(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=n.Oi(s.kind);Mn.Ti.Xr(i,o)}return n.Ci()}_s(e){const t=new Ps;return Mn.Ti.Xr(e,t.Oi(0)),t.Ci()}Es(e,t){const n=new Ps;return Mn.Ti.Xr(fc(this.databaseId,t),n.Oi((function(i){const o=Nn(i);return o.length===0?0:o[o.length-1].kind})(e))),n.Ci()}rs(e,t,n){if(n===null)return[];let s=[];s.push(new Ps);let i=0;for(const o of Nn(e)){const u=n[i++];for(const c of s)if(this.hs(t,o.fieldPath)&&pn(u))s=this.Ts(s,o,u);else{const h=c.Oi(o.kind);Mn.Ti.Xr(u,h)}}return this.Ps(s)}ns(e,t,n){return this.rs(e,t,n.position)}Ps(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].Ci();return t}Ts(e,t,n){const s=[...e],i=[];for(const o of n.arrayValue.values||[])for(const u of s){const c=new Ps;c.seed(u.Ci()),Mn.Ti.Xr(o,c.Oi(t.kind)),i.push(c)}return i}hs(e,t){return!!e.filters.find((n=>n instanceof Z&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in")))}getFieldIndexes(e,t){const n=Rs(e),s=_r(e);return(t?n.Kn(Du,IDBKeyRange.bound(t,t)):n.Kn()).next((i=>{const o=[];return A.forEach(i,(u=>s.get([u.indexId,this.uid]).next((c=>{o.push((function(f,m){const _=m?new ti(m.sequenceNumber,new tt(sr(m.readTime),new F(yt(m.documentKey)),m.largestBatchId)):ti.empty(),R=f.fields.map((([C,U])=>new lo(Ee.fromServerFormat(C),U)));return new Co(f.indexId,f.collectionGroup,R,_)})(u,c))})))).next((()=>o))}))}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next((t=>t.length===0?null:(t.sort(((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:G(n.collectionGroup,s.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(e,t,n){const s=Rs(e),i=_r(e);return this.Rs(e).next((o=>s.Kn(Du,IDBKeyRange.bound(t,t)).next((u=>A.forEach(u,(c=>i.put(bd(c.indexId,this.uid,o,n))))))))}updateIndexEntries(e,t){const n=new Map;return A.forEach(t,((s,i)=>{const o=n.get(s.collectionGroup);return(o?A.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next((u=>(n.set(s.collectionGroup,u),A.forEach(u,(c=>this.Is(e,s,c).next((h=>{const f=this.As(i,c);return h.isEqual(f)?A.resolve():this.Vs(e,i,c,h,f)})))))))}))}ds(e,t,n,s){return gr(e).put(s.ki(this.uid,this.Es(n,t.key),t.key))}fs(e,t,n,s){return gr(e).delete(s.qi(this.uid,this.Es(n,t.key),t.key))}Is(e,t,n){const s=gr(e);let i=new re(Jt);return s.jn({index:Lp,range:IDBKeyRange.only([n.indexId,this.uid,_o(this.Es(n,t))])},((o,u)=>{i=i.add(new Fn(n.indexId,t,Nd(u.arrayValue),Nd(u.directionalValue)))})).next((()=>i))}As(e,t){let n=new re(Jt);const s=this.ls(t,e);if(s==null)return n;const i=Au(t);if(i!=null){const o=e.data.field(i.fieldPath);if(pn(o))for(const u of o.arrayValue.values||[])n=n.add(new Fn(t.indexId,e.key,this._s(u),s))}else n=n.add(new Fn(t.indexId,e.key,eo,s));return n}Vs(e,t,n,s,i){N(Od,"Updating index entries for document '%s'",t.key);const o=[];return(function(c,h,f,m,_){const R=c.getIterator(),C=h.getIterator();let U=dr(R),L=dr(C);for(;U||L;){let z=!1,W=!1;if(U&&L){const H=f(U,L);H<0?W=!0:H>0&&(z=!0)}else U!=null?W=!0:z=!0;z?(m(L),L=dr(C)):W?(_(U),U=dr(R)):(U=dr(R),L=dr(C))}})(s,i,Jt,(u=>{o.push(this.ds(e,t,n,u))}),(u=>{o.push(this.fs(e,t,n,u))})),A.waitFor(o)}Rs(e){let t=1;return _r(e).jn({index:Op,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((n,s,i)=>{i.done(),t=s.sequenceNumber+1})).next((()=>t))}createRange(e,t,n){n=n.sort(((o,u)=>Jt(o,u))).filter(((o,u,c)=>!u||Jt(o,c[u-1])!==0));const s=[];s.push(e);for(const o of n){const u=Jt(o,e),c=Jt(o,t);if(u===0)s[0]=e.Ui();else if(u>0&&c<0)s.push(o),s.push(o.Ui());else if(c>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.ps(s[o],s[o+1]))return[];const u=s[o].qi(this.uid,eo,F.empty()),c=s[o+1].qi(this.uid,eo,F.empty());i.push(IDBKeyRange.bound(u,c))}return i}ps(e,t){return Jt(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(Md)}getMinOffset(e,t){return A.mapArray(this.es(t),(n=>this.ts(e,n).next((s=>s||B(44426))))).next(Md)}}function Ld(r){return Ae(r,hi)}function gr(r){return Ae(r,zs)}function Rs(r){return Ae(r,zc)}function _r(r){return Ae(r,$s)}function Md(r){D(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;yc(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new tt(e.readTime,e.documentKey,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(e){this.gs=e}next(){return this.gs+=2,this.gs}static ys(){return new Ft(0)}static ws(){return new Ft(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _A{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.bs(e).next((t=>{const n=new Ft(t.highestTargetId);return t.highestTargetId=n.next(),this.Ss(e,t).next((()=>t.highestTargetId))}))}getLastRemoteSnapshotVersion(e){return this.bs(e).next((t=>j.fromTimestamp(new se(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(e){return this.bs(e).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(e,t,n){return this.bs(e).next((s=>(s.highestListenSequenceNumber=t,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.Ss(e,s))))}addTargetData(e,t){return this.vs(e,t).next((()=>this.bs(e).next((n=>(n.targetCount+=1,this.Ds(t,n),this.Ss(e,n))))))}updateTargetData(e,t){return this.vs(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next((()=>yr(e).delete(t.targetId))).next((()=>this.bs(e))).next((n=>(D(n.targetCount>0,8065),n.targetCount-=1,this.Ss(e,n))))}removeTargets(e,t,n){let s=0;const i=[];return yr(e).jn(((o,u)=>{const c=Ns(this.serializer,u);c.sequenceNumber<=t&&n.get(c.targetId)===null&&(s++,i.push(this.removeTargetData(e,c)))})).next((()=>A.waitFor(i))).next((()=>s))}forEachTarget(e,t){return yr(e).jn(((n,s)=>{const i=Ns(this.serializer,s);t(i)}))}bs(e){return Fd(e).get(Uo).next((t=>(D(t!==null,2888),t)))}Ss(e,t){return Fd(e).put(Uo,t)}vs(e,t){return yr(e).put(zp(this.serializer,t))}Ds(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.bs(e).next((t=>t.targetCount))}getTargetData(e,t){const n=ga(t),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return yr(e).jn({range:s,index:kp},((o,u,c)=>{const h=Ns(this.serializer,u);Bc(t,h.target)&&(i=h,c.done())})).next((()=>i))}addMatchingKeys(e,t,n){const s=[],i=rn(e);return t.forEach((o=>{const u=Me(o.path);s.push(i.put({targetId:n,path:u})),s.push(this.referenceDelegate.addReference(e,n,o))})),A.waitFor(s)}removeMatchingKeys(e,t,n){const s=rn(e);return A.forEach(t,(i=>{const o=Me(i.path);return A.waitFor([s.delete([n,o]),this.referenceDelegate.removeReference(e,n,i)])}))}removeMatchingKeysForTargetId(e,t){const n=rn(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),s=rn(e);let i=Q();return s.jn({range:n,zn:!0},((o,u,c)=>{const h=yt(o[1]),f=new F(h);i=i.add(f)})).next((()=>i))}containsKey(e,t){const n=Me(t.path),s=IDBKeyRange.bound([n],[rm(n)],!1,!0);let i=0;return rn(e).jn({index:$c,zn:!0,range:s},(([o,u],c,h)=>{o!==0&&(i++,h.done())})).next((()=>i>0))}ge(e,t){return yr(e).get(t).next((n=>n?Ns(this.serializer,n):null))}}function yr(r){return Ae(r,jr)}function Fd(r){return Ae(r,Gn)}function rn(r){return Ae(r,$r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yA{constructor(e,t){this.db=e,this.garbageCollector=cp(this,t)}rr(e){const t=this.xs(e);return this.db.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}xs(e){let t=0;return this.ir(e,(n=>{t++})).next((()=>t))}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}ir(e,t){return this.Cs(e,((n,s)=>t(s)))}addReference(e,t,n){return to(e,n)}removeReference(e,t,n){return to(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return to(e,t)}Fs(e,t){return(function(s,i){let o=!1;return Wp(s).Hn((u=>Gp(s,u,i).next((c=>(c&&(o=!0),A.resolve(!c)))))).next((()=>o))})(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Cs(e,((o,u)=>{if(u<=t){const c=this.Fs(e,o).next((h=>{if(!h)return i++,n.getEntry(e,o).next((()=>(n.removeEntry(o,j.min()),rn(e).delete((function(m){return[0,Me(m.path)]})(o)))))}));s.push(c)}})).next((()=>A.waitFor(s))).next((()=>n.apply(e))).next((()=>i))}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return to(e,t)}Cs(e,t){const n=rn(e);let s,i=Ge.yn;return n.jn({index:$c},(([o,u],{path:c,sequenceNumber:h})=>{o===0?(i!==Ge.yn&&t(new F(yt(s)),i),i=h,s=c):i=Ge.yn})).next((()=>{i!==Ge.yn&&t(new F(yt(s)),i)}))}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function to(r,e){return rn(r).put((function(n,s){return{targetId:0,path:Me(n.path),sequenceNumber:s}})(e,r.currentSequenceNumber))}// Copyright 2024 Google LLC* @license
function Jp(r,e){var n;let t=e;for(const s of r.stages)t=IA({serializer:r.serializer,serverTimestampBehavior:(n=r.listenOptions)==null?void 0:n.serverTimestampBehavior},s,t);return t}function Ea(r,e){return Jp(r,[e]).length>0}function Yp(r,e){return me(r)?Ea(r,e):oa(r,e)}function IA(r,e,t){if(e instanceof Pi)return(function(s,i,o){return o.filter((u=>u.isFoundDocument()&&`/${u.key.getCollectionPath().canonicalString()}`===i.Er))})(0,e,t);if(e instanceof bi)return(function(s,i,o){return o.filter((u=>{const c=js($(i.condition).evaluate(s,u));return c!==void 0&&ot(c,He)}))})(r,e,t);if(e instanceof Ri)return(function(s,i,o){return o.filter((u=>u.isFoundDocument()&&u.key.getCollectionPath().lastSegment()===i.collectionId))})(0,e,t);if(e instanceof da)return(function(s,i,o){return o.filter((u=>u.isFoundDocument()))})(0,0,t);if(e instanceof fa)return(function(s,i,o){return o.filter((u=>u.isFoundDocument()&&i.Tr.has(u.key.path.toStringWithLeadingSlash())))})(0,e,t);if(e instanceof _n)return(function(s,i,o){return o.slice(0,i.limit)})(0,e,t);if(e instanceof _t)return(function(s,i,o){const u=i.orderings.map((c=>({Os:$(c.expr),direction:c.direction})));return[...o].sort(((c,h)=>{for(const{Os:f,direction:m}of u){const _=js(f.evaluate(s,c)),R=js(f.evaluate(s,h)),C=Ue(_??wt,R??wt);if(C!==0)return m==="ascending"?C:-C}return 0}))})(r,e,t);throw new Error(`Unknown stage: ${e._name}`)}function Bu(r){const e=(function(n){for(let s=n.stages.length-1;s>=0;s--){const i=n.stages[s];if(i instanceof _t)return i.orderings}throw new Error("Pipeline must contain at least one Sort stage")})(r);return(t,n)=>{for(const s of e){const i=js($(s.expr).evaluate({serializer:r.serializer},t)),o=js($(s.expr).evaluate({serializer:r.serializer},n)),u=Ue(i||wt,o||wt);if(u!==0)return s.direction==="ascending"?u:-u}return 0}}function iu(r){for(let e=r.stages.length-1;e>=0;e--){const t=r.stages[e];if(t instanceof _n)return{limit:t.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xp{constructor(){this.changes=new qt((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,fe.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?A.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class TA{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return Yt(e).put(n)}removeEntry(e,t,n){return Yt(e).delete((function(i,o){const u=i.path.toArray();return[u.slice(0,u.length-2),u[u.length-2],qo(o),u[u.length-1]]})(t,n))}updateMetadata(e,t){return this.getMetadata(e).next((n=>(n.byteSize+=t,this.Ms(e,n))))}getEntry(e,t){let n=fe.newInvalidDocument(t);return Yt(e).jn({index:go,range:IDBKeyRange.only(bs(t))},((s,i)=>{n=this.Ns(t,i)})).next((()=>n))}Ls(e,t){let n={size:0,document:fe.newInvalidDocument(t)};return Yt(e).jn({index:go,range:IDBKeyRange.only(bs(t))},((s,i)=>{n={document:this.Ns(t,i),size:Bo(i)}})).next((()=>n))}getEntries(e,t){let n=Te();return this.Bs(e,t,((s,i)=>{const o=this.Ns(s,i);n=n.insert(s,o)})).next((()=>n))}getAllEntries(e){let t=Te();return Yt(e).jn(((n,s)=>{const i=this.Ns(F.fromSegments(s.prefixPath.concat(s.collectionGroup,s.documentId)),s);t=t.insert(i.key,i)})).next((()=>t))}Us(e,t){let n=Te(),s=new ae(F.comparator);return this.Bs(e,t,((i,o)=>{const u=this.Ns(i,o);n=n.insert(i,u),s=s.insert(i,Bo(o))})).next((()=>({documents:n,ks:s})))}Bs(e,t,n){if(t.isEmpty())return A.resolve();let s=new re(qd);t.forEach((c=>s=s.add(c)));const i=IDBKeyRange.bound(bs(s.first()),bs(s.last())),o=s.getIterator();let u=o.getNext();return Yt(e).jn({index:go,range:i},((c,h,f)=>{const m=F.fromSegments([...h.prefixPath,h.collectionGroup,h.documentId]);for(;u&&qd(u,m)<0;)n(u,null),u=o.getNext();u&&u.isEqual(m)&&(n(u,h),u=o.hasNext()?o.getNext():null),u?f.$n(bs(u)):f.done()})).next((()=>{for(;u;)n(u,null),u=o.hasNext()?o.getNext():null}))}getDocumentsMatchingQuery(e,t,n,s,i){const o=me(t)?X.fromString(Si(t)):t.path,u=[o.popLast().toArray(),o.lastSegment(),qo(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],c=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return Yt(e).Kn(IDBKeyRange.bound(u,c,!0)).next((h=>{i==null||i.incrementDocumentReadCount(h.length);let f=Te();for(const m of h){const _=this.Ns(F.fromSegments(m.prefixPath.concat(m.collectionGroup,m.documentId)),m);_.isFoundDocument()&&(Yp(t,_)||s.has(_.key))&&(f=f.insert(_.key,_))}return f}))}getAllFromCollectionGroup(e,t,n,s){let i=Te();const o=Bd(t,n),u=Bd(t,tt.max());return Yt(e).jn({index:Dp,range:IDBKeyRange.bound(o,u,!0)},((c,h,f)=>{const m=this.Ns(F.fromSegments(h.prefixPath.concat(h.collectionGroup,h.documentId)),h);i=i.insert(m.key,m),i.size===s&&f.done()})).next((()=>i))}newChangeBuffer(e){return new wA(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next((t=>t.byteSize))}getMetadata(e){return Ud(e).get(Nu).next((t=>(D(!!t,20021),t)))}Ms(e,t){return Ud(e).put(Nu,t)}Ns(e,t){if(t){const n=oA(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(j.min())))return n}return fe.newInvalidDocument(e)}}function Zp(r){return new TA(r)}class wA extends Xp{constructor(e,t){super(),this.qs=e,this.trackRemovals=t,this.$s=new qt((n=>n.toString()),((n,s)=>n.isEqual(s)))}applyChanges(e){const t=[];let n=0,s=new re(((i,o)=>G(i.canonicalString(),o.canonicalString())));return this.changes.forEach(((i,o)=>{const u=this.$s.get(i);if(t.push(this.qs.removeEntry(e,i,u.readTime)),o.isValidDocument()){const c=Pd(this.qs.serializer,o);s=s.add(i.path.popLast());const h=Bo(c);n+=h-u.size,t.push(this.qs.addEntry(e,i,c))}else if(n-=u.size,this.trackRemovals){const c=Pd(this.qs.serializer,o.convertToNoDocument(j.min()));t.push(this.qs.addEntry(e,i,c))}})),s.forEach((i=>{t.push(this.qs.indexManager.addToCollectionParentIndex(e,i))})),t.push(this.qs.updateMetadata(e,n)),A.waitFor(t)}getFromCache(e,t){return this.qs.Ls(e,t).next((n=>(this.$s.set(t,{size:n.size,readTime:n.document.readTime}),n.document)))}getAllFromCache(e,t){return this.qs.Us(e,t).next((({documents:n,ks:s})=>(s.forEach(((i,o)=>{this.$s.set(i,{size:o,readTime:n.get(i).readTime})})),n)))}}function Ud(r){return Ae(r,li)}function Yt(r){return Ae(r,Fo)}function bs(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function Bd(r,e){const t=e.documentKey.path.toArray();return[r,qo(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function qd(r,e){const t=r.path.toArray(),n=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<n.length-2;++i)if(s=G(t[i],n[i]),s)return s;return s=G(t.length,n.length),s||(s=G(t[t.length-2],n[n.length-2]),s||G(t[t.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class EA{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eg{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(n=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(n!==null&&Ls(n.mutation,s,Ke.empty(),se.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.getLocalViewOfDocuments(e,n,Q()).next((()=>n))))}getLocalViewOfDocuments(e,t,n=Q()){const s=rt();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,n).next((i=>{let o=kn();return i.forEach(((u,c)=>{o=o.insert(u,c.overlayedDocument)})),o}))))}getOverlayedDocuments(e,t){const n=rt();return this.populateOverlays(e,n,t).next((()=>this.computeViews(e,t,n,Q())))}populateOverlays(e,t,n){const s=[];return n.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((o,u)=>{t.set(o,u)}))}))}computeViews(e,t,n,s){let i=Te();const o=Us(),u=(function(){return Us()})();return t.forEach(((c,h)=>{const f=n.get(h.key);s.has(h.key)&&(f===void 0||f.mutation instanceof Bt)?i=i.insert(h.key,h):f!==void 0?(o.set(h.key,f.mutation.getFieldMask()),Ls(f.mutation,h,f.mutation.getFieldMask(),se.now())):o.set(h.key,Ke.empty())})),this.recalculateAndSaveOverlays(e,i).next((c=>(c.forEach(((h,f)=>o.set(h,f))),t.forEach(((h,f)=>u.set(h,new EA(f,o.get(h)??null)))),u)))}recalculateAndSaveOverlays(e,t){const n=Us();let s=new ae(((o,u)=>o-u)),i=Q();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((o=>{for(const u of o)u.keys().forEach((c=>{const h=t.get(c);if(h===null)return;let f=n.get(c)||Ke.empty();f=u.applyToLocalView(h,f),n.set(c,f);const m=(s.get(u.batchId)||Q()).add(c);s=s.insert(u.batchId,m)}))})).next((()=>{const o=[],u=s.getReverseIterator();for(;u.hasNext();){const c=u.getNext(),h=c.key,f=c.value,m=Lm();f.forEach((_=>{if(!i.has(_)){const R=Tm(t.get(_),n.get(_));R!==null&&m.set(_,R),i=i.add(_)}})),o.push(this.documentOverlayCache.saveOverlays(e,h,m))}return A.waitFor(o)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.recalculateAndSaveOverlays(e,n)))}getDocumentsMatchingQuery(e,t,n,s){return me(t)?this.getDocumentsMatchingPipeline(e,t,n,s):sw(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):iw(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next((i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):A.resolve(rt());let u=Ur,c=i;return o.next((h=>A.forEach(h,((f,m)=>(u<m.largestBatchId&&(u=m.largestBatchId),i.get(f)?A.resolve():this.remoteDocumentCache.getEntry(e,f).next((_=>{c=c.insert(f,_)}))))).next((()=>this.populateOverlays(e,h,i))).next((()=>this.computeViews(e,c,h,Q()))).next((f=>({batchId:u,changes:Om(f)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new F(t)).next((n=>{let s=kn();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let o=kn();return this.indexManager.getCollectionParents(e,i).next((u=>A.forEach(u,(c=>{const h=(function(m,_){return new sa(_,null,m.explicitOrderBy.slice(),m.filters.slice(),m.limit,m.limitType,m.startAt,m.endAt)})(t,c.child(i));return this.getDocumentsMatchingCollectionQuery(e,h,n,s).next((f=>{f.forEach(((m,_)=>{o=o.insert(m,_)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s)))).next((o=>this.retrieveMatchingLocalDocuments(i,o,(u=>oa(t,u)))))}getDocumentsMatchingPipeline(e,t,n,s){if(xt(t)==="collection_group"){const i=Dc(t);let o=kn();return this.indexManager.getCollectionParents(e,i).next((u=>A.forEach(u,(c=>{const h=(function(m,_){const R=m.stages.map((C=>C instanceof Ri?new Pi(_.canonicalString(),{}):C));return new Oe(m.serializer,R)})(t,c.child(i));return this.getDocumentsMatchingPipeline(e,h,n,s).next((f=>{f.forEach(((m,_)=>{o=o.insert(m,_)}))}))})).next((()=>o))))}{let i;return this.getOverlaysForPipeline(e,t,n.largestBatchId).next((o=>{switch(i=o,xt(t)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s);case"documents":let u=Q();for(const c of Oo(t))u=u.add(F.fromPath(c));return this.remoteDocumentCache.getEntries(e,u);case"database":return this.remoteDocumentCache.getAllEntries(e);default:throw new O("invalid-argument",`Invalid pipeline source to execute offline: ${Nt(t)}`)}})).next((o=>this.retrieveMatchingLocalDocuments(i,o,(u=>Ea(t,u)))))}}retrieveMatchingLocalDocuments(e,t,n){e.forEach(((i,o)=>{const u=o.getKey();t.get(u)===null&&(t=t.insert(u,fe.newInvalidDocument(u)))}));let s=kn();return t.forEach(((i,o)=>{const u=e.get(i);u!==void 0&&Ls(u.mutation,o,Ke.empty(),se.now()),n(o)&&(s=s.insert(i,o))})),s}getOverlaysForPipeline(e,t,n){switch(xt(t)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(e,X.fromString(Si(t)),n);case"collection_group":throw new O("invalid-argument",`Unexpected collection group pipeline: ${Nt(t)}`);case"documents":return this.documentOverlayCache.getOverlays(e,Oo(t).map((s=>F.fromPath(s))));case"database":return this.documentOverlayCache.getAllOverlays(e,n);default:throw new O("invalid-argument",`Failed to get overlays for pipeline: ${Nt(t)}`)}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vA{constructor(e){this.serializer=e,this.Ks=new Map,this.Qs=new Map}getBundleMetadata(e,t){return A.resolve(this.Ks.get(t))}saveBundleMetadata(e,t){return this.Ks.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:$e(s.createTime)}})(t)),A.resolve()}getNamedQuery(e,t){return A.resolve(this.Qs.get(t))}saveNamedQuery(e,t){return this.Qs.set(t.name,(function(s){return{name:s.name,query:Kp(s.bundledQuery),readTime:$e(s.readTime)}})(t)),A.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class AA{constructor(){this.overlays=new ae(F.comparator),this.Ws=new Map}getOverlay(e,t){return A.resolve(this.overlays.get(t))}getOverlays(e,t){const n=rt();return A.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}getAllOverlays(e,t){const n=rt();return this.overlays.forEach(((s,i)=>{i.largestBatchId>t&&n.set(s,i)})),A.resolve(n)}saveOverlays(e,t,n){return n.forEach(((s,i)=>{this.Yr(e,t,i)})),A.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.Ws.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.Ws.delete(n)),A.resolve()}getOverlaysForCollection(e,t,n){const s=rt(),i=t.length+1,o=new F(t.child("")),u=this.overlays.getIteratorFrom(o);for(;u.hasNext();){const c=u.getNext().value,h=c.getKey();if(!t.isPrefixOf(h.path))break;h.path.length===i&&c.largestBatchId>n&&s.set(c.getKey(),c)}return A.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new ae(((h,f)=>h-f));const o=this.overlays.getIterator();for(;o.hasNext();){const h=o.getNext().value;if(h.getKey().getCollectionGroup()===t&&h.largestBatchId>n){let f=i.get(h.largestBatchId);f===null&&(f=rt(),i=i.insert(h.largestBatchId,f)),f.set(h.getKey(),h)}}const u=rt(),c=i.getIterator();for(;c.hasNext()&&(c.getNext().value.forEach(((h,f)=>u.set(h,f))),!(u.size()>=s)););return A.resolve(u)}Yr(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.Ws.get(s.largestBatchId).delete(n.key);this.Ws.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new Wc(t,n));let i=this.Ws.get(t);i===void 0&&(i=Q(),this.Ws.set(t,i)),this.Ws.set(t,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PA{constructor(){this.sessionToken=he.EMPTY_BYTE_STRING}getSessionToken(e){return A.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,A.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jc{constructor(){this.Gs=new re(Re.zs),this.js=new re(Re.Hs)}isEmpty(){return this.Gs.isEmpty()}addReference(e,t){const n=new Re(e,t);this.Gs=this.Gs.add(n),this.js=this.js.add(n)}Js(e,t){e.forEach((n=>this.addReference(n,t)))}removeReference(e,t){this.Ys(new Re(e,t))}Zs(e,t){e.forEach((n=>this.removeReference(n,t)))}Xs(e){const t=new F(new X([])),n=new Re(t,e),s=new Re(t,e+1),i=[];return this.js.forEachInRange([n,s],(o=>{this.Ys(o),i.push(o.key)})),i}e_(){this.Gs.forEach((e=>this.Ys(e)))}Ys(e){this.Gs=this.Gs.delete(e),this.js=this.js.delete(e)}t_(e){const t=new F(new X([])),n=new Re(t,e),s=new Re(t,e+1);let i=Q();return this.js.forEachInRange([n,s],(o=>{i=i.add(o.key)})),i}containsKey(e){const t=new Re(e,0),n=this.Gs.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class Re{constructor(e,t){this.key=e,this.n_=t}static zs(e,t){return F.comparator(e.key,t.key)||G(e.n_,t.n_)}static Hs(e,t){return G(e.n_,t.n_)||F.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class RA{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Wr=1,this.r_=new re(Re.zs)}checkEmpty(e){return A.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.Wr;this.Wr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new qc(i,t,n,s);this.mutationQueue.push(o);for(const u of s)this.r_=this.r_.add(new Re(u.key,i)),this.indexManager.addToCollectionParentIndex(e,u.key.path.popLast());return A.resolve(o)}lookupMutationBatch(e,t){return A.resolve(this.i_(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.s_(n),i=s<0?0:s;return A.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return A.resolve(this.mutationQueue.length===0?$n:this.Wr-1)}getAllMutationBatches(e){return A.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new Re(t,0),s=new Re(t,Number.POSITIVE_INFINITY),i=[];return this.r_.forEachInRange([n,s],(o=>{const u=this.i_(o.n_);i.push(u)})),A.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new re(G);return t.forEach((s=>{const i=new Re(s,0),o=new Re(s,Number.POSITIVE_INFINITY);this.r_.forEachInRange([i,o],(u=>{n=n.add(u.n_)}))})),A.resolve(this.__(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;F.isDocumentKey(i)||(i=i.child(""));const o=new Re(new F(i),0);let u=new re(G);return this.r_.forEachWhile((c=>{const h=c.key.path;return!!n.isPrefixOf(h)&&(h.length===s&&(u=u.add(c.n_)),!0)}),o),A.resolve(this.__(u))}__(e){const t=[];return e.forEach((n=>{const s=this.i_(n);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){D(this.o_(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.r_;return A.forEach(t.mutations,(s=>{const i=new Re(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.r_=n}))}jr(e){}containsKey(e,t){const n=new Re(t,0),s=this.r_.firstAfterOrEqual(n);return A.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,A.resolve()}o_(e,t){return this.s_(e)}s_(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}i_(e){const t=this.s_(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bA{constructor(e){this.a_=e,this.docs=(function(){return new ae(F.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,o=this.a_(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return A.resolve(n?n.document.mutableCopy():fe.newInvalidDocument(t))}getEntries(e,t){let n=Te();return t.forEach((s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():fe.newInvalidDocument(s))})),A.resolve(n)}getAllEntries(e){let t=Te();return this.docs.forEach(((n,s)=>{t=t.insert(n,s.document)})),A.resolve(t)}getDocumentsMatchingQuery(e,t,n,s){let i,o;me(t)?(i=X.fromString(Si(t)),o=f=>Ea(t,f)):(i=t.path,o=f=>oa(t,f));let u=Te();const c=new F(i.child("__id-9223372036854775808__")),h=this.docs.getIteratorFrom(c);for(;h.hasNext();){const{key:f,value:{document:m}}=h.getNext();if(!i.isPrefixOf(f.path))break;f.path.length>i.length+1||yc(xm(m),n)<=0||(s.has(m.key)||o(m))&&(u=u.insert(m.key,m.mutableCopy()))}return A.resolve(u)}getAllFromCollectionGroup(e,t,n,s){B(9500)}u_(e,t){return A.forEach(this.docs,(n=>t(n)))}newChangeBuffer(e){return new SA(this)}getSize(e){return A.resolve(this.size)}}class SA extends Xp{constructor(e){super(),this.qs=e}applyChanges(e){const t=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?t.push(this.qs.addEntry(e,s)):this.qs.removeEntry(n)})),A.waitFor(t)}getFromCache(e,t){return this.qs.getEntry(e,t)}getAllFromCache(e,t){return this.qs.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class VA{constructor(e){this.persistence=e,this.c_=new qt((t=>ga(t)),Bc),this.lastRemoteSnapshotVersion=j.min(),this.highestTargetId=0,this.l_=0,this.E_=new Jc,this.targetCount=0,this.h_=Ft.ys()}forEachTarget(e,t){return this.c_.forEach(((n,s)=>t(s))),A.resolve()}getLastRemoteSnapshotVersion(e){return A.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return A.resolve(this.l_)}allocateTargetId(e){return this.highestTargetId=this.h_.next(),A.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.l_&&(this.l_=t),A.resolve()}vs(e){this.c_.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.h_=new Ft(t),this.highestTargetId=t),e.sequenceNumber>this.l_&&(this.l_=e.sequenceNumber)}addTargetData(e,t){return this.vs(t),this.targetCount+=1,A.resolve()}updateTargetData(e,t){return this.vs(t),A.resolve()}removeTargetData(e,t){return this.c_.delete(t.target),this.E_.Xs(t.targetId),this.targetCount-=1,A.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.c_.forEach(((o,u)=>{u.sequenceNumber<=t&&n.get(u.targetId)===null&&(this.c_.delete(o),i.push(this.removeMatchingKeysForTargetId(e,u.targetId)),s++)})),A.waitFor(i).next((()=>s))}getTargetCount(e){return A.resolve(this.targetCount)}getTargetData(e,t){const n=this.c_.get(t)||null;return A.resolve(n)}addMatchingKeys(e,t,n){return this.E_.Js(t,n),A.resolve()}removeMatchingKeys(e,t,n){this.E_.Zs(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((o=>{i.push(s.markPotentiallyOrphaned(e,o))})),A.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.E_.Xs(t),A.resolve()}getMatchingKeysForTargetId(e,t){const n=this.E_.t_(t);return A.resolve(n)}containsKey(e,t){return A.resolve(this.E_.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yc{constructor(e,t){this.T_={},this.overlays={},this.P_=new Ge(0),this.R_=!1,this.R_=!0,this.I_=new PA,this.referenceDelegate=e(this),this.A_=new VA(this),this.indexManager=new pA,this.remoteDocumentCache=(function(s){return new bA(s)})((n=>this.referenceDelegate.V_(n))),this.serializer=new $p(t),this.d_=new vA(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.R_=!1,Promise.resolve()}get started(){return this.R_}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new AA,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.T_[e.toKey()];return n||(n=new RA(t,this.referenceDelegate),this.T_[e.toKey()]=n),n}getGlobalsCache(){return this.I_}getTargetCache(){return this.A_}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.d_}runTransaction(e,t,n){N("MemoryPersistence","Starting transaction:",e);const s=new CA(this.P_.next());return this.referenceDelegate.f_(),n(s).next((i=>this.referenceDelegate.m_(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}p_(e,t){return A.or(Object.values(this.T_).map((n=>()=>n.containsKey(e,t))))}}class CA extends ip{constructor(e){super(),this.currentSequenceNumber=e}}class va{constructor(e){this.persistence=e,this.g_=new Jc,this.y_=null}static w_(e){return new va(e)}get b_(){if(this.y_)return this.y_;throw B(60996)}addReference(e,t,n){return this.g_.addReference(n,t),this.b_.delete(n.toString()),A.resolve()}removeReference(e,t,n){return this.g_.removeReference(n,t),this.b_.add(n.toString()),A.resolve()}markPotentiallyOrphaned(e,t){return this.b_.add(t.toString()),A.resolve()}removeTarget(e,t){this.g_.Xs(t.targetId).forEach((s=>this.b_.add(s.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.b_.add(i.toString())))})).next((()=>n.removeTargetData(e,t)))}f_(){this.y_=new Set}m_(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return A.forEach(this.b_,(n=>{const s=F.fromPath(n);return this.S_(e,s).next((i=>{i||t.removeEntry(s,j.min())}))})).next((()=>(this.y_=null,t.apply(e))))}updateLimboDocument(e,t){return this.S_(e,t).next((n=>{n?this.b_.delete(t.toString()):this.b_.add(t.toString())}))}V_(e){return 0}S_(e,t){return A.or([()=>A.resolve(this.g_.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.p_(e,t)])}}class $o{constructor(e,t){this.persistence=e,this.v_=new qt((n=>Me(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=cp(this,t)}static w_(e,t){return new $o(e,t)}f_(){}m_(e){return A.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}rr(e){const t=this.xs(e);return this.persistence.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}xs(e){let t=0;return this.ir(e,(n=>{t++})).next((()=>t))}ir(e,t){return A.forEach(this.v_,((n,s)=>this.Fs(e,n,s).next((i=>i?A.resolve():t(s)))))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.u_(e,(o=>this.Fs(e,o,t).next((u=>{u||(n++,i.removeEntry(o,j.min()))})))).next((()=>i.apply(e))).next((()=>n))}markPotentiallyOrphaned(e,t){return this.v_.set(t,e.currentSequenceNumber),A.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.v_.set(n,e.currentSequenceNumber),A.resolve()}removeReference(e,t,n){return this.v_.set(n,e.currentSequenceNumber),A.resolve()}updateLimboDocument(e,t){return this.v_.set(t,e.currentSequenceNumber),A.resolve()}V_(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=uo(e.data.value)),t}Fs(e,t,n){return A.or([()=>this.persistence.p_(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.v_.get(t);return A.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xA{constructor(e){this.serializer=e}Mn(e,t,n,s){const i=new ca("createOrUpgrade",t);n<1&&s>=1&&((function(c){c.createObjectStore(Ci)})(e),(function(c){c.createObjectStore(ci,{keyPath:Ov}),c.createObjectStore(at,{keyPath:vd,autoIncrement:!0}).createIndex(qn,Ad,{unique:!0}),c.createObjectStore(qr)})(e),jd(e),(function(c){c.createObjectStore(Dn)})(e));let o=A.resolve();return n<3&&s>=3&&(n!==0&&((function(c){c.deleteObjectStore($r),c.deleteObjectStore(jr),c.deleteObjectStore(Gn)})(e),jd(e)),o=o.next((()=>(function(c){const h=c.store(Gn),f={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:j.min().toTimestamp(),targetCount:0};return h.put(Uo,f)})(i)))),n<4&&s>=4&&(n!==0&&(o=o.next((()=>(function(c,h){return h.store(at).Kn().next((m=>{c.deleteObjectStore(at),c.createObjectStore(at,{keyPath:vd,autoIncrement:!0}).createIndex(qn,Ad,{unique:!0});const _=h.store(at),R=m.map((C=>_.put(C)));return A.waitFor(R)}))})(e,i)))),o=o.next((()=>{(function(c){c.createObjectStore(zr,{keyPath:zv})})(e)}))),n<5&&s>=5&&(o=o.next((()=>this.D_(i)))),n<6&&s>=6&&(o=o.next((()=>((function(c){c.createObjectStore(li)})(e),this.x_(i))))),n<7&&s>=7&&(o=o.next((()=>this.C_(i)))),n<8&&s>=8&&(o=o.next((()=>this.F_(e,i)))),n<9&&s>=9&&(o=o.next((()=>{(function(c){c.objectStoreNames.contains("remoteDocumentChanges")&&c.deleteObjectStore("remoteDocumentChanges")})(e)}))),n<10&&s>=10&&(o=o.next((()=>this.O_(i)))),n<11&&s>=11&&(o=o.next((()=>{(function(c){c.createObjectStore(_a,{keyPath:Kv})})(e),(function(c){c.createObjectStore(ya,{keyPath:Gv})})(e)}))),n<12&&s>=12&&(o=o.next((()=>{(function(c){const h=c.createObjectStore(Ia,{keyPath:Zv});h.createIndex(ku,eA,{unique:!1}),h.createIndex(Mp,tA,{unique:!1})})(e)}))),n<13&&s>=13&&(o=o.next((()=>(function(c){const h=c.createObjectStore(Fo,{keyPath:Mv});h.createIndex(go,Fv),h.createIndex(Dp,Uv)})(e))).next((()=>this.M_(e,i))).next((()=>e.deleteObjectStore(Dn)))),n<14&&s>=14&&(o=o.next((()=>this.N_(e,i)))),n<15&&s>=15&&(o=o.next((()=>(function(c){c.createObjectStore(zc,{keyPath:Wv,autoIncrement:!0}).createIndex(Du,Hv,{unique:!1}),c.createObjectStore($s,{keyPath:Qv}).createIndex(Op,Jv,{unique:!1}),c.createObjectStore(zs,{keyPath:Yv}).createIndex(Lp,Xv,{unique:!1})})(e)))),n<16&&s>=16&&(o=o.next((()=>{t.objectStore($s).clear()})).next((()=>{t.objectStore(zs).clear()}))),n<17&&s>=17&&(o=o.next((()=>{(function(c){c.createObjectStore(Kc,{keyPath:nA})})(e)}))),n<18&&s>=18&&ff()&&(o=o.next((()=>{t.objectStore($s).clear()})).next((()=>{t.objectStore(zs).clear()}))),o}x_(e){let t=0;return e.store(Dn).jn(((n,s)=>{t+=Bo(s)})).next((()=>{const n={byteSize:t};return e.store(li).put(Nu,n)}))}D_(e){const t=e.store(ci),n=e.store(at);return t.Kn().next((s=>A.forEach(s,(i=>{const o=IDBKeyRange.bound([i.userId,$n],[i.userId,i.lastAcknowledgedBatchId]);return n.Kn(qn,o).next((u=>A.forEach(u,(c=>{D(c.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:c.batchId});const h=Ln(this.serializer,c);return jp(e,i.userId,h).next((()=>{}))}))))}))))}C_(e){const t=e.store($r),n=e.store(Dn);return e.store(Gn).get(Uo).next((s=>{const i=[];return n.jn(((o,u)=>{const c=new X(o),h=(function(m){return[0,Me(m)]})(c);i.push(t.get(h).next((f=>f?A.resolve():(m=>t.put({targetId:0,path:Me(m),sequenceNumber:s.highestListenSequenceNumber}))(c))))})).next((()=>A.waitFor(i)))}))}F_(e,t){e.createObjectStore(hi,{keyPath:$v});const n=t.store(hi),s=new Qc,i=o=>{if(s.add(o)){const u=o.lastSegment(),c=o.popLast();return n.put({collectionId:u,parent:Me(c)})}};return t.store(Dn).jn({zn:!0},((o,u)=>{const c=new X(o);return i(c.popLast())})).next((()=>t.store(qr).jn({zn:!0},(([o,u,c],h)=>{const f=yt(u);return i(f.popLast())}))))}O_(e){const t=e.store(jr);return t.jn(((n,s)=>{const i=Ns(this.serializer,s),o=zp(this.serializer,i);return t.put(o)}))}M_(e,t){const n=t.store(Dn),s=[];return n.jn(((i,o)=>{const u=t.store(Fo),c=(function(m){return m.document?new F(X.fromString(m.document.name).popFirst(5)):m.noDocument?F.fromSegments(m.noDocument.path):m.unknownDocument?F.fromSegments(m.unknownDocument.path):B(36783)})(o).path.toArray(),h={prefixPath:c.slice(0,c.length-2),collectionGroup:c[c.length-2],documentId:c[c.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(u.put(h))})).next((()=>A.waitFor(s)))}N_(e,t){const n=t.store(at),s=Zp(this.serializer),i=new Yc(va.w_,this.serializer.qr);return n.Kn().next((o=>{const u=new Map;return o.forEach((c=>{let h=u.get(c.userId)??Q();Ln(this.serializer,c).keys().forEach((f=>h=h.add(f))),u.set(c.userId,h)})),A.forEach(u,((c,h)=>{const f=new be(h),m=wa.Kr(this.serializer,f),_=i.getIndexManager(f),R=Ta.Kr(f,this.serializer,_,i.referenceDelegate);return new eg(s,R,m,_).recalculateAndSaveOverlaysForDocumentKeys(new Ou(t,Ge.yn),c).next()}))}))}}function jd(r){r.createObjectStore($r,{keyPath:qv}).createIndex($c,jv,{unique:!0}),r.createObjectStore(jr,{keyPath:"targetId"}).createIndex(kp,Bv,{unique:!0}),r.createObjectStore(Gn)}const Xt="IndexedDbPersistence",ou=18e5,au=5e3,uu="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",NA="main";class Xc{constructor(e,t,n,s,i,o,u,c,h,f,m=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.xt=i,this.window=o,this.document=u,this.L_=h,this.B_=f,this.U_=m,this.P_=null,this.R_=!1,this.isPrimary=!1,this.networkEnabled=!0,this.k_=null,this.inForeground=!1,this.q_=null,this.K_=null,this.Q_=Number.NEGATIVE_INFINITY,this.W_=_=>Promise.resolve(),!Xc.Je())throw new O(x.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new yA(this,s),this.G_=t+NA,this.serializer=new $p(c),this.z_=new cn(this.G_,this.U_,new xA(this.serializer)),this.I_=new cA,this.A_=new _A(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Zp(this.serializer),this.d_=new uA,this.window&&this.window.localStorage?this.j_=this.window.localStorage:(this.j_=null,f===!1&&pe(Xt,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.H_().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new O(x.FAILED_PRECONDITION,uu);return this.J_(),this.Y_(),this.Z_(),this.runTransaction("getHighestListenSequenceNumber","readonly",(e=>this.A_.getHighestSequenceNumber(e)))})).then((e=>{this.P_=new Ge(e,this.L_)})).then((()=>{this.R_=!0})).catch((e=>(this.z_&&this.z_.close(),Promise.reject(e))))}X_(e){return this.W_=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.z_.Ln((async t=>{t.newVersion===null&&await e()}))}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.xt.enqueueAndForget((async()=>{this.started&&await this.H_()})))}H_(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(e=>no(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.eo(e).next((t=>{t||(this.isPrimary=!1,this.xt.enqueueRetryable((()=>this.W_(!1))))}))})).next((()=>this.no(e))).next((t=>this.isPrimary&&!t?this.ro(e).next((()=>!1)):!!t&&this.io(e).next((()=>!0)))))).catch((e=>{if(vn(e))return N(Xt,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return N(Xt,"Releasing owner lease after error during lease refresh",e),!1})).then((e=>{this.isPrimary!==e&&this.xt.enqueueRetryable((()=>this.W_(e))),this.isPrimary=e}))}eo(e){return Ss(e).get(fr).next((t=>A.resolve(this.so(t))))}_o(e){return no(e).delete(this.clientId)}async oo(){if(this.isPrimary&&!this.ao(this.Q_,ou)){this.Q_=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const n=Ae(t,zr);return n.Kn().next((s=>{const i=this.uo(s,ou),o=s.filter((u=>i.indexOf(u)===-1));return A.forEach(o,(u=>n.delete(u.clientId))).next((()=>o))}))})).catch((()=>[]));if(this.j_)for(const t of e)this.j_.removeItem(this.co(t.clientId))}}Z_(){this.K_=this.xt.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.H_().then((()=>this.oo())).then((()=>this.Z_()))))}so(e){return!!e&&e.ownerId===this.clientId}no(e){return this.B_?A.resolve(!0):Ss(e).get(fr).next((t=>{if(t!==null&&this.ao(t.leaseTimestampMs,au)&&!this.lo(t.ownerId)){if(this.so(t)&&this.networkEnabled)return!0;if(!this.so(t)){if(!t.allowTabSynchronization)throw new O(x.FAILED_PRECONDITION,uu);return!1}}return!(!this.networkEnabled||!this.inForeground)||no(e).Kn().next((n=>this.uo(n,au).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,u=this.networkEnabled===s.networkEnabled;if(i||o&&u)return!0}return!1}))===void 0))})).next((t=>(this.isPrimary!==t&&N(Xt,`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.R_=!1,this.Eo(),this.K_&&(this.K_.cancel(),this.K_=null),this.ho(),this.To(),await this.z_.runTransaction("shutdown","readwrite",[Ci,zr],(e=>{const t=new Ou(e,Ge.yn);return this.ro(t).next((()=>this._o(t)))})),this.z_.close(),this.Po()}uo(e,t){return e.filter((n=>this.ao(n.updateTimeMs,t)&&!this.lo(n.clientId)))}Ro(){return this.runTransaction("getActiveClients","readonly",(e=>no(e).Kn().next((t=>this.uo(t,ou).map((n=>n.clientId))))))}get started(){return this.R_}getGlobalsCache(){return this.I_}getMutationQueue(e,t){return Ta.Kr(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.A_}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new gA(e,this.serializer.qr.databaseId)}getDocumentOverlayCache(e){return wa.Kr(this.serializer,e)}getBundleCache(){return this.d_}runTransaction(e,t,n){N(Xt,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=(function(c){return c===18?iA:c===17?qp:c===16?sA:c===15?Gc:c===14?Bp:c===13?Up:c===12?rA:c===11?Fp:void B(60245)})(this.U_);let o;return this.z_.runTransaction(e,s,i,(u=>(o=new Ou(u,this.P_?this.P_.next():Ge.yn),t==="readwrite-primary"?this.eo(o).next((c=>!!c||this.no(o))).next((c=>{if(!c)throw pe(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.xt.enqueueRetryable((()=>this.W_(!1))),new O(x.FAILED_PRECONDITION,sp);return n(o)})).next((c=>this.io(o).next((()=>c)))):this.Io(o).next((()=>n(o)))))).then((u=>(o.raiseOnCommittedEvent(),u)))}Io(e){return Ss(e).get(fr).next((t=>{if(t!==null&&this.ao(t.leaseTimestampMs,au)&&!this.lo(t.ownerId)&&!this.so(t)&&!(this.B_||this.allowTabSynchronization&&t.allowTabSynchronization))throw new O(x.FAILED_PRECONDITION,uu)}))}io(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return Ss(e).put(fr,t)}static Je(){return cn.Je()}ro(e){const t=Ss(e);return t.get(fr).next((n=>this.so(n)?(N(Xt,"Releasing primary lease."),t.delete(fr)):A.resolve()))}ao(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||(pe(`Detected an update time that is in the future: ${e} > ${n}`),!1))}J_(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.q_=()=>{this.xt.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.H_())))},this.document.addEventListener("visibilitychange",this.q_),this.inForeground=this.document.visibilityState==="visible")}ho(){this.q_&&(this.document.removeEventListener("visibilitychange",this.q_),this.q_=null)}Y_(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.k_=()=>{this.Eo();const t=/(?:Version|Mobile)\/1[456]/;df()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.xt.enterRestrictedMode(!0),this.xt.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.k_))}To(){this.k_&&(this.window.removeEventListener("pagehide",this.k_),this.k_=null)}lo(e){var t;try{const n=((t=this.j_)==null?void 0:t.getItem(this.co(e)))!==null;return N(Xt,`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return pe(Xt,"Failed to get zombied client id.",n),!1}}Eo(){if(this.j_)try{this.j_.setItem(this.co(this.clientId),String(Date.now()))}catch(e){pe("Failed to set zombie client id.",e)}}Po(){if(this.j_)try{this.j_.removeItem(this.co(this.clientId))}catch{}}co(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function Ss(r){return Ae(r,Ci)}function no(r){return Ae(r,zr)}function tg(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zc{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Ao=n,this.Vo=s}static fo(e,t){let n=Q(),s=Q();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new Zc(e,t.fromCache,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function DA(r,e){return F.comparator(r.key,e.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kA{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ng{constructor(){this.mo=!1,this.po=!1,this.yo=100,this.wo=(function(){return df()?8:op(ve())>0?6:4})()}initialize(e,t){this.bo=e,this.indexManager=t,this.mo=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.So(e,t).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.vo(e,t,s,n).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new kA;return this.Do(e,t,o).next((u=>{if(i.result=u,this.po)return this.xo(e,t,o,u.size)}))})).next((()=>i.result))}xo(e,t,n,s){return me(t)?A.resolve():n.documentReadCount<this.yo?(Ir()<=Y.DEBUG&&N("QueryEngine","SDK will not create cache indexes for query:",Fs(t),"since it only creates cache indexes for collection contains","more than or equal to",this.yo,"documents"),A.resolve()):(Ir()<=Y.DEBUG&&N("QueryEngine","Query:",Fs(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.wo*s?(Ir()<=Y.DEBUG&&N("QueryEngine","The SDK decides to create cache indexes for query:",Fs(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,et(t))):A.resolve())}So(e,t){if(me(t))return A.resolve(null);let n=t;if(rd(n))return A.resolve(null);let s=et(n);return this.indexManager.getIndexType(e,s).next((i=>i===0?null:(n.limit!==null&&i===1&&(n=Ru(n,null,"F"),s=et(n)),this.indexManager.getDocumentsMatchingTarget(e,s).next((o=>{const u=Q(...o);return this.bo.getDocuments(e,u).next((c=>this.indexManager.getMinOffset(e,s).next((h=>{const f=this.Co(n,c);return this.Fo(n,f,u,h.readTime)?this.So(e,Ru(n,null,"F")):this.Oo(e,f,n,h)}))))})))))}vo(e,t,n,s){return(me(t)?(function(o){for(const u of o.stages){if(u instanceof _n||u instanceof Td)return!1;if(u instanceof bi){if(u.condition instanceof Ip&&u.condition._expr.name==="exists"&&u.condition._expr.params[0]instanceof or&&u.condition._expr.params[0].fieldName===pt)continue;return!1}}return!0})(t):rd(t))||s.isEqual(j.min())?A.resolve(null):this.bo.getDocuments(e,n).next((i=>{const o=this.Co(t,i);return this.Fo(t,o,n,s)?A.resolve(null):(Ir()<=Y.DEBUG&&N("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),wd(t)),this.Oo(e,o,t,Cm(s,Ur)).next((u=>u)))}))}Co(e,t){let n,s;return me(e)?(n=new re(DA),s=i=>Ea(e,i)):(n=new re(wc(e)),s=i=>oa(e,i)),t.forEach(((i,o)=>{s(o)&&(n=n.add(o))})),n}Fo(e,t,n,s){if(me(e))return(function(u){return u.stages.some((c=>c instanceof _n||c instanceof Td))})(e);if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Do(e,t,n){return Ir()<=Y.DEBUG&&N("QueryEngine","Using full collection scan to execute query:",wd(t)),this.bo.getDocumentsMatchingQuery(e,t,tt.min(),n)}Oo(e,t,n,s){return this.bo.getDocumentsMatchingQuery(e,n,s).next((i=>(t.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const el="LocalStore",OA=3e8;class LA{constructor(e,t,n,s){this.persistence=e,this.Mo=t,this.serializer=s,this.No=new ae(G),this.Lo=new qt((i=>ga(i)),Bc),this.Bo=new Map,this.Uo=e.getRemoteDocumentCache(),this.A_=e.getTargetCache(),this.d_=e.getBundleCache(),this.ko(n)}ko(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new eg(this.Uo,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Uo.setIndexManager(this.indexManager),this.Mo.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.No)))}}function rg(r,e,t,n){return new LA(r,e,t,n)}async function sg(r,e){const t=q(r);return await t.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,t.ko(e),t.mutationQueue.getAllMutationBatches(n)))).next((i=>{const o=[],u=[];let c=Q();for(const h of s){o.push(h.batchId);for(const f of h.mutations)c=c.add(f.key)}for(const h of i){u.push(h.batchId);for(const f of h.mutations)c=c.add(f.key)}return t.localDocuments.getDocuments(n,c).next((h=>({qo:h,removedBatchIds:o,addedBatchIds:u})))}))}))}function MA(r,e){const t=q(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{const s=e.batch.keys(),i=t.Uo.newChangeBuffer({trackRemovals:!0});return(function(u,c,h,f){const m=h.batch,_=m.keys();let R=A.resolve();return _.forEach((C=>{R=R.next((()=>f.getEntry(c,C))).next((U=>{const L=h.docVersions.get(C);D(L!==null,48541),U.version.compareTo(L)<0&&(m.applyToRemoteDocument(U,h),U.isValidDocument()&&(U.setReadTime(h.commitVersion),f.addEntry(U)))}))})),R.next((()=>u.mutationQueue.removeMutationBatch(c,m)))})(t,n,e,i).next((()=>i.apply(n))).next((()=>t.mutationQueue.performConsistencyCheck(n))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(u){let c=Q();for(let h=0;h<u.mutationResults.length;++h)u.mutationResults[h].transformResults.length>0&&(c=c.add(u.batch.mutations[h].key));return c})(e)))).next((()=>t.localDocuments.getDocuments(n,s)))}))}function ig(r){const e=q(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.A_.getLastRemoteSnapshotVersion(t)))}function FA(r,e){const t=q(r),n=e.snapshotVersion;let s=t.No;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=t.Uo.newChangeBuffer({trackRemovals:!0});s=t.No;const u=[];e.targetChanges.forEach(((f,m)=>{const _=s.get(m);if(!_)return;u.push(t.A_.removeMatchingKeys(i,f.removedDocuments,m).next((()=>t.A_.addMatchingKeys(i,f.addedDocuments,m))));let R=_.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(m)!==null?R=R.withResumeToken(he.EMPTY_BYTE_STRING,j.min()).withLastLimboFreeSnapshotVersion(j.min()):f.resumeToken.approximateByteSize()>0&&(R=R.withResumeToken(f.resumeToken,n)),s=s.insert(m,R),(function(U,L,z){return U.resumeToken.approximateByteSize()===0||L.snapshotVersion.toMicroseconds()-U.snapshotVersion.toMicroseconds()>=OA?!0:z.addedDocuments.size+z.modifiedDocuments.size+z.removedDocuments.size>0})(_,R,f)&&u.push(t.A_.updateTargetData(i,R))}));let c=Te(),h=Q();if(e.documentUpdates.forEach((f=>{e.resolvedLimboDocuments.has(f)&&u.push(t.persistence.referenceDelegate.updateLimboDocument(i,f))})),u.push(UA(i,o,e.documentUpdates).next((f=>{c=f.$o,h=f.Ko}))),!n.isEqual(j.min())){const f=t.A_.getLastRemoteSnapshotVersion(i).next((m=>t.A_.setTargetsMetadata(i,i.currentSequenceNumber,n)));u.push(f)}return A.waitFor(u).next((()=>o.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,c,h))).next((()=>c))})).then((i=>(t.No=s,i)))}function UA(r,e,t){let n=Q(),s=Q();return t.forEach((i=>n=n.add(i))),e.getEntries(r,n).next((i=>{let o=Te();return t.forEach(((u,c)=>{const h=i.get(u);c.isFoundDocument()!==h.isFoundDocument()&&(s=s.add(u)),c.isNoDocument()&&c.version.isEqual(j.min())?(e.removeEntry(u,c.readTime),o=o.insert(u,c)):!h.isValidDocument()||c.version.compareTo(h.version)>0||c.version.compareTo(h.version)===0&&h.hasPendingWrites?(e.addEntry(c),o=o.insert(u,c)):N(el,"Ignoring outdated watch update for ",u,". Current version:",h.version," Watch version:",c.version)})),{$o:o,Ko:s}}))}function BA(r,e){const t=q(r);return t.persistence.runTransaction("Get next mutation batch","readonly",(n=>(e===void 0&&(e=$n),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e))))}function zo(r,e){const t=q(r);return t.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return t.A_.getTargetData(n,e).next((i=>i?(s=i,A.resolve(s)):t.A_.allocateTargetId(n).next((o=>(s=new It(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.A_.addTargetData(n,s).next((()=>s)))))))})).then((n=>{const s=t.No.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.No=t.No.insert(n.targetId,n),t.Lo.set(e,n.targetId)),n}))}async function Kr(r,e,t){const n=q(r),s=n.No.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,(o=>n.persistence.referenceDelegate.removeTarget(o,s)))}catch(o){if(!vn(o))throw o;N(el,`Failed to update sequence numbers for target ${e}: ${o}`)}n.No=n.No.remove(e),n.Lo.delete(s.target)}function qu(r,e,t){const n=q(r);let s=j.min(),i=Q();return n.persistence.runTransaction("Execute query","readwrite",(o=>(function(c,h,f){const m=q(c),_=m.Lo.get(f);return _!==void 0?A.resolve(m.No.get(_)):m.A_.getTargetData(h,f)})(n,o,me(e)?e:et(e)).next((u=>{if(u)return s=u.lastLimboFreeSnapshotVersion,n.A_.getMatchingKeysForTargetId(o,u.targetId).next((c=>{i=c}))})).next((()=>n.Mo.getDocumentsMatchingQuery(o,e,t?s:j.min(),t?i:Q()))).next((u=>(ag(n,u),{documents:u,Qo:i})))))}function og(r,e){const t=q(r),n=q(t.A_),s=t.No.get(e);return s?Promise.resolve(s.target??null):t.persistence.runTransaction("Get target data","readonly",(i=>n.ge(i,e).next((o=>(o==null?void 0:o.target)??null))))}function ju(r,e){const t=q(r),n=t.Bo.get(e)||j.min();return t.persistence.runTransaction("Get new document changes","readonly",(s=>t.Uo.getAllFromCollectionGroup(s,e,Cm(n,Ur),Number.MAX_SAFE_INTEGER))).then((s=>(ag(t,s),s)))}function ag(r,e){e.forEach(((t,n)=>{const s=n.key.getCollectionGroup(),i=r.Bo.get(s)||j.min();n.readTime.compareTo(i)>0&&r.Bo.set(s,n.readTime)}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qA{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.Jo=0,this.Yo=null,this.Zo=!0}Xo(){this.Jo===0&&(this.ea("Unknown"),this.Yo=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this.Yo=null,this.ta("Backend didn't respond within 10 seconds."),this.ea("Offline"),Promise.resolve()))))}na(e){this.state==="Online"?this.ea("Unknown"):(this.Jo++,this.Jo>=1&&(this.ra(),this.ta(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ea("Offline")))}set(e){this.ra(),this.Jo=0,e==="Online"&&(this.Zo=!1),this.ea(e)}ea(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}ta(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Zo?(pe(t),this.Zo=!1):N("OnlineStateTracker",t)}ra(){this.Yo!==null&&(this.Yo.cancel(),this.Yo=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pt="RemoteStore";class jA{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.ia=[],this.sa=new Map,this._a=new Map,this.oa=new Map,this.aa=new Ft(1e3),this.ua=new Ft(1001),this.ca=new Set,this.la=[],this.Ea=i,this.Ea.Ke((o=>{n.enqueueAndForget((async()=>{ur(this)&&(N(Pt,"Restarting streams for network reachability change."),await(async function(c){const h=q(c);h.ca.add(4),await xi(h),h.ha.set("Unknown"),h.ca.delete(4),await Aa(h)})(this))}))})),this.ha=new qA(n,s)}}async function Aa(r){if(ur(r))for(const e of r.la)await e(!0)}async function xi(r){for(const e of r.la)await e(!1)}function $u(r,e){return r._a.get(e)||void 0}function Pa(r,e){const t=q(r),n=$u(t,e.targetId);if(n!==void 0&&t.sa.has(n))return;const s=(function(u,c){const h=$u(u,c);h!==void 0&&u.oa.delete(h);const f=(function(_,R){return R%2!=0?_.ua.next():_.aa.next()})(u,c);return u._a.set(c,f),u.oa.set(f,c),f})(t,e.targetId);N(Pt,"remoteStoreListen mapping SDK target ID to remote",e.targetId,s);const i=new It(e.target,s,e.purpose,e.sequenceNumber,e.snapshotVersion,e.lastLimboFreeSnapshotVersion,e.resumeToken);t.sa.set(s,i),rl(t)?nl(t):is(t).Jt()&&tl(t,i)}function Gr(r,e){const t=q(r),n=is(t),s=$u(t,e);N(Pt,"remoteStoreUnlisten removing mapping of SDK target ID to remote",e,s),t.sa.delete(s),t._a.delete(e),t.oa.delete(s),n.Jt()&&ug(t,s),t.sa.size===0&&(n.Jt()?n.Xt():ur(t)&&t.ha.set("Unknown"))}function tl(r,e){if(r.Ta.H(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(j.min())>0){const t=r.oa.get(e.targetId);if(t===void 0)return void N(Pt,"SDK target ID not found for remote ID: "+e.targetId);const n=r.remoteSyncer.getRemoteKeysForTarget(t).size;e=e.withExpectedCount(n)}is(r).Tn(e)}function ug(r,e){r.Ta.H(e),is(r).Pn(e)}function nl(r){r.Ta=new _w({getRemoteKeysForTarget:e=>{const t=r.oa.get(e);return t!==void 0?r.remoteSyncer.getRemoteKeysForTarget(t):Q()},ge:e=>r.sa.get(e)||null,Ae:()=>r.datastore.serializer.databaseId}),is(r).start(),r.ha.Xo()}function rl(r){return ur(r)&&!is(r).Ht()&&r.sa.size>0}function ur(r){return q(r).ca.size===0}function cg(r){r.Ta=void 0}async function $A(r){r.ha.set("Online")}async function zA(r){r.sa.forEach(((e,t)=>{tl(r,e)}))}async function KA(r,e){cg(r),rl(r)?(r.ha.na(e),nl(r)):r.ha.set("Unknown")}async function GA(r,e,t){if(r.ha.set("Online"),e instanceof Fm&&e.state===2&&e.cause)try{await(async function(s,i){const o=i.cause;for(const u of i.targetIds){if(s.sa.has(u)){const c=s.oa.get(u);c!==void 0&&(await s.remoteSyncer.rejectListen(c,o),s._a.delete(c),s.oa.delete(u)),s.sa.delete(u)}s.Ta.removeTarget(u)}})(r,e)}catch(n){N(Pt,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Ko(r,n)}else if(e instanceof ho?r.Ta.se(e):e instanceof Mm?r.Ta.Ee(e):r.Ta.ae(e),!t.isEqual(j.min()))try{const n=await ig(r.localStore);t.compareTo(n)>=0&&await(function(i,o){const u=i.Ta.de(o);u.targetChanges.forEach(((h,f)=>{if(h.resumeToken.approximateByteSize()>0){const m=i.sa.get(f);m&&i.sa.set(f,m.withResumeToken(h.resumeToken,o))}})),u.targetMismatches.forEach(((h,f)=>{const m=i.sa.get(h);if(!m)return;i.sa.set(h,m.withResumeToken(he.EMPTY_BYTE_STRING,m.snapshotVersion)),ug(i,h);const _=new It(m.target,h,f,m.sequenceNumber);tl(i,_)}));const c=(function(f,m){const _=new Map;m.targetChanges.forEach(((C,U)=>{const L=f.oa.get(U);L!==void 0&&_.set(L,C)}));let R=new ae(G);return m.targetMismatches.forEach(((C,U)=>{const L=f.oa.get(C);L!==void 0&&(R=R.insert(L,U))})),new ts(m.snapshotVersion,_,R,m.documentUpdates,m.augmentedDocumentUpdates,m.resolvedLimboDocuments)})(i,u);return i.remoteSyncer.applyRemoteEvent(c)})(r,t)}catch(n){N(Pt,"Failed to raise snapshot:",n),await Ko(r,n)}}async function Ko(r,e,t){if(!vn(e))throw e;r.ca.add(1),await xi(r),r.ha.set("Offline"),t||(t=()=>ig(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{N(Pt,"Retrying IndexedDB access"),await t(),r.ca.delete(1),await Aa(r)}))}function lg(r,e){return e().catch((t=>Ko(r,t,e)))}async function ss(r){const e=q(r),t=In(e);let n=e.ia.length>0?e.ia[e.ia.length-1].batchId:$n;for(;WA(e);)try{const s=await BA(e.localStore,n);if(s===null){e.ia.length===0&&t.Xt();break}n=s.batchId,HA(e,s)}catch(s){await Ko(e,s)}hg(e)&&dg(e)}function WA(r){return ur(r)&&r.ia.length<10}function HA(r,e){r.ia.push(e);const t=In(r);t.Jt()&&t.Rn&&t.In(e.mutations)}function hg(r){return ur(r)&&!In(r).Ht()&&r.ia.length>0}function dg(r){In(r).start()}async function QA(r){In(r).dn()}async function JA(r){const e=In(r);for(const t of r.ia)e.In(t.mutations)}async function YA(r,e,t){const n=r.ia.shift(),s=jc.from(n,e,t);await lg(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await ss(r)}async function XA(r,e){e&&In(r).Rn&&await(async function(n,s){if((function(o){return lw(o)&&o!==x.ABORTED})(s.code)){const i=n.ia.shift();In(n).Zt(),await lg(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await ss(n)}})(r,e),hg(r)&&dg(r)}async function $d(r,e){const t=q(r);t.asyncQueue.verifyOperationInProgress(),N(Pt,"RemoteStore received new credentials");const n=ur(t);t.ca.add(3),await xi(t),n&&t.ha.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.ca.delete(3),await Aa(t)}async function zu(r,e){const t=q(r);e?(t.ca.delete(2),await Aa(t)):e||(t.ca.add(2),await xi(t),t.ha.set("Unknown"))}function is(r){return r.Pa||(r.Pa=(function(t,n,s){const i=q(t);return i.mn(),new jw(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{ut:$A.bind(null,r),lt:zA.bind(null,r),ht:KA.bind(null,r),hn:GA.bind(null,r)}),r.la.push((async e=>{e?(r.Pa.Zt(),rl(r)?nl(r):r.ha.set("Unknown")):(await r.Pa.stop(),cg(r))}))),r.Pa}function In(r){return r.Ra||(r.Ra=(function(t,n,s){const i=q(t);return i.mn(),new $w(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{ut:()=>Promise.resolve(),lt:QA.bind(null,r),ht:XA.bind(null,r),An:JA.bind(null,r),Vn:YA.bind(null,r)}),r.la.push((async e=>{e?(r.Ra.Zt(),await ss(r)):(await r.Ra.stop(),r.ia.length>0&&(N(Pt,`Stopping write stream with ${r.ia.length} pending writes`),r.ia=[]))}))),r.Ra}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fg{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ia(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ia(this.observer.error,e):pe("Uncaught Error in snapshot listener:",e.toString()))}Aa(){this.muted=!0}Ia(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sl{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Ct,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const o=Date.now()+n,u=new sl(e,t,o,s,i);return u.start(n),u}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new O(x.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function il(r,e){if(pe("AsyncQueue",`${e}: ${r}`),vn(r))return new O(x.UNAVAILABLE,`${e}: ${r}`);throw r}const Ks="IndexBackfiller";class ZA{constructor(e,t){this.asyncQueue=e,this.va=t,this.task=null}start(){this.Da(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}Da(e){N(Ks,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,(async()=>{this.task=null;try{const t=await this.va.xa();N(Ks,`Documents written: ${t}`)}catch(t){vn(t)?N(Ks,"Ignoring IndexedDB error during index backfill: ",t):await En(t)}await this.Da(6e4)}))}}class eP{constructor(e,t){this.localStore=e,this.persistence=t}async xa(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(t=>this.Ca(t,e)))}Ca(e,t){const n=new Set;let s=t,i=!0;return A.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next((o=>{if(o!==null&&!n.has(o))return N(Ks,`Processing collection: ${o}`),this.Fa(e,o,s).next((u=>{s-=u,n.add(o)}));i=!1})))).next((()=>t-s))}Fa(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next((s=>this.localStore.localDocuments.getNextDocuments(e,t,s,n).next((i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next((()=>this.Oa(s,i))).next((u=>(N(Ks,`Updating offset: ${u}`),this.localStore.indexManager.updateCollectionGroup(e,t,u)))).next((()=>o.size))}))))}Oa(e,t){let n=e;return t.changes.forEach(((s,i)=>{const o=xm(i);yc(o,n)>0&&(n=o)})),new tt(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mg="firestore_clients";function zd(r,e){return`${mg}_${r}_${e}`}const pg="firestore_mutations";function Kd(r,e,t){let n=`${pg}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const gg="firestore_targets";function cu(r,e){return`${gg}_${r}_${e}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mt="SharedClientState";class Go{constructor(e,t,n,s){this.user=e,this.batchId=t,this.state=n,this.error=s}static Ma(e,t,n){const s=JSON.parse(n);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new O(s.error.code,s.error.message))),o?new Go(e,t,s.state,i):(pe(mt,`Failed to parse mutation state for ID '${t}': ${n}`),null)}Na(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Gs{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static Ma(e,t){const n=JSON.parse(t);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new O(n.error.code,n.error.message))),i?new Gs(e,n.state,s):(pe(mt,`Failed to parse target state for ID '${e}': ${t}`),null)}Na(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Wo{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Ma(e,t){const n=JSON.parse(t);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=Ec();for(let o=0;s&&o<n.activeTargetIds.length;++o)s=hm(n.activeTargetIds[o]),i=i.add(n.activeTargetIds[o]);return s?new Wo(e,i):(pe(mt,`Failed to parse client data for instance '${e}': ${t}`),null)}}class ol{constructor(e,t){this.clientId=e,this.onlineState=t}static Ma(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new ol(t.clientId,t.onlineState):(pe(mt,`Failed to parse online state: ${e}`),null)}}class Ku{constructor(){this.activeTargetIds=Ec()}La(e){this.activeTargetIds=this.activeTargetIds.add(e)}Ba(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Na(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class lu{constructor(e,t,n,s,i){this.window=e,this.xt=t,this.persistenceKey=n,this.Ua=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.ka=this.qa.bind(this),this.$a=new ae(G),this.started=!1,this.Ka=[];const o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.Qa=zd(this.persistenceKey,this.Ua),this.Wa=(function(c){return`firestore_sequence_number_${c}`})(this.persistenceKey),this.$a=this.$a.insert(this.Ua,new Ku),this.Ga=new RegExp(`^${mg}_${o}_([^_]*)$`),this.za=new RegExp(`^${pg}_${o}_(\\d+)(?:_(.*))?$`),this.ja=new RegExp(`^${gg}_${o}_(\\d+)$`),this.Ha=(function(c){return`firestore_online_state_${c}`})(this.persistenceKey),this.Ja=(function(c){return`firestore_bundle_loaded_v2_${c}`})(this.persistenceKey),this.window.addEventListener("storage",this.ka)}static Je(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ro();for(const n of e){if(n===this.Ua)continue;const s=this.getItem(zd(this.persistenceKey,n));if(s){const i=Wo.Ma(n,s);i&&(this.$a=this.$a.insert(i.clientId,i))}}this.Ya();const t=this.storage.getItem(this.Ha);if(t){const n=this.Za(t);n&&this.Xa(n)}for(const n of this.Ka)this.qa(n);this.Ka=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(e){this.setItem(this.Wa,JSON.stringify(e))}getAllActiveQueryTargets(){return this.eu(this.$a)}isActiveQueryTarget(e){let t=!1;return this.$a.forEach(((n,s)=>{s.activeTargetIds.has(e)&&(t=!0)})),t}addPendingMutation(e){this.tu(e,"pending")}updateMutationState(e,t,n){this.tu(e,t,n),this.nu(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(cu(this.persistenceKey,e));if(s){const i=Gs.Ma(e,s);i&&(n=i.state)}}return t&&this.ru.La(e),this.Ya(),n}removeLocalQueryTarget(e){this.ru.Ba(e),this.Ya()}isLocalQueryTarget(e){return this.ru.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(cu(this.persistenceKey,e))}updateQueryState(e,t,n){this.iu(e,t,n)}handleUserChange(e,t,n){t.forEach((s=>{this.nu(s)})),this.currentUser=e,n.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(e){this.su(e)}notifyBundleLoaded(e){this._u(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.ka),this.removeItem(this.Qa),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return N(mt,"READ",e,t),t}setItem(e,t){N(mt,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){N(mt,"REMOVE",e),this.storage.removeItem(e)}qa(e){const t=e;if(t.storageArea===this.storage){if(N(mt,"EVENT",t.key,t.newValue),t.key===this.Qa)return void pe("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.xt.enqueueRetryable((async()=>{if(this.started){if(t.key!==null){if(this.Ga.test(t.key)){if(t.newValue==null){const n=this.ou(t.key);return this.au(n,null)}{const n=this.uu(t.key,t.newValue);if(n)return this.au(n.clientId,n)}}else if(this.za.test(t.key)){if(t.newValue!==null){const n=this.cu(t.key,t.newValue);if(n)return this.lu(n)}}else if(this.ja.test(t.key)){if(t.newValue!==null){const n=this.Eu(t.key,t.newValue);if(n)return this.hu(n)}}else if(t.key===this.Ha){if(t.newValue!==null){const n=this.Za(t.newValue);if(n)return this.Xa(n)}}else if(t.key===this.Wa){const n=(function(i){let o=Ge.yn;if(i!=null)try{const u=JSON.parse(i);D(typeof u=="number",30636,{Tu:i}),o=u}catch(u){pe(mt,"Failed to read sequence number from WebStorage",u)}return o})(t.newValue);n!==Ge.yn&&this.sequenceNumberHandler(n)}else if(t.key===this.Ja){const n=this.Pu(t.newValue);await Promise.all(n.map((s=>this.syncEngine.Ru(s))))}}}else this.Ka.push(t)}))}}get ru(){return this.$a.get(this.Ua)}Ya(){this.setItem(this.Qa,this.ru.Na())}tu(e,t,n){const s=new Go(this.currentUser,e,t,n),i=Kd(this.persistenceKey,this.currentUser,e);this.setItem(i,s.Na())}nu(e){const t=Kd(this.persistenceKey,this.currentUser,e);this.removeItem(t)}su(e){const t={clientId:this.Ua,onlineState:e};this.storage.setItem(this.Ha,JSON.stringify(t))}iu(e,t,n){const s=cu(this.persistenceKey,e),i=new Gs(e,t,n);this.setItem(s,i.Na())}_u(e){const t=JSON.stringify(Array.from(e));this.setItem(this.Ja,t)}ou(e){const t=this.Ga.exec(e);return t?t[1]:null}uu(e,t){const n=this.ou(e);return Wo.Ma(n,t)}cu(e,t){const n=this.za.exec(e),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return Go.Ma(new be(i),s,t)}Eu(e,t){const n=this.ja.exec(e),s=Number(n[1]);return Gs.Ma(s,t)}Za(e){return ol.Ma(e)}Pu(e){return JSON.parse(e)}async lu(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Iu(e.batchId,e.state,e.error);N(mt,`Ignoring mutation for non-active user ${e.user.uid}`)}hu(e){return this.syncEngine.Au(e.targetId,e.state,e.error)}au(e,t){const n=t?this.$a.insert(e,t):this.$a.remove(e),s=this.eu(this.$a),i=this.eu(n),o=[],u=[];return i.forEach((c=>{s.has(c)||o.push(c)})),s.forEach((c=>{i.has(c)||u.push(c)})),this.syncEngine.Vu(o,u).then((()=>{this.$a=n}))}Xa(e){this.$a.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}eu(e){let t=Ec();return e.forEach(((n,s)=>{t=t.unionWith(s.activeTargetIds)})),t}}class _g{constructor(){this.du=new Ku,this.fu={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.du.La(e),this.fu[e]||"not-current"}updateQueryState(e,t,n){this.fu[e]=t}removeLocalQueryTarget(e){this.du.Ba(e)}isLocalQueryTarget(e){return this.du.activeTargetIds.has(e)}clearQueryState(e){delete this.fu[e]}getAllActiveQueryTargets(){return this.du.activeTargetIds}isActiveQueryTarget(e){return this.du.activeTargetIds.has(e)}start(){return this.du=new Ku,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yg(){return typeof window<"u"?window:null}function yo(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wn{static emptySet(e){return new Wn(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||F.comparator(t.key,n.key):(t,n)=>F.comparator(t.key,n.key),this.keyedMap=kn(),this.sortedSet=new ae(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,n)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Wn)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new Wn;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gd{constructor(){this.mu=new ae(F.comparator)}track(e){const t=e.doc.key,n=this.mu.get(t);n?e.type!==0&&n.type===3?this.mu=this.mu.insert(t,e):e.type===3&&n.type!==1?this.mu=this.mu.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.mu=this.mu.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.mu=this.mu.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.mu=this.mu.remove(t):e.type===1&&n.type===2?this.mu=this.mu.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.mu=this.mu.insert(t,{type:2,doc:e.doc}):B(63341,{ye:e,pu:n}):this.mu=this.mu.insert(t,e)}gu(){const e=[];return this.mu.inorderTraversal(((t,n)=>{e.push(n)})),e}}class Wr{constructor(e,t,n,s,i,o,u,c,h){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=u,this.excludesMetadataChanges=c,this.hasCachedResults=h}static fromInitialDocuments(e,t,n,s,i){const o=[];return t.forEach((u=>{o.push({type:0,doc:u})})),new Wr(e,t,Wn.emptySet(t),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&pa(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tP{constructor(){this.yu=void 0,this.wu=[]}bu(){return this.wu.some((e=>e.Su()))}}class nP{constructor(){this.queries=Wd(),this.onlineState="Unknown",this.vu=new Set}terminate(){(function(t,n){const s=q(t),i=s.queries;s.queries=Wd(),i.forEach(((o,u)=>{for(const c of u.wu)c.onError(n)}))})(this,new O(x.ABORTED,"Firestore shutting down"))}}function Wd(){return new qt((r=>xp(r)),pa)}async function Ig(r,e){const t=q(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.bu()&&e.Su()&&(n=2):(i=new tP,n=e.Su()?0:1);try{switch(n){case 0:i.yu=await t.onListen(s,!0);break;case 1:i.yu=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const u=il(o,`Initialization of query '${me(e.query)?Nt(e.query):Fs(e.query)}' failed`);return void e.onError(u)}t.queries.set(s,i),i.wu.push(e),e.Du(t.onlineState),i.yu&&e.xu(i.yu)&&al(t)}async function Tg(r,e){const t=q(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const o=i.wu.indexOf(e);o>=0&&(i.wu.splice(o,1),i.wu.length===0?s=e.Su()?0:1:!i.bu()&&e.Su()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function rP(r,e){const t=q(r);let n=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const u of o.wu)u.xu(s)&&(n=!0);o.yu=s}}n&&al(t)}function sP(r,e,t){const n=q(r),s=n.queries.get(e);if(s)for(const i of s.wu)i.onError(t);n.queries.delete(e)}function al(r){r.vu.forEach((e=>{e.next()}))}var Gu;(function(r){r.Default="default",r.Cache="cache"})(Gu||(Gu={}));class wg{constructor(e,t,n){this.query=e,this.Cu=t,this.Fu=!1,this.Ou=null,this.onlineState="Unknown",this.options=n||{}}xu(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new Wr(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Fu?this.Mu(e)&&(this.Cu.next(e),t=!0):this.Nu(e,this.onlineState)&&(this.Lu(e),t=!0),this.Ou=e,t}onError(e){this.Cu.error(e)}Du(e){this.onlineState=e;let t=!1;return this.Ou&&!this.Fu&&this.Nu(this.Ou,e)&&(this.Lu(this.Ou),t=!0),t}Nu(e,t){if(!e.fromCache||!this.Su())return!0;const n=t!=="Offline";return(!this.options.waitForSyncWhenOnline||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Mu(e){if(e.docChanges.length>0)return!0;const t=this.Ou&&this.Ou.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}Lu(e){e=Wr.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Fu=!0,this.Cu.next(e)}Su(){return this.options.source!==Gu.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eg{constructor(e){this.key=e}}class vg{constructor(e){this.key=e}}class iP{constructor(e,t){this.query=e,this.Gu=t,this.zu=null,this.hasCachedResults=!1,this.current=!1,this.ju=Q(),this.mutatedKeys=Q(),this.Hu=me(e)?Bu(e):wc(e),this.Ju=new Wn(this.Hu)}get Yu(){return this.Gu}Zu(e,t){const n=t?t.Xu:new Gd,s=t?t.Ju:this.Ju;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,u=!1;const[c,h]=this.ec(this.query,s);e.inorderTraversal(((m,_)=>{const R=s.get(m),C=Yp(this.query,_)?_:null,U=!!R&&this.mutatedKeys.has(R.key),L=!!C&&(C.hasLocalMutations||this.mutatedKeys.has(C.key)&&C.hasCommittedMutations);let z=!1;R&&C?R.data.isEqual(C.data)?U!==L&&(n.track({type:3,doc:C}),z=!0):this.tc(R,C)||(n.track({type:2,doc:C}),z=!0,(c&&this.Hu(C,c)>0||h&&this.Hu(C,h)<0)&&(u=!0)):!R&&C?(n.track({type:0,doc:C}),z=!0):R&&!C&&(n.track({type:1,doc:R}),z=!0,(c||h)&&(u=!0)),z&&(C?(o=o.add(C),i=L?i.add(m):i.delete(m)):(o=o.delete(m),i=i.delete(m)))}));const f=this.nc(this.query);if(f)if(me(this.query)){const m=[];o.forEach((C=>m.push(C)));const _=Jp(this.query,m);let R=new Wn(Bu(this.query));for(const C of _)R=R.add(C);o.forEach((C=>{R.has(C.key)||(i=i.delete(C.key),n.track({type:1,doc:C}))})),o=R}else{const m=this.rc(this.query);for(;o.size>f;){const _=m==="F"?o.last():o.first();o=o.delete(_.key),i=i.delete(_.key),n.track({type:1,doc:_})}}return{Ju:o,Xu:n,Fo:u,mutatedKeys:i}}nc(e){var t;return me(e)?(t=iu(e))==null?void 0:t.limit:e.limit||void 0}rc(e){if(me(e)){const t=iu(e);return t&&t.limit<0?"L":"F"}return e.limitType}ec(e,t){var n;if(me(e)){const s=(n=iu(e))==null?void 0:n.limit;return[t.size===s?t.last():null,null]}return[e.limitType==="F"&&t.size===this.nc(this.query)?t.last():null,e.limitType==="L"&&t.size===this.nc(this.query)?t.first():null]}tc(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.Ju;this.Ju=e.Ju,this.mutatedKeys=e.mutatedKeys;const o=e.Xu.gu();o.sort(((f,m)=>(function(R,C){const U=L=>{switch(L){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return B(20277,{ye:L})}};return U(R)-U(C)})(f.type,m.type)||this.Hu(f.doc,m.doc))),this.sc(n),s=s??!1;const u=t&&!s?this._c():[],c=this.ju.size===0&&this.current&&!s?1:0,h=c!==this.zu;return this.zu=c,o.length!==0||h?{snapshot:new Wr(this.query,e.Ju,i,o,e.mutatedKeys,c===0,h,!1,!!n&&n.resumeToken.approximateByteSize()>0),oc:u}:{oc:u}}Du(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Ju:this.Ju,Xu:new Gd,mutatedKeys:this.mutatedKeys,Fo:!1},!1)):{oc:[]}}ac(e){return!this.Gu.has(e)&&!!this.Ju.has(e)&&!this.Ju.get(e).hasLocalMutations}sc(e){e&&(e.addedDocuments.forEach((t=>this.Gu=this.Gu.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.Gu=this.Gu.delete(t))),this.current=e.current)}_c(){if(!this.current)return[];const e=this.ju;this.ju=Q(),this.Ju.forEach((n=>{this.ac(n.key)&&(this.ju=this.ju.add(n.key))}));const t=[];return e.forEach((n=>{this.ju.has(n)||t.push(new vg(n))})),this.ju.forEach((n=>{e.has(n)||t.push(new Eg(n))})),t}uc(e){this.Gu=e.Qo,this.ju=Q();const t=this.Zu(e.documents);return this.applyChanges(t,!0)}cc(){return Wr.fromInitialDocuments(this.query,this.Ju,this.mutatedKeys,this.zu===0,this.hasCachedResults)}}const os="SyncEngine";class oP{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class aP{constructor(e){this.key=e,this.lc=!1}}class uP{constructor(e,t,n,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Ec={},this.hc=new qt((u=>xp(u)),pa),this.Tc=new Map,this.Pc=new Set,this.Rc=new ae(F.comparator),this.Ic=new Map,this.Ac=new Jc,this.Vc={},this.dc=new Map,this.fc=Ft.ws(),this.onlineState="Unknown",this.mc=void 0}get isPrimaryClient(){return this.mc===!0}}async function cP(r,e,t=!0){const n=Ra(r);let s;const i=n.hc.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.cc()):s=await Ag(n,e,t,!0),s}async function lP(r,e){const t=Ra(r);await Ag(t,e,!0,!1)}async function Ag(r,e,t,n){const s=await zo(r.localStore,me(e)?e:et(e)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,t);let u;return n&&(u=await ul(r,e,i,o==="current",s.resumeToken)),r.isPrimaryClient&&t&&Pa(r.remoteStore,s),u}async function ul(r,e,t,n,s){r.gc=(m,_,R)=>(async function(U,L,z,W){let H=L.view.Zu(z);H.Fo&&(H=await qu(U.localStore,L.query,!1).then((({documents:w})=>L.view.Zu(w,H))));const ce=W&&W.targetChanges.get(L.targetId),te=W&&W.targetMismatches.get(L.targetId)!=null,ne=L.view.applyChanges(H,U.isPrimaryClient,ce,te);return Wu(U,L.targetId,ne.oc),ne.snapshot})(r,m,_,R);const i=await qu(r.localStore,e,!0),o=new iP(e,i.Qo),u=o.Zu(i.documents),c=vi.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),h=o.applyChanges(u,r.isPrimaryClient,c);Wu(r,t,h.oc);const f=new oP(e,t,o);return r.hc.set(e,f),r.Tc.has(t)?r.Tc.get(t).push(e):r.Tc.set(t,[e]),h.snapshot}async function hP(r,e,t){const n=q(r),s=n.hc.get(e),i=n.Tc.get(s.targetId);if(i.length>1)return n.Tc.set(s.targetId,i.filter((o=>!pa(o,e)))),void n.hc.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await Kr(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),t&&Gr(n.remoteStore,s.targetId),Hr(n,s.targetId)})).catch(En)):(Hr(n,s.targetId),await Kr(n.localStore,s.targetId,!0))}async function dP(r,e){const t=q(r),n=t.hc.get(e),s=t.Tc.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),Gr(t.remoteStore,n.targetId))}async function fP(r,e,t){const n=dl(r);try{const s=await(function(o,u){const c=q(o),h=se.now(),f=u.reduce(((R,C)=>R.add(C.key)),Q());let m,_;return c.persistence.runTransaction("Locally write mutations","readwrite",(R=>{let C=Te(),U=Q();return c.Uo.getEntries(R,f).next((L=>{C=L,C.forEach(((z,W)=>{W.isValidDocument()||(U=U.add(z))}))})).next((()=>c.localDocuments.getOverlayedDocuments(R,C))).next((L=>{m=L;const z=[];for(const W of u){const H=QT(W,m.get(W.key).overlayedDocument);H!=null&&z.push(new Bt(W.key,H,pm(H.value.mapValue),Le.exists(!0)))}return c.mutationQueue.addMutationBatch(R,h,z,u)})).next((L=>{_=L;const z=L.applyToLocalDocumentSet(m,U);return c.documentOverlayCache.saveOverlays(R,L.batchId,z)}))})).then((()=>({batchId:_.batchId,changes:Om(m)})))})(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),(function(o,u,c){let h=o.Vc[o.currentUser.toKey()];h||(h=new ae(G)),h=h.insert(u,c),o.Vc[o.currentUser.toKey()]=h})(n,s.batchId,t),await An(n,s.changes),await ss(n.remoteStore)}catch(s){const i=il(s,"Failed to persist write");t.reject(i)}}async function Pg(r,e){const t=q(r);try{const n=await FA(t.localStore,e);e.targetChanges.forEach(((s,i)=>{const o=t.Ic.get(i);o&&(D(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.lc=!0:s.modifiedDocuments.size>0?D(o.lc,14607):s.removedDocuments.size>0&&(D(o.lc,42227),o.lc=!1))})),await An(t,n,e)}catch(n){await En(n)}}function Hd(r,e,t){const n=q(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.hc.forEach(((i,o)=>{const u=o.view.Du(e);u.snapshot&&s.push(u.snapshot)})),(function(o,u){const c=q(o);c.onlineState=u;let h=!1;c.queries.forEach(((f,m)=>{for(const _ of m.wu)_.Du(u)&&(h=!0)})),h&&al(c)})(n.eventManager,e),s.length&&n.Ec.hn(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function mP(r,e,t){const n=q(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Ic.get(e),i=s&&s.key;if(i){let o=new ae(F.comparator);o=o.insert(i,fe.newNoDocument(i,j.min()));const u=Q().add(i),c=new ts(j.min(),new Map,new ae(G),o,Te(),u);await Pg(n,c),n.Rc=n.Rc.remove(i),n.Ic.delete(e),hl(n)}else await Kr(n.localStore,e,!1).then((()=>Hr(n,e,t))).catch(En)}async function pP(r,e){const t=q(r),n=e.batch.batchId;try{const s=await MA(t.localStore,e);ll(t,n,null),cl(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await An(t,s)}catch(s){await En(s)}}async function gP(r,e,t){const n=q(r);try{const s=await(function(o,u){const c=q(o);return c.persistence.runTransaction("Reject batch","readwrite-primary",(h=>{let f;return c.mutationQueue.lookupMutationBatch(h,u).next((m=>(D(m!==null,37113),f=m.keys(),c.mutationQueue.removeMutationBatch(h,m)))).next((()=>c.mutationQueue.performConsistencyCheck(h))).next((()=>c.documentOverlayCache.removeOverlaysForBatchId(h,f,u))).next((()=>c.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(h,f))).next((()=>c.localDocuments.getDocuments(h,f)))}))})(n.localStore,e);ll(n,e,t),cl(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await An(n,s)}catch(s){await En(s)}}function cl(r,e){(r.dc.get(e)||[]).forEach((t=>{t.resolve()})),r.dc.delete(e)}function ll(r,e,t){const n=q(r);let s=n.Vc[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.Vc[n.currentUser.toKey()]=s}}function Hr(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Tc.get(e))r.hc.delete(n),t&&r.Ec.yc(n,t);r.Tc.delete(e),r.isPrimaryClient&&r.Ac.Xs(e).forEach((n=>{r.Ac.containsKey(n)||Rg(r,n)}))}function Rg(r,e){r.Pc.delete(e.path.canonicalString());const t=r.Rc.get(e);t!==null&&(Gr(r.remoteStore,t),r.Rc=r.Rc.remove(e),r.Ic.delete(t),hl(r))}function Wu(r,e,t){for(const n of t)n instanceof Eg?(r.Ac.addReference(n.key,e),_P(r,n)):n instanceof vg?(N(os,"Document no longer in limbo: "+n.key),r.Ac.removeReference(n.key,e),r.Ac.containsKey(n.key)||Rg(r,n.key)):B(19791,{wc:n})}function _P(r,e){const t=e.key,n=t.path.canonicalString();r.Rc.get(t)||r.Pc.has(n)||(N(os,"New document in limbo: "+t),r.Pc.add(n),hl(r))}function hl(r){for(;r.Pc.size>0&&r.Rc.size<r.maxConcurrentLimboResolutions;){const e=r.Pc.values().next().value;r.Pc.delete(e);const t=new F(X.fromString(e)),n=r.fc.next();r.Ic.set(n,new aP(t)),r.Rc=r.Rc.insert(t,n),Pa(r.remoteStore,new It(et(ia(t.path)),n,"TargetPurposeLimboResolution",Ge.yn))}}async function An(r,e,t){const n=q(r),s=[],i=[],o=[];n.hc.isEmpty()||(n.hc.forEach(((u,c)=>{o.push(n.gc(c,e,t).then((h=>{var f;if((h||t)&&n.isPrimaryClient){const m=h?!h.fromCache:(f=t==null?void 0:t.targetChanges.get(c.targetId))==null?void 0:f.current;n.sharedClientState.updateQueryState(c.targetId,m?"current":"not-current")}if(h){s.push(h);const m=Zc.fo(c.targetId,h);i.push(m)}})))})),await Promise.all(o),n.Ec.hn(s),await(async function(c,h){const f=q(c);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",(m=>A.forEach(h,(_=>A.forEach(_.Ao,(R=>f.persistence.referenceDelegate.addReference(m,_.targetId,R))).next((()=>A.forEach(_.Vo,(R=>f.persistence.referenceDelegate.removeReference(m,_.targetId,R)))))))))}catch(m){if(!vn(m))throw m;N(el,"Failed to update sequence numbers: "+m)}for(const m of h){const _=m.targetId;if(!m.fromCache){const R=f.No.get(_),C=R.snapshotVersion,U=R.withLastLimboFreeSnapshotVersion(C);f.No=f.No.insert(_,U)}}})(n.localStore,i))}async function yP(r,e){const t=q(r);if(!t.currentUser.isEqual(e)){N(os,"User change. New user:",e.toKey());const n=await sg(t.localStore,e);t.currentUser=e,(function(i,o){i.dc.forEach((u=>{u.forEach((c=>{c.reject(new O(x.CANCELLED,o))}))})),i.dc.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await An(t,n.qo)}}function IP(r,e){const t=q(r),n=t.Ic.get(e);if(n&&n.lc)return Q().add(n.key);{let s=Q();const i=t.Tc.get(e);if(!i)return s;for(const o of i??[]){const u=t.hc.get(o);s=s.unionWith(u.view.Yu)}return s}}async function TP(r,e){const t=q(r),n=await qu(t.localStore,e.query,!0),s=e.view.uc(n);return t.isPrimaryClient&&Wu(t,e.targetId,s.oc),s}async function wP(r,e){const t=q(r);return ju(t.localStore,e).then((n=>An(t,n)))}async function EP(r,e,t,n){const s=q(r),i=await(function(u,c){const h=q(u),f=q(h.mutationQueue);return h.persistence.runTransaction("Lookup mutation documents","readonly",(m=>f.Qr(m,c).next((_=>_?h.localDocuments.getDocuments(m,_):A.resolve(null)))))})(s.localStore,e);i!==null?(t==="pending"?await ss(s.remoteStore):t==="acknowledged"||t==="rejected"?(ll(s,e,n||null),cl(s,e),(function(u,c){q(q(u).mutationQueue).jr(c)})(s.localStore,e)):B(6720,"Unknown batchState",{bc:t}),await An(s,i)):N(os,"Cannot apply mutation batch with id: "+e)}async function vP(r,e){const t=q(r);if(Ra(t),dl(t),e===!0&&t.mc!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),s=await Qd(t,n.toArray());t.mc=!0,await zu(t.remoteStore,!0);for(const i of s)Pa(t.remoteStore,i)}else if(e===!1&&t.mc!==!1){const n=[];let s=Promise.resolve();t.Tc.forEach(((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?n.push(o):s=s.then((()=>(Hr(t,o),Kr(t.localStore,o,!0)))),Gr(t.remoteStore,o)})),await s,await Qd(t,n),(function(o){const u=q(o);u.Ic.forEach(((c,h)=>{Gr(u.remoteStore,h)})),u.Ac.e_(),u.Ic=new Map,u.Rc=new ae(F.comparator)})(t),t.mc=!1,await zu(t.remoteStore,!1)}}async function Qd(r,e,t){const n=q(r),s=[],i=[];for(const o of e){let u;const c=n.Tc.get(o);if(c&&c.length!==0){u=await zo(n.localStore,me(c[0])?c[0]:et(c[0]));for(const h of c){const f=n.hc.get(h),m=await TP(n,f);m.snapshot&&i.push(m.snapshot)}}else{const h=await og(n.localStore,o);u=await zo(n.localStore,h),await ul(n,bg(h),o,!1,u.resumeToken)}s.push(u)}return n.Ec.hn(i),s}function bg(r){return Rt(r)?r:Nm(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function AP(r){return(function(t){return q(q(t).persistence).Ro()})(q(r).localStore)}async function PP(r,e,t,n){const s=q(r);if(s.mc)return void N(os,"Ignoring unexpected query state notification.");const i=s.Tc.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{let o;if(me(i[0]))switch(xt(i[0])){case"collection_group":case"collection":o=await ju(s.localStore,Ap(i[0]));break;case"documents":o=await(function(h,f){const m=q(h),_=Q(...Oo(f).map((R=>F.fromPath(R))));return m.persistence.runTransaction("Get documents for pipeline","readonly",(R=>m.Uo.getEntries(R,_))).then((R=>R))})(s.localStore,i[0]);break;default:it(""),o=kn()}else o=await ju(s.localStore,(function(h){return h.collectionGroup||(h.path.length%2==1?h.path.lastSegment():h.path.get(h.path.length-2))})(i[0]));const u=ts.createSynthesizedRemoteEventForCurrentChange(e,t==="current",he.EMPTY_BYTE_STRING);await An(s,o,u);break}case"rejected":await Kr(s.localStore,e,!0),Hr(s,e,n);break;default:B(64155,t)}}async function RP(r,e,t){const n=Ra(r);if(n.mc){for(const s of e){if(n.Tc.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){N(os,"Adding an already active target "+s);continue}const i=await og(n.localStore,s),o=await zo(n.localStore,i);await ul(n,bg(i),o.targetId,!1,o.resumeToken),Pa(n.remoteStore,o)}for(const s of t)n.Tc.has(s)&&await Kr(n.localStore,s,!1).then((()=>{Gr(n.remoteStore,s),Hr(n,s)})).catch(En)}}function Ra(r){const e=q(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=Pg.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=IP.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=mP.bind(null,e),e.Ec.hn=rP.bind(null,e.eventManager),e.Ec.yc=sP.bind(null,e.eventManager),e}function dl(r){const e=q(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=pP.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=gP.bind(null,e),e}class di{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=aa(e.databaseInfo.databaseId),this.sharedClientState=this.Sc(e),this.persistence=this.vc(e),await this.persistence.start(),this.localStore=this.Dc(e),this.gcScheduler=this.xc(e,this.localStore),this.indexBackfillerScheduler=this.Cc(e,this.localStore)}xc(e,t){return null}Cc(e,t){return null}Dc(e){return rg(this.persistence,new ng,e.initialUser,this.serializer)}vc(e){return new Yc(va.w_,this.serializer)}Sc(e){return new _g}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}di.provider={build:()=>new di};class bP extends di{constructor(e){super(),this.cacheSizeBytes=e}xc(e,t){D(this.persistence.referenceDelegate instanceof $o,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new up(n,e.asyncQueue,t)}vc(e){const t=this.cacheSizeBytes!==void 0?ke.withCacheSize(this.cacheSizeBytes):ke.DEFAULT;return new Yc((n=>$o.w_(n,t)),this.serializer)}}class Sg extends di{constructor(e,t,n){super(),this.Fc=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.Fc.initialize(this,e),await dl(this.Fc.syncEngine),await ss(this.Fc.remoteStore),await this.persistence.X_((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}Dc(e){return rg(this.persistence,new ng,e.initialUser,this.serializer)}xc(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new up(n,e.asyncQueue,t)}Cc(e,t){const n=new eP(t,this.persistence);return new ZA(e.asyncQueue,n)}vc(e){const t=tg(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?ke.withCacheSize(this.cacheSizeBytes):ke.DEFAULT;return new Xc(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,yg(),yo(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Sc(e){return new _g}}class SP extends Sg{constructor(e,t){super(e,t,!1),this.Fc=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.Fc.syncEngine;this.sharedClientState instanceof lu&&(this.sharedClientState.syncEngine={Iu:EP.bind(null,t),Au:PP.bind(null,t),Vu:RP.bind(null,t),Ro:AP.bind(null,t),Ru:wP.bind(null,t)},await this.sharedClientState.start()),await this.persistence.X_((async n=>{await vP(this.Fc.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())}))}Sc(e){const t=yg();if(!lu.Je(t))throw new O(x.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=tg(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new lu(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class fi{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>Hd(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=yP.bind(null,this.syncEngine),await zu(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new nP})()}createDatastore(e){const t=aa(e.databaseInfo.databaseId),n=qw(e.databaseInfo);return Gw(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return(function(n,s,i,o,u){return new jA(n,s,i,o,u)})(this.localStore,this.datastore,e.asyncQueue,(t=>Hd(this.syncEngine,t,0)),(function(){return hd.Je()?new hd:new Mw})())}createSyncEngine(e,t){return(function(s,i,o,u,c,h,f){const m=new uP(s,i,o,u,c,h);return f&&(m.mc=!0),m})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){const i=q(s);N(Pt,"RemoteStore shutting down."),i.ca.add(5),await xi(i),i.Ea.shutdown(),i.ha.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}fi.provider={build:()=>new fi};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tn="FirestoreClient";class VP{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=be.UNAUTHENTICATED,this.clientId=cc.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async o=>{N(Tn,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(n,(o=>(N(Tn,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Ct;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=il(t,"Failed to shutdown persistence");e.reject(n)}})),e.promise}}async function hu(r,e){r.asyncQueue.verifyOperationInProgress(),N(Tn,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await sg(e.localStore,s),n=s)})),e.persistence.setDatabaseDeletedListener((()=>r.terminate())),r._offlineComponents=e}async function Jd(r,e){r.asyncQueue.verifyOperationInProgress();const t=await CP(r);N(Tn,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener((n=>$d(e.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>$d(e.remoteStore,s))),r._onlineComponents=e}async function CP(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){N(Tn,"Using user provided OfflineComponentProvider");try{await hu(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===x.FAILED_PRECONDITION||s.code===x.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;it("Error using user provided cache. Falling back to memory cache: "+t),await hu(r,new di)}}else N(Tn,"Using default OfflineComponentProvider"),await hu(r,new bP(void 0));return r._offlineComponents}async function Vg(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(N(Tn,"Using user provided OnlineComponentProvider"),await Jd(r,r._uninitializedComponentsProvider._online)):(N(Tn,"Using default OnlineComponentProvider"),await Jd(r,new fi))),r._onlineComponents}function xP(r){return Vg(r).then((e=>e.syncEngine))}async function Hu(r){const e=await Vg(r),t=e.eventManager;return t.onListen=cP.bind(null,e.syncEngine),t.onUnlisten=hP.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=lP.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=dP.bind(null,e.syncEngine),t}function NP(r,e,t,n){const s=new fg(n),i=new wg(e,s,t);return r.asyncQueue.enqueueAndForget((async()=>Ig(await Hu(r),i))),()=>{s.Aa(),r.asyncQueue.enqueueAndForget((async()=>Tg(await Hu(r),i)))}}function DP(r,e,t={}){const n=new Ct;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,u,c,h){const f=new fg({next:_=>{f.Aa(),o.enqueueAndForget((()=>Tg(i,m))),_.fromCache&&c.source==="server"?h.reject(new O(x.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):h.resolve(_)},error:_=>h.reject(_)}),m=new wg(u instanceof qs?Dv(u):u,f,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return Ig(i,m)})(await Hu(r),r.asyncQueue,e,t,n))),n.promise}function kP(r,e){const t=new Ct;return r.asyncQueue.enqueueAndForget((async()=>fP(await xP(r),e,t))),t.promise}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Cg=class{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new we(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new OP(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(nr("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},OP=class extends Cg{data(){return super.data()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class LP{convertValue(e,t="none"){switch(ye(e)){case 0:return null;case 1:return e.booleanValue;case 2:return ue(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Lt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw B(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return wn(e,((s,i)=>{n[s]=this.convertValue(i,t)})),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[Zn].arrayValue)==null?void 0:s.values)==null?void 0:i.map((o=>ue(o.doubleValue)));return new We(t)}convertGeoPoint(e){return new Et(ue(e.latitude),ue(e.longitude))}convertArray(e,t){return(e.values||[]).map((n=>this.convertValue(n,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const n=wi(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(xr(e));default:return null}}convertTimestamp(e){const t=Ot(e);return new se(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=X.fromString(e);D(Jm(n),9688,{name:e});const s=new Xn(n.get(1),n.get(3)),i=new F(n.popFirst(5));return s.isEqual(t)||pe(`A document reference to ${i} refers to a different database (${s.projectId}/${s.database}), which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MP(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yd="AsyncQueue";class Xd{constructor(e=Promise.resolve()){this.qc=[],this.$c=!1,this.Kc=[],this.Qc=null,this.Wc=!1,this.Gc=!1,this.zc=[],this.jt=new tp(this,"async_queue_retry"),this.jc=()=>{const n=yo();n&&N(Yd,"Visibility state changed to "+n.visibilityState),this.jt.qt()},this.Hc=e;const t=yo();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.jc)}get isShuttingDown(){return this.$c}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Jc(),this.Yc(e)}enterRestrictedMode(e){if(!this.$c){this.$c=!0,this.Gc=e||!1;const t=yo();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.jc)}}enqueue(e){if(this.Jc(),this.$c)return new Promise((()=>{}));const t=new Ct;return this.Yc((()=>this.$c&&this.Gc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.qc.push(e),this.Zc())))}async Zc(){if(this.qc.length!==0){try{await this.qc[0](),this.qc.shift(),this.jt.reset()}catch(e){if(!vn(e))throw e;N(Yd,"Operation failed with retryable error: "+e)}this.qc.length>0&&this.jt.Ut((()=>this.Zc()))}}Yc(e){const t=this.Hc.then((()=>(this.Wc=!0,e().catch((n=>{throw this.Qc=n,this.Wc=!1,pe("INTERNAL UNHANDLED ERROR: ",Zd(n)),n})).then((n=>(this.Wc=!1,n))))));return this.Hc=t,t}enqueueAfterDelay(e,t,n){this.Jc(),this.zc.indexOf(e)>-1&&(t=0);const s=sl.createAndSchedule(this,e,t,n,(i=>this.Xc(i)));return this.Kc.push(s),s}Jc(){this.Qc&&B(47125,{el:Zd(this.Qc)})}verifyOperationInProgress(){}async tl(){let e;do e=this.Hc,await e;while(e!==this.Hc)}nl(e){for(const t of this.Kc)if(t.timerId===e)return!0;return!1}rl(e){return this.tl().then((()=>{this.Kc.sort(((t,n)=>t.targetTimeMs-n.targetTimeMs));for(const t of this.Kc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.tl()}))}il(e){this.zc.push(e)}Xc(e){const t=this.Kc.indexOf(e);this.Kc.splice(t,1)}}function Zd(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}class Qr extends la{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new Xd,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Xd(e),this._firestoreClient=void 0,await e}}}function rR(r,e,t){t||(t=Js);const n=Qo(r,"firestore");if(n.isInitialized(t)){const s=n.getImmediate({identifier:t}),i=n.getOptions(t);if(dn(i,e))return s;throw new O(x.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new O(x.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<ap)throw new O(x.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&Jr(e.host)&&Ju(e.host),n.initialize({options:e,instanceIdentifier:t})}function sR(r,e){const t=typeof r=="object"?r:pf(),n=typeof r=="string"?r:e||Js,s=Qo(t,"firestore").getImmediate({identifier:n});if(!s._initialized){const i=I_("firestore");i&&Zw(s,...i)}return s}function ba(r){if(r._terminated)throw new O(x.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||FP(r),r._firestoreClient}function FP(r){var n,s,i,o;const e=r._freezeSettings(),t=Hw(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new VP(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&(function(c){const h=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(h),_online:h}})(r._componentsProvider))}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fl extends LP{constructor(e){super(),this.firestore=e}convertBytes(e){return new st(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new we(this.firestore,null,t)}}class Ds{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Hn extends Cg{constructor(e,t,n,s,i,o){super(e,t,n,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new Io(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(nr("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new O(x.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=Hn._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}Hn._jsonSchemaVersion="firestore/documentSnapshot/1.0",Hn._jsonSchema={type:_e("string",Hn._jsonSchemaVersion),bundleSource:_e("string","DocumentSnapshot"),bundleName:_e("string"),bundle:_e("string")};class Io extends Hn{data(e={}){return super.data(e)}}class Qn{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new Ds(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((n=>{e.call(t,new Io(this._firestore,this._userDataWriter,n.key,n,new Ds(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new O(x.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map((u=>{me(s._snapshot.query)?Bu(s._snapshot.query):wc(s.query._query);const c=new Io(s._firestore,s._userDataWriter,u.doc.key,u.doc,new Ds(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);return u.doc,{type:"added",doc:c,oldIndex:-1,newIndex:o++}}))}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((u=>i||u.type!==3)).map((u=>{const c=new Io(s._firestore,s._userDataWriter,u.doc.key,u.doc,new Ds(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);let h=-1,f=-1;return u.type!==0&&(h=o.indexOf(u.doc.key),o=o.delete(u.doc.key)),u.type!==1&&(o=o.add(u.doc),f=o.indexOf(u.doc.key)),{type:UP(u.type),doc:c,oldIndex:h,newIndex:f}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new O(x.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Qn._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=cc.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function UP(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return B(61501,{type:r})}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Qn._jsonSchemaVersion="firestore/querySnapshot/1.0",Qn._jsonSchema={type:_e("string",Qn._jsonSchemaVersion),bundleSource:_e("string","QuerySnapshot"),bundleName:_e("string"),bundle:_e("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xg(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new O(x.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ef(r){return(function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}class BP{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=$P(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}function iR(r){return new BP(r)}class qP{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=fi.provider,this._offlineComponentProvider={build:t=>new Sg(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class jP{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=fi.provider,this._offlineComponentProvider={build:t=>new SP(t,e==null?void 0:e.cacheSizeBytes)}}}function $P(r){return new qP(r==null?void 0:r.forceOwnership)}function oR(){return new jP}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zP{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=rE(e)}set(e,t,n){this._verifyNotCommitted();const s=du(e,this._firestore),i=MP(s.converter,t,n),o=sE(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,Le.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=du(e,this._firestore);let o;return o=typeof(t=Fe(t))=="string"||t instanceof ua?oE(this._dataReader,"WriteBatch.update",i._key,t,n,s):iE(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,Le.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=du(e,this._firestore);return this._mutations=this._mutations.concat(new Ei(t._key,Le.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new O(x.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function du(r,e){if((r=Fe(r)).firestore!==e)throw new O(x.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}function aR(r){r=un(r,Ai);const e=un(r.firestore,Qr),t=ba(e),n=new fl(e);return xg(r._query),DP(t,r._query).then((s=>new Qn(e,n,r,s)))}function uR(r){return Ng(un(r.firestore,Qr),[new Ei(r._key,Le.none())])}function cR(r,...e){var h,f,m;r=Fe(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||ef(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(ef(e[n])){const _=e[n];e[n]=(h=_.next)==null?void 0:h.bind(_),e[n+1]=(f=_.error)==null?void 0:f.bind(_),e[n+2]=(m=_.complete)==null?void 0:m.bind(_)}let i,o,u;if(r instanceof we)o=un(r.firestore,Qr),u=ia(r._key.path),i={next:_=>{e[n]&&e[n](KP(o,r,_))},error:e[n+1],complete:e[n+2]};else{const _=un(r,Ai);o=un(_.firestore,Qr),u=_._query;const R=new fl(o);i={next:C=>{e[n]&&e[n](new Qn(o,R,_,C))},error:e[n+1],complete:e[n+2]},xg(r._query)}const c=ba(o);return NP(c,u,s,i)}function Ng(r,e){const t=ba(r);return kP(t,e)}function KP(r,e,t){const n=t.docs.get(e._key),s=new fl(r);return new Hn(r,s,e._key,n,new Ds(t.hasPendingWrites,t.fromCache),e.converter)}function lR(r){return r=un(r,Qr),ba(r),new zP(r,(e=>Ng(r,e)))}const tf="@firebase/firestore",nf="4.17.1";(function(e,t=!0){CT(Yr),Sr(new Jn("firestore",((n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),u=new Qr(new Dw(n.getProvider("auth-internal")),new Lw(o,n.getProvider("app-check-internal")),UT(o,s),o);return i={useFetchStreams:t,...i},u._setSettings(i),u}),"PUBLIC").setMultipleInstances(!0)),on(tf,nf,e),on(tf,nf,"esm2020")})();export{en as G,pf as a,QP as b,rR as c,oR as d,sR as e,uR as f,WP as g,eR as h,wy as i,ZP as j,aR as k,HP as l,cR as o,iR as p,JP as s,lR as w};
