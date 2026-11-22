const T_=()=>{};var Wl={};/**
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
 */const nf=function(r){const e=[];let t=0;for(let n=0;n<r.length;n++){let s=r.charCodeAt(n);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(s=65536+((s&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},w_=function(r){const e=[];let t=0,n=0;for(;t<r.length;){const s=r[t++];if(s<128)e[n++]=String.fromCharCode(s);else if(s>191&&s<224){const i=r[t++];e[n++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=r[t++],o=r[t++],c=r[t++],u=((s&7)<<18|(i&63)<<12|(o&63)<<6|c&63)-65536;e[n++]=String.fromCharCode(55296+(u>>10)),e[n++]=String.fromCharCode(56320+(u&1023))}else{const i=r[t++],o=r[t++];e[n++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},rf={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let s=0;s<r.length;s+=3){const i=r[s],o=s+1<r.length,c=o?r[s+1]:0,u=s+2<r.length,h=u?r[s+2]:0,f=i>>2,m=(i&3)<<4|c>>4;let g=(c&15)<<2|h>>6,S=h&63;u||(S=64,o||(g=64)),n.push(t[f],t[m],t[g],t[S])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(nf(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):w_(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let s=0;s<r.length;){const i=t[r.charAt(s++)],c=s<r.length?t[r.charAt(s)]:0;++s;const h=s<r.length?t[r.charAt(s)]:64;++s;const m=s<r.length?t[r.charAt(s)]:64;if(++s,i==null||c==null||h==null||m==null)throw new v_;const g=i<<2|c>>4;if(n.push(g),h!==64){const S=c<<4&240|h>>2;if(n.push(S),m!==64){const k=h<<6&192|m;n.push(k)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class v_ extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const A_=function(r){const e=nf(r);return rf.encodeByteArray(e,!0)},sf=function(r){return A_(r).replace(/\./g,"")},of=function(r){try{return rf.decodeString(r,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */const b_=()=>af().__FIREBASE_DEFAULTS__,S_=()=>{if(typeof process>"u"||typeof Wl>"u")return;const r=Wl.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},R_=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=r&&of(r[1]);return e&&JSON.parse(e)},yo=()=>{try{return T_()||b_()||S_()||R_()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},P_=r=>{var e,t;return(t=(e=yo())==null?void 0:e.emulatorHosts)==null?void 0:t[r]},cf=()=>{var r;return(r=yo())==null?void 0:r.config},uf=r=>{var e;return(e=yo())==null?void 0:e[`_${r}`]};/**
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
 */class C_{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
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
 */function Pr(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function lf(r){return(await fetch(r,{credentials:"include"})).ok}const fs={};function V_(){const r={prod:[],emulator:[]};for(const e of Object.keys(fs))fs[e]?r.emulator.push(e):r.prod.push(e);return r}function k_(r){let e=document.getElementById(r),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",r),t=!0),{created:t,element:e}}let Ql=!1;function D_(r,e){if(typeof window>"u"||typeof document>"u"||!Pr(window.location.host)||fs[r]===e||fs[r]||Ql)return;fs[r]=e;function t(g){return`__firebase__banner__${g}`}const n="__firebase__banner",i=V_().prod.length>0;function o(){const g=document.getElementById(n);g&&g.remove()}function c(g){g.style.display="flex",g.style.background="#7faaf0",g.style.position="fixed",g.style.bottom="5px",g.style.left="5px",g.style.padding=".5em",g.style.borderRadius="5px",g.style.alignItems="center"}function u(g,S){g.setAttribute("width","24"),g.setAttribute("id",S),g.setAttribute("height","24"),g.setAttribute("viewBox","0 0 24 24"),g.setAttribute("fill","none"),g.style.marginLeft="-6px"}function h(){const g=document.createElement("span");return g.style.cursor="pointer",g.style.marginLeft="16px",g.style.fontSize="24px",g.innerHTML=" &times;",g.onclick=()=>{Ql=!0,o()},g}function f(g,S){g.setAttribute("id",S),g.innerText="Learn more",g.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",g.setAttribute("target","__blank"),g.style.paddingLeft="5px",g.style.textDecoration="underline"}function m(){const g=k_(n),S=t("text"),k=document.getElementById(S)||document.createElement("span"),D=t("learnmore"),N=document.getElementById(D)||document.createElement("a"),z=t("preprendIcon"),B=document.getElementById(z)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(g.created){const q=g.element;c(q),f(N,D);const ne=h();u(B,z),q.append(B,k,N,ne),document.body.appendChild(q)}i?(k.innerText="Preview backend disconnected.",B.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(B.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,k.innerText="Preview backend running in this workspace."),k.setAttribute("id",S)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",m):m()}/**
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
 */function ye(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function N_(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(ye())}function hf(){var e;const r=(e=yo())==null?void 0:e.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function x_(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function O_(){const r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function M_(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function L_(){const r=ye();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function df(){return!hf()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function ff(){return!hf()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function wc(){try{return typeof indexedDB=="object"}catch{return!1}}function pf(){return new Promise((r,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(n);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}function F_(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
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
 */const U_="FirebaseError";class ut extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=U_,Object.setPrototypeOf(this,ut.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Un.prototype.create)}}class Un{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?B_(i,n):"Error",c=`${this.serviceName}: ${o} (${s}).`;return new ut(s,c,n)}}function B_(r,e){return r.replace(q_,(t,n)=>{const s=e[n];return s!=null?String(s):`<${n}?>`})}const q_=/\{\$([^}]+)}/g;function $_(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function bn(r,e){if(r===e)return!0;const t=Object.keys(r),n=Object.keys(e);for(const s of t){if(!n.includes(s))return!1;const i=r[s],o=e[s];if(Jl(i)&&Jl(o)){if(!bn(i,o))return!1}else if(i!==o)return!1}for(const s of n)if(!t.includes(s))return!1;return!0}function Jl(r){return r!==null&&typeof r=="object"}/**
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
 */function js(r){const e=[];for(const[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function as(r){const e={};return r.replace(/^\?/,"").split("&").forEach(n=>{if(n){const[s,i]=n.split("=");e[decodeURIComponent(s)]=decodeURIComponent(i)}}),e}function cs(r){const e=r.indexOf("?");if(!e)return"";const t=r.indexOf("#",e);return r.substring(e,t>0?t:void 0)}function j_(r,e){const t=new z_(r,e);return t.subscribe.bind(t)}class z_{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let s;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");K_(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:n},s.next===void 0&&(s.next=Ia),s.error===void 0&&(s.error=Ia),s.complete===void 0&&(s.complete=Ia);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function K_(r,e){if(typeof r!="object"||r===null)return!1;for(const t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function Ia(){}/**
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
 */function se(r){return r&&r._delegate?r._delegate:r}class Ye{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const dn="[DEFAULT]";/**
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
 */class G_{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new C_;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&n.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(n)return null;throw s}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(W_(e))try{this.getOrInitializeService({instanceIdentifier:dn})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});n.resolve(i)}catch{}}}}clearInstance(e=dn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=dn){return this.instances.has(e)}getOptions(e=dn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[i,o]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(i);n===c&&o.resolve(s)}return s}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);const i=this.instances.get(n);return i&&e(i,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:H_(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=dn){return this.component?this.component.multipleInstances?e:dn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function H_(r){return r===dn?void 0:r}function W_(r){return r.instantiationMode==="EAGER"}/**
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
 */class Q_{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new G_(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var H;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(H||(H={}));const J_={debug:H.DEBUG,verbose:H.VERBOSE,info:H.INFO,warn:H.WARN,error:H.ERROR,silent:H.SILENT},Y_=H.INFO,X_={[H.DEBUG]:"log",[H.VERBOSE]:"log",[H.INFO]:"info",[H.WARN]:"warn",[H.ERROR]:"error"},Z_=(r,e,...t)=>{if(e<r.logLevel)return;const n=new Date().toISOString(),s=X_[e];if(s)console[s](`[${n}]  ${r.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class vc{constructor(e){this.name=e,this._logLevel=Y_,this._logHandler=Z_,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in H))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?J_[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,H.DEBUG,...e),this._logHandler(this,H.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,H.VERBOSE,...e),this._logHandler(this,H.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,H.INFO,...e),this._logHandler(this,H.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,H.WARN,...e),this._logHandler(this,H.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,H.ERROR,...e),this._logHandler(this,H.ERROR,...e)}}const ey=(r,e)=>e.some(t=>r instanceof t);let Yl,Xl;function ty(){return Yl||(Yl=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function ny(){return Xl||(Xl=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const mf=new WeakMap,qa=new WeakMap,gf=new WeakMap,Ea=new WeakMap,Ac=new WeakMap;function ry(r){const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("success",i),r.removeEventListener("error",o)},i=()=>{t(mt(r.result)),s()},o=()=>{n(r.error),s()};r.addEventListener("success",i),r.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&mf.set(t,r)}).catch(()=>{}),Ac.set(e,r),e}function sy(r){if(qa.has(r))return;const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("complete",i),r.removeEventListener("error",o),r.removeEventListener("abort",o)},i=()=>{t(),s()},o=()=>{n(r.error||new DOMException("AbortError","AbortError")),s()};r.addEventListener("complete",i),r.addEventListener("error",o),r.addEventListener("abort",o)});qa.set(r,e)}let $a={get(r,e,t){if(r instanceof IDBTransaction){if(e==="done")return qa.get(r);if(e==="objectStoreNames")return r.objectStoreNames||gf.get(r);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return mt(r[e])},set(r,e,t){return r[e]=t,!0},has(r,e){return r instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in r}};function iy(r){$a=r($a)}function oy(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=r.call(Ta(this),e,...t);return gf.set(n,e.sort?e.sort():[e]),mt(n)}:ny().includes(r)?function(...e){return r.apply(Ta(this),e),mt(mf.get(this))}:function(...e){return mt(r.apply(Ta(this),e))}}function ay(r){return typeof r=="function"?oy(r):(r instanceof IDBTransaction&&sy(r),ey(r,ty())?new Proxy(r,$a):r)}function mt(r){if(r instanceof IDBRequest)return ry(r);if(Ea.has(r))return Ea.get(r);const e=ay(r);return e!==r&&(Ea.set(r,e),Ac.set(e,r)),e}const Ta=r=>Ac.get(r);function Io(r,e,{blocked:t,upgrade:n,blocking:s,terminated:i}={}){const o=indexedDB.open(r,e),c=mt(o);return n&&o.addEventListener("upgradeneeded",u=>{n(mt(o.result),u.oldVersion,u.newVersion,mt(o.transaction),u)}),t&&o.addEventListener("blocked",u=>t(u.oldVersion,u.newVersion,u)),c.then(u=>{i&&u.addEventListener("close",()=>i()),s&&u.addEventListener("versionchange",h=>s(h.oldVersion,h.newVersion,h))}).catch(()=>{}),c}function wa(r,{blocked:e}={}){const t=indexedDB.deleteDatabase(r);return e&&t.addEventListener("blocked",n=>e(n.oldVersion,n)),mt(t).then(()=>{})}const cy=["get","getKey","getAll","getAllKeys","count"],uy=["put","add","delete","clear"],va=new Map;function Zl(r,e){if(!(r instanceof IDBDatabase&&!(e in r)&&typeof e=="string"))return;if(va.get(e))return va.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,s=uy.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(s||cy.includes(t)))return;const i=async function(o,...c){const u=this.transaction(o,s?"readwrite":"readonly");let h=u.store;return n&&(h=h.index(c.shift())),(await Promise.all([h[t](...c),s&&u.done]))[0]};return va.set(e,i),i}iy(r=>({...r,get:(e,t,n)=>Zl(e,t)||r.get(e,t,n),has:(e,t)=>!!Zl(e,t)||r.has(e,t)}));/**
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
 */class ly{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(hy(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function hy(r){const e=r.getComponent();return(e==null?void 0:e.type)==="VERSION"}const ja="@firebase/app",eh="0.14.9";/**
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
 */const yt=new vc("@firebase/app"),dy="@firebase/app-compat",fy="@firebase/analytics-compat",py="@firebase/analytics",my="@firebase/app-check-compat",gy="@firebase/app-check",_y="@firebase/auth",yy="@firebase/auth-compat",Iy="@firebase/database",Ey="@firebase/data-connect",Ty="@firebase/database-compat",wy="@firebase/functions",vy="@firebase/functions-compat",Ay="@firebase/installations",by="@firebase/installations-compat",Sy="@firebase/messaging",Ry="@firebase/messaging-compat",Py="@firebase/performance",Cy="@firebase/performance-compat",Vy="@firebase/remote-config",ky="@firebase/remote-config-compat",Dy="@firebase/storage",Ny="@firebase/storage-compat",xy="@firebase/firestore",Oy="@firebase/ai",My="@firebase/firestore-compat",Ly="firebase",Fy="12.10.0";/**
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
 */const za="[DEFAULT]",Uy={[ja]:"fire-core",[dy]:"fire-core-compat",[py]:"fire-analytics",[fy]:"fire-analytics-compat",[gy]:"fire-app-check",[my]:"fire-app-check-compat",[_y]:"fire-auth",[yy]:"fire-auth-compat",[Iy]:"fire-rtdb",[Ey]:"fire-data-connect",[Ty]:"fire-rtdb-compat",[wy]:"fire-fn",[vy]:"fire-fn-compat",[Ay]:"fire-iid",[by]:"fire-iid-compat",[Sy]:"fire-fcm",[Ry]:"fire-fcm-compat",[Py]:"fire-perf",[Cy]:"fire-perf-compat",[Vy]:"fire-rc",[ky]:"fire-rc-compat",[Dy]:"fire-gcs",[Ny]:"fire-gcs-compat",[xy]:"fire-fst",[My]:"fire-fst-compat",[Oy]:"fire-vertex","fire-js":"fire-js",[Ly]:"fire-js-all"};/**
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
 */const zi=new Map,By=new Map,Ka=new Map;function th(r,e){try{r.container.addComponent(e)}catch(t){yt.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function at(r){const e=r.name;if(Ka.has(e))return yt.debug(`There were multiple attempts to register component ${e}.`),!1;Ka.set(e,r);for(const t of zi.values())th(t,r);for(const t of By.values())th(t,r);return!0}function Cr(r,e){const t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function Ue(r){return r==null?!1:r.settings!==void 0}/**
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
 */const qy={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},zt=new Un("app","Firebase",qy);/**
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
 */class $y{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new Ye("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw zt.create("app-deleted",{appName:this._name})}}/**
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
 */const Vr=Fy;function jy(r,e={}){let t=r;typeof e!="object"&&(e={name:e});const n={name:za,automaticDataCollectionEnabled:!0,...e},s=n.name;if(typeof s!="string"||!s)throw zt.create("bad-app-name",{appName:String(s)});if(t||(t=cf()),!t)throw zt.create("no-options");const i=zi.get(s);if(i){if(bn(t,i.options)&&bn(n,i.config))return i;throw zt.create("duplicate-app",{appName:s})}const o=new Q_(s);for(const u of Ka.values())o.addComponent(u);const c=new $y(t,n,o);return zi.set(s,c),c}function _f(r=za){const e=zi.get(r);if(!e&&r===za&&cf())return jy();if(!e)throw zt.create("no-app",{appName:r});return e}function ze(r,e,t){let n=Uy[r]??r;t&&(n+=`-${t}`);const s=n.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${n}" with version "${e}":`];s&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),yt.warn(o.join(" "));return}at(new Ye(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}/**
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
 */const zy="firebase-heartbeat-database",Ky=1,vs="firebase-heartbeat-store";let Aa=null;function yf(){return Aa||(Aa=Io(zy,Ky,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(vs)}catch(t){console.warn(t)}}}}).catch(r=>{throw zt.create("idb-open",{originalErrorMessage:r.message})})),Aa}async function Gy(r){try{const t=(await yf()).transaction(vs),n=await t.objectStore(vs).get(If(r));return await t.done,n}catch(e){if(e instanceof ut)yt.warn(e.message);else{const t=zt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});yt.warn(t.message)}}}async function nh(r,e){try{const n=(await yf()).transaction(vs,"readwrite");await n.objectStore(vs).put(e,If(r)),await n.done}catch(t){if(t instanceof ut)yt.warn(t.message);else{const n=zt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});yt.warn(n.message)}}}function If(r){return`${r.name}!${r.options.appId}`}/**
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
 */const Hy=1024,Wy=30;class Qy{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Yy(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=rh();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>Wy){const o=Xy(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){yt.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=rh(),{heartbeatsToSend:n,unsentEntries:s}=Jy(this._heartbeatsCache.heartbeats),i=sf(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return yt.warn(t),""}}}function rh(){return new Date().toISOString().substring(0,10)}function Jy(r,e=Hy){const t=[];let n=r.slice();for(const s of r){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),sh(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),sh(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class Yy{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return wc()?pf().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Gy(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return nh(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return nh(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function sh(r){return sf(JSON.stringify({version:2,heartbeats:r})).length}function Xy(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
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
 */function Zy(r){at(new Ye("platform-logger",e=>new ly(e),"PRIVATE")),at(new Ye("heartbeat",e=>new Qy(e),"PRIVATE")),ze(ja,eh,r),ze(ja,eh,"esm2020"),ze("fire-js","")}Zy("");function Ef(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const eI=Ef,Tf=new Un("auth","Firebase",Ef());/**
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
 */const Ki=new vc("@firebase/auth");function tI(r,...e){Ki.logLevel<=H.WARN&&Ki.warn(`Auth (${Vr}): ${r}`,...e)}function Pi(r,...e){Ki.logLevel<=H.ERROR&&Ki.error(`Auth (${Vr}): ${r}`,...e)}/**
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
 */function Ke(r,...e){throw Sc(r,...e)}function We(r,...e){return Sc(r,...e)}function bc(r,e,t){const n={...eI(),[e]:t};return new Un("auth","Firebase",n).create(e,{appName:r.name})}function gt(r){return bc(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function nI(r,e,t){const n=t;if(!(e instanceof n))throw n.name!==e.constructor.name&&Ke(r,"argument-error"),bc(r,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function Sc(r,...e){if(typeof r!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return Tf.create(r,...e)}function $(r,e,...t){if(!r)throw Sc(e,...t)}function dt(r){const e="INTERNAL ASSERTION FAILED: "+r;throw Pi(e),new Error(e)}function It(r,e){r||dt(e)}/**
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
 */function Ga(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.href)||""}function rI(){return ih()==="http:"||ih()==="https:"}function ih(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.protocol)||null}/**
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
 */function sI(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(rI()||O_()||"connection"in navigator)?navigator.onLine:!0}function iI(){if(typeof navigator>"u")return null;const r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
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
 */class zs{constructor(e,t){this.shortDelay=e,this.longDelay=t,It(t>e,"Short delay should be less than long delay!"),this.isMobile=N_()||M_()}get(){return sI()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function Rc(r,e){It(r.emulator,"Emulator should always be set here");const{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class wf{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;dt("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;dt("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;dt("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const oI={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const aI=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],cI=new zs(3e4,6e4);function wt(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function vt(r,e,t,n,s={}){return vf(r,s,async()=>{let i={},o={};n&&(e==="GET"?o=n:i={body:JSON.stringify(n)});const c=js({key:r.config.apiKey,...o}).slice(1),u=await r._getAdditionalHeaders();u["Content-Type"]="application/json",r.languageCode&&(u["X-Firebase-Locale"]=r.languageCode);const h={method:e,headers:u,...i};return x_()||(h.referrerPolicy="no-referrer"),r.emulatorConfig&&Pr(r.emulatorConfig.host)&&(h.credentials="include"),wf.fetch()(await Af(r,r.config.apiHost,t,c),h)})}async function vf(r,e,t){r._canInitEmulator=!1;const n={...oI,...e};try{const s=new lI(r),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw Ei(r,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const c=i.ok?o.errorMessage:o.error.message,[u,h]=c.split(" : ");if(u==="FEDERATED_USER_ID_ALREADY_LINKED")throw Ei(r,"credential-already-in-use",o);if(u==="EMAIL_EXISTS")throw Ei(r,"email-already-in-use",o);if(u==="USER_DISABLED")throw Ei(r,"user-disabled",o);const f=n[u]||u.toLowerCase().replace(/[_\s]+/g,"-");if(h)throw bc(r,f,h);Ke(r,f)}}catch(s){if(s instanceof ut)throw s;Ke(r,"network-request-failed",{message:String(s)})}}async function Ks(r,e,t,n,s={}){const i=await vt(r,e,t,n,s);return"mfaPendingCredential"in i&&Ke(r,"multi-factor-auth-required",{_serverResponse:i}),i}async function Af(r,e,t,n){const s=`${e}${t}?${n}`,i=r,o=i.config.emulator?Rc(r.config,s):`${r.config.apiScheme}://${s}`;return aI.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}function uI(r){switch(r){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class lI{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(We(this.auth,"network-request-failed")),cI.get())})}}function Ei(r,e,t){const n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const s=We(r,e,n);return s.customData._tokenResponse=t,s}function oh(r){return r!==void 0&&r.enterprise!==void 0}class hI{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return uI(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}async function dI(r,e){return vt(r,"GET","/v2/recaptchaConfig",wt(r,e))}/**
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
 */async function fI(r,e){return vt(r,"POST","/v1/accounts:delete",e)}async function Gi(r,e){return vt(r,"POST","/v1/accounts:lookup",e)}/**
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
 */function ps(r){if(r)try{const e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function pI(r,e=!1){const t=se(r),n=await t.getIdToken(e),s=Pc(n);$(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:n,authTime:ps(ba(s.auth_time)),issuedAtTime:ps(ba(s.iat)),expirationTime:ps(ba(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function ba(r){return Number(r)*1e3}function Pc(r){const[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return Pi("JWT malformed, contained fewer than 3 sections"),null;try{const s=of(t);return s?JSON.parse(s):(Pi("Failed to decode base64 JWT payload"),null)}catch(s){return Pi("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function ah(r){const e=Pc(r);return $(e,"internal-error"),$(typeof e.exp<"u","internal-error"),$(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function As(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof ut&&mI(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function mI({code:r}){return r==="auth/user-disabled"||r==="auth/user-token-expired"}/**
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
 */class gI{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class Ha{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=ps(this.lastLoginAt),this.creationTime=ps(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function Hi(r){var m;const e=r.auth,t=await r.getIdToken(),n=await As(r,Gi(e,{idToken:t}));$(n==null?void 0:n.users.length,e,"internal-error");const s=n.users[0];r._notifyReloadListener(s);const i=(m=s.providerUserInfo)!=null&&m.length?bf(s.providerUserInfo):[],o=yI(r.providerData,i),c=r.isAnonymous,u=!(r.email&&s.passwordHash)&&!(o!=null&&o.length),h=c?u:!1,f={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new Ha(s.createdAt,s.lastLoginAt),isAnonymous:h};Object.assign(r,f)}async function _I(r){const e=se(r);await Hi(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function yI(r,e){return[...r.filter(n=>!e.some(s=>s.providerId===n.providerId)),...e]}function bf(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
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
 */async function II(r,e){const t=await vf(r,{},async()=>{const n=js({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=r.config,o=await Af(r,s,"/v1/token",`key=${i}`),c=await r._getAdditionalHeaders();c["Content-Type"]="application/x-www-form-urlencoded";const u={method:"POST",headers:c,body:n};return r.emulatorConfig&&Pr(r.emulatorConfig.host)&&(u.credentials="include"),wf.fetch()(o,u)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function EI(r,e){return vt(r,"POST","/v2/accounts:revokeToken",wt(r,e))}/**
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
 */class sr{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){$(e.idToken,"internal-error"),$(typeof e.idToken<"u","internal-error"),$(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):ah(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){$(e.length!==0,"internal-error");const t=ah(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:($(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:s,expiresIn:i}=await II(e,t);this.updateTokensAndExpiration(n,s,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:s,expirationTime:i}=t,o=new sr;return n&&($(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),s&&($(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&($(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new sr,this.toJSON())}_performRefresh(){return dt("not implemented")}}/**
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
 */function Nt(r,e){$(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}class He{constructor({uid:e,auth:t,stsTokenManager:n,...s}){this.providerId="firebase",this.proactiveRefresh=new gI(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new Ha(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await As(this,this.stsTokenManager.getToken(this.auth,e));return $(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return pI(this,e)}reload(){return _I(this)}_assign(e){this!==e&&($(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new He({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){$(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await Hi(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Ue(this.auth.app))return Promise.reject(gt(this.auth));const e=await this.getIdToken();return await As(this,fI(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,c=t.tenantId??void 0,u=t._redirectEventId??void 0,h=t.createdAt??void 0,f=t.lastLoginAt??void 0,{uid:m,emailVerified:g,isAnonymous:S,providerData:k,stsTokenManager:D}=t;$(m&&D,e,"internal-error");const N=sr.fromJSON(this.name,D);$(typeof m=="string",e,"internal-error"),Nt(n,e.name),Nt(s,e.name),$(typeof g=="boolean",e,"internal-error"),$(typeof S=="boolean",e,"internal-error"),Nt(i,e.name),Nt(o,e.name),Nt(c,e.name),Nt(u,e.name),Nt(h,e.name),Nt(f,e.name);const z=new He({uid:m,auth:e,email:s,emailVerified:g,displayName:n,isAnonymous:S,photoURL:o,phoneNumber:i,tenantId:c,stsTokenManager:N,createdAt:h,lastLoginAt:f});return k&&Array.isArray(k)&&(z.providerData=k.map(B=>({...B}))),u&&(z._redirectEventId=u),z}static async _fromIdTokenResponse(e,t,n=!1){const s=new sr;s.updateFromServerResponse(t);const i=new He({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:n});return await Hi(i),i}static async _fromGetAccountInfoResponse(e,t,n){const s=t.users[0];$(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?bf(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),c=new sr;c.updateFromIdToken(n);const u=new He({uid:s.localId,auth:e,stsTokenManager:c,isAnonymous:o}),h={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new Ha(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(u,h),u}}/**
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
 */const ch=new Map;function ft(r){It(r instanceof Function,"Expected a class definition");let e=ch.get(r);return e?(It(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,ch.set(r,e),e)}/**
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
 */class Sf{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Sf.type="NONE";const uh=Sf;/**
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
 */function Ci(r,e,t){return`firebase:${r}:${e}:${t}`}class ir{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:s,name:i}=this.auth;this.fullUserKey=Ci(this.userKey,s.apiKey,i),this.fullPersistenceKey=Ci("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Gi(this.auth,{idToken:e}).catch(()=>{});return t?He._fromGetAccountInfoResponse(this.auth,t,e):null}return He._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,n="authUser"){if(!t.length)return new ir(ft(uh),e,n);const s=(await Promise.all(t.map(async h=>{if(await h._isAvailable())return h}))).filter(h=>h);let i=s[0]||ft(uh);const o=Ci(n,e.config.apiKey,e.name);let c=null;for(const h of t)try{const f=await h._get(o);if(f){let m;if(typeof f=="string"){const g=await Gi(e,{idToken:f}).catch(()=>{});if(!g)break;m=await He._fromGetAccountInfoResponse(e,g,f)}else m=He._fromJSON(e,f);h!==i&&(c=m),i=h;break}}catch{}const u=s.filter(h=>h._shouldAllowMigration);return!i._shouldAllowMigration||!u.length?new ir(i,e,n):(i=u[0],c&&await i._set(o,c.toJSON()),await Promise.all(t.map(async h=>{if(h!==i)try{await h._remove(o)}catch{}})),new ir(i,e,n))}}/**
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
 */function lh(r){const e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Vf(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Rf(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Df(e))return"Blackberry";if(Nf(e))return"Webos";if(Pf(e))return"Safari";if((e.includes("chrome/")||Cf(e))&&!e.includes("edge/"))return"Chrome";if(kf(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function Rf(r=ye()){return/firefox\//i.test(r)}function Pf(r=ye()){const e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Cf(r=ye()){return/crios\//i.test(r)}function Vf(r=ye()){return/iemobile/i.test(r)}function kf(r=ye()){return/android/i.test(r)}function Df(r=ye()){return/blackberry/i.test(r)}function Nf(r=ye()){return/webos/i.test(r)}function Cc(r=ye()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function TI(r=ye()){var e;return Cc(r)&&!!((e=window.navigator)!=null&&e.standalone)}function wI(){return L_()&&document.documentMode===10}function xf(r=ye()){return Cc(r)||kf(r)||Nf(r)||Df(r)||/windows phone/i.test(r)||Vf(r)}/**
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
 */function Of(r,e=[]){let t;switch(r){case"Browser":t=lh(ye());break;case"Worker":t=`${lh(ye())}-${r}`;break;default:t=r}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Vr}/${n}`}/**
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
 */class vI{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=i=>new Promise((o,c)=>{try{const u=e(i);o(u)}catch(u){c(u)}});n.onAbort=t,this.queue.push(n);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}}/**
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
 */async function AI(r,e={}){return vt(r,"GET","/v2/passwordPolicy",wt(r,e))}/**
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
 */const bI=6;class SI{constructor(e){var n;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??bI,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let s=0;s<e.length;s++)n=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
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
 */class RI{constructor(e,t,n,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new hh(this),this.idTokenSubscription=new hh(this),this.beforeStateQueue=new vI(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Tf,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=ft(t)),this._initializationPromise=this.queue(async()=>{var n,s,i;if(!this._deleted&&(this.persistenceManager=await ir.create(this,e),(n=this._resolvePersistenceManagerAvailable)==null||n.call(this),!this._deleted)){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Gi(this,{idToken:e}),n=await He._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(Ue(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(c=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(c,c))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,c=n==null?void 0:n._redirectEventId,u=await this.tryRedirectSignIn(e);(!o||o===c)&&(u!=null&&u.user)&&(n=u.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(o){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return $(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Hi(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=iI()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Ue(this.app))return Promise.reject(gt(this));const t=e?se(e):null;return t&&$(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&$(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Ue(this.app)?Promise.reject(gt(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Ue(this.app)?Promise.reject(gt(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(ft(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await AI(this),t=new SI(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new Un("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await EI(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&ft(e)||this._popupRedirectResolver;$(t,this,"argument-error"),this.redirectPersistenceManager=await ir.create(this,[ft(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const c=this._isInitialized?Promise.resolve():this._initializationPromise;if($(c,this,"internal-error"),c.then(()=>{o||i(this.currentUser)}),typeof t=="function"){const u=e.addObserver(t,n,s);return()=>{o=!0,u()}}else{const u=e.addObserver(t);return()=>{o=!0,u()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return $(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Of(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(Ue(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&tI(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function At(r){return se(r)}class hh{constructor(e){this.auth=e,this.observer=null,this.addObserver=j_(t=>this.observer=t)}get next(){return $(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
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
 */let Eo={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function PI(r){Eo=r}function Mf(r){return Eo.loadJS(r)}function CI(){return Eo.recaptchaEnterpriseScript}function VI(){return Eo.gapiScript}function kI(r){return`__${r}${Math.floor(Math.random()*1e6)}`}class DI{constructor(){this.enterprise=new NI}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class NI{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}const xI="recaptcha-enterprise",Lf="NO_RECAPTCHA";class OI{constructor(e){this.type=xI,this.auth=At(e)}async verify(e="verify",t=!1){async function n(i){if(!t){if(i.tenantId==null&&i._agentRecaptchaConfig!=null)return i._agentRecaptchaConfig.siteKey;if(i.tenantId!=null&&i._tenantRecaptchaConfigs[i.tenantId]!==void 0)return i._tenantRecaptchaConfigs[i.tenantId].siteKey}return new Promise(async(o,c)=>{dI(i,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(u=>{if(u.recaptchaKey===void 0)c(new Error("recaptcha Enterprise site key undefined"));else{const h=new hI(u);return i.tenantId==null?i._agentRecaptchaConfig=h:i._tenantRecaptchaConfigs[i.tenantId]=h,o(h.siteKey)}}).catch(u=>{c(u)})})}function s(i,o,c){const u=window.grecaptcha;oh(u)?u.enterprise.ready(()=>{u.enterprise.execute(i,{action:e}).then(h=>{o(h)}).catch(()=>{o(Lf)})}):c(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new DI().execute("siteKey",{action:"verify"}):new Promise((i,o)=>{n(this.auth).then(c=>{if(!t&&oh(window.grecaptcha))s(c,i,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let u=CI();u.length!==0&&(u+=c),Mf(u).then(()=>{s(c,i,o)}).catch(h=>{o(h)})}}).catch(c=>{o(c)})})}}async function dh(r,e,t,n=!1,s=!1){const i=new OI(r);let o;if(s)o=Lf;else try{o=await i.verify(t)}catch{o=await i.verify(t,!0)}const c={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in c){const u=c.phoneEnrollmentInfo.phoneNumber,h=c.phoneEnrollmentInfo.recaptchaToken;Object.assign(c,{phoneEnrollmentInfo:{phoneNumber:u,recaptchaToken:h,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in c){const u=c.phoneSignInInfo.recaptchaToken;Object.assign(c,{phoneSignInInfo:{recaptchaToken:u,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return c}return n?Object.assign(c,{captchaResp:o}):Object.assign(c,{captchaResponse:o}),Object.assign(c,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(c,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),c}async function Wi(r,e,t,n,s){var i;if((i=r._getRecaptchaConfig())!=null&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const o=await dh(r,e,t,t==="getOobCode");return n(r,o)}else return n(r,e).catch(async o=>{if(o.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const c=await dh(r,e,t,t==="getOobCode");return n(r,c)}else return Promise.reject(o)})}/**
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
 */function MI(r,e){const t=Cr(r,"auth");if(t.isInitialized()){const s=t.getImmediate(),i=t.getOptions();if(bn(i,e??{}))return s;Ke(s,"already-initialized")}return t.initialize({options:e})}function LI(r,e){const t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(ft);e!=null&&e.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function FI(r,e,t){const n=At(r);$(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const s=!1,i=Ff(e),{host:o,port:c}=UI(e),u=c===null?"":`:${c}`,h={url:`${i}//${o}${u}/`},f=Object.freeze({host:o,port:c,protocol:i.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!n._canInitEmulator){$(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),$(bn(h,n.config.emulator)&&bn(f,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=h,n.emulatorConfig=f,n.settings.appVerificationDisabledForTesting=!0,Pr(o)?(lf(`${i}//${o}${u}`),D_("Auth",!0)):BI()}function Ff(r){const e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function UI(r){const e=Ff(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(n);if(s){const i=s[1];return{host:i,port:fh(n.substr(i.length+1))}}else{const[i,o]=n.split(":");return{host:i,port:fh(o)}}}function fh(r){if(!r)return null;const e=Number(r);return isNaN(e)?null:e}function BI(){function r(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
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
 */class Vc{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return dt("not implemented")}_getIdTokenResponse(e){return dt("not implemented")}_linkToIdToken(e,t){return dt("not implemented")}_getReauthenticationResolver(e){return dt("not implemented")}}async function qI(r,e){return vt(r,"POST","/v1/accounts:signUp",e)}/**
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
 */async function $I(r,e){return Ks(r,"POST","/v1/accounts:signInWithPassword",wt(r,e))}async function jI(r,e){return vt(r,"POST","/v1/accounts:sendOobCode",wt(r,e))}async function zI(r,e){return jI(r,e)}/**
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
 */async function KI(r,e){return Ks(r,"POST","/v1/accounts:signInWithEmailLink",wt(r,e))}async function GI(r,e){return Ks(r,"POST","/v1/accounts:signInWithEmailLink",wt(r,e))}/**
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
 */class bs extends Vc{constructor(e,t,n,s=null){super("password",n),this._email=e,this._password=t,this._tenantId=s}static _fromEmailAndPassword(e,t){return new bs(e,t,"password")}static _fromEmailAndCode(e,t,n=null){return new bs(e,t,"emailLink",n)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Wi(e,t,"signInWithPassword",$I);case"emailLink":return KI(e,{email:this._email,oobCode:this._password});default:Ke(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const n={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Wi(e,n,"signUpPassword",qI);case"emailLink":return GI(e,{idToken:t,email:this._email,oobCode:this._password});default:Ke(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
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
 */async function or(r,e){return Ks(r,"POST","/v1/accounts:signInWithIdp",wt(r,e))}/**
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
 */const HI="http://localhost";class Sn extends Vc{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new Sn(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Ke("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,...i}=t;if(!n||!s)return null;const o=new Sn(n,s);return o.idToken=i.idToken||void 0,o.accessToken=i.accessToken||void 0,o.secret=i.secret,o.nonce=i.nonce,o.pendingToken=i.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return or(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,or(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,or(e,t)}buildRequest(){const e={requestUri:HI,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=js(t)}return e}}/**
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
 */function WI(r){switch(r){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function QI(r){const e=as(cs(r)).link,t=e?as(cs(e)).deep_link_id:null,n=as(cs(r)).deep_link_id;return(n?as(cs(n)).link:null)||n||t||e||r}class kc{constructor(e){const t=as(cs(e)),n=t.apiKey??null,s=t.oobCode??null,i=WI(t.mode??null);$(n&&s&&i,"argument-error"),this.apiKey=n,this.operation=i,this.code=s,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){const t=QI(e);try{return new kc(t)}catch{return null}}}/**
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
 */class kr{constructor(){this.providerId=kr.PROVIDER_ID}static credential(e,t){return bs._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const n=kc.parseLink(t);return $(n,"argument-error"),bs._fromEmailAndCode(e,n.code,n.tenantId)}}kr.PROVIDER_ID="password";kr.EMAIL_PASSWORD_SIGN_IN_METHOD="password";kr.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
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
 */class Dc{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
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
 */class Gs extends Dc{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
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
 */class Lt extends Gs{constructor(){super("facebook.com")}static credential(e){return Sn._fromParams({providerId:Lt.PROVIDER_ID,signInMethod:Lt.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Lt.credentialFromTaggedObject(e)}static credentialFromError(e){return Lt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Lt.credential(e.oauthAccessToken)}catch{return null}}}Lt.FACEBOOK_SIGN_IN_METHOD="facebook.com";Lt.PROVIDER_ID="facebook.com";/**
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
 */class Ft extends Gs{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return Sn._fromParams({providerId:Ft.PROVIDER_ID,signInMethod:Ft.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return Ft.credentialFromTaggedObject(e)}static credentialFromError(e){return Ft.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return Ft.credential(t,n)}catch{return null}}}Ft.GOOGLE_SIGN_IN_METHOD="google.com";Ft.PROVIDER_ID="google.com";/**
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
 */class Ut extends Gs{constructor(){super("github.com")}static credential(e){return Sn._fromParams({providerId:Ut.PROVIDER_ID,signInMethod:Ut.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Ut.credentialFromTaggedObject(e)}static credentialFromError(e){return Ut.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Ut.credential(e.oauthAccessToken)}catch{return null}}}Ut.GITHUB_SIGN_IN_METHOD="github.com";Ut.PROVIDER_ID="github.com";/**
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
 */class Bt extends Gs{constructor(){super("twitter.com")}static credential(e,t){return Sn._fromParams({providerId:Bt.PROVIDER_ID,signInMethod:Bt.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return Bt.credentialFromTaggedObject(e)}static credentialFromError(e){return Bt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return Bt.credential(t,n)}catch{return null}}}Bt.TWITTER_SIGN_IN_METHOD="twitter.com";Bt.PROVIDER_ID="twitter.com";/**
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
 */async function JI(r,e){return Ks(r,"POST","/v1/accounts:signUp",wt(r,e))}/**
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
 */class Rn{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,s=!1){const i=await He._fromIdTokenResponse(e,n,s),o=ph(n);return new Rn({user:i,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const s=ph(n);return new Rn({user:e,providerId:s,_tokenResponse:n,operationType:t})}}function ph(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
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
 */class Qi extends ut{constructor(e,t,n,s){super(t.code,t.message),this.operationType=n,this.user=s,Object.setPrototypeOf(this,Qi.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,s){return new Qi(e,t,n,s)}}function Uf(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(i=>{throw i.code==="auth/multi-factor-auth-required"?Qi._fromErrorAndOperation(r,i,e,n):i})}async function YI(r,e,t=!1){const n=await As(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return Rn._forOperation(r,"link",n)}/**
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
 */async function XI(r,e,t=!1){const{auth:n}=r;if(Ue(n.app))return Promise.reject(gt(n));const s="reauthenticate";try{const i=await As(r,Uf(n,s,e,r),t);$(i.idToken,n,"internal-error");const o=Pc(i.idToken);$(o,n,"internal-error");const{sub:c}=o;return $(r.uid===c,n,"user-mismatch"),Rn._forOperation(r,s,i)}catch(i){throw(i==null?void 0:i.code)==="auth/user-not-found"&&Ke(n,"user-mismatch"),i}}/**
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
 */async function Bf(r,e,t=!1){if(Ue(r.app))return Promise.reject(gt(r));const n="signIn",s=await Uf(r,n,e),i=await Rn._fromIdTokenResponse(r,n,s);return t||await r._updateCurrentUser(i.user),i}async function ZI(r,e){return Bf(At(r),e)}/**
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
 */async function qf(r){const e=At(r);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function SS(r,e,t){const n=At(r);await Wi(n,{requestType:"PASSWORD_RESET",email:e,clientType:"CLIENT_TYPE_WEB"},"getOobCode",zI)}async function RS(r,e,t){if(Ue(r.app))return Promise.reject(gt(r));const n=At(r),o=await Wi(n,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",JI).catch(u=>{throw u.code==="auth/password-does-not-meet-requirements"&&qf(r),u}),c=await Rn._fromIdTokenResponse(n,"signIn",o);return await n._updateCurrentUser(c.user),c}function PS(r,e,t){return Ue(r.app)?Promise.reject(gt(r)):ZI(se(r),kr.credential(e,t)).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&qf(r),n})}function eE(r,e,t,n){return se(r).onIdTokenChanged(e,t,n)}function tE(r,e,t){return se(r).beforeAuthStateChanged(e,t)}function CS(r,e,t,n){return se(r).onAuthStateChanged(e,t,n)}function VS(r){return se(r).signOut()}const Ji="__sak";/**
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
 */class $f{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Ji,"1"),this.storage.removeItem(Ji),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
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
 */const nE=1e3,rE=10;class jf extends $f{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=xf(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),s=this.localCache[t];n!==s&&e(t,s,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,c,u)=>{this.notifyListeners(o,u)});return}const n=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},i=this.storage.getItem(n);wI()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,rE):s()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},nE)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}jf.type="LOCAL";const sE=jf;/**
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
 */class zf extends $f{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}zf.type="SESSION";const Kf=zf;/**
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
 */function iE(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
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
 */class To{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const n=new To(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:s,data:i}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:s});const c=Array.from(o).map(async h=>h(t.origin,i)),u=await iE(c);t.ports[0].postMessage({status:"done",eventId:n,eventType:s,response:u})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}To.receivers=[];/**
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
 */function Nc(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
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
 */class oE{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let i,o;return new Promise((c,u)=>{const h=Nc("",20);s.port1.start();const f=setTimeout(()=>{u(new Error("unsupported_event"))},n);o={messageChannel:s,onMessage(m){const g=m;if(g.data.eventId===h)switch(g.data.status){case"ack":clearTimeout(f),i=setTimeout(()=>{u(new Error("timeout"))},3e3);break;case"done":clearTimeout(i),c(g.data.response);break;default:clearTimeout(f),clearTimeout(i),u(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:h,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
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
 */function it(){return window}function aE(r){it().location.href=r}/**
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
 */function Gf(){return typeof it().WorkerGlobalScope<"u"&&typeof it().importScripts=="function"}async function cE(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function uE(){var r;return((r=navigator==null?void 0:navigator.serviceWorker)==null?void 0:r.controller)||null}function lE(){return Gf()?self:null}/**
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
 */const Hf="firebaseLocalStorageDb",hE=1,Yi="firebaseLocalStorage",Wf="fbase_key";class Hs{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function wo(r,e){return r.transaction([Yi],e?"readwrite":"readonly").objectStore(Yi)}function dE(){const r=indexedDB.deleteDatabase(Hf);return new Hs(r).toPromise()}function Wa(){const r=indexedDB.open(Hf,hE);return new Promise((e,t)=>{r.addEventListener("error",()=>{t(r.error)}),r.addEventListener("upgradeneeded",()=>{const n=r.result;try{n.createObjectStore(Yi,{keyPath:Wf})}catch(s){t(s)}}),r.addEventListener("success",async()=>{const n=r.result;n.objectStoreNames.contains(Yi)?e(n):(n.close(),await dE(),e(await Wa()))})})}async function mh(r,e,t){const n=wo(r,!0).put({[Wf]:e,value:t});return new Hs(n).toPromise()}async function fE(r,e){const t=wo(r,!1).get(e),n=await new Hs(t).toPromise();return n===void 0?null:n.value}function gh(r,e){const t=wo(r,!0).delete(e);return new Hs(t).toPromise()}const pE=800,mE=3;class Qf{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Wa(),this.db)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(t++>mE)throw n;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Gf()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=To._getInstance(lE()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await cE(),!this.activeServiceWorker)return;this.sender=new oE(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||uE()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await Wa();return await mh(e,Ji,"1"),await gh(e,Ji),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>mh(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>fE(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>gh(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(s=>{const i=wo(s,!1).getAll();return new Hs(i).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:s,value:i}of e)n.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(i)&&(this.notifyListeners(s,i),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!n.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),pE)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}Qf.type="LOCAL";const gE=Qf;new zs(3e4,6e4);/**
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
 */function Jf(r,e){return e?ft(e):($(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
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
 */class xc extends Vc{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return or(e,this._buildIdpRequest())}_linkToIdToken(e,t){return or(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return or(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function _E(r){return Bf(r.auth,new xc(r),r.bypassAuthState)}function yE(r){const{auth:e,user:t}=r;return $(t,e,"internal-error"),XI(t,new xc(r),r.bypassAuthState)}async function IE(r){const{auth:e,user:t}=r;return $(t,e,"internal-error"),YI(t,new xc(r),r.bypassAuthState)}/**
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
 */class Yf{constructor(e,t,n,s,i=!1){this.auth=e,this.resolver=n,this.user=s,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:s,tenantId:i,error:o,type:c}=e;if(o){this.reject(o);return}const u={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(c)(u))}catch(h){this.reject(h)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return _E;case"linkViaPopup":case"linkViaRedirect":return IE;case"reauthViaPopup":case"reauthViaRedirect":return yE;default:Ke(this.auth,"internal-error")}}resolve(e){It(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){It(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
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
 */const EE=new zs(2e3,1e4);async function kS(r,e,t){if(Ue(r.app))return Promise.reject(We(r,"operation-not-supported-in-this-environment"));const n=At(r);nI(r,e,Dc);const s=Jf(n,t);return new In(n,"signInViaPopup",e,s).executeNotNull()}class In extends Yf{constructor(e,t,n,s,i){super(e,t,s,i),this.provider=n,this.authWindow=null,this.pollId=null,In.currentPopupAction&&In.currentPopupAction.cancel(),In.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return $(e,this.auth,"internal-error"),e}async onExecution(){It(this.filter.length===1,"Popup operations only handle one event");const e=Nc();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(We(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(We(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,In.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(We(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,EE.get())};e()}}In.currentPopupAction=null;/**
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
 */const TE="pendingRedirect",Vi=new Map;class wE extends Yf{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=Vi.get(this.auth._key());if(!e){try{const n=await vE(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}Vi.set(this.auth._key(),e)}return this.bypassAuthState||Vi.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function vE(r,e){const t=SE(e),n=bE(r);if(!await n._isAvailable())return!1;const s=await n._get(t)==="true";return await n._remove(t),s}function AE(r,e){Vi.set(r._key(),e)}function bE(r){return ft(r._redirectPersistence)}function SE(r){return Ci(TE,r.config.apiKey,r.name)}async function RE(r,e,t=!1){if(Ue(r.app))return Promise.reject(gt(r));const n=At(r),s=Jf(n,e),o=await new wE(n,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}/**
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
 */const PE=600*1e3;class CE{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!VE(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!Xf(e)){const s=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(We(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=PE&&this.cachedEventUids.clear(),this.cachedEventUids.has(_h(e))}saveEventToCache(e){this.cachedEventUids.add(_h(e)),this.lastProcessedEventTime=Date.now()}}function _h(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function Xf({type:r,error:e}){return r==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function VE(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Xf(r);default:return!1}}/**
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
 */async function kE(r,e={}){return vt(r,"GET","/v1/projects",e)}/**
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
 */const DE=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,NE=/^https?/;async function xE(r){if(r.config.emulator)return;const{authorizedDomains:e}=await kE(r);for(const t of e)try{if(OE(t))return}catch{}Ke(r,"unauthorized-domain")}function OE(r){const e=Ga(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){const o=new URL(r);return o.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!NE.test(t))return!1;if(DE.test(r))return n===r;const s=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(n)}/**
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
 */const ME=new zs(3e4,6e4);function yh(){const r=it().___jsl;if(r!=null&&r.H){for(const e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function LE(r){return new Promise((e,t)=>{var s,i,o;function n(){yh(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{yh(),t(We(r,"network-request-failed"))},timeout:ME.get()})}if((i=(s=it().gapi)==null?void 0:s.iframes)!=null&&i.Iframe)e(gapi.iframes.getContext());else if((o=it().gapi)!=null&&o.load)n();else{const c=kI("iframefcb");return it()[c]=()=>{gapi.load?n():t(We(r,"network-request-failed"))},Mf(`${VI()}?onload=${c}`).catch(u=>t(u))}}).catch(e=>{throw ki=null,e})}let ki=null;function FE(r){return ki=ki||LE(r),ki}/**
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
 */const UE=new zs(5e3,15e3),BE="__/auth/iframe",qE="emulator/auth/iframe",$E={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},jE=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function zE(r){const e=r.config;$(e.authDomain,r,"auth-domain-config-required");const t=e.emulator?Rc(e,qE):`https://${r.config.authDomain}/${BE}`,n={apiKey:e.apiKey,appName:r.name,v:Vr},s=jE.get(r.config.apiHost);s&&(n.eid=s);const i=r._getFrameworks();return i.length&&(n.fw=i.join(",")),`${t}?${js(n).slice(1)}`}async function KE(r){const e=await FE(r),t=it().gapi;return $(t,r,"internal-error"),e.open({where:document.body,url:zE(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:$E,dontclear:!0},n=>new Promise(async(s,i)=>{await n.restyle({setHideOnLeave:!1});const o=We(r,"network-request-failed"),c=it().setTimeout(()=>{i(o)},UE.get());function u(){it().clearTimeout(c),s(n)}n.ping(u).then(u,()=>{i(o)})}))}/**
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
 */const GE={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},HE=500,WE=600,QE="_blank",JE="http://localhost";class Ih{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function YE(r,e,t,n=HE,s=WE){const i=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let c="";const u={...GE,width:n.toString(),height:s.toString(),top:i,left:o},h=ye().toLowerCase();t&&(c=Cf(h)?QE:t),Rf(h)&&(e=e||JE,u.scrollbars="yes");const f=Object.entries(u).reduce((g,[S,k])=>`${g}${S}=${k},`,"");if(TI(h)&&c!=="_self")return XE(e||"",c),new Ih(null);const m=window.open(e||"",c,f);$(m,r,"popup-blocked");try{m.focus()}catch{}return new Ih(m)}function XE(r,e){const t=document.createElement("a");t.href=r,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
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
 */const ZE="__/auth/handler",eT="emulator/auth/handler",tT=encodeURIComponent("fac");async function Eh(r,e,t,n,s,i){$(r.config.authDomain,r,"auth-domain-config-required"),$(r.config.apiKey,r,"invalid-api-key");const o={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:Vr,eventId:s};if(e instanceof Dc){e.setDefaultLanguage(r.languageCode),o.providerId=e.providerId||"",$_(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[f,m]of Object.entries({}))o[f]=m}if(e instanceof Gs){const f=e.getScopes().filter(m=>m!=="");f.length>0&&(o.scopes=f.join(","))}r.tenantId&&(o.tid=r.tenantId);const c=o;for(const f of Object.keys(c))c[f]===void 0&&delete c[f];const u=await r._getAppCheckToken(),h=u?`#${tT}=${encodeURIComponent(u)}`:"";return`${nT(r)}?${js(c).slice(1)}${h}`}function nT({config:r}){return r.emulator?Rc(r,eT):`https://${r.authDomain}/${ZE}`}/**
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
 */const Sa="webStorageSupport";class rT{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Kf,this._completeRedirectFn=RE,this._overrideRedirectResult=AE}async _openPopup(e,t,n,s){var o;It((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const i=await Eh(e,t,n,Ga(),s);return YE(e,i,Nc())}async _openRedirect(e,t,n,s){await this._originValidation(e);const i=await Eh(e,t,n,Ga(),s);return aE(i),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:i}=this.eventManagers[t];return s?Promise.resolve(s):(It(i,"If manager is not set, promise should be"),i)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await KE(e),n=new CE(e);return t.register("authEvent",s=>($(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:n.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Sa,{type:Sa},s=>{var o;const i=(o=s==null?void 0:s[0])==null?void 0:o[Sa];i!==void 0&&t(!!i),Ke(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=xE(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return xf()||Pf()||Cc()}}const sT=rT;var Th="@firebase/auth",wh="1.12.1";/**
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
 */class iT{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){$(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function oT(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function aT(r){at(new Ye("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:c}=n.options;$(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const u={apiKey:o,authDomain:c,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Of(r)},h=new RI(n,s,i,u);return LI(h,t),h},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),at(new Ye("auth-internal",e=>{const t=At(e.getProvider("auth").getImmediate());return(n=>new iT(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ze(Th,wh,oT(r)),ze(Th,wh,"esm2020")}/**
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
 */const cT=300,uT=uf("authIdTokenMaxAge")||cT;let vh=null;const lT=r=>async e=>{const t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>uT)return;const s=t==null?void 0:t.token;vh!==s&&(vh=s,await fetch(r,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function DS(r=_f()){const e=Cr(r,"auth");if(e.isInitialized())return e.getImmediate();const t=MI(r,{popupRedirectResolver:sT,persistence:[gE,sE,Kf]}),n=uf("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){const i=new URL(n,location.origin);if(location.origin===i.origin){const o=lT(i.toString());tE(t,o,()=>o(t.currentUser)),eE(t,c=>o(c))}}const s=P_("auth");return s&&FI(t,`http://${s}`),t}function hT(){var r;return((r=document.getElementsByTagName("head"))==null?void 0:r[0])??document}PI({loadJS(r){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",r),n.onload=e,n.onerror=s=>{const i=We("internal-error");i.customData=s,t(i)},n.type="text/javascript",n.charset="UTF-8",hT().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});aT("Browser");var dT="firebase",fT="12.10.0";/**
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
 */ze(dT,fT,"app");var Ah=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Kt,Zf;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(E,_){function I(){}I.prototype=_.prototype,E.F=_.prototype,E.prototype=new I,E.prototype.constructor=E,E.D=function(w,T,b){for(var y=Array(arguments.length-2),xe=2;xe<arguments.length;xe++)y[xe-2]=arguments[xe];return _.prototype[T].apply(w,y)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(E,_,I){I||(I=0);const w=Array(16);if(typeof _=="string")for(var T=0;T<16;++T)w[T]=_.charCodeAt(I++)|_.charCodeAt(I++)<<8|_.charCodeAt(I++)<<16|_.charCodeAt(I++)<<24;else for(T=0;T<16;++T)w[T]=_[I++]|_[I++]<<8|_[I++]<<16|_[I++]<<24;_=E.g[0],I=E.g[1],T=E.g[2];let b=E.g[3],y;y=_+(b^I&(T^b))+w[0]+3614090360&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[1]+3905402710&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[2]+606105819&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[3]+3250441966&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(b^I&(T^b))+w[4]+4118548399&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[5]+1200080426&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[6]+2821735955&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[7]+4249261313&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(b^I&(T^b))+w[8]+1770035416&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[9]+2336552879&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[10]+4294925233&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[11]+2304563134&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(b^I&(T^b))+w[12]+1804603682&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[13]+4254626195&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[14]+2792965006&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[15]+1236535329&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(T^b&(I^T))+w[1]+4129170786&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[6]+3225465664&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[11]+643717713&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[0]+3921069994&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(T^b&(I^T))+w[5]+3593408605&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[10]+38016083&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[15]+3634488961&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[4]+3889429448&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(T^b&(I^T))+w[9]+568446438&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[14]+3275163606&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[3]+4107603335&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[8]+1163531501&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(T^b&(I^T))+w[13]+2850285829&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[2]+4243563512&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[7]+1735328473&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[12]+2368359562&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(I^T^b)+w[5]+4294588738&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[8]+2272392833&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[11]+1839030562&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[14]+4259657740&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(I^T^b)+w[1]+2763975236&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[4]+1272893353&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[7]+4139469664&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[10]+3200236656&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(I^T^b)+w[13]+681279174&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[0]+3936430074&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[3]+3572445317&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[6]+76029189&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(I^T^b)+w[9]+3654602809&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[12]+3873151461&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[15]+530742520&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[2]+3299628645&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(T^(I|~b))+w[0]+4096336452&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[7]+1126891415&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[14]+2878612391&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[5]+4237533241&4294967295,I=T+(y<<21&4294967295|y>>>11),y=_+(T^(I|~b))+w[12]+1700485571&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[3]+2399980690&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[10]+4293915773&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[1]+2240044497&4294967295,I=T+(y<<21&4294967295|y>>>11),y=_+(T^(I|~b))+w[8]+1873313359&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[15]+4264355552&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[6]+2734768916&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[13]+1309151649&4294967295,I=T+(y<<21&4294967295|y>>>11),y=_+(T^(I|~b))+w[4]+4149444226&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[11]+3174756917&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[2]+718787259&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[9]+3951481745&4294967295,E.g[0]=E.g[0]+_&4294967295,E.g[1]=E.g[1]+(T+(y<<21&4294967295|y>>>11))&4294967295,E.g[2]=E.g[2]+T&4294967295,E.g[3]=E.g[3]+b&4294967295}n.prototype.v=function(E,_){_===void 0&&(_=E.length);const I=_-this.blockSize,w=this.C;let T=this.h,b=0;for(;b<_;){if(T==0)for(;b<=I;)s(this,E,b),b+=this.blockSize;if(typeof E=="string"){for(;b<_;)if(w[T++]=E.charCodeAt(b++),T==this.blockSize){s(this,w),T=0;break}}else for(;b<_;)if(w[T++]=E[b++],T==this.blockSize){s(this,w),T=0;break}}this.h=T,this.o+=_},n.prototype.A=function(){var E=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);E[0]=128;for(var _=1;_<E.length-8;++_)E[_]=0;_=this.o*8;for(var I=E.length-8;I<E.length;++I)E[I]=_&255,_/=256;for(this.v(E),E=Array(16),_=0,I=0;I<4;++I)for(let w=0;w<32;w+=8)E[_++]=this.g[I]>>>w&255;return E};function i(E,_){var I=c;return Object.prototype.hasOwnProperty.call(I,E)?I[E]:I[E]=_(E)}function o(E,_){this.h=_;const I=[];let w=!0;for(let T=E.length-1;T>=0;T--){const b=E[T]|0;w&&b==_||(I[T]=b,w=!1)}this.g=I}var c={};function u(E){return-128<=E&&E<128?i(E,function(_){return new o([_|0],_<0?-1:0)}):new o([E|0],E<0?-1:0)}function h(E){if(isNaN(E)||!isFinite(E))return m;if(E<0)return N(h(-E));const _=[];let I=1;for(let w=0;E>=I;w++)_[w]=E/I|0,I*=4294967296;return new o(_,0)}function f(E,_){if(E.length==0)throw Error("number format error: empty string");if(_=_||10,_<2||36<_)throw Error("radix out of range: "+_);if(E.charAt(0)=="-")return N(f(E.substring(1),_));if(E.indexOf("-")>=0)throw Error('number format error: interior "-" character');const I=h(Math.pow(_,8));let w=m;for(let b=0;b<E.length;b+=8){var T=Math.min(8,E.length-b);const y=parseInt(E.substring(b,b+T),_);T<8?(T=h(Math.pow(_,T)),w=w.j(T).add(h(y))):(w=w.j(I),w=w.add(h(y)))}return w}var m=u(0),g=u(1),S=u(16777216);r=o.prototype,r.m=function(){if(D(this))return-N(this).m();let E=0,_=1;for(let I=0;I<this.g.length;I++){const w=this.i(I);E+=(w>=0?w:4294967296+w)*_,_*=4294967296}return E},r.toString=function(E){if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(k(this))return"0";if(D(this))return"-"+N(this).toString(E);const _=h(Math.pow(E,6));var I=this;let w="";for(;;){const T=ne(I,_).g;I=z(I,T.j(_));let b=((I.g.length>0?I.g[0]:I.h)>>>0).toString(E);if(I=T,k(I))return b+w;for(;b.length<6;)b="0"+b;w=b+w}},r.i=function(E){return E<0?0:E<this.g.length?this.g[E]:this.h};function k(E){if(E.h!=0)return!1;for(let _=0;_<E.g.length;_++)if(E.g[_]!=0)return!1;return!0}function D(E){return E.h==-1}r.l=function(E){return E=z(this,E),D(E)?-1:k(E)?0:1};function N(E){const _=E.g.length,I=[];for(let w=0;w<_;w++)I[w]=~E.g[w];return new o(I,~E.h).add(g)}r.abs=function(){return D(this)?N(this):this},r.add=function(E){const _=Math.max(this.g.length,E.g.length),I=[];let w=0;for(let T=0;T<=_;T++){let b=w+(this.i(T)&65535)+(E.i(T)&65535),y=(b>>>16)+(this.i(T)>>>16)+(E.i(T)>>>16);w=y>>>16,b&=65535,y&=65535,I[T]=y<<16|b}return new o(I,I[I.length-1]&-2147483648?-1:0)};function z(E,_){return E.add(N(_))}r.j=function(E){if(k(this)||k(E))return m;if(D(this))return D(E)?N(this).j(N(E)):N(N(this).j(E));if(D(E))return N(this.j(N(E)));if(this.l(S)<0&&E.l(S)<0)return h(this.m()*E.m());const _=this.g.length+E.g.length,I=[];for(var w=0;w<2*_;w++)I[w]=0;for(w=0;w<this.g.length;w++)for(let T=0;T<E.g.length;T++){const b=this.i(w)>>>16,y=this.i(w)&65535,xe=E.i(T)>>>16,sn=E.i(T)&65535;I[2*w+2*T]+=y*sn,B(I,2*w+2*T),I[2*w+2*T+1]+=b*sn,B(I,2*w+2*T+1),I[2*w+2*T+1]+=y*xe,B(I,2*w+2*T+1),I[2*w+2*T+2]+=b*xe,B(I,2*w+2*T+2)}for(E=0;E<_;E++)I[E]=I[2*E+1]<<16|I[2*E];for(E=_;E<2*_;E++)I[E]=0;return new o(I,0)};function B(E,_){for(;(E[_]&65535)!=E[_];)E[_+1]+=E[_]>>>16,E[_]&=65535,_++}function q(E,_){this.g=E,this.h=_}function ne(E,_){if(k(_))throw Error("division by zero");if(k(E))return new q(m,m);if(D(E))return _=ne(N(E),_),new q(N(_.g),N(_.h));if(D(_))return _=ne(E,N(_)),new q(N(_.g),_.h);if(E.g.length>30){if(D(E)||D(_))throw Error("slowDivide_ only works with positive integers.");for(var I=g,w=_;w.l(E)<=0;)I=Y(I),w=Y(w);var T=X(I,1),b=X(w,1);for(w=X(w,2),I=X(I,2);!k(w);){var y=b.add(w);y.l(E)<=0&&(T=T.add(I),b=y),w=X(w,1),I=X(I,1)}return _=z(E,T.j(_)),new q(T,_)}for(T=m;E.l(_)>=0;){for(I=Math.max(1,Math.floor(E.m()/_.m())),w=Math.ceil(Math.log(I)/Math.LN2),w=w<=48?1:Math.pow(2,w-48),b=h(I),y=b.j(_);D(y)||y.l(E)>0;)I-=w,b=h(I),y=b.j(_);k(b)&&(b=g),T=T.add(b),E=z(E,y)}return new q(T,E)}r.B=function(E){return ne(this,E).h},r.and=function(E){const _=Math.max(this.g.length,E.g.length),I=[];for(let w=0;w<_;w++)I[w]=this.i(w)&E.i(w);return new o(I,this.h&E.h)},r.or=function(E){const _=Math.max(this.g.length,E.g.length),I=[];for(let w=0;w<_;w++)I[w]=this.i(w)|E.i(w);return new o(I,this.h|E.h)},r.xor=function(E){const _=Math.max(this.g.length,E.g.length),I=[];for(let w=0;w<_;w++)I[w]=this.i(w)^E.i(w);return new o(I,this.h^E.h)};function Y(E){const _=E.g.length+1,I=[];for(let w=0;w<_;w++)I[w]=E.i(w)<<1|E.i(w-1)>>>31;return new o(I,E.h)}function X(E,_){const I=_>>5;_%=32;const w=E.g.length-I,T=[];for(let b=0;b<w;b++)T[b]=_>0?E.i(b+I)>>>_|E.i(b+I+1)<<32-_:E.i(b+I);return new o(T,E.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,Zf=n,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=h,o.fromString=f,Kt=o}).apply(typeof Ah<"u"?Ah:typeof self<"u"?self:typeof window<"u"?window:{});var Ti=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var ep,us,tp,Di,Qa,np,rp,sp;(function(){var r,e=Object.defineProperty;function t(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof Ti=="object"&&Ti];for(var l=0;l<a.length;++l){var d=a[l];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var n=t(this);function s(a,l){if(l)e:{var d=n;a=a.split(".");for(var p=0;p<a.length-1;p++){var A=a[p];if(!(A in d))break e;d=d[A]}a=a[a.length-1],p=d[a],l=l(p),l!=p&&l!=null&&e(d,a,{configurable:!0,writable:!0,value:l})}}s("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(a){return a||function(l){var d=[],p;for(p in l)Object.prototype.hasOwnProperty.call(l,p)&&d.push([p,l[p]]);return d}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function c(a){var l=typeof a;return l=="object"&&a!=null||l=="function"}function u(a,l,d){return a.call.apply(a.bind,arguments)}function h(a,l,d){return h=u,h.apply(null,arguments)}function f(a,l){var d=Array.prototype.slice.call(arguments,1);return function(){var p=d.slice();return p.push.apply(p,arguments),a.apply(this,p)}}function m(a,l){function d(){}d.prototype=l.prototype,a.Z=l.prototype,a.prototype=new d,a.prototype.constructor=a,a.Ob=function(p,A,P){for(var x=Array(arguments.length-2),K=2;K<arguments.length;K++)x[K-2]=arguments[K];return l.prototype[A].apply(p,x)}}var g=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function S(a){const l=a.length;if(l>0){const d=Array(l);for(let p=0;p<l;p++)d[p]=a[p];return d}return[]}function k(a,l){for(let p=1;p<arguments.length;p++){const A=arguments[p];var d=typeof A;if(d=d!="object"?d:A?Array.isArray(A)?"array":d:"null",d=="array"||d=="object"&&typeof A.length=="number"){d=a.length||0;const P=A.length||0;a.length=d+P;for(let x=0;x<P;x++)a[d+x]=A[x]}else a.push(A)}}class D{constructor(l,d){this.i=l,this.j=d,this.h=0,this.g=null}get(){let l;return this.h>0?(this.h--,l=this.g,this.g=l.next,l.next=null):l=this.i(),l}}function N(a){o.setTimeout(()=>{throw a},0)}function z(){var a=E;let l=null;return a.g&&(l=a.g,a.g=a.g.next,a.g||(a.h=null),l.next=null),l}class B{constructor(){this.h=this.g=null}add(l,d){const p=q.get();p.set(l,d),this.h?this.h.next=p:this.g=p,this.h=p}}var q=new D(()=>new ne,a=>a.reset());class ne{constructor(){this.next=this.g=this.h=null}set(l,d){this.h=l,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let Y,X=!1,E=new B,_=()=>{const a=Promise.resolve(void 0);Y=()=>{a.then(I)}};function I(){for(var a;a=z();){try{a.h.call(a.g)}catch(d){N(d)}var l=q;l.j(a),l.h<100&&(l.h++,a.next=l.g,l.g=a)}X=!1}function w(){this.u=this.u,this.C=this.C}w.prototype.u=!1,w.prototype.dispose=function(){this.u||(this.u=!0,this.N())},w.prototype[Symbol.dispose]=function(){this.dispose()},w.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(a,l){this.type=a,this.g=this.target=l,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var b=(function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,l=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const d=()=>{};o.addEventListener("test",d,l),o.removeEventListener("test",d,l)}catch{}return a})();function y(a){return/^[\s\xa0]*$/.test(a)}function xe(a,l){T.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,l)}m(xe,T),xe.prototype.init=function(a,l){const d=this.type=a.type,p=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=l,l=a.relatedTarget,l||(d=="mouseover"?l=a.fromElement:d=="mouseout"&&(l=a.toElement)),this.relatedTarget=l,p?(this.clientX=p.clientX!==void 0?p.clientX:p.pageX,this.clientY=p.clientY!==void 0?p.clientY:p.pageY,this.screenX=p.screenX||0,this.screenY=p.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&xe.Z.h.call(this)},xe.prototype.h=function(){xe.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var sn="closure_listenable_"+(Math.random()*1e6|0),jg=0;function zg(a,l,d,p,A){this.listener=a,this.proxy=null,this.src=l,this.type=d,this.capture=!!p,this.ha=A,this.key=++jg,this.da=this.fa=!1}function ii(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function oi(a,l,d){for(const p in a)l.call(d,a[p],p,a)}function Kg(a,l){for(const d in a)l.call(void 0,a[d],d,a)}function Hu(a){const l={};for(const d in a)l[d]=a[d];return l}const Wu="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Qu(a,l){let d,p;for(let A=1;A<arguments.length;A++){p=arguments[A];for(d in p)a[d]=p[d];for(let P=0;P<Wu.length;P++)d=Wu[P],Object.prototype.hasOwnProperty.call(p,d)&&(a[d]=p[d])}}function ai(a){this.src=a,this.g={},this.h=0}ai.prototype.add=function(a,l,d,p,A){const P=a.toString();a=this.g[P],a||(a=this.g[P]=[],this.h++);const x=Jo(a,l,p,A);return x>-1?(l=a[x],d||(l.fa=!1)):(l=new zg(l,this.src,P,!!p,A),l.fa=d,a.push(l)),l};function Qo(a,l){const d=l.type;if(d in a.g){var p=a.g[d],A=Array.prototype.indexOf.call(p,l,void 0),P;(P=A>=0)&&Array.prototype.splice.call(p,A,1),P&&(ii(l),a.g[d].length==0&&(delete a.g[d],a.h--))}}function Jo(a,l,d,p){for(let A=0;A<a.length;++A){const P=a[A];if(!P.da&&P.listener==l&&P.capture==!!d&&P.ha==p)return A}return-1}var Yo="closure_lm_"+(Math.random()*1e6|0),Xo={};function Ju(a,l,d,p,A){if(Array.isArray(l)){for(let P=0;P<l.length;P++)Ju(a,l[P],d,p,A);return null}return d=Zu(d),a&&a[sn]?a.J(l,d,c(p)?!!p.capture:!1,A):Gg(a,l,d,!1,p,A)}function Gg(a,l,d,p,A,P){if(!l)throw Error("Invalid event type");const x=c(A)?!!A.capture:!!A;let K=ea(a);if(K||(a[Yo]=K=new ai(a)),d=K.add(l,d,p,x,P),d.proxy)return d;if(p=Hg(),d.proxy=p,p.src=a,p.listener=d,a.addEventListener)b||(A=x),A===void 0&&(A=!1),a.addEventListener(l.toString(),p,A);else if(a.attachEvent)a.attachEvent(Xu(l.toString()),p);else if(a.addListener&&a.removeListener)a.addListener(p);else throw Error("addEventListener and attachEvent are unavailable.");return d}function Hg(){function a(d){return l.call(a.src,a.listener,d)}const l=Wg;return a}function Yu(a,l,d,p,A){if(Array.isArray(l))for(var P=0;P<l.length;P++)Yu(a,l[P],d,p,A);else p=c(p)?!!p.capture:!!p,d=Zu(d),a&&a[sn]?(a=a.i,P=String(l).toString(),P in a.g&&(l=a.g[P],d=Jo(l,d,p,A),d>-1&&(ii(l[d]),Array.prototype.splice.call(l,d,1),l.length==0&&(delete a.g[P],a.h--)))):a&&(a=ea(a))&&(l=a.g[l.toString()],a=-1,l&&(a=Jo(l,d,p,A)),(d=a>-1?l[a]:null)&&Zo(d))}function Zo(a){if(typeof a!="number"&&a&&!a.da){var l=a.src;if(l&&l[sn])Qo(l.i,a);else{var d=a.type,p=a.proxy;l.removeEventListener?l.removeEventListener(d,p,a.capture):l.detachEvent?l.detachEvent(Xu(d),p):l.addListener&&l.removeListener&&l.removeListener(p),(d=ea(l))?(Qo(d,a),d.h==0&&(d.src=null,l[Yo]=null)):ii(a)}}}function Xu(a){return a in Xo?Xo[a]:Xo[a]="on"+a}function Wg(a,l){if(a.da)a=!0;else{l=new xe(l,this);const d=a.listener,p=a.ha||a.src;a.fa&&Zo(a),a=d.call(p,l)}return a}function ea(a){return a=a[Yo],a instanceof ai?a:null}var ta="__closure_events_fn_"+(Math.random()*1e9>>>0);function Zu(a){return typeof a=="function"?a:(a[ta]||(a[ta]=function(l){return a.handleEvent(l)}),a[ta])}function be(){w.call(this),this.i=new ai(this),this.M=this,this.G=null}m(be,w),be.prototype[sn]=!0,be.prototype.removeEventListener=function(a,l,d,p){Yu(this,a,l,d,p)};function De(a,l){var d,p=a.G;if(p)for(d=[];p;p=p.G)d.push(p);if(a=a.M,p=l.type||l,typeof l=="string")l=new T(l,a);else if(l instanceof T)l.target=l.target||a;else{var A=l;l=new T(p,a),Qu(l,A)}A=!0;let P,x;if(d)for(x=d.length-1;x>=0;x--)P=l.g=d[x],A=ci(P,p,!0,l)&&A;if(P=l.g=a,A=ci(P,p,!0,l)&&A,A=ci(P,p,!1,l)&&A,d)for(x=0;x<d.length;x++)P=l.g=d[x],A=ci(P,p,!1,l)&&A}be.prototype.N=function(){if(be.Z.N.call(this),this.i){var a=this.i;for(const l in a.g){const d=a.g[l];for(let p=0;p<d.length;p++)ii(d[p]);delete a.g[l],a.h--}}this.G=null},be.prototype.J=function(a,l,d,p){return this.i.add(String(a),l,!1,d,p)},be.prototype.K=function(a,l,d,p){return this.i.add(String(a),l,!0,d,p)};function ci(a,l,d,p){if(l=a.i.g[String(l)],!l)return!0;l=l.concat();let A=!0;for(let P=0;P<l.length;++P){const x=l[P];if(x&&!x.da&&x.capture==d){const K=x.listener,_e=x.ha||x.src;x.fa&&Qo(a.i,x),A=K.call(_e,p)!==!1&&A}}return A&&!p.defaultPrevented}function Qg(a,l){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=h(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(l)>2147483647?-1:o.setTimeout(a,l||0)}function el(a){a.g=Qg(()=>{a.g=null,a.i&&(a.i=!1,el(a))},a.l);const l=a.h;a.h=null,a.m.apply(null,l)}class Jg extends w{constructor(l,d){super(),this.m=l,this.l=d,this.h=null,this.i=!1,this.g=null}j(l){this.h=arguments,this.g?this.i=!0:el(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Ur(a){w.call(this),this.h=a,this.g={}}m(Ur,w);var tl=[];function nl(a){oi(a.g,function(l,d){this.g.hasOwnProperty(d)&&Zo(l)},a),a.g={}}Ur.prototype.N=function(){Ur.Z.N.call(this),nl(this)},Ur.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var na=o.JSON.stringify,Yg=o.JSON.parse,Xg=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function rl(){}function sl(){}var Br={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function ra(){T.call(this,"d")}m(ra,T);function sa(){T.call(this,"c")}m(sa,T);var on={},il=null;function ui(){return il=il||new be}on.Ia="serverreachability";function ol(a){T.call(this,on.Ia,a)}m(ol,T);function qr(a){const l=ui();De(l,new ol(l))}on.STAT_EVENT="statevent";function al(a,l){T.call(this,on.STAT_EVENT,a),this.stat=l}m(al,T);function Ne(a){const l=ui();De(l,new al(l,a))}on.Ja="timingevent";function cl(a,l){T.call(this,on.Ja,a),this.size=l}m(cl,T);function $r(a,l){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},l)}function jr(){this.g=!0}jr.prototype.ua=function(){this.g=!1};function Zg(a,l,d,p,A,P){a.info(function(){if(a.g)if(P){var x="",K=P.split("&");for(let re=0;re<K.length;re++){var _e=K[re].split("=");if(_e.length>1){const Ee=_e[0];_e=_e[1];const et=Ee.split("_");x=et.length>=2&&et[1]=="type"?x+(Ee+"="+_e+"&"):x+(Ee+"=redacted&")}}}else x=null;else x=P;return"XMLHTTP REQ ("+p+") [attempt "+A+"]: "+l+`
`+d+`
`+x})}function e_(a,l,d,p,A,P,x){a.info(function(){return"XMLHTTP RESP ("+p+") [ attempt "+A+"]: "+l+`
`+d+`
`+P+" "+x})}function jn(a,l,d,p){a.info(function(){return"XMLHTTP TEXT ("+l+"): "+n_(a,d)+(p?" "+p:"")})}function t_(a,l){a.info(function(){return"TIMEOUT: "+l})}jr.prototype.info=function(){};function n_(a,l){if(!a.g)return l;if(!l)return null;try{const P=JSON.parse(l);if(P){for(a=0;a<P.length;a++)if(Array.isArray(P[a])){var d=P[a];if(!(d.length<2)){var p=d[1];if(Array.isArray(p)&&!(p.length<1)){var A=p[0];if(A!="noop"&&A!="stop"&&A!="close")for(let x=1;x<p.length;x++)p[x]=""}}}}return na(P)}catch{return l}}var li={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},ul={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},ll;function ia(){}m(ia,rl),ia.prototype.g=function(){return new XMLHttpRequest},ll=new ia;function zr(a){return encodeURIComponent(String(a))}function r_(a){var l=1;a=a.split(":");const d=[];for(;l>0&&a.length;)d.push(a.shift()),l--;return a.length&&d.push(a.join(":")),d}function Rt(a,l,d,p){this.j=a,this.i=l,this.l=d,this.S=p||1,this.V=new Ur(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new hl}function hl(){this.i=null,this.g="",this.h=!1}var dl={},oa={};function aa(a,l,d){a.M=1,a.A=di(Ze(l)),a.u=d,a.R=!0,fl(a,null)}function fl(a,l){a.F=Date.now(),hi(a),a.B=Ze(a.A);var d=a.B,p=a.S;Array.isArray(p)||(p=[String(p)]),Sl(d.i,"t",p),a.C=0,d=a.j.L,a.h=new hl,a.g=zl(a.j,d?l:null,!a.u),a.P>0&&(a.O=new Jg(h(a.Y,a,a.g),a.P)),l=a.V,d=a.g,p=a.ba;var A="readystatechange";Array.isArray(A)||(A&&(tl[0]=A.toString()),A=tl);for(let P=0;P<A.length;P++){const x=Ju(d,A[P],p||l.handleEvent,!1,l.h||l);if(!x)break;l.g[x.key]=x}l=a.J?Hu(a.J):{},a.u?(a.v||(a.v="POST"),l["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,l)):(a.v="GET",a.g.ea(a.B,a.v,null,l)),qr(),Zg(a.i,a.v,a.B,a.l,a.S,a.u)}Rt.prototype.ba=function(a){a=a.target;const l=this.O;l&&Vt(a)==3?l.j():this.Y(a)},Rt.prototype.Y=function(a){try{if(a==this.g)e:{const K=Vt(this.g),_e=this.g.ya(),re=this.g.ca();if(!(K<3)&&(K!=3||this.g&&(this.h.h||this.g.la()||Nl(this.g)))){this.K||K!=4||_e==7||(_e==8||re<=0?qr(3):qr(2)),ca(this);var l=this.g.ca();this.X=l;var d=s_(this);if(this.o=l==200,e_(this.i,this.v,this.B,this.l,this.S,K,l),this.o){if(this.U&&!this.L){t:{if(this.g){var p,A=this.g;if((p=A.g?A.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!y(p)){var P=p;break t}}P=null}if(a=P)jn(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,ua(this,a);else{this.o=!1,this.m=3,Ne(12),an(this),Kr(this);break e}}if(this.R){a=!0;let Ee;for(;!this.K&&this.C<d.length;)if(Ee=i_(this,d),Ee==oa){K==4&&(this.m=4,Ne(14),a=!1),jn(this.i,this.l,null,"[Incomplete Response]");break}else if(Ee==dl){this.m=4,Ne(15),jn(this.i,this.l,d,"[Invalid Chunk]"),a=!1;break}else jn(this.i,this.l,Ee,null),ua(this,Ee);if(pl(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),K!=4||d.length!=0||this.h.h||(this.m=1,Ne(16),a=!1),this.o=this.o&&a,!a)jn(this.i,this.l,d,"[Invalid Chunked Response]"),an(this),Kr(this);else if(d.length>0&&!this.W){this.W=!0;var x=this.j;x.g==this&&x.aa&&!x.P&&(x.j.info("Great, no buffering proxy detected. Bytes received: "+d.length),_a(x),x.P=!0,Ne(11))}}else jn(this.i,this.l,d,null),ua(this,d);K==4&&an(this),this.o&&!this.K&&(K==4?Bl(this.j,this):(this.o=!1,hi(this)))}else I_(this.g),l==400&&d.indexOf("Unknown SID")>0?(this.m=3,Ne(12)):(this.m=0,Ne(13)),an(this),Kr(this)}}}catch{}finally{}};function s_(a){if(!pl(a))return a.g.la();const l=Nl(a.g);if(l==="")return"";let d="";const p=l.length,A=Vt(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return an(a),Kr(a),"";a.h.i=new o.TextDecoder}for(let P=0;P<p;P++)a.h.h=!0,d+=a.h.i.decode(l[P],{stream:!(A&&P==p-1)});return l.length=0,a.h.g+=d,a.C=0,a.h.g}function pl(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function i_(a,l){var d=a.C,p=l.indexOf(`
`,d);return p==-1?oa:(d=Number(l.substring(d,p)),isNaN(d)?dl:(p+=1,p+d>l.length?oa:(l=l.slice(p,p+d),a.C=p+d,l)))}Rt.prototype.cancel=function(){this.K=!0,an(this)};function hi(a){a.T=Date.now()+a.H,ml(a,a.H)}function ml(a,l){if(a.D!=null)throw Error("WatchDog timer not null");a.D=$r(h(a.aa,a),l)}function ca(a){a.D&&(o.clearTimeout(a.D),a.D=null)}Rt.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(t_(this.i,this.B),this.M!=2&&(qr(),Ne(17)),an(this),this.m=2,Kr(this)):ml(this,this.T-a)};function Kr(a){a.j.I==0||a.K||Bl(a.j,a)}function an(a){ca(a);var l=a.O;l&&typeof l.dispose=="function"&&l.dispose(),a.O=null,nl(a.V),a.g&&(l=a.g,a.g=null,l.abort(),l.dispose())}function ua(a,l){try{var d=a.j;if(d.I!=0&&(d.g==a||la(d.h,a))){if(!a.L&&la(d.h,a)&&d.I==3){try{var p=d.Ba.g.parse(l)}catch{p=null}if(Array.isArray(p)&&p.length==3){var A=p;if(A[0]==0){e:if(!d.v){if(d.g)if(d.g.F+3e3<a.F)_i(d),mi(d);else break e;ga(d),Ne(18)}}else d.xa=A[1],0<d.xa-d.K&&A[2]<37500&&d.F&&d.A==0&&!d.C&&(d.C=$r(h(d.Va,d),6e3));yl(d.h)<=1&&d.ta&&(d.ta=void 0)}else un(d,11)}else if((a.L||d.g==a)&&_i(d),!y(l))for(A=d.Ba.g.parse(l),l=0;l<A.length;l++){let re=A[l];const Ee=re[0];if(!(Ee<=d.K))if(d.K=Ee,re=re[1],d.I==2)if(re[0]=="c"){d.M=re[1],d.ba=re[2];const et=re[3];et!=null&&(d.ka=et,d.j.info("VER="+d.ka));const ln=re[4];ln!=null&&(d.za=ln,d.j.info("SVER="+d.za));const kt=re[5];kt!=null&&typeof kt=="number"&&kt>0&&(p=1.5*kt,d.O=p,d.j.info("backChannelRequestTimeoutMs_="+p)),p=d;const Dt=a.g;if(Dt){const Ii=Dt.g?Dt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Ii){var P=p.h;P.g||Ii.indexOf("spdy")==-1&&Ii.indexOf("quic")==-1&&Ii.indexOf("h2")==-1||(P.j=P.l,P.g=new Set,P.h&&(ha(P,P.h),P.h=null))}if(p.G){const ya=Dt.g?Dt.g.getResponseHeader("X-HTTP-Session-Id"):null;ya&&(p.wa=ya,oe(p.J,p.G,ya))}}d.I=3,d.l&&d.l.ra(),d.aa&&(d.T=Date.now()-a.F,d.j.info("Handshake RTT: "+d.T+"ms")),p=d;var x=a;if(p.na=jl(p,p.L?p.ba:null,p.W),x.L){Il(p.h,x);var K=x,_e=p.O;_e&&(K.H=_e),K.D&&(ca(K),hi(K)),p.g=x}else Fl(p);d.i.length>0&&gi(d)}else re[0]!="stop"&&re[0]!="close"||un(d,7);else d.I==3&&(re[0]=="stop"||re[0]=="close"?re[0]=="stop"?un(d,7):ma(d):re[0]!="noop"&&d.l&&d.l.qa(re),d.A=0)}}qr(4)}catch{}}var o_=class{constructor(a,l){this.g=a,this.map=l}};function gl(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function _l(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function yl(a){return a.h?1:a.g?a.g.size:0}function la(a,l){return a.h?a.h==l:a.g?a.g.has(l):!1}function ha(a,l){a.g?a.g.add(l):a.h=l}function Il(a,l){a.h&&a.h==l?a.h=null:a.g&&a.g.has(l)&&a.g.delete(l)}gl.prototype.cancel=function(){if(this.i=El(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function El(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let l=a.i;for(const d of a.g.values())l=l.concat(d.G);return l}return S(a.i)}var Tl=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function a_(a,l){if(a){a=a.split("&");for(let d=0;d<a.length;d++){const p=a[d].indexOf("=");let A,P=null;p>=0?(A=a[d].substring(0,p),P=a[d].substring(p+1)):A=a[d],l(A,P?decodeURIComponent(P.replace(/\+/g," ")):"")}}}function Pt(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let l;a instanceof Pt?(this.l=a.l,Gr(this,a.j),this.o=a.o,this.g=a.g,Hr(this,a.u),this.h=a.h,da(this,Rl(a.i)),this.m=a.m):a&&(l=String(a).match(Tl))?(this.l=!1,Gr(this,l[1]||"",!0),this.o=Wr(l[2]||""),this.g=Wr(l[3]||"",!0),Hr(this,l[4]),this.h=Wr(l[5]||"",!0),da(this,l[6]||"",!0),this.m=Wr(l[7]||"")):(this.l=!1,this.i=new Jr(null,this.l))}Pt.prototype.toString=function(){const a=[];var l=this.j;l&&a.push(Qr(l,wl,!0),":");var d=this.g;return(d||l=="file")&&(a.push("//"),(l=this.o)&&a.push(Qr(l,wl,!0),"@"),a.push(zr(d).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.u,d!=null&&a.push(":",String(d))),(d=this.h)&&(this.g&&d.charAt(0)!="/"&&a.push("/"),a.push(Qr(d,d.charAt(0)=="/"?l_:u_,!0))),(d=this.i.toString())&&a.push("?",d),(d=this.m)&&a.push("#",Qr(d,d_)),a.join("")},Pt.prototype.resolve=function(a){const l=Ze(this);let d=!!a.j;d?Gr(l,a.j):d=!!a.o,d?l.o=a.o:d=!!a.g,d?l.g=a.g:d=a.u!=null;var p=a.h;if(d)Hr(l,a.u);else if(d=!!a.h){if(p.charAt(0)!="/")if(this.g&&!this.h)p="/"+p;else{var A=l.h.lastIndexOf("/");A!=-1&&(p=l.h.slice(0,A+1)+p)}if(A=p,A==".."||A==".")p="";else if(A.indexOf("./")!=-1||A.indexOf("/.")!=-1){p=A.lastIndexOf("/",0)==0,A=A.split("/");const P=[];for(let x=0;x<A.length;){const K=A[x++];K=="."?p&&x==A.length&&P.push(""):K==".."?((P.length>1||P.length==1&&P[0]!="")&&P.pop(),p&&x==A.length&&P.push("")):(P.push(K),p=!0)}p=P.join("/")}else p=A}return d?l.h=p:d=a.i.toString()!=="",d?da(l,Rl(a.i)):d=!!a.m,d&&(l.m=a.m),l};function Ze(a){return new Pt(a)}function Gr(a,l,d){a.j=d?Wr(l,!0):l,a.j&&(a.j=a.j.replace(/:$/,""))}function Hr(a,l){if(l){if(l=Number(l),isNaN(l)||l<0)throw Error("Bad port number "+l);a.u=l}else a.u=null}function da(a,l,d){l instanceof Jr?(a.i=l,f_(a.i,a.l)):(d||(l=Qr(l,h_)),a.i=new Jr(l,a.l))}function oe(a,l,d){a.i.set(l,d)}function di(a){return oe(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function Wr(a,l){return a?l?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function Qr(a,l,d){return typeof a=="string"?(a=encodeURI(a).replace(l,c_),d&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function c_(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var wl=/[#\/\?@]/g,u_=/[#\?:]/g,l_=/[#\?]/g,h_=/[#\?@]/g,d_=/#/g;function Jr(a,l){this.h=this.g=null,this.i=a||null,this.j=!!l}function cn(a){a.g||(a.g=new Map,a.h=0,a.i&&a_(a.i,function(l,d){a.add(decodeURIComponent(l.replace(/\+/g," ")),d)}))}r=Jr.prototype,r.add=function(a,l){cn(this),this.i=null,a=zn(this,a);let d=this.g.get(a);return d||this.g.set(a,d=[]),d.push(l),this.h+=1,this};function vl(a,l){cn(a),l=zn(a,l),a.g.has(l)&&(a.i=null,a.h-=a.g.get(l).length,a.g.delete(l))}function Al(a,l){return cn(a),l=zn(a,l),a.g.has(l)}r.forEach=function(a,l){cn(this),this.g.forEach(function(d,p){d.forEach(function(A){a.call(l,A,p,this)},this)},this)};function bl(a,l){cn(a);let d=[];if(typeof l=="string")Al(a,l)&&(d=d.concat(a.g.get(zn(a,l))));else for(a=Array.from(a.g.values()),l=0;l<a.length;l++)d=d.concat(a[l]);return d}r.set=function(a,l){return cn(this),this.i=null,a=zn(this,a),Al(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[l]),this.h+=1,this},r.get=function(a,l){return a?(a=bl(this,a),a.length>0?String(a[0]):l):l};function Sl(a,l,d){vl(a,l),d.length>0&&(a.i=null,a.g.set(zn(a,l),S(d)),a.h+=d.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],l=Array.from(this.g.keys());for(let p=0;p<l.length;p++){var d=l[p];const A=zr(d);d=bl(this,d);for(let P=0;P<d.length;P++){let x=A;d[P]!==""&&(x+="="+zr(d[P])),a.push(x)}}return this.i=a.join("&")};function Rl(a){const l=new Jr;return l.i=a.i,a.g&&(l.g=new Map(a.g),l.h=a.h),l}function zn(a,l){return l=String(l),a.j&&(l=l.toLowerCase()),l}function f_(a,l){l&&!a.j&&(cn(a),a.i=null,a.g.forEach(function(d,p){const A=p.toLowerCase();p!=A&&(vl(this,p),Sl(this,A,d))},a)),a.j=l}function p_(a,l){const d=new jr;if(o.Image){const p=new Image;p.onload=f(Ct,d,"TestLoadImage: loaded",!0,l,p),p.onerror=f(Ct,d,"TestLoadImage: error",!1,l,p),p.onabort=f(Ct,d,"TestLoadImage: abort",!1,l,p),p.ontimeout=f(Ct,d,"TestLoadImage: timeout",!1,l,p),o.setTimeout(function(){p.ontimeout&&p.ontimeout()},1e4),p.src=a}else l(!1)}function m_(a,l){const d=new jr,p=new AbortController,A=setTimeout(()=>{p.abort(),Ct(d,"TestPingServer: timeout",!1,l)},1e4);fetch(a,{signal:p.signal}).then(P=>{clearTimeout(A),P.ok?Ct(d,"TestPingServer: ok",!0,l):Ct(d,"TestPingServer: server error",!1,l)}).catch(()=>{clearTimeout(A),Ct(d,"TestPingServer: error",!1,l)})}function Ct(a,l,d,p,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),p(d)}catch{}}function g_(){this.g=new Xg}function fa(a){this.i=a.Sb||null,this.h=a.ab||!1}m(fa,rl),fa.prototype.g=function(){return new fi(this.i,this.h)};function fi(a,l){be.call(this),this.H=a,this.o=l,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}m(fi,be),r=fi.prototype,r.open=function(a,l){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=l,this.readyState=1,Xr(this)},r.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const l={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(l.body=a),(this.H||o).fetch(new Request(this.D,l)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Yr(this)),this.readyState=0},r.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Xr(this)),this.g&&(this.readyState=3,Xr(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Pl(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function Pl(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}r.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var l=a.value?a.value:new Uint8Array(0);(l=this.B.decode(l,{stream:!a.done}))&&(this.response=this.responseText+=l)}a.done?Yr(this):Xr(this),this.readyState==3&&Pl(this)}},r.Oa=function(a){this.g&&(this.response=this.responseText=a,Yr(this))},r.Na=function(a){this.g&&(this.response=a,Yr(this))},r.ga=function(){this.g&&Yr(this)};function Yr(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Xr(a)}r.setRequestHeader=function(a,l){this.A.append(a,l)},r.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],l=this.h.entries();for(var d=l.next();!d.done;)d=d.value,a.push(d[0]+": "+d[1]),d=l.next();return a.join(`\r
`)};function Xr(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(fi.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function Cl(a){let l="";return oi(a,function(d,p){l+=p,l+=":",l+=d,l+=`\r
`}),l}function pa(a,l,d){e:{for(p in d){var p=!1;break e}p=!0}p||(d=Cl(d),typeof a=="string"?d!=null&&zr(d):oe(a,l,d))}function de(a){be.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}m(de,be);var __=/^https?$/i,y_=["POST","PUT"];r=de.prototype,r.Fa=function(a){this.H=a},r.ea=function(a,l,d,p){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);l=l?l.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():ll.g(),this.g.onreadystatechange=g(h(this.Ca,this));try{this.B=!0,this.g.open(l,String(a),!0),this.B=!1}catch(P){Vl(this,P);return}if(a=d||"",d=new Map(this.headers),p)if(Object.getPrototypeOf(p)===Object.prototype)for(var A in p)d.set(A,p[A]);else if(typeof p.keys=="function"&&typeof p.get=="function")for(const P of p.keys())d.set(P,p.get(P));else throw Error("Unknown input type for opt_headers: "+String(p));p=Array.from(d.keys()).find(P=>P.toLowerCase()=="content-type"),A=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(y_,l,void 0)>=0)||p||A||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[P,x]of d)this.g.setRequestHeader(P,x);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(P){Vl(this,P)}};function Vl(a,l){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=l,a.o=5,kl(a),pi(a)}function kl(a){a.A||(a.A=!0,De(a,"complete"),De(a,"error"))}r.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,De(this,"complete"),De(this,"abort"),pi(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),pi(this,!0)),de.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?Dl(this):this.Xa())},r.Xa=function(){Dl(this)};function Dl(a){if(a.h&&typeof i<"u"){if(a.v&&Vt(a)==4)setTimeout(a.Ca.bind(a),0);else if(De(a,"readystatechange"),Vt(a)==4){a.h=!1;try{const P=a.ca();e:switch(P){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var l=!0;break e;default:l=!1}var d;if(!(d=l)){var p;if(p=P===0){let x=String(a.D).match(Tl)[1]||null;!x&&o.self&&o.self.location&&(x=o.self.location.protocol.slice(0,-1)),p=!__.test(x?x.toLowerCase():"")}d=p}if(d)De(a,"complete"),De(a,"success");else{a.o=6;try{var A=Vt(a)>2?a.g.statusText:""}catch{A=""}a.l=A+" ["+a.ca()+"]",kl(a)}}finally{pi(a)}}}}function pi(a,l){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const d=a.g;a.g=null,l||De(a,"ready");try{d.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function Vt(a){return a.g?a.g.readyState:0}r.ca=function(){try{return Vt(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(a){if(this.g){var l=this.g.responseText;return a&&l.indexOf(a)==0&&(l=l.substring(a.length)),Yg(l)}};function Nl(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function I_(a){const l={};a=(a.g&&Vt(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let p=0;p<a.length;p++){if(y(a[p]))continue;var d=r_(a[p]);const A=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const P=l[A]||[];l[A]=P,P.push(d)}Kg(l,function(p){return p.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Zr(a,l,d){return d&&d.internalChannelParams&&d.internalChannelParams[a]||l}function xl(a){this.za=0,this.i=[],this.j=new jr,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Zr("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Zr("baseRetryDelayMs",5e3,a),this.Za=Zr("retryDelaySeedMs",1e4,a),this.Ta=Zr("forwardChannelMaxRetries",2,a),this.va=Zr("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new gl(a&&a.concurrentRequestLimit),this.Ba=new g_,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=xl.prototype,r.ka=8,r.I=1,r.connect=function(a,l,d,p){Ne(0),this.W=a,this.H=l||{},d&&p!==void 0&&(this.H.OSID=d,this.H.OAID=p),this.F=this.X,this.J=jl(this,null,this.W),gi(this)};function ma(a){if(Ol(a),a.I==3){var l=a.V++,d=Ze(a.J);if(oe(d,"SID",a.M),oe(d,"RID",l),oe(d,"TYPE","terminate"),es(a,d),l=new Rt(a,a.j,l),l.M=2,l.A=di(Ze(d)),d=!1,o.navigator&&o.navigator.sendBeacon)try{d=o.navigator.sendBeacon(l.A.toString(),"")}catch{}!d&&o.Image&&(new Image().src=l.A,d=!0),d||(l.g=zl(l.j,null),l.g.ea(l.A)),l.F=Date.now(),hi(l)}$l(a)}function mi(a){a.g&&(_a(a),a.g.cancel(),a.g=null)}function Ol(a){mi(a),a.v&&(o.clearTimeout(a.v),a.v=null),_i(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function gi(a){if(!_l(a.h)&&!a.m){a.m=!0;var l=a.Ea;Y||_(),X||(Y(),X=!0),E.add(l,a),a.D=0}}function E_(a,l){return yl(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=l.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=$r(h(a.Ea,a,l),ql(a,a.D)),a.D++,!0)}r.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const A=new Rt(this,this.j,a);let P=this.o;if(this.U&&(P?(P=Hu(P),Qu(P,this.U)):P=this.U),this.u!==null||this.R||(A.J=P,P=null),this.S)e:{for(var l=0,d=0;d<this.i.length;d++){t:{var p=this.i[d];if("__data__"in p.map&&(p=p.map.__data__,typeof p=="string")){p=p.length;break t}p=void 0}if(p===void 0)break;if(l+=p,l>4096){l=d;break e}if(l===4096||d===this.i.length-1){l=d+1;break e}}l=1e3}else l=1e3;l=Ll(this,A,l),d=Ze(this.J),oe(d,"RID",a),oe(d,"CVER",22),this.G&&oe(d,"X-HTTP-Session-Id",this.G),es(this,d),P&&(this.R?l="headers="+zr(Cl(P))+"&"+l:this.u&&pa(d,this.u,P)),ha(this.h,A),this.Ra&&oe(d,"TYPE","init"),this.S?(oe(d,"$req",l),oe(d,"SID","null"),A.U=!0,aa(A,d,null)):aa(A,d,l),this.I=2}}else this.I==3&&(a?Ml(this,a):this.i.length==0||_l(this.h)||Ml(this))};function Ml(a,l){var d;l?d=l.l:d=a.V++;const p=Ze(a.J);oe(p,"SID",a.M),oe(p,"RID",d),oe(p,"AID",a.K),es(a,p),a.u&&a.o&&pa(p,a.u,a.o),d=new Rt(a,a.j,d,a.D+1),a.u===null&&(d.J=a.o),l&&(a.i=l.G.concat(a.i)),l=Ll(a,d,1e3),d.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),ha(a.h,d),aa(d,p,l)}function es(a,l){a.H&&oi(a.H,function(d,p){oe(l,p,d)}),a.l&&oi({},function(d,p){oe(l,p,d)})}function Ll(a,l,d){d=Math.min(a.i.length,d);const p=a.l?h(a.l.Ka,a.l,a):null;e:{var A=a.i;let K=-1;for(;;){const _e=["count="+d];K==-1?d>0?(K=A[0].g,_e.push("ofs="+K)):K=0:_e.push("ofs="+K);let re=!0;for(let Ee=0;Ee<d;Ee++){var P=A[Ee].g;const et=A[Ee].map;if(P-=K,P<0)K=Math.max(0,A[Ee].g-100),re=!1;else try{P="req"+P+"_"||"";try{var x=et instanceof Map?et:Object.entries(et);for(const[ln,kt]of x){let Dt=kt;c(kt)&&(Dt=na(kt)),_e.push(P+ln+"="+encodeURIComponent(Dt))}}catch(ln){throw _e.push(P+"type="+encodeURIComponent("_badmap")),ln}}catch{p&&p(et)}}if(re){x=_e.join("&");break e}}x=void 0}return a=a.i.splice(0,d),l.G=a,x}function Fl(a){if(!a.g&&!a.v){a.Y=1;var l=a.Da;Y||_(),X||(Y(),X=!0),E.add(l,a),a.A=0}}function ga(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=$r(h(a.Da,a),ql(a,a.A)),a.A++,!0)}r.Da=function(){if(this.v=null,Ul(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=$r(h(this.Wa,this),a)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Ne(10),mi(this),Ul(this))};function _a(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function Ul(a){a.g=new Rt(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var l=Ze(a.na);oe(l,"RID","rpc"),oe(l,"SID",a.M),oe(l,"AID",a.K),oe(l,"CI",a.F?"0":"1"),!a.F&&a.ia&&oe(l,"TO",a.ia),oe(l,"TYPE","xmlhttp"),es(a,l),a.u&&a.o&&pa(l,a.u,a.o),a.O&&(a.g.H=a.O);var d=a.g;a=a.ba,d.M=1,d.A=di(Ze(l)),d.u=null,d.R=!0,fl(d,a)}r.Va=function(){this.C!=null&&(this.C=null,mi(this),ga(this),Ne(19))};function _i(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function Bl(a,l){var d=null;if(a.g==l){_i(a),_a(a),a.g=null;var p=2}else if(la(a.h,l))d=l.G,Il(a.h,l),p=1;else return;if(a.I!=0){if(l.o)if(p==1){d=l.u?l.u.length:0,l=Date.now()-l.F;var A=a.D;p=ui(),De(p,new cl(p,d)),gi(a)}else Fl(a);else if(A=l.m,A==3||A==0&&l.X>0||!(p==1&&E_(a,l)||p==2&&ga(a)))switch(d&&d.length>0&&(l=a.h,l.i=l.i.concat(d)),A){case 1:un(a,5);break;case 4:un(a,10);break;case 3:un(a,6);break;default:un(a,2)}}}function ql(a,l){let d=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(d*=2),d*l}function un(a,l){if(a.j.info("Error code "+l),l==2){var d=h(a.bb,a),p=a.Ua;const A=!p;p=new Pt(p||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||Gr(p,"https"),di(p),A?p_(p.toString(),d):m_(p.toString(),d)}else Ne(2);a.I=0,a.l&&a.l.pa(l),$l(a),Ol(a)}r.bb=function(a){a?(this.j.info("Successfully pinged google.com"),Ne(2)):(this.j.info("Failed to ping google.com"),Ne(1))};function $l(a){if(a.I=0,a.ja=[],a.l){const l=El(a.h);(l.length!=0||a.i.length!=0)&&(k(a.ja,l),k(a.ja,a.i),a.h.i.length=0,S(a.i),a.i.length=0),a.l.oa()}}function jl(a,l,d){var p=d instanceof Pt?Ze(d):new Pt(d);if(p.g!="")l&&(p.g=l+"."+p.g),Hr(p,p.u);else{var A=o.location;p=A.protocol,l=l?l+"."+A.hostname:A.hostname,A=+A.port;const P=new Pt(null);p&&Gr(P,p),l&&(P.g=l),A&&Hr(P,A),d&&(P.h=d),p=P}return d=a.G,l=a.wa,d&&l&&oe(p,d,l),oe(p,"VER",a.ka),es(a,p),p}function zl(a,l,d){if(l&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return l=a.Aa&&!a.ma?new de(new fa({ab:d})):new de(a.ma),l.Fa(a.L),l}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function Kl(){}r=Kl.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function yi(){}yi.prototype.g=function(a,l){return new Le(a,l)};function Le(a,l){be.call(this),this.g=new xl(l),this.l=a,this.h=l&&l.messageUrlParams||null,a=l&&l.messageHeaders||null,l&&l.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=l&&l.initMessageHeaders||null,l&&l.messageContentType&&(a?a["X-WebChannel-Content-Type"]=l.messageContentType:a={"X-WebChannel-Content-Type":l.messageContentType}),l&&l.sa&&(a?a["X-WebChannel-Client-Profile"]=l.sa:a={"X-WebChannel-Client-Profile":l.sa}),this.g.U=a,(a=l&&l.Qb)&&!y(a)&&(this.g.u=a),this.A=l&&l.supportsCrossDomainXhr||!1,this.v=l&&l.sendRawJson||!1,(l=l&&l.httpSessionIdParam)&&!y(l)&&(this.g.G=l,a=this.h,a!==null&&l in a&&(a=this.h,l in a&&delete a[l])),this.j=new Kn(this)}m(Le,be),Le.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Le.prototype.close=function(){ma(this.g)},Le.prototype.o=function(a){var l=this.g;if(typeof a=="string"){var d={};d.__data__=a,a=d}else this.v&&(d={},d.__data__=na(a),a=d);l.i.push(new o_(l.Ya++,a)),l.I==3&&gi(l)},Le.prototype.N=function(){this.g.l=null,delete this.j,ma(this.g),delete this.g,Le.Z.N.call(this)};function Gl(a){ra.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var l=a.__sm__;if(l){e:{for(const d in l){a=d;break e}a=void 0}(this.i=a)&&(a=this.i,l=l!==null&&a in l?l[a]:void 0),this.data=l}else this.data=a}m(Gl,ra);function Hl(){sa.call(this),this.status=1}m(Hl,sa);function Kn(a){this.g=a}m(Kn,Kl),Kn.prototype.ra=function(){De(this.g,"a")},Kn.prototype.qa=function(a){De(this.g,new Gl(a))},Kn.prototype.pa=function(a){De(this.g,new Hl)},Kn.prototype.oa=function(){De(this.g,"b")},yi.prototype.createWebChannel=yi.prototype.g,Le.prototype.send=Le.prototype.o,Le.prototype.open=Le.prototype.m,Le.prototype.close=Le.prototype.close,sp=function(){return new yi},rp=function(){return ui()},np=on,Qa={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},li.NO_ERROR=0,li.TIMEOUT=8,li.HTTP_ERROR=6,Di=li,ul.COMPLETE="complete",tp=ul,sl.EventType=Br,Br.OPEN="a",Br.CLOSE="b",Br.ERROR="c",Br.MESSAGE="d",be.prototype.listen=be.prototype.J,us=sl,de.prototype.listenOnce=de.prototype.K,de.prototype.getLastError=de.prototype.Ha,de.prototype.getLastErrorCode=de.prototype.ya,de.prototype.getStatus=de.prototype.ca,de.prototype.getResponseJson=de.prototype.La,de.prototype.getResponseText=de.prototype.la,de.prototype.send=de.prototype.ea,de.prototype.setWithCredentials=de.prototype.Fa,ep=de}).apply(typeof Ti<"u"?Ti:typeof self<"u"?self:typeof window<"u"?window:{});/**
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
 */class Re{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Re.UNAUTHENTICATED=new Re(null),Re.GOOGLE_CREDENTIALS=new Re("google-credentials-uid"),Re.FIRST_PARTY=new Re("first-party-uid"),Re.MOCK_USER=new Re("mock-user");/**
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
 */let Dr="12.10.0";function pT(r){Dr=r}/**
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
 */const Pn=new vc("@firebase/firestore");function Xn(){return Pn.logLevel}function C(r,...e){if(Pn.logLevel<=H.DEBUG){const t=e.map(Oc);Pn.debug(`Firestore (${Dr}): ${r}`,...t)}}function fe(r,...e){if(Pn.logLevel<=H.ERROR){const t=e.map(Oc);Pn.error(`Firestore (${Dr}): ${r}`,...t)}}function lr(r,...e){if(Pn.logLevel<=H.WARN){const t=e.map(Oc);Pn.warn(`Firestore (${Dr}): ${r}`,...t)}}function Oc(r){if(typeof r=="string")return r;try{return(function(t){return JSON.stringify(t)})(r)}catch{return r}}/**
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
 */function M(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,ip(r,n,t)}function ip(r,e,t){let n=`FIRESTORE (${Dr}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw fe(n),new Error(n)}function F(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||ip(e,s,n)}function L(r,e){return r}/**
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
 */const R={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class V extends ut{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
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
 */class Qe{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
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
 */class mT{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class gT{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(Re.UNAUTHENTICATED)))}shutdown(){}}class _T{constructor(e){this.t=e,this.currentUser=Re.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){F(this.o===void 0,42304);let n=this.i;const s=u=>this.i!==n?(n=this.i,t(u)):Promise.resolve();let i=new Qe;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new Qe,e.enqueueRetryable((()=>s(this.currentUser)))};const o=()=>{const u=i;e.enqueueRetryable((async()=>{await u.promise,await s(this.currentUser)}))},c=u=>{C("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit((u=>c(u))),setTimeout((()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?c(u):(C("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Qe)}}),0),o()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((n=>this.i!==e?(C("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(F(typeof n.accessToken=="string",31837,{l:n}),new mT(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return F(e===null||typeof e=="string",2055,{h:e}),new Re(e)}}class yT{constructor(e,t,n){this.P=e,this.T=t,this.I=n,this.type="FirstParty",this.user=Re.FIRST_PARTY,this.R=new Map}A(){return this.I?this.I():null}get headers(){this.R.set("X-Goog-AuthUser",this.P);const e=this.A();return e&&this.R.set("Authorization",e),this.T&&this.R.set("X-Goog-Iam-Authorization-Token",this.T),this.R}}class IT{constructor(e,t,n){this.P=e,this.T=t,this.I=n}getToken(){return Promise.resolve(new yT(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(Re.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class bh{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class ET{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Ue(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){F(this.o===void 0,3512);const n=i=>{i.error!=null&&C("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.m;return this.m=i.token,C("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable((()=>n(i)))};const s=i=>{C("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):C("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new bh(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(F(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new bh(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
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
 */function TT(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
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
 */class Mc{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=TT(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function j(r,e){return r<e?-1:r>e?1:0}function Ja(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return Ra(s)===Ra(i)?j(s,i):Ra(s)?1:-1}return j(r.length,e.length)}const wT=55296,vT=57343;function Ra(r){const e=r.charCodeAt(0);return e>=wT&&e<=vT}function hr(r,e,t){return r.length===e.length&&r.every(((n,s)=>t(n,e[s])))}function op(r){return r+"\0"}/**
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
 */const Sh="__name__";class tt{constructor(e,t,n){t===void 0?t=0:t>e.length&&M(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&M(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return tt.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof tt?e.forEach((n=>{t.push(n)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=tt.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return j(e.length,t.length)}static compareSegments(e,t){const n=tt.isNumericId(e),s=tt.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?tt.extractNumericId(e).compare(tt.extractNumericId(t)):Ja(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Kt.fromString(e.substring(4,e.length-2))}}class J extends tt{construct(e,t,n){return new J(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new V(R.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter((s=>s.length>0)))}return new J(t)}static emptyPath(){return new J([])}}const AT=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class le extends tt{construct(e,t,n){return new le(e,t,n)}static isValidIdentifier(e){return AT.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),le.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Sh}static keyField(){return new le([Sh])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new V(R.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;s<e.length;){const c=e[s];if(c==="\\"){if(s+1===e.length)throw new V(R.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[s+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new V(R.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=u,s+=2}else c==="`"?(o=!o,s++):c!=="."||o?(n+=c,s++):(i(),s++)}if(i(),o)throw new V(R.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new le(t)}static emptyPath(){return new le([])}}/**
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
 */class O{constructor(e){this.path=e}static fromPath(e){return new O(J.fromString(e))}static fromName(e){return new O(J.fromString(e).popFirst(5))}static empty(){return new O(J.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&J.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return J.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new O(new J(e.slice()))}}/**
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
 */function ap(r,e,t){if(!t)throw new V(R.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function bT(r,e,t,n){if(e===!0&&n===!0)throw new V(R.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function Rh(r){if(!O.isDocumentKey(r))throw new V(R.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function Ph(r){if(O.isDocumentKey(r))throw new V(R.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function cp(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function vo(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=(function(n){return n.constructor?n.constructor.name:null})(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":M(12329,{type:typeof r})}function Ce(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new V(R.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=vo(r);throw new V(R.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}function ST(r,e){if(e<=0)throw new V(R.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${e}.`)}/**
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
 */function ge(r,e){const t={typeString:r};return e&&(t.value=e),t}function Ws(r,e){if(!cp(r))throw new V(R.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new V(R.INVALID_ARGUMENT,t);return!0}/**
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
 */const Ch=-62135596800,Vh=1e6;class Z{static now(){return Z.fromMillis(Date.now())}static fromDate(e){return Z.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*Vh);return new Z(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new V(R.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new V(R.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Ch)throw new V(R.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new V(R.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Vh}_compareTo(e){return this.seconds===e.seconds?j(this.nanoseconds,e.nanoseconds):j(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Z._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Ws(e,Z._jsonSchema))return new Z(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Ch;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Z._jsonSchemaVersion="firestore/timestamp/1.0",Z._jsonSchema={type:ge("string",Z._jsonSchemaVersion),seconds:ge("number"),nanoseconds:ge("number")};/**
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
 */class U{static fromTimestamp(e){return new U(e)}static min(){return new U(new Z(0,0))}static max(){return new U(new Z(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const dr=-1;class Xi{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}}function Ya(r){return r.fields.find((e=>e.kind===2))}function fn(r){return r.fields.filter((e=>e.kind!==2))}Xi.UNKNOWN_ID=-1;class Ni{constructor(e,t){this.fieldPath=e,this.kind=t}}class Ss{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new Ss(0,je.min())}}function up(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=U.fromTimestamp(n===1e9?new Z(t+1,0):new Z(t,n));return new je(s,O.empty(),e)}function lp(r){return new je(r.readTime,r.key,dr)}class je{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new je(U.min(),O.empty(),dr)}static max(){return new je(U.max(),O.empty(),dr)}}function Lc(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=O.comparator(r.documentKey,e.documentKey),t!==0?t:j(r.largestBatchId,e.largestBatchId))}/**
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
 */const hp="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class dp{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
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
 */async function en(r){if(r.code!==R.FAILED_PRECONDITION||r.message!==hp)throw r;C("LocalStore","Unexpectedly lost primary lease")}/**
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
 */class v{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&M(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new v(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof v?t:v.resolve(t)}catch(t){return v.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):v.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):v.reject(t)}static resolve(e){return new v(((t,n)=>{t(e)}))}static reject(e){return new v(((t,n)=>{n(e)}))}static waitFor(e){return new v(((t,n)=>{let s=0,i=0,o=!1;e.forEach((c=>{++s,c.next((()=>{++i,o&&i===s&&t()}),(u=>n(u)))})),o=!0,i===s&&t()}))}static or(e){let t=v.resolve(!1);for(const n of e)t=t.next((s=>s?v.resolve(s):n()));return t}static forEach(e,t){const n=[];return e.forEach(((s,i)=>{n.push(t.call(this,s,i))})),this.waitFor(n)}static mapArray(e,t){return new v(((n,s)=>{const i=e.length,o=new Array(i);let c=0;for(let u=0;u<i;u++){const h=u;t(e[h]).next((f=>{o[h]=f,++c,c===i&&n(o)}),(f=>s(f)))}}))}static doWhile(e,t){return new v(((n,s)=>{const i=()=>{e()===!0?t().next((()=>{i()}),s):n()};i()}))}}/**
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
 */const Fe="SimpleDb";class Ao{static open(e,t,n,s){try{return new Ao(t,e.transaction(s,n))}catch(i){throw new ms(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.S=new Qe,this.transaction.oncomplete=()=>{this.S.resolve()},this.transaction.onabort=()=>{t.error?this.S.reject(new ms(e,t.error)):this.S.resolve()},this.transaction.onerror=n=>{const s=Fc(n.target.error);this.S.reject(new ms(e,s))}}get D(){return this.S.promise}abort(e){e&&this.S.reject(e),this.aborted||(C(Fe,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}C(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new PT(t)}}class Gt{static delete(e){return C(Fe,"Removing database:",e),mn(af().indexedDB.deleteDatabase(e)).toPromise()}static v(){if(!wc())return!1;if(Gt.F())return!0;const e=ye(),t=Gt.M(e),n=0<t&&t<10,s=fp(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||i)}static F(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static O(e,t){return e.store(t)}static M(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.N=n,this.B=null,Gt.M(ye())===12.2&&fe("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async L(e){return this.db||(C(Fe,"Opening database:",this.name),this.db=await new Promise(((t,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{n(new ms(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?n(new V(R.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?n(new V(R.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):n(new ms(e,o))},s.onupgradeneeded=i=>{C(Fe,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.N.k(o,s.transaction,i.oldVersion,this.version).next((()=>{C(Fe,"Database upgrade to version "+this.version+" complete")}))}}))),this.K&&(this.db.onversionchange=t=>this.K(t)),this.db}q(e){this.K=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.L(e);const c=Ao.open(this.db,e,i?"readonly":"readwrite",n),u=s(c).next((h=>(c.C(),h))).catch((h=>(c.abort(h),v.reject(h)))).toPromise();return u.catch((()=>{})),await c.D,u}catch(c){const u=c,h=u.name!=="FirebaseError"&&o<3;if(C(Fe,"Transaction failed with error:",u.message,"Retrying:",h),this.close(),!h)return Promise.reject(u)}}}close(){this.db&&this.db.close(),this.db=void 0}}function fp(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class RT{constructor(e){this.U=e,this.$=!1,this.W=null}get isDone(){return this.$}get G(){return this.W}set cursor(e){this.U=e}done(){this.$=!0}j(e){this.W=e}delete(){return mn(this.U.delete())}}class ms extends V{constructor(e,t){super(R.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function tn(r){return r.name==="IndexedDbTransactionError"}class PT{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(C(Fe,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(C(Fe,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),mn(n)}add(e){return C(Fe,"ADD",this.store.name,e,e),mn(this.store.add(e))}get(e){return mn(this.store.get(e)).next((t=>(t===void 0&&(t=null),C(Fe,"GET",this.store.name,e,t),t)))}delete(e){return C(Fe,"DELETE",this.store.name,e),mn(this.store.delete(e))}count(){return C(Fe,"COUNT",this.store.name),mn(this.store.count())}H(e,t){const n=this.options(e,t),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new v(((o,c)=>{i.onerror=u=>{c(u.target.error)},i.onsuccess=u=>{o(u.target.result)}}))}{const i=this.cursor(n),o=[];return this.J(i,((c,u)=>{o.push(u)})).next((()=>o))}}Z(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new v(((s,i)=>{n.onerror=o=>{i(o.target.error)},n.onsuccess=o=>{s(o.target.result)}}))}X(e,t){C(Fe,"DELETE ALL",this.store.name);const n=this.options(e,t);n.Y=!1;const s=this.cursor(n);return this.J(s,((i,o,c)=>c.delete()))}ee(e,t){let n;t?n=e:(n={},t=e);const s=this.cursor(n);return this.J(s,t)}te(e){const t=this.cursor({});return new v(((n,s)=>{t.onerror=i=>{const o=Fc(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next((c=>{c?o.continue():n()})):n()}}))}J(e,t){const n=[];return new v(((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const c=o.target.result;if(!c)return void s();const u=new RT(c),h=t(c.primaryKey,c.value,u);if(h instanceof v){const f=h.catch((m=>(u.done(),v.reject(m))));n.push(f)}u.isDone?s():u.G===null?c.continue():c.continue(u.G)}})).next((()=>v.waitFor(n)))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.Y?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function mn(r){return new v(((e,t)=>{r.onsuccess=n=>{const s=n.target.result;e(s)},r.onerror=n=>{const s=Fc(n.target.error);t(s)}}))}let kh=!1;function Fc(r){const e=Gt.M(ye());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new V("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return kh||(kh=!0,setTimeout((()=>{throw n}),0)),n}}return r}const gs="IndexBackfiller";class CT{constructor(e,t){this.asyncQueue=e,this.ne=t,this.task=null}start(){this.re(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}re(e){C(gs,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,(async()=>{this.task=null;try{const t=await this.ne.ie();C(gs,`Documents written: ${t}`)}catch(t){tn(t)?C(gs,"Ignoring IndexedDB error during index backfill: ",t):await en(t)}await this.re(6e4)}))}}class VT{constructor(e,t){this.localStore=e,this.persistence=t}async ie(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(t=>this.se(t,e)))}se(e,t){const n=new Set;let s=t,i=!0;return v.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next((o=>{if(o!==null&&!n.has(o))return C(gs,`Processing collection: ${o}`),this.oe(e,o,s).next((c=>{s-=c,n.add(o)}));i=!1})))).next((()=>t-s))}oe(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next((s=>this.localStore.localDocuments.getNextDocuments(e,t,s,n).next((i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next((()=>this._e(s,i))).next((c=>(C(gs,`Updating offset: ${c}`),this.localStore.indexManager.updateCollectionGroup(e,t,c)))).next((()=>o.size))}))))}_e(e,t){let n=e;return t.changes.forEach(((s,i)=>{const o=lp(i);Lc(o,n)>0&&(n=o)})),new je(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
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
 */class Oe{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.ae(n),this.ue=n=>t.writeSequenceNumber(n))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}Oe.ce=-1;/**
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
 */const wn=-1;function Qs(r){return r==null}function Rs(r){return r===0&&1/r==-1/0}function pp(r){return typeof r=="number"&&Number.isInteger(r)&&!Rs(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}/**
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
 */const Zi="";function Ve(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=Dh(e)),e=kT(r.get(t),e);return Dh(e)}function kT(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case Zi:t+="";break;default:t+=i}}return t}function Dh(r){return r+Zi+""}function rt(r){const e=r.length;if(F(e>=2,64408,{path:r}),e===2)return F(r.charAt(0)===Zi&&r.charAt(1)==="",56145,{path:r}),J.emptyPath();const t=e-2,n=[];let s="";for(let i=0;i<e;){const o=r.indexOf(Zi,i);switch((o<0||o>t)&&M(50515,{path:r}),r.charAt(o+1)){case"":const c=r.substring(i,o);let u;s.length===0?u=c:(s+=c,u=s,s=""),n.push(u);break;case"":s+=r.substring(i,o),s+="\0";break;case"":s+=r.substring(i,o+1);break;default:M(61167,{path:r})}i=o+2}return new J(n)}/**
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
 */const pn="remoteDocuments",Js="owner",Gn="owner",Ps="mutationQueues",DT="userId",Ge="mutations",Nh="batchId",En="userMutationsIndex",xh=["userId","batchId"];/**
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
 */function xi(r,e){return[r,Ve(e)]}function mp(r,e,t){return[r,Ve(e),t]}const NT={},fr="documentMutations",eo="remoteDocumentsV14",xT=["prefixPath","collectionGroup","readTime","documentId"],Oi="documentKeyIndex",OT=["prefixPath","collectionGroup","documentId"],gp="collectionGroupIndex",MT=["collectionGroup","readTime","prefixPath","documentId"],Cs="remoteDocumentGlobal",Xa="remoteDocumentGlobalKey",pr="targets",_p="queryTargetsIndex",LT=["canonicalId","targetId"],mr="targetDocuments",FT=["targetId","path"],Uc="documentTargetsIndex",UT=["path","targetId"],to="targetGlobalKey",vn="targetGlobal",Vs="collectionParents",BT=["collectionId","parent"],gr="clientMetadata",qT="clientId",bo="bundles",$T="bundleId",So="namedQueries",jT="name",Bc="indexConfiguration",zT="indexId",Za="collectionGroupIndex",KT="collectionGroup",_s="indexState",GT=["indexId","uid"],yp="sequenceNumberIndex",HT=["uid","sequenceNumber"],ys="indexEntries",WT=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Ip="documentKeyIndex",QT=["indexId","uid","orderedDocumentKey"],Ro="documentOverlays",JT=["userId","collectionPath","documentId"],ec="collectionPathOverlayIndex",YT=["userId","collectionPath","largestBatchId"],Ep="collectionGroupOverlayIndex",XT=["userId","collectionGroup","largestBatchId"],qc="globals",ZT="name",Tp=[Ps,Ge,fr,pn,pr,Js,vn,mr,gr,Cs,Vs,bo,So],ew=[...Tp,Ro],wp=[Ps,Ge,fr,eo,pr,Js,vn,mr,gr,Cs,Vs,bo,So,Ro],vp=wp,$c=[...vp,Bc,_s,ys],tw=$c,Ap=[...$c,qc],nw=Ap;/**
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
 */class tc extends dp{constructor(e,t){super(),this.le=e,this.currentSequenceNumber=t}}function Ie(r,e){const t=L(r);return Gt.O(t.le,e)}/**
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
 */function Oh(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function nn(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function bp(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
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
 */class ie{constructor(e,t){this.comparator=e,this.root=t||ve.EMPTY}insert(e,t){return new ie(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,ve.BLACK,null,null))}remove(e){return new ie(this.comparator,this.root.remove(e,this.comparator).copy(null,null,ve.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,n)=>(e(t,n),!1)))}toString(){const e=[];return this.inorderTraversal(((t,n)=>(e.push(`${t}:${n}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new wi(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new wi(this.root,e,this.comparator,!1)}getReverseIterator(){return new wi(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new wi(this.root,e,this.comparator,!0)}}class wi{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class ve{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??ve.RED,this.left=s??ve.EMPTY,this.right=i??ve.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new ve(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return ve.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return ve.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,ve.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,ve.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw M(43730,{key:this.key,value:this.value});if(this.right.isRed())throw M(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw M(27949);return e+(this.isRed()?0:1)}}ve.EMPTY=null,ve.RED=!0,ve.BLACK=!1;ve.EMPTY=new class{constructor(){this.size=0}get key(){throw M(57766)}get value(){throw M(16141)}get color(){throw M(16727)}get left(){throw M(29726)}get right(){throw M(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new ve(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
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
 */class te{constructor(e){this.comparator=e,this.data=new ie(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,n)=>(e(t),!1)))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Mh(this.data.getIterator())}getIteratorFrom(e){return new Mh(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((n=>{t=t.add(n)})),t}isEqual(e){if(!(e instanceof te)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new te(this.comparator);return t.data=e,t}}class Mh{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function Hn(r){return r.hasNext()?r.getNext():void 0}/**
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
 */class Me{constructor(e){this.fields=e,e.sort(le.comparator)}static empty(){return new Me([])}unionWith(e){let t=new te(le.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new Me(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return hr(this.fields,e.fields,((t,n)=>t.isEqual(n)))}}/**
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
 */class Sp extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */class pe{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Sp("Invalid base64 string: "+i):i}})(e);return new pe(t)}static fromUint8Array(e){const t=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(e);return new pe(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return j(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}pe.EMPTY_BYTE_STRING=new pe("");const rw=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Et(r){if(F(!!r,39018),typeof r=="string"){let e=0;const t=rw.exec(r);if(F(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:ae(r.seconds),nanos:ae(r.nanos)}}function ae(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function Tt(r){return typeof r=="string"?pe.fromBase64String(r):pe.fromUint8Array(r)}/**
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
 */const Rp="server_timestamp",Pp="__type__",Cp="__previous_value__",Vp="__local_write_time__";function Po(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[Pp])==null?void 0:n.stringValue)===Rp}function Co(r){const e=r.mapValue.fields[Cp];return Po(e)?Co(e):e}function ks(r){const e=Et(r.mapValue.fields[Vp].timestampValue);return new Z(e.seconds,e.nanos)}/**
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
 */class sw{constructor(e,t,n,s,i,o,c,u,h,f,m){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=c,this.longPollingOptions=u,this.useFetchStreams=h,this.isUsingEmulator=f,this.apiKey=m}}const no="(default)";class Cn{constructor(e,t){this.projectId=e,this.database=t||no}static empty(){return new Cn("","")}get isDefaultDatabase(){return this.database===no}isEqual(e){return e instanceof Cn&&e.projectId===this.projectId&&e.database===this.database}}function iw(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new V(R.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Cn(r.options.projectId,e)}/**
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
 */const jc="__type__",kp="__max__",$t={mapValue:{fields:{__type__:{stringValue:kp}}}},zc="__vector__",_r="value",Mi={nullValue:"NULL_VALUE"};function Qt(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?Po(r)?4:Dp(r)?9007199254740991:Vo(r)?10:11:M(28295,{value:r})}function ct(r,e){if(r===e)return!0;const t=Qt(r);if(t!==Qt(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return ks(r).isEqual(ks(e));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const o=Et(s.timestampValue),c=Et(i.timestampValue);return o.seconds===c.seconds&&o.nanos===c.nanos})(r,e);case 5:return r.stringValue===e.stringValue;case 6:return(function(s,i){return Tt(s.bytesValue).isEqual(Tt(i.bytesValue))})(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return(function(s,i){return ae(s.geoPointValue.latitude)===ae(i.geoPointValue.latitude)&&ae(s.geoPointValue.longitude)===ae(i.geoPointValue.longitude)})(r,e);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return ae(s.integerValue)===ae(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const o=ae(s.doubleValue),c=ae(i.doubleValue);return o===c?Rs(o)===Rs(c):isNaN(o)&&isNaN(c)}return!1})(r,e);case 9:return hr(r.arrayValue.values||[],e.arrayValue.values||[],ct);case 10:case 11:return(function(s,i){const o=s.mapValue.fields||{},c=i.mapValue.fields||{};if(Oh(o)!==Oh(c))return!1;for(const u in o)if(o.hasOwnProperty(u)&&(c[u]===void 0||!ct(o[u],c[u])))return!1;return!0})(r,e);default:return M(52216,{left:r})}}function Ds(r,e){return(r.values||[]).find((t=>ct(t,e)))!==void 0}function Jt(r,e){if(r===e)return 0;const t=Qt(r),n=Qt(e);if(t!==n)return j(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return j(r.booleanValue,e.booleanValue);case 2:return(function(i,o){const c=ae(i.integerValue||i.doubleValue),u=ae(o.integerValue||o.doubleValue);return c<u?-1:c>u?1:c===u?0:isNaN(c)?isNaN(u)?0:-1:1})(r,e);case 3:return Lh(r.timestampValue,e.timestampValue);case 4:return Lh(ks(r),ks(e));case 5:return Ja(r.stringValue,e.stringValue);case 6:return(function(i,o){const c=Tt(i),u=Tt(o);return c.compareTo(u)})(r.bytesValue,e.bytesValue);case 7:return(function(i,o){const c=i.split("/"),u=o.split("/");for(let h=0;h<c.length&&h<u.length;h++){const f=j(c[h],u[h]);if(f!==0)return f}return j(c.length,u.length)})(r.referenceValue,e.referenceValue);case 8:return(function(i,o){const c=j(ae(i.latitude),ae(o.latitude));return c!==0?c:j(ae(i.longitude),ae(o.longitude))})(r.geoPointValue,e.geoPointValue);case 9:return Fh(r.arrayValue,e.arrayValue);case 10:return(function(i,o){var g,S,k,D;const c=i.fields||{},u=o.fields||{},h=(g=c[_r])==null?void 0:g.arrayValue,f=(S=u[_r])==null?void 0:S.arrayValue,m=j(((k=h==null?void 0:h.values)==null?void 0:k.length)||0,((D=f==null?void 0:f.values)==null?void 0:D.length)||0);return m!==0?m:Fh(h,f)})(r.mapValue,e.mapValue);case 11:return(function(i,o){if(i===$t.mapValue&&o===$t.mapValue)return 0;if(i===$t.mapValue)return 1;if(o===$t.mapValue)return-1;const c=i.fields||{},u=Object.keys(c),h=o.fields||{},f=Object.keys(h);u.sort(),f.sort();for(let m=0;m<u.length&&m<f.length;++m){const g=Ja(u[m],f[m]);if(g!==0)return g;const S=Jt(c[u[m]],h[f[m]]);if(S!==0)return S}return j(u.length,f.length)})(r.mapValue,e.mapValue);default:throw M(23264,{he:t})}}function Lh(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return j(r,e);const t=Et(r),n=Et(e),s=j(t.seconds,n.seconds);return s!==0?s:j(t.nanos,n.nanos)}function Fh(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=Jt(t[s],n[s]);if(i)return i}return j(t.length,n.length)}function yr(r){return nc(r)}function nc(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(t){const n=Et(t);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(t){return Tt(t).toBase64()})(r.bytesValue):"referenceValue"in r?(function(t){return O.fromName(t).toString()})(r.referenceValue):"geoPointValue"in r?(function(t){return`geo(${t.latitude},${t.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=nc(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${nc(t.fields[o])}`;return s+"}"})(r.mapValue):M(61005,{value:r})}function Li(r){switch(Qt(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Co(r);return e?16+Li(e):16;case 5:return 2*r.stringValue.length;case 6:return Tt(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return(function(n){return(n.values||[]).reduce(((s,i)=>s+Li(i)),0)})(r.arrayValue);case 10:case 11:return(function(n){let s=0;return nn(n.fields,((i,o)=>{s+=i.length+Li(o)})),s})(r.mapValue);default:throw M(13486,{value:r})}}function Vn(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function rc(r){return!!r&&"integerValue"in r}function Ns(r){return!!r&&"arrayValue"in r}function Uh(r){return!!r&&"nullValue"in r}function Bh(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function Fi(r){return!!r&&"mapValue"in r}function Vo(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[jc])==null?void 0:n.stringValue)===zc}function Is(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return nn(r.mapValue.fields,((t,n)=>e.mapValue.fields[t]=Is(n))),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Is(r.arrayValue.values[t]);return e}return{...r}}function Dp(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===kp}const Np={mapValue:{fields:{[jc]:{stringValue:zc},[_r]:{arrayValue:{}}}}};function ow(r){return"nullValue"in r?Mi:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?Vn(Cn.empty(),O.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?Vo(r)?Np:{mapValue:{}}:M(35942,{value:r})}function aw(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?Vn(Cn.empty(),O.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?Np:"mapValue"in r?Vo(r)?{mapValue:{}}:$t:M(61959,{value:r})}function qh(r,e){const t=Jt(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function $h(r,e){const t=Jt(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
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
 */class Ae{constructor(e){this.value=e}static empty(){return new Ae({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!Fi(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Is(t)}setAll(e){let t=le.emptyPath(),n={},s=[];e.forEach(((o,c)=>{if(!t.isImmediateParentOf(c)){const u=this.getFieldsMap(t);this.applyChanges(u,n,s),n={},s=[],t=c.popLast()}o?n[c.lastSegment()]=Is(o):s.push(c.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());Fi(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return ct(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];Fi(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){nn(t,((s,i)=>e[s]=i));for(const s of n)delete e[s]}clone(){return new Ae(Is(this.value))}}function xp(r){const e=[];return nn(r.fields,((t,n)=>{const s=new le([t]);if(Fi(n)){const i=xp(n.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)})),new Me(e)}/**
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
 */class ce{constructor(e,t,n,s,i,o,c){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=c}static newInvalidDocument(e){return new ce(e,0,U.min(),U.min(),U.min(),Ae.empty(),0)}static newFoundDocument(e,t,n,s){return new ce(e,1,t,U.min(),n,s,0)}static newNoDocument(e,t){return new ce(e,2,t,U.min(),U.min(),Ae.empty(),0)}static newUnknownDocument(e,t){return new ce(e,3,t,U.min(),U.min(),Ae.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(U.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Ae.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Ae.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=U.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof ce&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new ce(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class Yt{constructor(e,t){this.position=e,this.inclusive=t}}function jh(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],o=r.position[s];if(i.field.isKeyField()?n=O.comparator(O.fromName(o.referenceValue),t.key):n=Jt(o,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function zh(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!ct(r.position[t],e.position[t]))return!1;return!0}/**
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
 */class xs{constructor(e,t="asc"){this.field=e,this.dir=t}}function cw(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
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
 */class Op{}class W extends Op{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new uw(e,t,n):t==="array-contains"?new dw(e,n):t==="in"?new qp(e,n):t==="not-in"?new fw(e,n):t==="array-contains-any"?new pw(e,n):new W(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new lw(e,n):new hw(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Jt(t,this.value)):t!==null&&Qt(this.value)===Qt(t)&&this.matchesComparison(Jt(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return M(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class ee extends Op{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new ee(e,t)}matches(e){return Ir(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function Ir(r){return r.op==="and"}function sc(r){return r.op==="or"}function Kc(r){return Mp(r)&&Ir(r)}function Mp(r){for(const e of r.filters)if(e instanceof ee)return!1;return!0}function ic(r){if(r instanceof W)return r.field.canonicalString()+r.op.toString()+yr(r.value);if(Kc(r))return r.filters.map((e=>ic(e))).join(",");{const e=r.filters.map((t=>ic(t))).join(",");return`${r.op}(${e})`}}function Lp(r,e){return r instanceof W?(function(n,s){return s instanceof W&&n.op===s.op&&n.field.isEqual(s.field)&&ct(n.value,s.value)})(r,e):r instanceof ee?(function(n,s){return s instanceof ee&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,o,c)=>i&&Lp(o,s.filters[c])),!0):!1})(r,e):void M(19439)}function Fp(r,e){const t=r.filters.concat(e);return ee.create(t,r.op)}function Up(r){return r instanceof W?(function(t){return`${t.field.canonicalString()} ${t.op} ${yr(t.value)}`})(r):r instanceof ee?(function(t){return t.op.toString()+" {"+t.getFilters().map(Up).join(" ,")+"}"})(r):"Filter"}class uw extends W{constructor(e,t,n){super(e,t,n),this.key=O.fromName(n.referenceValue)}matches(e){const t=O.comparator(e.key,this.key);return this.matchesComparison(t)}}class lw extends W{constructor(e,t){super(e,"in",t),this.keys=Bp("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class hw extends W{constructor(e,t){super(e,"not-in",t),this.keys=Bp("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function Bp(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((n=>O.fromName(n.referenceValue)))}class dw extends W{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return Ns(t)&&Ds(t.arrayValue,this.value)}}class qp extends W{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&Ds(this.value.arrayValue,t)}}class fw extends W{constructor(e,t){super(e,"not-in",t)}matches(e){if(Ds(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!Ds(this.value.arrayValue,t)}}class pw extends W{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!Ns(t)||!t.arrayValue.values)&&t.arrayValue.values.some((n=>Ds(this.value.arrayValue,n)))}}/**
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
 */class mw{constructor(e,t=null,n=[],s=[],i=null,o=null,c=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=c,this.Te=null}}function oc(r,e=null,t=[],n=[],s=null,i=null,o=null){return new mw(r,e,t,n,s,i,o)}function kn(r){const e=L(r);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((n=>ic(n))).join(","),t+="|ob:",t+=e.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),Qs(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((n=>yr(n))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((n=>yr(n))).join(",")),e.Te=t}return e.Te}function Ys(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!cw(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!Lp(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!zh(r.startAt,e.startAt)&&zh(r.endAt,e.endAt)}function ro(r){return O.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function so(r,e){return r.filters.filter((t=>t instanceof W&&t.field.isEqual(e)))}function Kh(r,e,t){let n=Mi,s=!0;for(const i of so(r,e)){let o=Mi,c=!0;switch(i.op){case"<":case"<=":o=ow(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,c=!1;break;case"!=":case"not-in":o=Mi}qh({value:n,inclusive:s},{value:o,inclusive:c})<0&&(n=o,s=c)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];qh({value:n,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}function Gh(r,e,t){let n=$t,s=!0;for(const i of so(r,e)){let o=$t,c=!0;switch(i.op){case">=":case">":o=aw(i.value),c=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,c=!1;break;case"!=":case"not-in":o=$t}$h({value:n,inclusive:s},{value:o,inclusive:c})>0&&(n=o,s=c)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];$h({value:n,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}/**
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
 */class Bn{constructor(e,t=null,n=[],s=[],i=null,o="F",c=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=c,this.endAt=u,this.Ie=null,this.Ee=null,this.Re=null,this.startAt,this.endAt}}function $p(r,e,t,n,s,i,o,c){return new Bn(r,e,t,n,s,i,o,c)}function Xs(r){return new Bn(r)}function Hh(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function gw(r){return O.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function Gc(r){return r.collectionGroup!==null}function ar(r){const e=L(r);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let c=new te(le.comparator);return o.filters.forEach((u=>{u.getFlattenedFilters().forEach((h=>{h.isInequality()&&(c=c.add(h.field))}))})),c})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new xs(i,n))})),t.has(le.keyField().canonicalString())||e.Ie.push(new xs(le.keyField(),n))}return e.Ie}function $e(r){const e=L(r);return e.Ee||(e.Ee=_w(e,ar(r))),e.Ee}function _w(r,e){if(r.limitType==="F")return oc(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new xs(s.field,i)}));const t=r.endAt?new Yt(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Yt(r.startAt.position,r.startAt.inclusive):null;return oc(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function ac(r,e){const t=r.filters.concat([e]);return new Bn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function yw(r,e){const t=r.explicitOrderBy.concat([e]);return new Bn(r.path,r.collectionGroup,t,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}function io(r,e,t){return new Bn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function Iw(r,e){return new Bn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),r.limit,r.limitType,e,r.endAt)}function ko(r,e){return Ys($e(r),$e(e))&&r.limitType===e.limitType}function jp(r){return`${kn($e(r))}|lt:${r.limitType}`}function Zn(r){return`Query(target=${(function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map((s=>Up(s))).join(", ")}]`),Qs(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map((s=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(s))).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map((s=>yr(s))).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map((s=>yr(s))).join(",")),`Target(${n})`})($e(r))}; limitType=${r.limitType})`}function Zs(r,e){return e.isFoundDocument()&&(function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):O.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,e)&&(function(n,s){for(const i of ar(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,e)&&(function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0})(r,e)&&(function(n,s){return!(n.startAt&&!(function(o,c,u){const h=jh(o,c,u);return o.inclusive?h<=0:h<0})(n.startAt,ar(n),s)||n.endAt&&!(function(o,c,u){const h=jh(o,c,u);return o.inclusive?h>=0:h>0})(n.endAt,ar(n),s))})(r,e)}function zp(r){return r.collectionGroup||(r.path.length%2==1?r.path.lastSegment():r.path.get(r.path.length-2))}function Kp(r){return(e,t)=>{let n=!1;for(const s of ar(r)){const i=Ew(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function Ew(r,e,t){const n=r.field.isKeyField()?O.comparator(e.key,t.key):(function(i,o,c){const u=o.data.field(i),h=c.data.field(i);return u!==null&&h!==null?Jt(u,h):M(42886)})(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return M(19790,{direction:r.dir})}}/**
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
 */class bt{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){nn(this.inner,((t,n)=>{for(const[s,i]of n)e(s,i)}))}isEmpty(){return bp(this.inner)}size(){return this.innerSize}}/**
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
 */const Tw=new ie(O.comparator);function qe(){return Tw}const Gp=new ie(O.comparator);function ls(...r){let e=Gp;for(const t of r)e=e.insert(t.key,t);return e}function Hp(r){let e=Gp;return r.forEach(((t,n)=>e=e.insert(t,n.overlayedDocument))),e}function st(){return Es()}function Wp(){return Es()}function Es(){return new bt((r=>r.toString()),((r,e)=>r.isEqual(e)))}const ww=new ie(O.comparator),vw=new te(O.comparator);function G(...r){let e=vw;for(const t of r)e=e.add(t);return e}const Aw=new te(j);function Hc(){return Aw}/**
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
 */function Wc(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Rs(e)?"-0":e}}function Qp(r){return{integerValue:""+r}}function Jp(r,e){return pp(e)?Qp(e):Wc(r,e)}/**
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
 */class Do{constructor(){this._=void 0}}function bw(r,e,t){return r instanceof Os?(function(s,i){const o={fields:{[Pp]:{stringValue:Rp},[Vp]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Po(i)&&(i=Co(i)),i&&(o.fields[Cp]=i),{mapValue:o}})(t,e):r instanceof Er?Xp(r,e):r instanceof Tr?Zp(r,e):(function(s,i){const o=Yp(s,i),c=Wh(o)+Wh(s.Ae);return rc(o)&&rc(s.Ae)?Qp(c):Wc(s.serializer,c)})(r,e)}function Sw(r,e,t){return r instanceof Er?Xp(r,e):r instanceof Tr?Zp(r,e):t}function Yp(r,e){return r instanceof wr?(function(n){return rc(n)||(function(i){return!!i&&"doubleValue"in i})(n)})(e)?e:{integerValue:0}:null}class Os extends Do{}class Er extends Do{constructor(e){super(),this.elements=e}}function Xp(r,e){const t=em(e);for(const n of r.elements)t.some((s=>ct(s,n)))||t.push(n);return{arrayValue:{values:t}}}class Tr extends Do{constructor(e){super(),this.elements=e}}function Zp(r,e){let t=em(e);for(const n of r.elements)t=t.filter((s=>!ct(s,n)));return{arrayValue:{values:t}}}class wr extends Do{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function Wh(r){return ae(r.integerValue||r.doubleValue)}function em(r){return Ns(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
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
 */class tm{constructor(e,t){this.field=e,this.transform=t}}function Rw(r,e){return r.field.isEqual(e.field)&&(function(n,s){return n instanceof Er&&s instanceof Er||n instanceof Tr&&s instanceof Tr?hr(n.elements,s.elements,ct):n instanceof wr&&s instanceof wr?ct(n.Ae,s.Ae):n instanceof Os&&s instanceof Os})(r.transform,e.transform)}class Pw{constructor(e,t){this.version=e,this.transformResults=t}}class he{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new he}static exists(e){return new he(void 0,e)}static updateTime(e){return new he(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Ui(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class No{}function nm(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new xr(r.key,he.none()):new Nr(r.key,r.data,he.none());{const t=r.data,n=Ae.empty();let s=new te(le.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new St(r.key,n,new Me(s.toArray()),he.none())}}function Cw(r,e,t){r instanceof Nr?(function(s,i,o){const c=s.value.clone(),u=Jh(s.fieldTransforms,i,o.transformResults);c.setAll(u),i.convertToFoundDocument(o.version,c).setHasCommittedMutations()})(r,e,t):r instanceof St?(function(s,i,o){if(!Ui(s.precondition,i))return void i.convertToUnknownDocument(o.version);const c=Jh(s.fieldTransforms,i,o.transformResults),u=i.data;u.setAll(rm(s)),u.setAll(c),i.convertToFoundDocument(o.version,u).setHasCommittedMutations()})(r,e,t):(function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,e,t)}function Ts(r,e,t,n){return r instanceof Nr?(function(i,o,c,u){if(!Ui(i.precondition,o))return c;const h=i.value.clone(),f=Yh(i.fieldTransforms,u,o);return h.setAll(f),o.convertToFoundDocument(o.version,h).setHasLocalMutations(),null})(r,e,t,n):r instanceof St?(function(i,o,c,u){if(!Ui(i.precondition,o))return c;const h=Yh(i.fieldTransforms,u,o),f=o.data;return f.setAll(rm(i)),f.setAll(h),o.convertToFoundDocument(o.version,f).setHasLocalMutations(),c===null?null:c.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((m=>m.field)))})(r,e,t,n):(function(i,o,c){return Ui(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):c})(r,e,t)}function Vw(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=Yp(n.transform,s||null);i!=null&&(t===null&&(t=Ae.empty()),t.set(n.field,i))}return t||null}function Qh(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&hr(n,s,((i,o)=>Rw(i,o)))})(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class Nr extends No{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class St extends No{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function rm(r){const e=new Map;return r.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}})),e}function Jh(r,e,t){const n=new Map;F(r.length===t.length,32656,{Ve:t.length,de:r.length});for(let s=0;s<t.length;s++){const i=r[s],o=i.transform,c=e.data.field(i.field);n.set(i.field,Sw(o,c,t[s]))}return n}function Yh(r,e,t){const n=new Map;for(const s of r){const i=s.transform,o=t.data.field(s.field);n.set(s.field,bw(i,o,e))}return n}class xr extends No{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Qc extends No{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
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
 */class Jc{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&Cw(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=Ts(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=Ts(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=Wp();return this.mutations.forEach((s=>{const i=e.get(s.key),o=i.overlayedDocument;let c=this.applyToLocalView(o,i.mutatedFields);c=t.has(s.key)?null:c;const u=nm(o,c);u!==null&&n.set(s.key,u),o.isValidDocument()||o.convertToNoDocument(U.min())})),n}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),G())}isEqual(e){return this.batchId===e.batchId&&hr(this.mutations,e.mutations,((t,n)=>Qh(t,n)))&&hr(this.baseMutations,e.baseMutations,((t,n)=>Qh(t,n)))}}class Yc{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){F(e.mutations.length===n.length,58842,{me:e.mutations.length,fe:n.length});let s=(function(){return ww})();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new Yc(e,t,n,s)}}/**
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
 */class Xc{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
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
 */class kw{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
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
 */var me,Q;function sm(r){switch(r){case R.OK:return M(64938);case R.CANCELLED:case R.UNKNOWN:case R.DEADLINE_EXCEEDED:case R.RESOURCE_EXHAUSTED:case R.INTERNAL:case R.UNAVAILABLE:case R.UNAUTHENTICATED:return!1;case R.INVALID_ARGUMENT:case R.NOT_FOUND:case R.ALREADY_EXISTS:case R.PERMISSION_DENIED:case R.FAILED_PRECONDITION:case R.ABORTED:case R.OUT_OF_RANGE:case R.UNIMPLEMENTED:case R.DATA_LOSS:return!0;default:return M(15467,{code:r})}}function im(r){if(r===void 0)return fe("GRPC error has no .code"),R.UNKNOWN;switch(r){case me.OK:return R.OK;case me.CANCELLED:return R.CANCELLED;case me.UNKNOWN:return R.UNKNOWN;case me.DEADLINE_EXCEEDED:return R.DEADLINE_EXCEEDED;case me.RESOURCE_EXHAUSTED:return R.RESOURCE_EXHAUSTED;case me.INTERNAL:return R.INTERNAL;case me.UNAVAILABLE:return R.UNAVAILABLE;case me.UNAUTHENTICATED:return R.UNAUTHENTICATED;case me.INVALID_ARGUMENT:return R.INVALID_ARGUMENT;case me.NOT_FOUND:return R.NOT_FOUND;case me.ALREADY_EXISTS:return R.ALREADY_EXISTS;case me.PERMISSION_DENIED:return R.PERMISSION_DENIED;case me.FAILED_PRECONDITION:return R.FAILED_PRECONDITION;case me.ABORTED:return R.ABORTED;case me.OUT_OF_RANGE:return R.OUT_OF_RANGE;case me.UNIMPLEMENTED:return R.UNIMPLEMENTED;case me.DATA_LOSS:return R.DATA_LOSS;default:return M(39323,{code:r})}}(Q=me||(me={}))[Q.OK=0]="OK",Q[Q.CANCELLED=1]="CANCELLED",Q[Q.UNKNOWN=2]="UNKNOWN",Q[Q.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Q[Q.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Q[Q.NOT_FOUND=5]="NOT_FOUND",Q[Q.ALREADY_EXISTS=6]="ALREADY_EXISTS",Q[Q.PERMISSION_DENIED=7]="PERMISSION_DENIED",Q[Q.UNAUTHENTICATED=16]="UNAUTHENTICATED",Q[Q.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Q[Q.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Q[Q.ABORTED=10]="ABORTED",Q[Q.OUT_OF_RANGE=11]="OUT_OF_RANGE",Q[Q.UNIMPLEMENTED=12]="UNIMPLEMENTED",Q[Q.INTERNAL=13]="INTERNAL",Q[Q.UNAVAILABLE=14]="UNAVAILABLE",Q[Q.DATA_LOSS=15]="DATA_LOSS";/**
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
 */function Dw(){return new TextEncoder}/**
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
 */const Nw=new Kt([4294967295,4294967295],0);function Xh(r){const e=Dw().encode(r),t=new Zf;return t.update(e),new Uint8Array(t.digest())}function Zh(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Kt([t,n],0),new Kt([s,i],0)]}class Zc{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new hs(`Invalid padding: ${t}`);if(n<0)throw new hs(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new hs(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new hs(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=Kt.fromNumber(this.ge)}ye(e,t,n){let s=e.add(t.multiply(Kt.fromNumber(n)));return s.compare(Nw)===1&&(s=new Kt([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=Xh(e),[n,s]=Zh(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(n,s,i);if(!this.we(o))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new Zc(i,s,t);return n.forEach((c=>o.insert(c))),o}insert(e){if(this.ge===0)return;const t=Xh(e),[n,s]=Zh(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(n,s,i);this.be(o)}}be(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class hs extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
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
 */class ei{constructor(e,t,n,s,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,ti.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new ei(U.min(),s,new ie(j),qe(),G())}}class ti{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new ti(n,t,G(),G(),G())}}/**
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
 */class Bi{constructor(e,t,n,s){this.Se=e,this.removedTargetIds=t,this.key=n,this.De=s}}class om{constructor(e,t){this.targetId=e,this.Ce=t}}class am{constructor(e,t,n=pe.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class ed{constructor(){this.ve=0,this.Fe=td(),this.Me=pe.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=G(),t=G(),n=G();return this.Fe.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:M(38017,{changeType:i})}})),new ti(this.Me,this.xe,e,t,n)}Ke(){this.Oe=!1,this.Fe=td()}qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}Ue(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}$e(){this.ve+=1}We(){this.ve-=1,F(this.ve>=0,3241,{ve:this.ve})}Qe(){this.Oe=!0,this.xe=!0}}class xw{constructor(e){this.Ge=e,this.ze=new Map,this.je=qe(),this.He=vi(),this.Je=vi(),this.Ze=new ie(j)}Xe(e){for(const t of e.Se)e.De&&e.De.isFoundDocument()?this.Ye(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,(t=>{const n=this.nt(t);switch(e.state){case 0:this.rt(t)&&n.Le(e.resumeToken);break;case 1:n.We(),n.Ne||n.Ke(),n.Le(e.resumeToken);break;case 2:n.We(),n.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(n.Qe(),n.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),n.Le(e.resumeToken));break;default:M(56790,{state:e.state})}}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach(((n,s)=>{this.rt(s)&&t(s)}))}st(e){const t=e.targetId,n=e.Ce.count,s=this.ot(t);if(s){const i=s.target;if(ro(i))if(n===0){const o=new O(i.path);this.et(t,o,ce.newNoDocument(o,U.min()))}else F(n===1,20013,{expectedCount:n});else{const o=this._t(t);if(o!==n){const c=this.ut(e),u=c?this.ct(c,e,o):1;if(u!==0){this.it(t);const h=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ze=this.Ze.insert(t,h)}}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let o,c;try{o=Tt(n).toUint8Array()}catch(u){if(u instanceof Sp)return lr("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{c=new Zc(o,s,i)}catch(u){return lr(u instanceof hs?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return c.ge===0?null:c}ct(e,t,n){return t.Ce.count===n-this.Pt(e,t.targetId)?0:2}Pt(e,t){const n=this.Ge.getRemoteKeysForTarget(t);let s=0;return n.forEach((i=>{const o=this.Ge.ht(),c=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(c)||(this.et(t,i,null),s++)})),s}Tt(e){const t=new Map;this.ze.forEach(((i,o)=>{const c=this.ot(o);if(c){if(i.current&&ro(c.target)){const u=new O(c.target.path);this.It(u).has(o)||this.Et(o,u)||this.et(o,u,ce.newNoDocument(u,e))}i.Be&&(t.set(o,i.ke()),i.Ke())}}));let n=G();this.Je.forEach(((i,o)=>{let c=!0;o.forEachWhile((u=>{const h=this.ot(u);return!h||h.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)})),c&&(n=n.add(i))})),this.je.forEach(((i,o)=>o.setReadTime(e)));const s=new ei(e,t,this.Ze,this.je,n);return this.je=qe(),this.He=vi(),this.Je=vi(),this.Ze=new ie(j),s}Ye(e,t){if(!this.rt(e))return;const n=this.Et(e,t.key)?2:0;this.nt(e).qe(t.key,n),this.je=this.je.insert(t.key,t),this.He=this.He.insert(t.key,this.It(t.key).add(e)),this.Je=this.Je.insert(t.key,this.Rt(t.key).add(e))}et(e,t,n){if(!this.rt(e))return;const s=this.nt(e);this.Et(e,t)?s.qe(t,1):s.Ue(t),this.Je=this.Je.insert(t,this.Rt(t).delete(e)),this.Je=this.Je.insert(t,this.Rt(t).add(e)),n&&(this.je=this.je.insert(t,n))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}$e(e){this.nt(e).$e()}nt(e){let t=this.ze.get(e);return t||(t=new ed,this.ze.set(e,t)),t}Rt(e){let t=this.Je.get(e);return t||(t=new te(j),this.Je=this.Je.insert(e,t)),t}It(e){let t=this.He.get(e);return t||(t=new te(j),this.He=this.He.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||C("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new ed),this.Ge.getRemoteKeysForTarget(e).forEach((t=>{this.et(e,t,null)}))}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function vi(){return new ie(O.comparator)}function td(){return new ie(O.comparator)}const Ow={asc:"ASCENDING",desc:"DESCENDING"},Mw={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Lw={and:"AND",or:"OR"};class Fw{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function cc(r,e){return r.useProto3Json||Qs(e)?e:{value:e}}function vr(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function cm(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function Uw(r,e){return vr(r,e.toTimestamp())}function we(r){return F(!!r,49232),U.fromTimestamp((function(t){const n=Et(t);return new Z(n.seconds,n.nanos)})(r))}function eu(r,e){return uc(r,e).canonicalString()}function uc(r,e){const t=(function(s){return new J(["projects",s.projectId,"databases",s.database])})(r).child("documents");return e===void 0?t:t.child(e)}function um(r){const e=J.fromString(r);return F(ym(e),10190,{key:e.toString()}),e}function Ms(r,e){return eu(r.databaseId,e.path)}function _t(r,e){const t=um(e);if(t.get(1)!==r.databaseId.projectId)throw new V(R.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new V(R.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new O(dm(t))}function lm(r,e){return eu(r.databaseId,e)}function hm(r){const e=um(r);return e.length===4?J.emptyPath():dm(e)}function lc(r){return new J(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function dm(r){return F(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function nd(r,e,t){return{name:Ms(r,e),fields:t.value.mapValue.fields}}function Bw(r,e,t){const n=_t(r,e.name),s=we(e.updateTime),i=e.createTime?we(e.createTime):U.min(),o=new Ae({mapValue:{fields:e.fields}}),c=ce.newFoundDocument(n,s,i,o);return t&&c.setHasCommittedMutations(),t?c.setHasCommittedMutations():c}function qw(r,e){return"found"in e?(function(n,s){F(!!s.found,43571),s.found.name,s.found.updateTime;const i=_t(n,s.found.name),o=we(s.found.updateTime),c=s.found.createTime?we(s.found.createTime):U.min(),u=new Ae({mapValue:{fields:s.found.fields}});return ce.newFoundDocument(i,o,c,u)})(r,e):"missing"in e?(function(n,s){F(!!s.missing,3894),F(!!s.readTime,22933);const i=_t(n,s.missing),o=we(s.readTime);return ce.newNoDocument(i,o)})(r,e):M(7234,{result:e})}function $w(r,e){let t;if("targetChange"in e){e.targetChange;const n=(function(h){return h==="NO_CHANGE"?0:h==="ADD"?1:h==="REMOVE"?2:h==="CURRENT"?3:h==="RESET"?4:M(39313,{state:h})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(h,f){return h.useProto3Json?(F(f===void 0||typeof f=="string",58123),pe.fromBase64String(f||"")):(F(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),pe.fromUint8Array(f||new Uint8Array))})(r,e.targetChange.resumeToken),o=e.targetChange.cause,c=o&&(function(h){const f=h.code===void 0?R.UNKNOWN:im(h.code);return new V(f,h.message||"")})(o);t=new am(n,s,i,c||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=_t(r,n.document.name),i=we(n.document.updateTime),o=n.document.createTime?we(n.document.createTime):U.min(),c=new Ae({mapValue:{fields:n.document.fields}}),u=ce.newFoundDocument(s,i,o,c),h=n.targetIds||[],f=n.removedTargetIds||[];t=new Bi(h,f,u.key,u)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=_t(r,n.document),i=n.readTime?we(n.readTime):U.min(),o=ce.newNoDocument(s,i),c=n.removedTargetIds||[];t=new Bi([],c,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=_t(r,n.document),i=n.removedTargetIds||[];t=new Bi([],i,s,null)}else{if(!("filter"in e))return M(11601,{Vt:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new kw(s,i),c=n.targetId;t=new om(c,o)}}return t}function Ls(r,e){let t;if(e instanceof Nr)t={update:nd(r,e.key,e.value)};else if(e instanceof xr)t={delete:Ms(r,e.key)};else if(e instanceof St)t={update:nd(r,e.key,e.data),updateMask:Ww(e.fieldMask)};else{if(!(e instanceof Qc))return M(16599,{dt:e.type});t={verify:Ms(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((n=>(function(i,o){const c=o.transform;if(c instanceof Os)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof Er)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof Tr)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof wr)return{fieldPath:o.field.canonicalString(),increment:c.Ae};throw M(20930,{transform:o.transform})})(0,n)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:Uw(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:M(27497)})(r,e.precondition)),t}function hc(r,e){const t=e.currentDocument?(function(i){return i.updateTime!==void 0?he.updateTime(we(i.updateTime)):i.exists!==void 0?he.exists(i.exists):he.none()})(e.currentDocument):he.none(),n=e.updateTransforms?e.updateTransforms.map((s=>(function(o,c){let u=null;if("setToServerValue"in c)F(c.setToServerValue==="REQUEST_TIME",16630,{proto:c}),u=new Os;else if("appendMissingElements"in c){const f=c.appendMissingElements.values||[];u=new Er(f)}else if("removeAllFromArray"in c){const f=c.removeAllFromArray.values||[];u=new Tr(f)}else"increment"in c?u=new wr(o,c.increment):M(16584,{proto:c});const h=le.fromServerFormat(c.fieldPath);return new tm(h,u)})(r,s))):[];if(e.update){e.update.name;const s=_t(r,e.update.name),i=new Ae({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=(function(u){const h=u.fieldPaths||[];return new Me(h.map((f=>le.fromServerFormat(f))))})(e.updateMask);return new St(s,i,o,t,n)}return new Nr(s,i,t,n)}if(e.delete){const s=_t(r,e.delete);return new xr(s,t)}if(e.verify){const s=_t(r,e.verify);return new Qc(s,t)}return M(1463,{proto:e})}function jw(r,e){return r&&r.length>0?(F(e!==void 0,14353),r.map((t=>(function(s,i){let o=s.updateTime?we(s.updateTime):we(i);return o.isEqual(U.min())&&(o=we(i)),new Pw(o,s.transformResults||[])})(t,e)))):[]}function fm(r,e){return{documents:[lm(r,e.path)]}}function pm(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=lm(r,s);const i=(function(h){if(h.length!==0)return _m(ee.create(h,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const o=(function(h){if(h.length!==0)return h.map((f=>(function(g){return{field:er(g.field),direction:Kw(g.dir)}})(f)))})(e.orderBy);o&&(t.structuredQuery.orderBy=o);const c=cc(r,e.limit);return c!==null&&(t.structuredQuery.limit=c),e.startAt&&(t.structuredQuery.startAt=(function(h){return{before:h.inclusive,values:h.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(h){return{before:!h.inclusive,values:h.position}})(e.endAt)),{ft:t,parent:s}}function mm(r){let e=hm(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){F(n===1,65062);const f=t.from[0];f.allDescendants?s=f.collectionId:e=e.child(f.collectionId)}let i=[];t.where&&(i=(function(m){const g=gm(m);return g instanceof ee&&Kc(g)?g.getFilters():[g]})(t.where));let o=[];t.orderBy&&(o=(function(m){return m.map((g=>(function(k){return new xs(tr(k.field),(function(N){switch(N){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(k.direction))})(g)))})(t.orderBy));let c=null;t.limit&&(c=(function(m){let g;return g=typeof m=="object"?m.value:m,Qs(g)?null:g})(t.limit));let u=null;t.startAt&&(u=(function(m){const g=!!m.before,S=m.values||[];return new Yt(S,g)})(t.startAt));let h=null;return t.endAt&&(h=(function(m){const g=!m.before,S=m.values||[];return new Yt(S,g)})(t.endAt)),$p(e,s,o,i,c,"F",u,h)}function zw(r,e){const t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return M(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function gm(r){return r.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=tr(t.unaryFilter.field);return W.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=tr(t.unaryFilter.field);return W.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=tr(t.unaryFilter.field);return W.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=tr(t.unaryFilter.field);return W.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return M(61313);default:return M(60726)}})(r):r.fieldFilter!==void 0?(function(t){return W.create(tr(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return M(58110);default:return M(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(t){return ee.create(t.compositeFilter.filters.map((n=>gm(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return M(1026)}})(t.compositeFilter.op))})(r):M(30097,{filter:r})}function Kw(r){return Ow[r]}function Gw(r){return Mw[r]}function Hw(r){return Lw[r]}function er(r){return{fieldPath:r.canonicalString()}}function tr(r){return le.fromServerFormat(r.fieldPath)}function _m(r){return r instanceof W?(function(t){if(t.op==="=="){if(Bh(t.value))return{unaryFilter:{field:er(t.field),op:"IS_NAN"}};if(Uh(t.value))return{unaryFilter:{field:er(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Bh(t.value))return{unaryFilter:{field:er(t.field),op:"IS_NOT_NAN"}};if(Uh(t.value))return{unaryFilter:{field:er(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:er(t.field),op:Gw(t.op),value:t.value}}})(r):r instanceof ee?(function(t){const n=t.getFilters().map((s=>_m(s)));return n.length===1?n[0]:{compositeFilter:{op:Hw(t.op),filters:n}}})(r):M(54877,{filter:r})}function Ww(r){const e=[];return r.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function ym(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function Im(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}/**
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
 */class pt{constructor(e,t,n,s,i=U.min(),o=U.min(),c=pe.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=c,this.expectedCount=u}withSequenceNumber(e){return new pt(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new pt(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new pt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new pt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
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
 */class Em{constructor(e){this.yt=e}}function Qw(r,e){let t;if(e.document)t=Bw(r.yt,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=O.fromSegments(e.noDocument.path),s=Nn(e.noDocument.readTime);t=ce.newNoDocument(n,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return M(56709);{const n=O.fromSegments(e.unknownDocument.path),s=Nn(e.unknownDocument.version);t=ce.newUnknownDocument(n,s)}}return e.readTime&&t.setReadTime((function(s){const i=new Z(s[0],s[1]);return U.fromTimestamp(i)})(e.readTime)),t}function rd(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:oo(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=(function(i,o){return{name:Ms(i,o.key),fields:o.data.value.mapValue.fields,updateTime:vr(i,o.version.toTimestamp()),createTime:vr(i,o.createTime.toTimestamp())}})(r.yt,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:Dn(e.version)};else{if(!e.isUnknownDocument())return M(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:Dn(e.version)}}return n}function oo(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function Dn(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function Nn(r){const e=new Z(r.seconds,r.nanoseconds);return U.fromTimestamp(e)}function gn(r,e){const t=(e.baseMutations||[]).map((i=>hc(r.yt,i)));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const c=e.mutations[i+1];o.updateTransforms=c.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const n=e.mutations.map((i=>hc(r.yt,i))),s=Z.fromMillis(e.localWriteTimeMs);return new Jc(e.batchId,s,t,n)}function ds(r){const e=Nn(r.readTime),t=r.lastLimboFreeSnapshotVersion!==void 0?Nn(r.lastLimboFreeSnapshotVersion):U.min();let n;return n=(function(i){return i.documents!==void 0})(r.query)?(function(i){const o=i.documents.length;return F(o===1,1966,{count:o}),$e(Xs(hm(i.documents[0])))})(r.query):(function(i){return $e(mm(i))})(r.query),new pt(n,r.targetId,"TargetPurposeListen",r.lastListenSequenceNumber,e,t,pe.fromBase64String(r.resumeToken))}function Tm(r,e){const t=Dn(e.snapshotVersion),n=Dn(e.lastLimboFreeSnapshotVersion);let s;s=ro(e.target)?fm(r.yt,e.target):pm(r.yt,e.target).ft;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:kn(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function wm(r){const e=mm({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?io(e,e.limit,"L"):e}function Pa(r,e){return new Xc(e.largestBatchId,hc(r.yt,e.overlayMutation))}function sd(r,e){const t=e.path.lastSegment();return[r,Ve(e.path.popLast()),t]}function id(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:Dn(n.readTime),documentKey:Ve(n.documentKey.path),largestBatchId:n.largestBatchId}}/**
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
 */class Jw{getBundleMetadata(e,t){return od(e).get(t).next((n=>{if(n)return(function(i){return{id:i.bundleId,createTime:Nn(i.createTime),version:i.version}})(n)}))}saveBundleMetadata(e,t){return od(e).put((function(s){return{bundleId:s.id,createTime:Dn(we(s.createTime)),version:s.version}})(t))}getNamedQuery(e,t){return ad(e).get(t).next((n=>{if(n)return(function(i){return{name:i.name,query:wm(i.bundledQuery),readTime:Nn(i.readTime)}})(n)}))}saveNamedQuery(e,t){return ad(e).put((function(s){return{name:s.name,readTime:Dn(we(s.readTime)),bundledQuery:s.bundledQuery}})(t))}}function od(r){return Ie(r,bo)}function ad(r){return Ie(r,So)}/**
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
 */class xo{constructor(e,t){this.serializer=e,this.userId=t}static wt(e,t){const n=t.uid||"";return new xo(e,n)}getOverlay(e,t){return ts(e).get(sd(this.userId,t)).next((n=>n?Pa(this.serializer,n):null))}getOverlays(e,t){const n=st();return v.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(e,t,n){const s=[];return n.forEach(((i,o)=>{const c=new Xc(t,o);s.push(this.bt(e,c))})),v.waitFor(s)}removeOverlaysForBatchId(e,t,n){const s=new Set;t.forEach((o=>s.add(Ve(o.getCollectionPath()))));const i=[];return s.forEach((o=>{const c=IDBKeyRange.bound([this.userId,o,n],[this.userId,o,n+1],!1,!0);i.push(ts(e).X(ec,c))})),v.waitFor(i)}getOverlaysForCollection(e,t,n){const s=st(),i=Ve(t),o=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return ts(e).H(ec,o).next((c=>{for(const u of c){const h=Pa(this.serializer,u);s.set(h.getKey(),h)}return s}))}getOverlaysForCollectionGroup(e,t,n,s){const i=st();let o;const c=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return ts(e).ee({index:Ep,range:c},((u,h,f)=>{const m=Pa(this.serializer,h);i.size()<s||m.largestBatchId===o?(i.set(m.getKey(),m),o=m.largestBatchId):f.done()})).next((()=>i))}bt(e,t){return ts(e).put((function(s,i,o){const[c,u,h]=sd(i,o.mutation.key);return{userId:i,collectionPath:u,documentId:h,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:Ls(s.yt,o.mutation)}})(this.serializer,this.userId,t))}}function ts(r){return Ie(r,Ro)}/**
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
 */class Yw{St(e){return Ie(e,qc)}getSessionToken(e){return this.St(e).get("sessionToken").next((t=>{const n=t==null?void 0:t.value;return n?pe.fromUint8Array(n):pe.EMPTY_BYTE_STRING}))}setSessionToken(e,t){return this.St(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
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
 */class _n{constructor(){}Dt(e,t){this.Ct(e,t),t.vt()}Ct(e,t){if("nullValue"in e)this.Ft(t,5);else if("booleanValue"in e)this.Ft(t,10),t.Mt(e.booleanValue?1:0);else if("integerValue"in e)this.Ft(t,15),t.Mt(ae(e.integerValue));else if("doubleValue"in e){const n=ae(e.doubleValue);isNaN(n)?this.Ft(t,13):(this.Ft(t,15),Rs(n)?t.Mt(0):t.Mt(n))}else if("timestampValue"in e){let n=e.timestampValue;this.Ft(t,20),typeof n=="string"&&(n=Et(n)),t.xt(`${n.seconds||""}`),t.Mt(n.nanos||0)}else if("stringValue"in e)this.Ot(e.stringValue,t),this.Nt(t);else if("bytesValue"in e)this.Ft(t,30),t.Bt(Tt(e.bytesValue)),this.Nt(t);else if("referenceValue"in e)this.Lt(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.Ft(t,45),t.Mt(n.latitude||0),t.Mt(n.longitude||0)}else"mapValue"in e?Dp(e)?this.Ft(t,Number.MAX_SAFE_INTEGER):Vo(e)?this.kt(e.mapValue,t):(this.Kt(e.mapValue,t),this.Nt(t)):"arrayValue"in e?(this.qt(e.arrayValue,t),this.Nt(t)):M(19022,{Ut:e})}Ot(e,t){this.Ft(t,25),this.$t(e,t)}$t(e,t){t.xt(e)}Kt(e,t){const n=e.fields||{};this.Ft(t,55);for(const s of Object.keys(n))this.Ot(s,t),this.Ct(n[s],t)}kt(e,t){var o,c;const n=e.fields||{};this.Ft(t,53);const s=_r,i=((c=(o=n[s].arrayValue)==null?void 0:o.values)==null?void 0:c.length)||0;this.Ft(t,15),t.Mt(ae(i)),this.Ot(s,t),this.Ct(n[s],t)}qt(e,t){const n=e.values||[];this.Ft(t,50);for(const s of n)this.Ct(s,t)}Lt(e,t){this.Ft(t,37),O.fromName(e).path.forEach((n=>{this.Ft(t,60),this.$t(n,t)}))}Ft(e,t){e.Mt(t)}Nt(e){e.Mt(2)}}_n.Wt=new _n;/**
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
 */const Wn=255;function Xw(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function cd(r){const e=64-(function(n){let s=0;for(let i=0;i<8;++i){const o=Xw(255&n[i]);if(s+=o,o!==8)break}return s})(r);return Math.ceil(e/8)}class Zw{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Qt(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Gt(n.value),n=t.next();this.zt()}jt(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Ht(n.value),n=t.next();this.Jt()}Zt(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Gt(n);else if(n<2048)this.Gt(960|n>>>6),this.Gt(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Gt(480|n>>>12),this.Gt(128|63&n>>>6),this.Gt(128|63&n);else{const s=t.codePointAt(0);this.Gt(240|s>>>18),this.Gt(128|63&s>>>12),this.Gt(128|63&s>>>6),this.Gt(128|63&s)}}this.zt()}Xt(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Ht(n);else if(n<2048)this.Ht(960|n>>>6),this.Ht(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Ht(480|n>>>12),this.Ht(128|63&n>>>6),this.Ht(128|63&n);else{const s=t.codePointAt(0);this.Ht(240|s>>>18),this.Ht(128|63&s>>>12),this.Ht(128|63&s>>>6),this.Ht(128|63&s)}}this.Jt()}Yt(e){const t=this.en(e),n=cd(t);this.tn(1+n),this.buffer[this.position++]=255&n;for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=255&t[s]}nn(e){const t=this.en(e),n=cd(t);this.tn(1+n),this.buffer[this.position++]=~(255&n);for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}rn(){this.sn(Wn),this.sn(255)}_n(){this.an(Wn),this.an(255)}reset(){this.position=0}seed(e){this.tn(e.length),this.buffer.set(e,this.position),this.position+=e.length}un(){return this.buffer.slice(0,this.position)}en(e){const t=(function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)})(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let s=1;s<t.length;++s)t[s]^=n?255:0;return t}Gt(e){const t=255&e;t===0?(this.sn(0),this.sn(255)):t===Wn?(this.sn(Wn),this.sn(0)):this.sn(t)}Ht(e){const t=255&e;t===0?(this.an(0),this.an(255)):t===Wn?(this.an(Wn),this.an(0)):this.an(e)}zt(){this.sn(0),this.sn(1)}Jt(){this.an(0),this.an(1)}sn(e){this.tn(1),this.buffer[this.position++]=e}an(e){this.tn(1),this.buffer[this.position++]=~e}tn(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class ev{constructor(e){this.cn=e}Bt(e){this.cn.Qt(e)}xt(e){this.cn.Zt(e)}Mt(e){this.cn.Yt(e)}vt(){this.cn.rn()}}class tv{constructor(e){this.cn=e}Bt(e){this.cn.jt(e)}xt(e){this.cn.Xt(e)}Mt(e){this.cn.nn(e)}vt(){this.cn._n()}}class ns{constructor(){this.cn=new Zw,this.ascending=new ev(this.cn),this.descending=new tv(this.cn)}seed(e){this.cn.seed(e)}ln(e){return e===0?this.ascending:this.descending}un(){return this.cn.un()}reset(){this.cn.reset()}}/**
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
 */class yn{constructor(e,t,n,s){this.hn=e,this.Pn=t,this.Tn=n,this.In=s}En(){const e=this.In.length,t=e===0||this.In[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.In,0),t!==e?n.set([0],this.In.length):++n[n.length-1],new yn(this.hn,this.Pn,this.Tn,n)}Rn(e,t,n){return{indexId:this.hn,uid:e,arrayValue:qi(this.Tn),directionalValue:qi(this.In),orderedDocumentKey:qi(t),documentKey:n.path.toArray()}}An(e,t,n){const s=this.Rn(e,t,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function xt(r,e){let t=r.hn-e.hn;return t!==0?t:(t=ud(r.Tn,e.Tn),t!==0?t:(t=ud(r.In,e.In),t!==0?t:O.comparator(r.Pn,e.Pn)))}function ud(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function qi(r){return ff()?(function(t){let n="";for(let s=0;s<t.length;s++)n+=String.fromCharCode(t[s]);return n})(r):r}function ld(r){return typeof r!="string"?r:(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(r)}class hd{constructor(e){this.Vn=new te(((t,n)=>le.comparator(t.field,n.field))),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.dn=e.orderBy,this.mn=[];for(const t of e.filters){const n=t;n.isInequality()?this.Vn=this.Vn.add(n):this.mn.push(n)}}get fn(){return this.Vn.size>1}gn(e){if(F(e.collectionGroup===this.collectionId,49279),this.fn)return!1;const t=Ya(e);if(t!==void 0&&!this.pn(t))return!1;const n=fn(e);let s=new Set,i=0,o=0;for(;i<n.length&&this.pn(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.Vn.size>0){const c=this.Vn.getIterator().getNext();if(!s.has(c.field.canonicalString())){const u=n[i];if(!this.yn(c,u)||!this.wn(this.dn[o++],u))return!1}++i}for(;i<n.length;++i){const c=n[i];if(o>=this.dn.length||!this.wn(this.dn[o++],c))return!1}return!0}bn(){if(this.fn)return null;let e=new te(le.comparator);const t=[];for(const n of this.mn)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new Ni(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new Ni(n.field,0))}for(const n of this.dn)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new Ni(n.field,n.dir==="asc"?0:1)));return new Xi(Xi.UNKNOWN_ID,this.collectionId,t,Ss.empty())}pn(e){for(const t of this.mn)if(this.yn(t,e))return!0;return!1}yn(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}wn(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
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
 */function vm(r){var t,n;if(F(r instanceof W||r instanceof ee,20012),r instanceof W){if(r instanceof qp){const s=((n=(t=r.value.arrayValue)==null?void 0:t.values)==null?void 0:n.map((i=>W.create(r.field,"==",i))))||[];return ee.create(s,"or")}return r}const e=r.filters.map((s=>vm(s)));return ee.create(e,r.op)}function nv(r){if(r.getFilters().length===0)return[];const e=pc(vm(r));return F(Am(e),7391),dc(e)||fc(e)?[e]:e.getFilters()}function dc(r){return r instanceof W}function fc(r){return r instanceof ee&&Kc(r)}function Am(r){return dc(r)||fc(r)||(function(t){if(t instanceof ee&&sc(t)){for(const n of t.getFilters())if(!dc(n)&&!fc(n))return!1;return!0}return!1})(r)}function pc(r){if(F(r instanceof W||r instanceof ee,34018),r instanceof W)return r;if(r.filters.length===1)return pc(r.filters[0]);const e=r.filters.map((n=>pc(n)));let t=ee.create(e,r.op);return t=ao(t),Am(t)?t:(F(t instanceof ee,64498),F(Ir(t),40251),F(t.filters.length>1,57927),t.filters.reduce(((n,s)=>tu(n,s))))}function tu(r,e){let t;return F(r instanceof W||r instanceof ee,38388),F(e instanceof W||e instanceof ee,25473),t=r instanceof W?e instanceof W?(function(s,i){return ee.create([s,i],"and")})(r,e):dd(r,e):e instanceof W?dd(e,r):(function(s,i){if(F(s.filters.length>0&&i.filters.length>0,48005),Ir(s)&&Ir(i))return Fp(s,i.getFilters());const o=sc(s)?s:i,c=sc(s)?i:s,u=o.filters.map((h=>tu(h,c)));return ee.create(u,"or")})(r,e),ao(t)}function dd(r,e){if(Ir(e))return Fp(e,r.getFilters());{const t=e.filters.map((n=>tu(r,n)));return ee.create(t,"or")}}function ao(r){if(F(r instanceof W||r instanceof ee,11850),r instanceof W)return r;const e=r.getFilters();if(e.length===1)return ao(e[0]);if(Mp(r))return r;const t=e.map((s=>ao(s))),n=[];return t.forEach((s=>{s instanceof W?n.push(s):s instanceof ee&&(s.op===r.op?n.push(...s.filters):n.push(s))})),n.length===1?n[0]:ee.create(n,r.op)}/**
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
 */class rv{constructor(){this.Sn=new nu}addToCollectionParentIndex(e,t){return this.Sn.add(t),v.resolve()}getCollectionParents(e,t){return v.resolve(this.Sn.getEntries(t))}addFieldIndex(e,t){return v.resolve()}deleteFieldIndex(e,t){return v.resolve()}deleteAllFieldIndexes(e){return v.resolve()}createTargetIndexes(e,t){return v.resolve()}getDocumentsMatchingTarget(e,t){return v.resolve(null)}getIndexType(e,t){return v.resolve(0)}getFieldIndexes(e,t){return v.resolve([])}getNextCollectionGroupToUpdate(e){return v.resolve(null)}getMinOffset(e,t){return v.resolve(je.min())}getMinOffsetFromCollectionGroup(e,t){return v.resolve(je.min())}updateCollectionGroup(e,t,n){return v.resolve()}updateIndexEntries(e,t){return v.resolve()}}class nu{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new te(J.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new te(J.comparator)).toArray()}}/**
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
 */const fd="IndexedDbIndexManager",Ai=new Uint8Array(0);class sv{constructor(e,t){this.databaseId=t,this.Dn=new nu,this.Cn=new bt((n=>kn(n)),((n,s)=>Ys(n,s))),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.Dn.has(t)){const n=t.lastSegment(),s=t.popLast();e.addOnCommittedListener((()=>{this.Dn.add(t)}));const i={collectionId:n,parent:Ve(s)};return pd(e).put(i)}return v.resolve()}getCollectionParents(e,t){const n=[],s=IDBKeyRange.bound([t,""],[op(t),""],!1,!0);return pd(e).H(s).next((i=>{for(const o of i){if(o.collectionId!==t)break;n.push(rt(o.parent))}return n}))}addFieldIndex(e,t){const n=rs(e),s=(function(c){return{indexId:c.indexId,collectionGroup:c.collectionGroup,fields:c.fields.map((u=>[u.fieldPath.canonicalString(),u.kind]))}})(t);delete s.indexId;const i=n.add(s);if(t.indexState){const o=Jn(e);return i.next((c=>{o.put(id(c,this.uid,t.indexState.sequenceNumber,t.indexState.offset))}))}return i.next()}deleteFieldIndex(e,t){const n=rs(e),s=Jn(e),i=Qn(e);return n.delete(t.indexId).next((()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))))}deleteAllFieldIndexes(e){const t=rs(e),n=Qn(e),s=Jn(e);return t.X().next((()=>n.X())).next((()=>s.X()))}createTargetIndexes(e,t){return v.forEach(this.vn(t),(n=>this.getIndexType(e,n).next((s=>{if(s===0||s===1){const i=new hd(n).bn();if(i!=null)return this.addFieldIndex(e,i)}}))))}getDocumentsMatchingTarget(e,t){const n=Qn(e);let s=!0;const i=new Map;return v.forEach(this.vn(t),(o=>this.Fn(e,o).next((c=>{s&&(s=!!c),i.set(o,c)})))).next((()=>{if(s){let o=G();const c=[];return v.forEach(i,((u,h)=>{C(fd,`Using index ${(function(q){return`id=${q.indexId}|cg=${q.collectionGroup}|f=${q.fields.map((ne=>`${ne.fieldPath}:${ne.kind}`)).join(",")}`})(u)} to execute ${kn(t)}`);const f=(function(q,ne){const Y=Ya(ne);if(Y===void 0)return null;for(const X of so(q,Y.fieldPath))switch(X.op){case"array-contains-any":return X.value.arrayValue.values||[];case"array-contains":return[X.value]}return null})(h,u),m=(function(q,ne){const Y=new Map;for(const X of fn(ne))for(const E of so(q,X.fieldPath))switch(E.op){case"==":case"in":Y.set(X.fieldPath.canonicalString(),E.value);break;case"not-in":case"!=":return Y.set(X.fieldPath.canonicalString(),E.value),Array.from(Y.values())}return null})(h,u),g=(function(q,ne){const Y=[];let X=!0;for(const E of fn(ne)){const _=E.kind===0?Kh(q,E.fieldPath,q.startAt):Gh(q,E.fieldPath,q.startAt);Y.push(_.value),X&&(X=_.inclusive)}return new Yt(Y,X)})(h,u),S=(function(q,ne){const Y=[];let X=!0;for(const E of fn(ne)){const _=E.kind===0?Gh(q,E.fieldPath,q.endAt):Kh(q,E.fieldPath,q.endAt);Y.push(_.value),X&&(X=_.inclusive)}return new Yt(Y,X)})(h,u),k=this.Mn(u,h,g),D=this.Mn(u,h,S),N=this.xn(u,h,m),z=this.On(u.indexId,f,k,g.inclusive,D,S.inclusive,N);return v.forEach(z,(B=>n.Z(B,t.limit).next((q=>{q.forEach((ne=>{const Y=O.fromSegments(ne.documentKey);o.has(Y)||(o=o.add(Y),c.push(Y))}))}))))})).next((()=>c))}return v.resolve(null)}))}vn(e){let t=this.Cn.get(e);return t||(e.filters.length===0?t=[e]:t=nv(ee.create(e.filters,"and")).map((n=>oc(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt))),this.Cn.set(e,t),t)}On(e,t,n,s,i,o,c){const u=(t!=null?t.length:1)*Math.max(n.length,i.length),h=u/(t!=null?t.length:1),f=[];for(let m=0;m<u;++m){const g=t?this.Nn(t[m/h]):Ai,S=this.Bn(e,g,n[m%h],s),k=this.Ln(e,g,i[m%h],o),D=c.map((N=>this.Bn(e,g,N,!0)));f.push(...this.createRange(S,k,D))}return f}Bn(e,t,n,s){const i=new yn(e,O.empty(),t,n);return s?i:i.En()}Ln(e,t,n,s){const i=new yn(e,O.empty(),t,n);return s?i.En():i}Fn(e,t){const n=new hd(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next((i=>{let o=null;for(const c of i)n.gn(c)&&(!o||c.fields.length>o.fields.length)&&(o=c);return o}))}getIndexType(e,t){let n=2;const s=this.vn(t);return v.forEach(s,(i=>this.Fn(e,i).next((o=>{o?n!==0&&o.fields.length<(function(u){let h=new te(le.comparator),f=!1;for(const m of u.filters)for(const g of m.getFlattenedFilters())g.field.isKeyField()||(g.op==="array-contains"||g.op==="array-contains-any"?f=!0:h=h.add(g.field));for(const m of u.orderBy)m.field.isKeyField()||(h=h.add(m.field));return h.size+(f?1:0)})(i)&&(n=1):n=0})))).next((()=>(function(o){return o.limit!==null})(t)&&s.length>1&&n===2?1:n))}kn(e,t){const n=new ns;for(const s of fn(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=n.ln(s.kind);_n.Wt.Dt(i,o)}return n.un()}Nn(e){const t=new ns;return _n.Wt.Dt(e,t.ln(0)),t.un()}Kn(e,t){const n=new ns;return _n.Wt.Dt(Vn(this.databaseId,t),n.ln((function(i){const o=fn(i);return o.length===0?0:o[o.length-1].kind})(e))),n.un()}xn(e,t,n){if(n===null)return[];let s=[];s.push(new ns);let i=0;for(const o of fn(e)){const c=n[i++];for(const u of s)if(this.qn(t,o.fieldPath)&&Ns(c))s=this.Un(s,o,c);else{const h=u.ln(o.kind);_n.Wt.Dt(c,h)}}return this.$n(s)}Mn(e,t,n){return this.xn(e,t,n.position)}$n(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].un();return t}Un(e,t,n){const s=[...e],i=[];for(const o of n.arrayValue.values||[])for(const c of s){const u=new ns;u.seed(c.un()),_n.Wt.Dt(o,u.ln(t.kind)),i.push(u)}return i}qn(e,t){return!!e.filters.find((n=>n instanceof W&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in")))}getFieldIndexes(e,t){const n=rs(e),s=Jn(e);return(t?n.H(Za,IDBKeyRange.bound(t,t)):n.H()).next((i=>{const o=[];return v.forEach(i,(c=>s.get([c.indexId,this.uid]).next((u=>{o.push((function(f,m){const g=m?new Ss(m.sequenceNumber,new je(Nn(m.readTime),new O(rt(m.documentKey)),m.largestBatchId)):Ss.empty(),S=f.fields.map((([k,D])=>new Ni(le.fromServerFormat(k),D)));return new Xi(f.indexId,f.collectionGroup,S,g)})(c,u))})))).next((()=>o))}))}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next((t=>t.length===0?null:(t.sort(((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:j(n.collectionGroup,s.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(e,t,n){const s=rs(e),i=Jn(e);return this.Wn(e).next((o=>s.H(Za,IDBKeyRange.bound(t,t)).next((c=>v.forEach(c,(u=>i.put(id(u.indexId,this.uid,o,n))))))))}updateIndexEntries(e,t){const n=new Map;return v.forEach(t,((s,i)=>{const o=n.get(s.collectionGroup);return(o?v.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next((c=>(n.set(s.collectionGroup,c),v.forEach(c,(u=>this.Qn(e,s,u).next((h=>{const f=this.Gn(i,u);return h.isEqual(f)?v.resolve():this.zn(e,i,u,h,f)})))))))}))}jn(e,t,n,s){return Qn(e).put(s.Rn(this.uid,this.Kn(n,t.key),t.key))}Hn(e,t,n,s){return Qn(e).delete(s.An(this.uid,this.Kn(n,t.key),t.key))}Qn(e,t,n){const s=Qn(e);let i=new te(xt);return s.ee({index:Ip,range:IDBKeyRange.only([n.indexId,this.uid,qi(this.Kn(n,t))])},((o,c)=>{i=i.add(new yn(n.indexId,t,ld(c.arrayValue),ld(c.directionalValue)))})).next((()=>i))}Gn(e,t){let n=new te(xt);const s=this.kn(t,e);if(s==null)return n;const i=Ya(t);if(i!=null){const o=e.data.field(i.fieldPath);if(Ns(o))for(const c of o.arrayValue.values||[])n=n.add(new yn(t.indexId,e.key,this.Nn(c),s))}else n=n.add(new yn(t.indexId,e.key,Ai,s));return n}zn(e,t,n,s,i){C(fd,"Updating index entries for document '%s'",t.key);const o=[];return(function(u,h,f,m,g){const S=u.getIterator(),k=h.getIterator();let D=Hn(S),N=Hn(k);for(;D||N;){let z=!1,B=!1;if(D&&N){const q=f(D,N);q<0?B=!0:q>0&&(z=!0)}else D!=null?B=!0:z=!0;z?(m(N),N=Hn(k)):B?(g(D),D=Hn(S)):(D=Hn(S),N=Hn(k))}})(s,i,xt,(c=>{o.push(this.jn(e,t,n,c))}),(c=>{o.push(this.Hn(e,t,n,c))})),v.waitFor(o)}Wn(e){let t=1;return Jn(e).ee({index:yp,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((n,s,i)=>{i.done(),t=s.sequenceNumber+1})).next((()=>t))}createRange(e,t,n){n=n.sort(((o,c)=>xt(o,c))).filter(((o,c,u)=>!c||xt(o,u[c-1])!==0));const s=[];s.push(e);for(const o of n){const c=xt(o,e),u=xt(o,t);if(c===0)s[0]=e.En();else if(c>0&&u<0)s.push(o),s.push(o.En());else if(u>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.Jn(s[o],s[o+1]))return[];const c=s[o].An(this.uid,Ai,O.empty()),u=s[o+1].An(this.uid,Ai,O.empty());i.push(IDBKeyRange.bound(c,u))}return i}Jn(e,t){return xt(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(md)}getMinOffset(e,t){return v.mapArray(this.vn(t),(n=>this.Fn(e,n).next((s=>s||M(44426))))).next(md)}}function pd(r){return Ie(r,Vs)}function Qn(r){return Ie(r,ys)}function rs(r){return Ie(r,Bc)}function Jn(r){return Ie(r,_s)}function md(r){F(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;Lc(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new je(e.readTime,e.documentKey,t)}/**
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
 */const gd={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},bm=41943040;class Pe{static withCacheSize(e){return new Pe(e,Pe.DEFAULT_COLLECTION_PERCENTILE,Pe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}/**
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
 */function Sm(r,e,t){const n=r.store(Ge),s=r.store(fr),i=[],o=IDBKeyRange.only(t.batchId);let c=0;const u=n.ee({range:o},((f,m,g)=>(c++,g.delete())));i.push(u.next((()=>{F(c===1,47070,{batchId:t.batchId})})));const h=[];for(const f of t.mutations){const m=mp(e,f.key.path,t.batchId);i.push(s.delete(m)),h.push(f.key)}return v.waitFor(i).next((()=>h))}function co(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw M(14731);e=r.noDocument}return JSON.stringify(e).length}/**
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
 */Pe.DEFAULT_COLLECTION_PERCENTILE=10,Pe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Pe.DEFAULT=new Pe(bm,Pe.DEFAULT_COLLECTION_PERCENTILE,Pe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Pe.DISABLED=new Pe(-1,0,0);class Oo{constructor(e,t,n,s){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=s,this.Zn={}}static wt(e,t,n,s){F(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new Oo(i,t,n,s)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return Ot(e).ee({index:En,range:n},((s,i,o)=>{t=!1,o.done()})).next((()=>t))}addMutationBatch(e,t,n,s){const i=nr(e),o=Ot(e);return o.add({}).next((c=>{F(typeof c=="number",49019);const u=new Jc(c,t,n,s),h=(function(S,k,D){const N=D.baseMutations.map((B=>Ls(S.yt,B))),z=D.mutations.map((B=>Ls(S.yt,B)));return{userId:k,batchId:D.batchId,localWriteTimeMs:D.localWriteTime.toMillis(),baseMutations:N,mutations:z}})(this.serializer,this.userId,u),f=[];let m=new te(((g,S)=>j(g.canonicalString(),S.canonicalString())));for(const g of s){const S=mp(this.userId,g.key.path,c);m=m.add(g.key.path.popLast()),f.push(o.put(h)),f.push(i.put(S,NT))}return m.forEach((g=>{f.push(this.indexManager.addToCollectionParentIndex(e,g))})),e.addOnCommittedListener((()=>{this.Zn[c]=u.keys()})),v.waitFor(f).next((()=>u))}))}lookupMutationBatch(e,t){return Ot(e).get(t).next((n=>n?(F(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),gn(this.serializer,n)):null))}Xn(e,t){return this.Zn[t]?v.resolve(this.Zn[t]):this.lookupMutationBatch(e,t).next((n=>{if(n){const s=n.keys();return this.Zn[t]=s,s}return null}))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return Ot(e).ee({index:En,range:s},((o,c,u)=>{c.userId===this.userId&&(F(c.batchId>=n,47524,{Yn:n}),i=gn(this.serializer,c)),u.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=wn;return Ot(e).ee({index:En,range:t,reverse:!0},((s,i,o)=>{n=i.batchId,o.done()})).next((()=>n))}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,wn],[this.userId,Number.POSITIVE_INFINITY]);return Ot(e).H(En,t).next((n=>n.map((s=>gn(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=xi(this.userId,t.path),s=IDBKeyRange.lowerBound(n),i=[];return nr(e).ee({range:s},((o,c,u)=>{const[h,f,m]=o,g=rt(f);if(h===this.userId&&t.path.isEqual(g))return Ot(e).get(m).next((S=>{if(!S)throw M(61480,{er:o,batchId:m});F(S.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:S.userId,batchId:m}),i.push(gn(this.serializer,S))}));u.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new te(j);const s=[];return t.forEach((i=>{const o=xi(this.userId,i.path),c=IDBKeyRange.lowerBound(o),u=nr(e).ee({range:c},((h,f,m)=>{const[g,S,k]=h,D=rt(S);g===this.userId&&i.path.isEqual(D)?n=n.add(k):m.done()}));s.push(u)})),v.waitFor(s).next((()=>this.tr(e,n)))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1,i=xi(this.userId,n),o=IDBKeyRange.lowerBound(i);let c=new te(j);return nr(e).ee({range:o},((u,h,f)=>{const[m,g,S]=u,k=rt(g);m===this.userId&&n.isPrefixOf(k)?k.length===s&&(c=c.add(S)):f.done()})).next((()=>this.tr(e,c)))}tr(e,t){const n=[],s=[];return t.forEach((i=>{s.push(Ot(e).get(i).next((o=>{if(o===null)throw M(35274,{batchId:i});F(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),n.push(gn(this.serializer,o))})))})),v.waitFor(s).next((()=>n))}removeMutationBatch(e,t){return Sm(e.le,this.userId,t).next((n=>(e.addOnCommittedListener((()=>{this.nr(t.batchId)})),v.forEach(n,(s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))))}nr(e){delete this.Zn[e]}performConsistencyCheck(e){return this.checkEmpty(e).next((t=>{if(!t)return v.resolve();const n=IDBKeyRange.lowerBound((function(o){return[o]})(this.userId)),s=[];return nr(e).ee({range:n},((i,o,c)=>{if(i[0]===this.userId){const u=rt(i[1]);s.push(u)}else c.done()})).next((()=>{F(s.length===0,56720,{rr:s.map((i=>i.canonicalString()))})}))}))}containsKey(e,t){return Rm(e,this.userId,t)}ir(e){return Pm(e).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:wn,lastStreamToken:""}))}}function Rm(r,e,t){const n=xi(e,t.path),s=n[1],i=IDBKeyRange.lowerBound(n);let o=!1;return nr(r).ee({range:i,Y:!0},((c,u,h)=>{const[f,m,g]=c;f===e&&m===s&&(o=!0),h.done()})).next((()=>o))}function Ot(r){return Ie(r,Ge)}function nr(r){return Ie(r,fr)}function Pm(r){return Ie(r,Ps)}/**
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
 */class xn{constructor(e){this.sr=e}next(){return this.sr+=2,this.sr}static _r(){return new xn(0)}static ar(){return new xn(-1)}}/**
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
 */class iv{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.ur(e).next((t=>{const n=new xn(t.highestTargetId);return t.highestTargetId=n.next(),this.cr(e,t).next((()=>t.highestTargetId))}))}getLastRemoteSnapshotVersion(e){return this.ur(e).next((t=>U.fromTimestamp(new Z(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(e){return this.ur(e).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(e,t,n){return this.ur(e).next((s=>(s.highestListenSequenceNumber=t,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.cr(e,s))))}addTargetData(e,t){return this.lr(e,t).next((()=>this.ur(e).next((n=>(n.targetCount+=1,this.hr(t,n),this.cr(e,n))))))}updateTargetData(e,t){return this.lr(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next((()=>Yn(e).delete(t.targetId))).next((()=>this.ur(e))).next((n=>(F(n.targetCount>0,8065),n.targetCount-=1,this.cr(e,n))))}removeTargets(e,t,n){let s=0;const i=[];return Yn(e).ee(((o,c)=>{const u=ds(c);u.sequenceNumber<=t&&n.get(u.targetId)===null&&(s++,i.push(this.removeTargetData(e,u)))})).next((()=>v.waitFor(i))).next((()=>s))}forEachTarget(e,t){return Yn(e).ee(((n,s)=>{const i=ds(s);t(i)}))}ur(e){return _d(e).get(to).next((t=>(F(t!==null,2888),t)))}cr(e,t){return _d(e).put(to,t)}lr(e,t){return Yn(e).put(Tm(this.serializer,t))}hr(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.ur(e).next((t=>t.targetCount))}getTargetData(e,t){const n=kn(t),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return Yn(e).ee({range:s,index:_p},((o,c,u)=>{const h=ds(c);Ys(t,h.target)&&(i=h,u.done())})).next((()=>i))}addMatchingKeys(e,t,n){const s=[],i=qt(e);return t.forEach((o=>{const c=Ve(o.path);s.push(i.put({targetId:n,path:c})),s.push(this.referenceDelegate.addReference(e,n,o))})),v.waitFor(s)}removeMatchingKeys(e,t,n){const s=qt(e);return v.forEach(t,(i=>{const o=Ve(i.path);return v.waitFor([s.delete([n,o]),this.referenceDelegate.removeReference(e,n,i)])}))}removeMatchingKeysForTargetId(e,t){const n=qt(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),s=qt(e);let i=G();return s.ee({range:n,Y:!0},((o,c,u)=>{const h=rt(o[1]),f=new O(h);i=i.add(f)})).next((()=>i))}containsKey(e,t){const n=Ve(t.path),s=IDBKeyRange.bound([n],[op(n)],!1,!0);let i=0;return qt(e).ee({index:Uc,Y:!0,range:s},(([o,c],u,h)=>{o!==0&&(i++,h.done())})).next((()=>i>0))}At(e,t){return Yn(e).get(t).next((n=>n?ds(n):null))}}function Yn(r){return Ie(r,pr)}function _d(r){return Ie(r,vn)}function qt(r){return Ie(r,mr)}/**
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
 */const yd="LruGarbageCollector",Cm=1048576;function Id([r,e],[t,n]){const s=j(r,t);return s===0?j(e,n):s}class ov{constructor(e){this.Pr=e,this.buffer=new te(Id),this.Tr=0}Ir(){return++this.Tr}Er(e){const t=[e,this.Ir()];if(this.buffer.size<this.Pr)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();Id(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Vm{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Ar(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Ar(e){C(yd,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){tn(t)?C(yd,"Ignoring IndexedDB error during garbage collection: ",t):await en(t)}await this.Ar(3e5)}))}}class av{constructor(e,t){this.Vr=e,this.params=t}calculateTargetCount(e,t){return this.Vr.dr(e).next((n=>Math.floor(t/100*n)))}nthSequenceNumber(e,t){if(t===0)return v.resolve(Oe.ce);const n=new ov(t);return this.Vr.forEachTarget(e,(s=>n.Er(s.sequenceNumber))).next((()=>this.Vr.mr(e,(s=>n.Er(s))))).next((()=>n.maxValue))}removeTargets(e,t,n){return this.Vr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.Vr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(C("LruGarbageCollector","Garbage collection skipped; disabled"),v.resolve(gd)):this.getCacheSize(e).next((n=>n<this.params.cacheSizeCollectionThreshold?(C("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),gd):this.gr(e,t)))}getCacheSize(e){return this.Vr.getCacheSize(e)}gr(e,t){let n,s,i,o,c,u,h;const f=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((m=>(m>this.params.maximumSequenceNumbersToCollect?(C("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${m}`),s=this.params.maximumSequenceNumbersToCollect):s=m,o=Date.now(),this.nthSequenceNumber(e,s)))).next((m=>(n=m,c=Date.now(),this.removeTargets(e,n,t)))).next((m=>(i=m,u=Date.now(),this.removeOrphanedDocuments(e,n)))).next((m=>(h=Date.now(),Xn()<=H.DEBUG&&C("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-f}ms
	Determined least recently used ${s} in `+(c-o)+`ms
	Removed ${i} targets in `+(u-c)+`ms
	Removed ${m} documents in `+(h-u)+`ms
Total Duration: ${h-f}ms`),v.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:m}))))}}function km(r,e){return new av(r,e)}/**
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
 */class cv{constructor(e,t){this.db=e,this.garbageCollector=km(this,t)}dr(e){const t=this.pr(e);return this.db.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}pr(e){let t=0;return this.mr(e,(n=>{t++})).next((()=>t))}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}mr(e,t){return this.yr(e,((n,s)=>t(s)))}addReference(e,t,n){return bi(e,n)}removeReference(e,t,n){return bi(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return bi(e,t)}wr(e,t){return(function(s,i){let o=!1;return Pm(s).te((c=>Rm(s,c,i).next((u=>(u&&(o=!0),v.resolve(!u)))))).next((()=>o))})(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.yr(e,((o,c)=>{if(c<=t){const u=this.wr(e,o).next((h=>{if(!h)return i++,n.getEntry(e,o).next((()=>(n.removeEntry(o,U.min()),qt(e).delete((function(m){return[0,Ve(m.path)]})(o)))))}));s.push(u)}})).next((()=>v.waitFor(s))).next((()=>n.apply(e))).next((()=>i))}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return bi(e,t)}yr(e,t){const n=qt(e);let s,i=Oe.ce;return n.ee({index:Uc},(([o,c],{path:u,sequenceNumber:h})=>{o===0?(i!==Oe.ce&&t(new O(rt(s)),i),i=h,s=u):i=Oe.ce})).next((()=>{i!==Oe.ce&&t(new O(rt(s)),i)}))}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function bi(r,e){return qt(r).put((function(n,s){return{targetId:0,path:Ve(n.path),sequenceNumber:s}})(e,r.currentSequenceNumber))}/**
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
 */class Dm{constructor(){this.changes=new bt((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,ce.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?v.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
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
 */class uv{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return hn(e).put(n)}removeEntry(e,t,n){return hn(e).delete((function(i,o){const c=i.path.toArray();return[c.slice(0,c.length-2),c[c.length-2],oo(o),c[c.length-1]]})(t,n))}updateMetadata(e,t){return this.getMetadata(e).next((n=>(n.byteSize+=t,this.br(e,n))))}getEntry(e,t){let n=ce.newInvalidDocument(t);return hn(e).ee({index:Oi,range:IDBKeyRange.only(ss(t))},((s,i)=>{n=this.Sr(t,i)})).next((()=>n))}Dr(e,t){let n={size:0,document:ce.newInvalidDocument(t)};return hn(e).ee({index:Oi,range:IDBKeyRange.only(ss(t))},((s,i)=>{n={document:this.Sr(t,i),size:co(i)}})).next((()=>n))}getEntries(e,t){let n=qe();return this.Cr(e,t,((s,i)=>{const o=this.Sr(s,i);n=n.insert(s,o)})).next((()=>n))}vr(e,t){let n=qe(),s=new ie(O.comparator);return this.Cr(e,t,((i,o)=>{const c=this.Sr(i,o);n=n.insert(i,c),s=s.insert(i,co(o))})).next((()=>({documents:n,Fr:s})))}Cr(e,t,n){if(t.isEmpty())return v.resolve();let s=new te(wd);t.forEach((u=>s=s.add(u)));const i=IDBKeyRange.bound(ss(s.first()),ss(s.last())),o=s.getIterator();let c=o.getNext();return hn(e).ee({index:Oi,range:i},((u,h,f)=>{const m=O.fromSegments([...h.prefixPath,h.collectionGroup,h.documentId]);for(;c&&wd(c,m)<0;)n(c,null),c=o.getNext();c&&c.isEqual(m)&&(n(c,h),c=o.hasNext()?o.getNext():null),c?f.j(ss(c)):f.done()})).next((()=>{for(;c;)n(c,null),c=o.hasNext()?o.getNext():null}))}getDocumentsMatchingQuery(e,t,n,s,i){const o=t.path,c=[o.popLast().toArray(),o.lastSegment(),oo(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],u=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return hn(e).H(IDBKeyRange.bound(c,u,!0)).next((h=>{i==null||i.incrementDocumentReadCount(h.length);let f=qe();for(const m of h){const g=this.Sr(O.fromSegments(m.prefixPath.concat(m.collectionGroup,m.documentId)),m);g.isFoundDocument()&&(Zs(t,g)||s.has(g.key))&&(f=f.insert(g.key,g))}return f}))}getAllFromCollectionGroup(e,t,n,s){let i=qe();const o=Td(t,n),c=Td(t,je.max());return hn(e).ee({index:gp,range:IDBKeyRange.bound(o,c,!0)},((u,h,f)=>{const m=this.Sr(O.fromSegments(h.prefixPath.concat(h.collectionGroup,h.documentId)),h);i=i.insert(m.key,m),i.size===s&&f.done()})).next((()=>i))}newChangeBuffer(e){return new lv(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next((t=>t.byteSize))}getMetadata(e){return Ed(e).get(Xa).next((t=>(F(!!t,20021),t)))}br(e,t){return Ed(e).put(Xa,t)}Sr(e,t){if(t){const n=Qw(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(U.min())))return n}return ce.newInvalidDocument(e)}}function Nm(r){return new uv(r)}class lv extends Dm{constructor(e,t){super(),this.Mr=e,this.trackRemovals=t,this.Or=new bt((n=>n.toString()),((n,s)=>n.isEqual(s)))}applyChanges(e){const t=[];let n=0,s=new te(((i,o)=>j(i.canonicalString(),o.canonicalString())));return this.changes.forEach(((i,o)=>{const c=this.Or.get(i);if(t.push(this.Mr.removeEntry(e,i,c.readTime)),o.isValidDocument()){const u=rd(this.Mr.serializer,o);s=s.add(i.path.popLast());const h=co(u);n+=h-c.size,t.push(this.Mr.addEntry(e,i,u))}else if(n-=c.size,this.trackRemovals){const u=rd(this.Mr.serializer,o.convertToNoDocument(U.min()));t.push(this.Mr.addEntry(e,i,u))}})),s.forEach((i=>{t.push(this.Mr.indexManager.addToCollectionParentIndex(e,i))})),t.push(this.Mr.updateMetadata(e,n)),v.waitFor(t)}getFromCache(e,t){return this.Mr.Dr(e,t).next((n=>(this.Or.set(t,{size:n.size,readTime:n.document.readTime}),n.document)))}getAllFromCache(e,t){return this.Mr.vr(e,t).next((({documents:n,Fr:s})=>(s.forEach(((i,o)=>{this.Or.set(i,{size:o,readTime:n.get(i).readTime})})),n)))}}function Ed(r){return Ie(r,Cs)}function hn(r){return Ie(r,eo)}function ss(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function Td(r,e){const t=e.documentKey.path.toArray();return[r,oo(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function wd(r,e){const t=r.path.toArray(),n=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<n.length-2;++i)if(s=j(t[i],n[i]),s)return s;return s=j(t.length,n.length),s||(s=j(t[t.length-2],n[n.length-2]),s||j(t[t.length-1],n[n.length-1]))}/**
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
 */class hv{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
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
 */class xm{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(n=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(n!==null&&Ts(n.mutation,s,Me.empty(),Z.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.getLocalViewOfDocuments(e,n,G()).next((()=>n))))}getLocalViewOfDocuments(e,t,n=G()){const s=st();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,n).next((i=>{let o=ls();return i.forEach(((c,u)=>{o=o.insert(c,u.overlayedDocument)})),o}))))}getOverlayedDocuments(e,t){const n=st();return this.populateOverlays(e,n,t).next((()=>this.computeViews(e,t,n,G())))}populateOverlays(e,t,n){const s=[];return n.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((o,c)=>{t.set(o,c)}))}))}computeViews(e,t,n,s){let i=qe();const o=Es(),c=(function(){return Es()})();return t.forEach(((u,h)=>{const f=n.get(h.key);s.has(h.key)&&(f===void 0||f.mutation instanceof St)?i=i.insert(h.key,h):f!==void 0?(o.set(h.key,f.mutation.getFieldMask()),Ts(f.mutation,h,f.mutation.getFieldMask(),Z.now())):o.set(h.key,Me.empty())})),this.recalculateAndSaveOverlays(e,i).next((u=>(u.forEach(((h,f)=>o.set(h,f))),t.forEach(((h,f)=>c.set(h,new hv(f,o.get(h)??null)))),c)))}recalculateAndSaveOverlays(e,t){const n=Es();let s=new ie(((o,c)=>o-c)),i=G();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((o=>{for(const c of o)c.keys().forEach((u=>{const h=t.get(u);if(h===null)return;let f=n.get(u)||Me.empty();f=c.applyToLocalView(h,f),n.set(u,f);const m=(s.get(c.batchId)||G()).add(u);s=s.insert(c.batchId,m)}))})).next((()=>{const o=[],c=s.getReverseIterator();for(;c.hasNext();){const u=c.getNext(),h=u.key,f=u.value,m=Wp();f.forEach((g=>{if(!i.has(g)){const S=nm(t.get(g),n.get(g));S!==null&&m.set(g,S),i=i.add(g)}})),o.push(this.documentOverlayCache.saveOverlays(e,h,m))}return v.waitFor(o)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.recalculateAndSaveOverlays(e,n)))}getDocumentsMatchingQuery(e,t,n,s){return gw(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Gc(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next((i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):v.resolve(st());let c=dr,u=i;return o.next((h=>v.forEach(h,((f,m)=>(c<m.largestBatchId&&(c=m.largestBatchId),i.get(f)?v.resolve():this.remoteDocumentCache.getEntry(e,f).next((g=>{u=u.insert(f,g)}))))).next((()=>this.populateOverlays(e,h,i))).next((()=>this.computeViews(e,u,h,G()))).next((f=>({batchId:c,changes:Hp(f)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new O(t)).next((n=>{let s=ls();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let o=ls();return this.indexManager.getCollectionParents(e,i).next((c=>v.forEach(c,(u=>{const h=(function(m,g){return new Bn(g,null,m.explicitOrderBy.slice(),m.filters.slice(),m.limit,m.limitType,m.startAt,m.endAt)})(t,u.child(i));return this.getDocumentsMatchingCollectionQuery(e,h,n,s).next((f=>{f.forEach(((m,g)=>{o=o.insert(m,g)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s)))).next((o=>{i.forEach(((u,h)=>{const f=h.getKey();o.get(f)===null&&(o=o.insert(f,ce.newInvalidDocument(f)))}));let c=ls();return o.forEach(((u,h)=>{const f=i.get(u);f!==void 0&&Ts(f.mutation,h,Me.empty(),Z.now()),Zs(t,h)&&(c=c.insert(u,h))})),c}))}}/**
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
 */class dv{constructor(e){this.serializer=e,this.Nr=new Map,this.Br=new Map}getBundleMetadata(e,t){return v.resolve(this.Nr.get(t))}saveBundleMetadata(e,t){return this.Nr.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:we(s.createTime)}})(t)),v.resolve()}getNamedQuery(e,t){return v.resolve(this.Br.get(t))}saveNamedQuery(e,t){return this.Br.set(t.name,(function(s){return{name:s.name,query:wm(s.bundledQuery),readTime:we(s.readTime)}})(t)),v.resolve()}}/**
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
 */class fv{constructor(){this.overlays=new ie(O.comparator),this.Lr=new Map}getOverlay(e,t){return v.resolve(this.overlays.get(t))}getOverlays(e,t){const n=st();return v.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(e,t,n){return n.forEach(((s,i)=>{this.bt(e,t,i)})),v.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.Lr.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.Lr.delete(n)),v.resolve()}getOverlaysForCollection(e,t,n){const s=st(),i=t.length+1,o=new O(t.child("")),c=this.overlays.getIteratorFrom(o);for(;c.hasNext();){const u=c.getNext().value,h=u.getKey();if(!t.isPrefixOf(h.path))break;h.path.length===i&&u.largestBatchId>n&&s.set(u.getKey(),u)}return v.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new ie(((h,f)=>h-f));const o=this.overlays.getIterator();for(;o.hasNext();){const h=o.getNext().value;if(h.getKey().getCollectionGroup()===t&&h.largestBatchId>n){let f=i.get(h.largestBatchId);f===null&&(f=st(),i=i.insert(h.largestBatchId,f)),f.set(h.getKey(),h)}}const c=st(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach(((h,f)=>c.set(h,f))),!(c.size()>=s)););return v.resolve(c)}bt(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.Lr.get(s.largestBatchId).delete(n.key);this.Lr.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new Xc(t,n));let i=this.Lr.get(t);i===void 0&&(i=G(),this.Lr.set(t,i)),this.Lr.set(t,i.add(n.key))}}/**
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
 */class pv{constructor(){this.sessionToken=pe.EMPTY_BYTE_STRING}getSessionToken(e){return v.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,v.resolve()}}/**
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
 */class ru{constructor(){this.kr=new te(Te.Kr),this.qr=new te(Te.Ur)}isEmpty(){return this.kr.isEmpty()}addReference(e,t){const n=new Te(e,t);this.kr=this.kr.add(n),this.qr=this.qr.add(n)}$r(e,t){e.forEach((n=>this.addReference(n,t)))}removeReference(e,t){this.Wr(new Te(e,t))}Qr(e,t){e.forEach((n=>this.removeReference(n,t)))}Gr(e){const t=new O(new J([])),n=new Te(t,e),s=new Te(t,e+1),i=[];return this.qr.forEachInRange([n,s],(o=>{this.Wr(o),i.push(o.key)})),i}zr(){this.kr.forEach((e=>this.Wr(e)))}Wr(e){this.kr=this.kr.delete(e),this.qr=this.qr.delete(e)}jr(e){const t=new O(new J([])),n=new Te(t,e),s=new Te(t,e+1);let i=G();return this.qr.forEachInRange([n,s],(o=>{i=i.add(o.key)})),i}containsKey(e){const t=new Te(e,0),n=this.kr.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class Te{constructor(e,t){this.key=e,this.Hr=t}static Kr(e,t){return O.comparator(e.key,t.key)||j(e.Hr,t.Hr)}static Ur(e,t){return j(e.Hr,t.Hr)||O.comparator(e.key,t.key)}}/**
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
 */class mv{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Yn=1,this.Jr=new te(Te.Kr)}checkEmpty(e){return v.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.Yn;this.Yn++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new Jc(i,t,n,s);this.mutationQueue.push(o);for(const c of s)this.Jr=this.Jr.add(new Te(c.key,i)),this.indexManager.addToCollectionParentIndex(e,c.key.path.popLast());return v.resolve(o)}lookupMutationBatch(e,t){return v.resolve(this.Zr(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.Xr(n),i=s<0?0:s;return v.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return v.resolve(this.mutationQueue.length===0?wn:this.Yn-1)}getAllMutationBatches(e){return v.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new Te(t,0),s=new Te(t,Number.POSITIVE_INFINITY),i=[];return this.Jr.forEachInRange([n,s],(o=>{const c=this.Zr(o.Hr);i.push(c)})),v.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new te(j);return t.forEach((s=>{const i=new Te(s,0),o=new Te(s,Number.POSITIVE_INFINITY);this.Jr.forEachInRange([i,o],(c=>{n=n.add(c.Hr)}))})),v.resolve(this.Yr(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;O.isDocumentKey(i)||(i=i.child(""));const o=new Te(new O(i),0);let c=new te(j);return this.Jr.forEachWhile((u=>{const h=u.key.path;return!!n.isPrefixOf(h)&&(h.length===s&&(c=c.add(u.Hr)),!0)}),o),v.resolve(this.Yr(c))}Yr(e){const t=[];return e.forEach((n=>{const s=this.Zr(n);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){F(this.ei(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.Jr;return v.forEach(t.mutations,(s=>{const i=new Te(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.Jr=n}))}nr(e){}containsKey(e,t){const n=new Te(t,0),s=this.Jr.firstAfterOrEqual(n);return v.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,v.resolve()}ei(e,t){return this.Xr(e)}Xr(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Zr(e){const t=this.Xr(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
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
 */class gv{constructor(e){this.ti=e,this.docs=(function(){return new ie(O.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,o=this.ti(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return v.resolve(n?n.document.mutableCopy():ce.newInvalidDocument(t))}getEntries(e,t){let n=qe();return t.forEach((s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():ce.newInvalidDocument(s))})),v.resolve(n)}getDocumentsMatchingQuery(e,t,n,s){let i=qe();const o=t.path,c=new O(o.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(c);for(;u.hasNext();){const{key:h,value:{document:f}}=u.getNext();if(!o.isPrefixOf(h.path))break;h.path.length>o.length+1||Lc(lp(f),n)<=0||(s.has(f.key)||Zs(t,f))&&(i=i.insert(f.key,f.mutableCopy()))}return v.resolve(i)}getAllFromCollectionGroup(e,t,n,s){M(9500)}ni(e,t){return v.forEach(this.docs,(n=>t(n)))}newChangeBuffer(e){return new _v(this)}getSize(e){return v.resolve(this.size)}}class _v extends Dm{constructor(e){super(),this.Mr=e}applyChanges(e){const t=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?t.push(this.Mr.addEntry(e,s)):this.Mr.removeEntry(n)})),v.waitFor(t)}getFromCache(e,t){return this.Mr.getEntry(e,t)}getAllFromCache(e,t){return this.Mr.getEntries(e,t)}}/**
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
 */class yv{constructor(e){this.persistence=e,this.ri=new bt((t=>kn(t)),Ys),this.lastRemoteSnapshotVersion=U.min(),this.highestTargetId=0,this.ii=0,this.si=new ru,this.targetCount=0,this.oi=xn._r()}forEachTarget(e,t){return this.ri.forEach(((n,s)=>t(s))),v.resolve()}getLastRemoteSnapshotVersion(e){return v.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return v.resolve(this.ii)}allocateTargetId(e){return this.highestTargetId=this.oi.next(),v.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.ii&&(this.ii=t),v.resolve()}lr(e){this.ri.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.oi=new xn(t),this.highestTargetId=t),e.sequenceNumber>this.ii&&(this.ii=e.sequenceNumber)}addTargetData(e,t){return this.lr(t),this.targetCount+=1,v.resolve()}updateTargetData(e,t){return this.lr(t),v.resolve()}removeTargetData(e,t){return this.ri.delete(t.target),this.si.Gr(t.targetId),this.targetCount-=1,v.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.ri.forEach(((o,c)=>{c.sequenceNumber<=t&&n.get(c.targetId)===null&&(this.ri.delete(o),i.push(this.removeMatchingKeysForTargetId(e,c.targetId)),s++)})),v.waitFor(i).next((()=>s))}getTargetCount(e){return v.resolve(this.targetCount)}getTargetData(e,t){const n=this.ri.get(t)||null;return v.resolve(n)}addMatchingKeys(e,t,n){return this.si.$r(t,n),v.resolve()}removeMatchingKeys(e,t,n){this.si.Qr(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((o=>{i.push(s.markPotentiallyOrphaned(e,o))})),v.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.si.Gr(t),v.resolve()}getMatchingKeysForTargetId(e,t){const n=this.si.jr(t);return v.resolve(n)}containsKey(e,t){return v.resolve(this.si.containsKey(t))}}/**
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
 */class su{constructor(e,t){this._i={},this.overlays={},this.ai=new Oe(0),this.ui=!1,this.ui=!0,this.ci=new pv,this.referenceDelegate=e(this),this.li=new yv(this),this.indexManager=new rv,this.remoteDocumentCache=(function(s){return new gv(s)})((n=>this.referenceDelegate.hi(n))),this.serializer=new Em(t),this.Pi=new dv(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ui=!1,Promise.resolve()}get started(){return this.ui}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new fv,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this._i[e.toKey()];return n||(n=new mv(t,this.referenceDelegate),this._i[e.toKey()]=n),n}getGlobalsCache(){return this.ci}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Pi}runTransaction(e,t,n){C("MemoryPersistence","Starting transaction:",e);const s=new Iv(this.ai.next());return this.referenceDelegate.Ti(),n(s).next((i=>this.referenceDelegate.Ii(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Ei(e,t){return v.or(Object.values(this._i).map((n=>()=>n.containsKey(e,t))))}}class Iv extends dp{constructor(e){super(),this.currentSequenceNumber=e}}class Mo{constructor(e){this.persistence=e,this.Ri=new ru,this.Ai=null}static Vi(e){return new Mo(e)}get di(){if(this.Ai)return this.Ai;throw M(60996)}addReference(e,t,n){return this.Ri.addReference(n,t),this.di.delete(n.toString()),v.resolve()}removeReference(e,t,n){return this.Ri.removeReference(n,t),this.di.add(n.toString()),v.resolve()}markPotentiallyOrphaned(e,t){return this.di.add(t.toString()),v.resolve()}removeTarget(e,t){this.Ri.Gr(t.targetId).forEach((s=>this.di.add(s.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.di.add(i.toString())))})).next((()=>n.removeTargetData(e,t)))}Ti(){this.Ai=new Set}Ii(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return v.forEach(this.di,(n=>{const s=O.fromPath(n);return this.mi(e,s).next((i=>{i||t.removeEntry(s,U.min())}))})).next((()=>(this.Ai=null,t.apply(e))))}updateLimboDocument(e,t){return this.mi(e,t).next((n=>{n?this.di.delete(t.toString()):this.di.add(t.toString())}))}hi(e){return 0}mi(e,t){return v.or([()=>v.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ei(e,t)])}}class uo{constructor(e,t){this.persistence=e,this.fi=new bt((n=>Ve(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=km(this,t)}static Vi(e,t){return new uo(e,t)}Ti(){}Ii(e){return v.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}dr(e){const t=this.pr(e);return this.persistence.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}pr(e){let t=0;return this.mr(e,(n=>{t++})).next((()=>t))}mr(e,t){return v.forEach(this.fi,((n,s)=>this.wr(e,n,s).next((i=>i?v.resolve():t(s)))))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ni(e,(o=>this.wr(e,o,t).next((c=>{c||(n++,i.removeEntry(o,U.min()))})))).next((()=>i.apply(e))).next((()=>n))}markPotentiallyOrphaned(e,t){return this.fi.set(t,e.currentSequenceNumber),v.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.fi.set(n,e.currentSequenceNumber),v.resolve()}removeReference(e,t,n){return this.fi.set(n,e.currentSequenceNumber),v.resolve()}updateLimboDocument(e,t){return this.fi.set(t,e.currentSequenceNumber),v.resolve()}hi(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Li(e.data.value)),t}wr(e,t,n){return v.or([()=>this.persistence.Ei(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.fi.get(t);return v.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
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
 */class Ev{constructor(e){this.serializer=e}k(e,t,n,s){const i=new Ao("createOrUpgrade",t);n<1&&s>=1&&((function(u){u.createObjectStore(Js)})(e),(function(u){u.createObjectStore(Ps,{keyPath:DT}),u.createObjectStore(Ge,{keyPath:Nh,autoIncrement:!0}).createIndex(En,xh,{unique:!0}),u.createObjectStore(fr)})(e),vd(e),(function(u){u.createObjectStore(pn)})(e));let o=v.resolve();return n<3&&s>=3&&(n!==0&&((function(u){u.deleteObjectStore(mr),u.deleteObjectStore(pr),u.deleteObjectStore(vn)})(e),vd(e)),o=o.next((()=>(function(u){const h=u.store(vn),f={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:U.min().toTimestamp(),targetCount:0};return h.put(to,f)})(i)))),n<4&&s>=4&&(n!==0&&(o=o.next((()=>(function(u,h){return h.store(Ge).H().next((m=>{u.deleteObjectStore(Ge),u.createObjectStore(Ge,{keyPath:Nh,autoIncrement:!0}).createIndex(En,xh,{unique:!0});const g=h.store(Ge),S=m.map((k=>g.put(k)));return v.waitFor(S)}))})(e,i)))),o=o.next((()=>{(function(u){u.createObjectStore(gr,{keyPath:qT})})(e)}))),n<5&&s>=5&&(o=o.next((()=>this.gi(i)))),n<6&&s>=6&&(o=o.next((()=>((function(u){u.createObjectStore(Cs)})(e),this.pi(i))))),n<7&&s>=7&&(o=o.next((()=>this.yi(i)))),n<8&&s>=8&&(o=o.next((()=>this.wi(e,i)))),n<9&&s>=9&&(o=o.next((()=>{(function(u){u.objectStoreNames.contains("remoteDocumentChanges")&&u.deleteObjectStore("remoteDocumentChanges")})(e)}))),n<10&&s>=10&&(o=o.next((()=>this.bi(i)))),n<11&&s>=11&&(o=o.next((()=>{(function(u){u.createObjectStore(bo,{keyPath:$T})})(e),(function(u){u.createObjectStore(So,{keyPath:jT})})(e)}))),n<12&&s>=12&&(o=o.next((()=>{(function(u){const h=u.createObjectStore(Ro,{keyPath:JT});h.createIndex(ec,YT,{unique:!1}),h.createIndex(Ep,XT,{unique:!1})})(e)}))),n<13&&s>=13&&(o=o.next((()=>(function(u){const h=u.createObjectStore(eo,{keyPath:xT});h.createIndex(Oi,OT),h.createIndex(gp,MT)})(e))).next((()=>this.Si(e,i))).next((()=>e.deleteObjectStore(pn)))),n<14&&s>=14&&(o=o.next((()=>this.Di(e,i)))),n<15&&s>=15&&(o=o.next((()=>(function(u){u.createObjectStore(Bc,{keyPath:zT,autoIncrement:!0}).createIndex(Za,KT,{unique:!1}),u.createObjectStore(_s,{keyPath:GT}).createIndex(yp,HT,{unique:!1}),u.createObjectStore(ys,{keyPath:WT}).createIndex(Ip,QT,{unique:!1})})(e)))),n<16&&s>=16&&(o=o.next((()=>{t.objectStore(_s).clear()})).next((()=>{t.objectStore(ys).clear()}))),n<17&&s>=17&&(o=o.next((()=>{(function(u){u.createObjectStore(qc,{keyPath:ZT})})(e)}))),n<18&&s>=18&&ff()&&(o=o.next((()=>{t.objectStore(_s).clear()})).next((()=>{t.objectStore(ys).clear()}))),o}pi(e){let t=0;return e.store(pn).ee(((n,s)=>{t+=co(s)})).next((()=>{const n={byteSize:t};return e.store(Cs).put(Xa,n)}))}gi(e){const t=e.store(Ps),n=e.store(Ge);return t.H().next((s=>v.forEach(s,(i=>{const o=IDBKeyRange.bound([i.userId,wn],[i.userId,i.lastAcknowledgedBatchId]);return n.H(En,o).next((c=>v.forEach(c,(u=>{F(u.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:u.batchId});const h=gn(this.serializer,u);return Sm(e,i.userId,h).next((()=>{}))}))))}))))}yi(e){const t=e.store(mr),n=e.store(pn);return e.store(vn).get(to).next((s=>{const i=[];return n.ee(((o,c)=>{const u=new J(o),h=(function(m){return[0,Ve(m)]})(u);i.push(t.get(h).next((f=>f?v.resolve():(m=>t.put({targetId:0,path:Ve(m),sequenceNumber:s.highestListenSequenceNumber}))(u))))})).next((()=>v.waitFor(i)))}))}wi(e,t){e.createObjectStore(Vs,{keyPath:BT});const n=t.store(Vs),s=new nu,i=o=>{if(s.add(o)){const c=o.lastSegment(),u=o.popLast();return n.put({collectionId:c,parent:Ve(u)})}};return t.store(pn).ee({Y:!0},((o,c)=>{const u=new J(o);return i(u.popLast())})).next((()=>t.store(fr).ee({Y:!0},(([o,c,u],h)=>{const f=rt(c);return i(f.popLast())}))))}bi(e){const t=e.store(pr);return t.ee(((n,s)=>{const i=ds(s),o=Tm(this.serializer,i);return t.put(o)}))}Si(e,t){const n=t.store(pn),s=[];return n.ee(((i,o)=>{const c=t.store(eo),u=(function(m){return m.document?new O(J.fromString(m.document.name).popFirst(5)):m.noDocument?O.fromSegments(m.noDocument.path):m.unknownDocument?O.fromSegments(m.unknownDocument.path):M(36783)})(o).path.toArray(),h={prefixPath:u.slice(0,u.length-2),collectionGroup:u[u.length-2],documentId:u[u.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(c.put(h))})).next((()=>v.waitFor(s)))}Di(e,t){const n=t.store(Ge),s=Nm(this.serializer),i=new su(Mo.Vi,this.serializer.yt);return n.H().next((o=>{const c=new Map;return o.forEach((u=>{let h=c.get(u.userId)??G();gn(this.serializer,u).keys().forEach((f=>h=h.add(f))),c.set(u.userId,h)})),v.forEach(c,((u,h)=>{const f=new Re(h),m=xo.wt(this.serializer,f),g=i.getIndexManager(f),S=Oo.wt(f,this.serializer,g,i.referenceDelegate);return new xm(s,S,m,g).recalculateAndSaveOverlaysForDocumentKeys(new tc(t,Oe.ce),u).next()}))}))}}function vd(r){r.createObjectStore(mr,{keyPath:FT}).createIndex(Uc,UT,{unique:!0}),r.createObjectStore(pr,{keyPath:"targetId"}).createIndex(_p,LT,{unique:!0}),r.createObjectStore(vn)}const Mt="IndexedDbPersistence",Ca=18e5,Va=5e3,ka="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",Tv="main";class iu{constructor(e,t,n,s,i,o,c,u,h,f,m=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.Ci=i,this.window=o,this.document=c,this.Fi=h,this.Mi=f,this.xi=m,this.ai=null,this.ui=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Oi=null,this.inForeground=!1,this.Ni=null,this.Bi=null,this.Li=Number.NEGATIVE_INFINITY,this.ki=g=>Promise.resolve(),!iu.v())throw new V(R.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new cv(this,s),this.Ki=t+Tv,this.serializer=new Em(u),this.qi=new Gt(this.Ki,this.xi,new Ev(this.serializer)),this.ci=new Yw,this.li=new iv(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Nm(this.serializer),this.Pi=new Jw,this.window&&this.window.localStorage?this.Ui=this.window.localStorage:(this.Ui=null,f===!1&&fe(Mt,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.$i().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new V(R.FAILED_PRECONDITION,ka);return this.Wi(),this.Qi(),this.Gi(),this.runTransaction("getHighestListenSequenceNumber","readonly",(e=>this.li.getHighestSequenceNumber(e)))})).then((e=>{this.ai=new Oe(e,this.Fi)})).then((()=>{this.ui=!0})).catch((e=>(this.qi&&this.qi.close(),Promise.reject(e))))}zi(e){return this.ki=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.qi.q((async t=>{t.newVersion===null&&await e()}))}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Ci.enqueueAndForget((async()=>{this.started&&await this.$i()})))}$i(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(e=>Si(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.ji(e).next((t=>{t||(this.isPrimary=!1,this.Ci.enqueueRetryable((()=>this.ki(!1))))}))})).next((()=>this.Hi(e))).next((t=>this.isPrimary&&!t?this.Ji(e).next((()=>!1)):!!t&&this.Zi(e).next((()=>!0)))))).catch((e=>{if(tn(e))return C(Mt,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return C(Mt,"Releasing owner lease after error during lease refresh",e),!1})).then((e=>{this.isPrimary!==e&&this.Ci.enqueueRetryable((()=>this.ki(e))),this.isPrimary=e}))}ji(e){return is(e).get(Gn).next((t=>v.resolve(this.Xi(t))))}Yi(e){return Si(e).delete(this.clientId)}async es(){if(this.isPrimary&&!this.ts(this.Li,Ca)){this.Li=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const n=Ie(t,gr);return n.H().next((s=>{const i=this.ns(s,Ca),o=s.filter((c=>i.indexOf(c)===-1));return v.forEach(o,(c=>n.delete(c.clientId))).next((()=>o))}))})).catch((()=>[]));if(this.Ui)for(const t of e)this.Ui.removeItem(this.rs(t.clientId))}}Gi(){this.Bi=this.Ci.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.$i().then((()=>this.es())).then((()=>this.Gi()))))}Xi(e){return!!e&&e.ownerId===this.clientId}Hi(e){return this.Mi?v.resolve(!0):is(e).get(Gn).next((t=>{if(t!==null&&this.ts(t.leaseTimestampMs,Va)&&!this.ss(t.ownerId)){if(this.Xi(t)&&this.networkEnabled)return!0;if(!this.Xi(t)){if(!t.allowTabSynchronization)throw new V(R.FAILED_PRECONDITION,ka);return!1}}return!(!this.networkEnabled||!this.inForeground)||Si(e).H().next((n=>this.ns(n,Va).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,c=this.networkEnabled===s.networkEnabled;if(i||o&&c)return!0}return!1}))===void 0))})).next((t=>(this.isPrimary!==t&&C(Mt,`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.ui=!1,this._s(),this.Bi&&(this.Bi.cancel(),this.Bi=null),this.us(),this.cs(),await this.qi.runTransaction("shutdown","readwrite",[Js,gr],(e=>{const t=new tc(e,Oe.ce);return this.Ji(t).next((()=>this.Yi(t)))})),this.qi.close(),this.ls()}ns(e,t){return e.filter((n=>this.ts(n.updateTimeMs,t)&&!this.ss(n.clientId)))}hs(){return this.runTransaction("getActiveClients","readonly",(e=>Si(e).H().next((t=>this.ns(t,Ca).map((n=>n.clientId))))))}get started(){return this.ui}getGlobalsCache(){return this.ci}getMutationQueue(e,t){return Oo.wt(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new sv(e,this.serializer.yt.databaseId)}getDocumentOverlayCache(e){return xo.wt(this.serializer,e)}getBundleCache(){return this.Pi}runTransaction(e,t,n){C(Mt,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=(function(u){return u===18?nw:u===17?Ap:u===16?tw:u===15?$c:u===14?vp:u===13?wp:u===12?ew:u===11?Tp:void M(60245)})(this.xi);let o;return this.qi.runTransaction(e,s,i,(c=>(o=new tc(c,this.ai?this.ai.next():Oe.ce),t==="readwrite-primary"?this.ji(o).next((u=>!!u||this.Hi(o))).next((u=>{if(!u)throw fe(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Ci.enqueueRetryable((()=>this.ki(!1))),new V(R.FAILED_PRECONDITION,hp);return n(o)})).next((u=>this.Zi(o).next((()=>u)))):this.Ps(o).next((()=>n(o)))))).then((c=>(o.raiseOnCommittedEvent(),c)))}Ps(e){return is(e).get(Gn).next((t=>{if(t!==null&&this.ts(t.leaseTimestampMs,Va)&&!this.ss(t.ownerId)&&!this.Xi(t)&&!(this.Mi||this.allowTabSynchronization&&t.allowTabSynchronization))throw new V(R.FAILED_PRECONDITION,ka)}))}Zi(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return is(e).put(Gn,t)}static v(){return Gt.v()}Ji(e){const t=is(e);return t.get(Gn).next((n=>this.Xi(n)?(C(Mt,"Releasing primary lease."),t.delete(Gn)):v.resolve()))}ts(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||(fe(`Detected an update time that is in the future: ${e} > ${n}`),!1))}Wi(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.Ni=()=>{this.Ci.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.$i())))},this.document.addEventListener("visibilitychange",this.Ni),this.inForeground=this.document.visibilityState==="visible")}us(){this.Ni&&(this.document.removeEventListener("visibilitychange",this.Ni),this.Ni=null)}Qi(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.Oi=()=>{this._s();const t=/(?:Version|Mobile)\/1[456]/;df()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.Ci.enterRestrictedMode(!0),this.Ci.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.Oi))}cs(){this.Oi&&(this.window.removeEventListener("pagehide",this.Oi),this.Oi=null)}ss(e){var t;try{const n=((t=this.Ui)==null?void 0:t.getItem(this.rs(e)))!==null;return C(Mt,`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return fe(Mt,"Failed to get zombied client id.",n),!1}}_s(){if(this.Ui)try{this.Ui.setItem(this.rs(this.clientId),String(Date.now()))}catch(e){fe("Failed to set zombie client id.",e)}}ls(){if(this.Ui)try{this.Ui.removeItem(this.rs(this.clientId))}catch{}}rs(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function is(r){return Ie(r,Js)}function Si(r){return Ie(r,gr)}function Om(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
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
 */class ou{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Ts=n,this.Is=s}static Es(e,t){let n=G(),s=G();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new ou(e,t.fromCache,n,s)}}/**
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
 */class wv{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
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
 */class Mm{constructor(){this.Rs=!1,this.As=!1,this.Vs=100,this.ds=(function(){return df()?8:fp(ye())>0?6:4})()}initialize(e,t){this.fs=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.gs(e,t).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.ps(e,t,s,n).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new wv;return this.ys(e,t,o).next((c=>{if(i.result=c,this.As)return this.ws(e,t,o,c.size)}))})).next((()=>i.result))}ws(e,t,n,s){return n.documentReadCount<this.Vs?(Xn()<=H.DEBUG&&C("QueryEngine","SDK will not create cache indexes for query:",Zn(t),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),v.resolve()):(Xn()<=H.DEBUG&&C("QueryEngine","Query:",Zn(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.ds*s?(Xn()<=H.DEBUG&&C("QueryEngine","The SDK decides to create cache indexes for query:",Zn(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,$e(t))):v.resolve())}gs(e,t){if(Hh(t))return v.resolve(null);let n=$e(t);return this.indexManager.getIndexType(e,n).next((s=>s===0?null:(t.limit!==null&&s===1&&(t=io(t,null,"F"),n=$e(t)),this.indexManager.getDocumentsMatchingTarget(e,n).next((i=>{const o=G(...i);return this.fs.getDocuments(e,o).next((c=>this.indexManager.getMinOffset(e,n).next((u=>{const h=this.bs(t,c);return this.Ss(t,h,o,u.readTime)?this.gs(e,io(t,null,"F")):this.Ds(e,h,t,u)}))))})))))}ps(e,t,n,s){return Hh(t)||s.isEqual(U.min())?v.resolve(null):this.fs.getDocuments(e,n).next((i=>{const o=this.bs(t,i);return this.Ss(t,o,n,s)?v.resolve(null):(Xn()<=H.DEBUG&&C("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Zn(t)),this.Ds(e,o,t,up(s,dr)).next((c=>c)))}))}bs(e,t){let n=new te(Kp(e));return t.forEach(((s,i)=>{Zs(e,i)&&(n=n.add(i))})),n}Ss(e,t,n,s){if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}ys(e,t,n){return Xn()<=H.DEBUG&&C("QueryEngine","Using full collection scan to execute query:",Zn(t)),this.fs.getDocumentsMatchingQuery(e,t,je.min(),n)}Ds(e,t,n,s){return this.fs.getDocumentsMatchingQuery(e,n,s).next((i=>(t.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
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
 */const au="LocalStore",vv=3e8;class Av{constructor(e,t,n,s){this.persistence=e,this.Cs=t,this.serializer=s,this.vs=new ie(j),this.Fs=new bt((i=>kn(i)),Ys),this.Ms=new Map,this.xs=e.getRemoteDocumentCache(),this.li=e.getTargetCache(),this.Pi=e.getBundleCache(),this.Os(n)}Os(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new xm(this.xs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.xs.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.vs)))}}function Lm(r,e,t,n){return new Av(r,e,t,n)}async function Fm(r,e){const t=L(r);return await t.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,t.Os(e),t.mutationQueue.getAllMutationBatches(n)))).next((i=>{const o=[],c=[];let u=G();for(const h of s){o.push(h.batchId);for(const f of h.mutations)u=u.add(f.key)}for(const h of i){c.push(h.batchId);for(const f of h.mutations)u=u.add(f.key)}return t.localDocuments.getDocuments(n,u).next((h=>({Ns:h,removedBatchIds:o,addedBatchIds:c})))}))}))}function bv(r,e){const t=L(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{const s=e.batch.keys(),i=t.xs.newChangeBuffer({trackRemovals:!0});return(function(c,u,h,f){const m=h.batch,g=m.keys();let S=v.resolve();return g.forEach((k=>{S=S.next((()=>f.getEntry(u,k))).next((D=>{const N=h.docVersions.get(k);F(N!==null,48541),D.version.compareTo(N)<0&&(m.applyToRemoteDocument(D,h),D.isValidDocument()&&(D.setReadTime(h.commitVersion),f.addEntry(D)))}))})),S.next((()=>c.mutationQueue.removeMutationBatch(u,m)))})(t,n,e,i).next((()=>i.apply(n))).next((()=>t.mutationQueue.performConsistencyCheck(n))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(c){let u=G();for(let h=0;h<c.mutationResults.length;++h)c.mutationResults[h].transformResults.length>0&&(u=u.add(c.batch.mutations[h].key));return u})(e)))).next((()=>t.localDocuments.getDocuments(n,s)))}))}function Um(r){const e=L(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.li.getLastRemoteSnapshotVersion(t)))}function Sv(r,e){const t=L(r),n=e.snapshotVersion;let s=t.vs;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=t.xs.newChangeBuffer({trackRemovals:!0});s=t.vs;const c=[];e.targetChanges.forEach(((f,m)=>{const g=s.get(m);if(!g)return;c.push(t.li.removeMatchingKeys(i,f.removedDocuments,m).next((()=>t.li.addMatchingKeys(i,f.addedDocuments,m))));let S=g.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(m)!==null?S=S.withResumeToken(pe.EMPTY_BYTE_STRING,U.min()).withLastLimboFreeSnapshotVersion(U.min()):f.resumeToken.approximateByteSize()>0&&(S=S.withResumeToken(f.resumeToken,n)),s=s.insert(m,S),(function(D,N,z){return D.resumeToken.approximateByteSize()===0||N.snapshotVersion.toMicroseconds()-D.snapshotVersion.toMicroseconds()>=vv?!0:z.addedDocuments.size+z.modifiedDocuments.size+z.removedDocuments.size>0})(g,S,f)&&c.push(t.li.updateTargetData(i,S))}));let u=qe(),h=G();if(e.documentUpdates.forEach((f=>{e.resolvedLimboDocuments.has(f)&&c.push(t.persistence.referenceDelegate.updateLimboDocument(i,f))})),c.push(Rv(i,o,e.documentUpdates).next((f=>{u=f.Bs,h=f.Ls}))),!n.isEqual(U.min())){const f=t.li.getLastRemoteSnapshotVersion(i).next((m=>t.li.setTargetsMetadata(i,i.currentSequenceNumber,n)));c.push(f)}return v.waitFor(c).next((()=>o.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,u,h))).next((()=>u))})).then((i=>(t.vs=s,i)))}function Rv(r,e,t){let n=G(),s=G();return t.forEach((i=>n=n.add(i))),e.getEntries(r,n).next((i=>{let o=qe();return t.forEach(((c,u)=>{const h=i.get(c);u.isFoundDocument()!==h.isFoundDocument()&&(s=s.add(c)),u.isNoDocument()&&u.version.isEqual(U.min())?(e.removeEntry(c,u.readTime),o=o.insert(c,u)):!h.isValidDocument()||u.version.compareTo(h.version)>0||u.version.compareTo(h.version)===0&&h.hasPendingWrites?(e.addEntry(u),o=o.insert(c,u)):C(au,"Ignoring outdated watch update for ",c,". Current version:",h.version," Watch version:",u.version)})),{Bs:o,Ls:s}}))}function Pv(r,e){const t=L(r);return t.persistence.runTransaction("Get next mutation batch","readonly",(n=>(e===void 0&&(e=wn),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e))))}function lo(r,e){const t=L(r);return t.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return t.li.getTargetData(n,e).next((i=>i?(s=i,v.resolve(s)):t.li.allocateTargetId(n).next((o=>(s=new pt(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.li.addTargetData(n,s).next((()=>s)))))))})).then((n=>{const s=t.vs.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.vs=t.vs.insert(n.targetId,n),t.Fs.set(e,n.targetId)),n}))}async function Ar(r,e,t){const n=L(r),s=n.vs.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,(o=>n.persistence.referenceDelegate.removeTarget(o,s)))}catch(o){if(!tn(o))throw o;C(au,`Failed to update sequence numbers for target ${e}: ${o}`)}n.vs=n.vs.remove(e),n.Fs.delete(s.target)}function mc(r,e,t){const n=L(r);let s=U.min(),i=G();return n.persistence.runTransaction("Execute query","readwrite",(o=>(function(u,h,f){const m=L(u),g=m.Fs.get(f);return g!==void 0?v.resolve(m.vs.get(g)):m.li.getTargetData(h,f)})(n,o,$e(e)).next((c=>{if(c)return s=c.lastLimboFreeSnapshotVersion,n.li.getMatchingKeysForTargetId(o,c.targetId).next((u=>{i=u}))})).next((()=>n.Cs.getDocumentsMatchingQuery(o,e,t?s:U.min(),t?i:G()))).next((c=>($m(n,zp(e),c),{documents:c,ks:i})))))}function Bm(r,e){const t=L(r),n=L(t.li),s=t.vs.get(e);return s?Promise.resolve(s.target):t.persistence.runTransaction("Get target data","readonly",(i=>n.At(i,e).next((o=>o?o.target:null))))}function qm(r,e){const t=L(r),n=t.Ms.get(e)||U.min();return t.persistence.runTransaction("Get new document changes","readonly",(s=>t.xs.getAllFromCollectionGroup(s,e,up(n,dr),Number.MAX_SAFE_INTEGER))).then((s=>($m(t,e,s),s)))}function $m(r,e,t){let n=r.Ms.get(e)||U.min();t.forEach(((s,i)=>{i.readTime.compareTo(n)>0&&(n=i.readTime)})),r.Ms.set(e,n)}/**
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
 */const jm="firestore_clients";function Ad(r,e){return`${jm}_${r}_${e}`}const zm="firestore_mutations";function bd(r,e,t){let n=`${zm}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const Km="firestore_targets";function Da(r,e){return`${Km}_${r}_${e}`}/**
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
 */const nt="SharedClientState";class ho{constructor(e,t,n,s){this.user=e,this.batchId=t,this.state=n,this.error=s}static $s(e,t,n){const s=JSON.parse(n);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new V(s.error.code,s.error.message))),o?new ho(e,t,s.state,i):(fe(nt,`Failed to parse mutation state for ID '${t}': ${n}`),null)}Ws(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class ws{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static $s(e,t){const n=JSON.parse(t);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new V(n.error.code,n.error.message))),i?new ws(e,n.state,s):(fe(nt,`Failed to parse target state for ID '${e}': ${t}`),null)}Ws(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class fo{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static $s(e,t){const n=JSON.parse(t);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=Hc();for(let o=0;s&&o<n.activeTargetIds.length;++o)s=pp(n.activeTargetIds[o]),i=i.add(n.activeTargetIds[o]);return s?new fo(e,i):(fe(nt,`Failed to parse client data for instance '${e}': ${t}`),null)}}class cu{constructor(e,t){this.clientId=e,this.onlineState=t}static $s(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new cu(t.clientId,t.onlineState):(fe(nt,`Failed to parse online state: ${e}`),null)}}class gc{constructor(){this.activeTargetIds=Hc()}Qs(e){this.activeTargetIds=this.activeTargetIds.add(e)}Gs(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Ws(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class Na{constructor(e,t,n,s,i){this.window=e,this.Ci=t,this.persistenceKey=n,this.zs=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.js=this.Hs.bind(this),this.Js=new ie(j),this.started=!1,this.Zs=[];const o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.Xs=Ad(this.persistenceKey,this.zs),this.Ys=(function(u){return`firestore_sequence_number_${u}`})(this.persistenceKey),this.Js=this.Js.insert(this.zs,new gc),this.eo=new RegExp(`^${jm}_${o}_([^_]*)$`),this.no=new RegExp(`^${zm}_${o}_(\\d+)(?:_(.*))?$`),this.ro=new RegExp(`^${Km}_${o}_(\\d+)$`),this.io=(function(u){return`firestore_online_state_${u}`})(this.persistenceKey),this.so=(function(u){return`firestore_bundle_loaded_v2_${u}`})(this.persistenceKey),this.window.addEventListener("storage",this.js)}static v(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.hs();for(const n of e){if(n===this.zs)continue;const s=this.getItem(Ad(this.persistenceKey,n));if(s){const i=fo.$s(n,s);i&&(this.Js=this.Js.insert(i.clientId,i))}}this.oo();const t=this.storage.getItem(this.io);if(t){const n=this._o(t);n&&this.ao(n)}for(const n of this.Zs)this.Hs(n);this.Zs=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(e){this.setItem(this.Ys,JSON.stringify(e))}getAllActiveQueryTargets(){return this.uo(this.Js)}isActiveQueryTarget(e){let t=!1;return this.Js.forEach(((n,s)=>{s.activeTargetIds.has(e)&&(t=!0)})),t}addPendingMutation(e){this.co(e,"pending")}updateMutationState(e,t,n){this.co(e,t,n),this.lo(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(Da(this.persistenceKey,e));if(s){const i=ws.$s(e,s);i&&(n=i.state)}}return t&&this.ho.Qs(e),this.oo(),n}removeLocalQueryTarget(e){this.ho.Gs(e),this.oo()}isLocalQueryTarget(e){return this.ho.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(Da(this.persistenceKey,e))}updateQueryState(e,t,n){this.Po(e,t,n)}handleUserChange(e,t,n){t.forEach((s=>{this.lo(s)})),this.currentUser=e,n.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(e){this.To(e)}notifyBundleLoaded(e){this.Io(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.js),this.removeItem(this.Xs),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return C(nt,"READ",e,t),t}setItem(e,t){C(nt,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){C(nt,"REMOVE",e),this.storage.removeItem(e)}Hs(e){const t=e;if(t.storageArea===this.storage){if(C(nt,"EVENT",t.key,t.newValue),t.key===this.Xs)return void fe("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Ci.enqueueRetryable((async()=>{if(this.started){if(t.key!==null){if(this.eo.test(t.key)){if(t.newValue==null){const n=this.Eo(t.key);return this.Ro(n,null)}{const n=this.Ao(t.key,t.newValue);if(n)return this.Ro(n.clientId,n)}}else if(this.no.test(t.key)){if(t.newValue!==null){const n=this.Vo(t.key,t.newValue);if(n)return this.mo(n)}}else if(this.ro.test(t.key)){if(t.newValue!==null){const n=this.fo(t.key,t.newValue);if(n)return this.po(n)}}else if(t.key===this.io){if(t.newValue!==null){const n=this._o(t.newValue);if(n)return this.ao(n)}}else if(t.key===this.Ys){const n=(function(i){let o=Oe.ce;if(i!=null)try{const c=JSON.parse(i);F(typeof c=="number",30636,{yo:i}),o=c}catch(c){fe(nt,"Failed to read sequence number from WebStorage",c)}return o})(t.newValue);n!==Oe.ce&&this.sequenceNumberHandler(n)}else if(t.key===this.so){const n=this.wo(t.newValue);await Promise.all(n.map((s=>this.syncEngine.bo(s))))}}}else this.Zs.push(t)}))}}get ho(){return this.Js.get(this.zs)}oo(){this.setItem(this.Xs,this.ho.Ws())}co(e,t,n){const s=new ho(this.currentUser,e,t,n),i=bd(this.persistenceKey,this.currentUser,e);this.setItem(i,s.Ws())}lo(e){const t=bd(this.persistenceKey,this.currentUser,e);this.removeItem(t)}To(e){const t={clientId:this.zs,onlineState:e};this.storage.setItem(this.io,JSON.stringify(t))}Po(e,t,n){const s=Da(this.persistenceKey,e),i=new ws(e,t,n);this.setItem(s,i.Ws())}Io(e){const t=JSON.stringify(Array.from(e));this.setItem(this.so,t)}Eo(e){const t=this.eo.exec(e);return t?t[1]:null}Ao(e,t){const n=this.Eo(e);return fo.$s(n,t)}Vo(e,t){const n=this.no.exec(e),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return ho.$s(new Re(i),s,t)}fo(e,t){const n=this.ro.exec(e),s=Number(n[1]);return ws.$s(s,t)}_o(e){return cu.$s(e)}wo(e){return JSON.parse(e)}async mo(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.So(e.batchId,e.state,e.error);C(nt,`Ignoring mutation for non-active user ${e.user.uid}`)}po(e){return this.syncEngine.Do(e.targetId,e.state,e.error)}Ro(e,t){const n=t?this.Js.insert(e,t):this.Js.remove(e),s=this.uo(this.Js),i=this.uo(n),o=[],c=[];return i.forEach((u=>{s.has(u)||o.push(u)})),s.forEach((u=>{i.has(u)||c.push(u)})),this.syncEngine.Co(o,c).then((()=>{this.Js=n}))}ao(e){this.Js.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}uo(e){let t=Hc();return e.forEach(((n,s)=>{t=t.unionWith(s.activeTargetIds)})),t}}class Gm{constructor(){this.vo=new gc,this.Fo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.vo.Qs(e),this.Fo[e]||"not-current"}updateQueryState(e,t,n){this.Fo[e]=t}removeLocalQueryTarget(e){this.vo.Gs(e)}isLocalQueryTarget(e){return this.vo.activeTargetIds.has(e)}clearQueryState(e){delete this.Fo[e]}getAllActiveQueryTargets(){return this.vo.activeTargetIds}isActiveQueryTarget(e){return this.vo.activeTargetIds.has(e)}start(){return this.vo=new gc,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
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
 */class Cv{Mo(e){}shutdown(){}}/**
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
 */const Sd="ConnectivityMonitor";class Rd{constructor(){this.xo=()=>this.Oo(),this.No=()=>this.Bo(),this.Lo=[],this.ko()}Mo(e){this.Lo.push(e)}shutdown(){window.removeEventListener("online",this.xo),window.removeEventListener("offline",this.No)}ko(){window.addEventListener("online",this.xo),window.addEventListener("offline",this.No)}Oo(){C(Sd,"Network connectivity changed: AVAILABLE");for(const e of this.Lo)e(0)}Bo(){C(Sd,"Network connectivity changed: UNAVAILABLE");for(const e of this.Lo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let Ri=null;function _c(){return Ri===null?Ri=(function(){return 268435456+Math.round(2147483648*Math.random())})():Ri++,"0x"+Ri.toString(16)}/**
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
 */const xa="RestConnection",Vv={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class kv{get Ko(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.qo=t+"://"+e.host,this.Uo=`projects/${n}/databases/${s}`,this.$o=this.databaseId.database===no?`project_id=${n}`:`project_id=${n}&database_id=${s}`}Wo(e,t,n,s,i){const o=_c(),c=this.Qo(e,t.toUriEncodedString());C(xa,`Sending RPC '${e}' ${o}:`,c,n);const u={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.$o};this.Go(u,s,i);const{host:h}=new URL(c),f=Pr(h);return this.zo(e,c,u,n,f).then((m=>(C(xa,`Received RPC '${e}' ${o}: `,m),m)),(m=>{throw lr(xa,`RPC '${e}' ${o} failed with error: `,m,"url: ",c,"request:",n),m}))}jo(e,t,n,s,i,o){return this.Wo(e,t,n,s,i)}Go(e,t,n){e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Dr})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),n&&n.headers.forEach(((s,i)=>e[i]=s))}Qo(e,t){const n=Vv[e];let s=`${this.qo}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
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
 */class Dv{constructor(e){this.Ho=e.Ho,this.Jo=e.Jo}Zo(e){this.Xo=e}Yo(e){this.e_=e}t_(e){this.n_=e}onMessage(e){this.r_=e}close(){this.Jo()}send(e){this.Ho(e)}i_(){this.Xo()}s_(){this.e_()}o_(e){this.n_(e)}__(e){this.r_(e)}}/**
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
 */const Se="WebChannelConnection",os=(r,e,t)=>{r.listen(e,(n=>{try{t(n)}catch(s){setTimeout((()=>{throw s}),0)}}))};class cr extends kv{constructor(e){super(e),this.a_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static u_(){if(!cr.c_){const e=rp();os(e,np.STAT_EVENT,(t=>{t.stat===Qa.PROXY?C(Se,"STAT_EVENT: detected buffering proxy"):t.stat===Qa.NOPROXY&&C(Se,"STAT_EVENT: detected no buffering proxy")})),cr.c_=!0}}zo(e,t,n,s,i){const o=_c();return new Promise(((c,u)=>{const h=new ep;h.setWithCredentials(!0),h.listenOnce(tp.COMPLETE,(()=>{try{switch(h.getLastErrorCode()){case Di.NO_ERROR:const m=h.getResponseJson();C(Se,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(m)),c(m);break;case Di.TIMEOUT:C(Se,`RPC '${e}' ${o} timed out`),u(new V(R.DEADLINE_EXCEEDED,"Request time out"));break;case Di.HTTP_ERROR:const g=h.getStatus();if(C(Se,`RPC '${e}' ${o} failed with status:`,g,"response text:",h.getResponseText()),g>0){let S=h.getResponseJson();Array.isArray(S)&&(S=S[0]);const k=S==null?void 0:S.error;if(k&&k.status&&k.message){const D=(function(z){const B=z.toLowerCase().replace(/_/g,"-");return Object.values(R).indexOf(B)>=0?B:R.UNKNOWN})(k.status);u(new V(D,k.message))}else u(new V(R.UNKNOWN,"Server responded with status "+h.getStatus()))}else u(new V(R.UNAVAILABLE,"Connection failed."));break;default:M(9055,{l_:e,streamId:o,h_:h.getLastErrorCode(),P_:h.getLastError()})}}finally{C(Se,`RPC '${e}' ${o} completed.`)}}));const f=JSON.stringify(s);C(Se,`RPC '${e}' ${o} sending request:`,s),h.send(t,"POST",f,n,15)}))}T_(e,t,n){const s=_c(),i=[this.qo,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),c={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(c.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(c.useFetchStreams=!0),this.Go(c.initMessageHeaders,t,n),c.encodeInitMessageHeaders=!0;const h=i.join("");C(Se,`Creating RPC '${e}' stream ${s}: ${h}`,c);const f=o.createWebChannel(h,c);this.I_(f);let m=!1,g=!1;const S=new Dv({Ho:k=>{g?C(Se,`Not sending because RPC '${e}' stream ${s} is closed:`,k):(m||(C(Se,`Opening RPC '${e}' stream ${s} transport.`),f.open(),m=!0),C(Se,`RPC '${e}' stream ${s} sending:`,k),f.send(k))},Jo:()=>f.close()});return os(f,us.EventType.OPEN,(()=>{g||(C(Se,`RPC '${e}' stream ${s} transport opened.`),S.i_())})),os(f,us.EventType.CLOSE,(()=>{g||(g=!0,C(Se,`RPC '${e}' stream ${s} transport closed`),S.o_(),this.E_(f))})),os(f,us.EventType.ERROR,(k=>{g||(g=!0,lr(Se,`RPC '${e}' stream ${s} transport errored. Name:`,k.name,"Message:",k.message),S.o_(new V(R.UNAVAILABLE,"The operation could not be completed")))})),os(f,us.EventType.MESSAGE,(k=>{var D;if(!g){const N=k.data[0];F(!!N,16349);const z=N,B=(z==null?void 0:z.error)||((D=z[0])==null?void 0:D.error);if(B){C(Se,`RPC '${e}' stream ${s} received error:`,B);const q=B.status;let ne=(function(E){const _=me[E];if(_!==void 0)return im(_)})(q),Y=B.message;q==="NOT_FOUND"&&Y.includes("database")&&Y.includes("does not exist")&&Y.includes(this.databaseId.database)&&lr(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),ne===void 0&&(ne=R.INTERNAL,Y="Unknown error status: "+q+" with message "+B.message),g=!0,S.o_(new V(ne,Y)),f.close()}else C(Se,`RPC '${e}' stream ${s} received:`,N),S.__(N)}})),cr.u_(),setTimeout((()=>{S.s_()}),0),S}terminate(){this.a_.forEach((e=>e.close())),this.a_=[]}I_(e){this.a_.push(e)}E_(e){this.a_=this.a_.filter((t=>t===e))}Go(e,t,n){super.Go(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return sp()}}/**
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
 */function Nv(r){return new cr(r)}/**
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
 */function Hm(){return typeof window<"u"?window:null}function $i(){return typeof document<"u"?document:null}/**
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
 */function Lo(r){return new Fw(r,!0)}/**
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
 */cr.c_=!1;class uu{constructor(e,t,n=1e3,s=1.5,i=6e4){this.Ci=e,this.timerId=t,this.R_=n,this.A_=s,this.V_=i,this.d_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.d_=0}g_(){this.d_=this.V_}p_(e){this.cancel();const t=Math.floor(this.d_+this.y_()),n=Math.max(0,Date.now()-this.f_),s=Math.max(0,t-n);s>0&&C("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.d_} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.m_=this.Ci.enqueueAfterDelay(this.timerId,s,(()=>(this.f_=Date.now(),e()))),this.d_*=this.A_,this.d_<this.R_&&(this.d_=this.R_),this.d_>this.V_&&(this.d_=this.V_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.d_}}/**
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
 */const Pd="PersistentStream";class Wm{constructor(e,t,n,s,i,o,c,u){this.Ci=e,this.b_=n,this.S_=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=c,this.listener=u,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new uu(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Ci.enqueueAfterDelay(this.b_,6e4,(()=>this.k_())))}K_(e){this.q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===R.RESOURCE_EXHAUSTED?(fe(t.toString()),fe("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===R.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.W_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.t_(t)}W_(){}auth(){this.state=1;const e=this.Q_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.D_===t&&this.G_(n,s)}),(n=>{e((()=>{const s=new V(R.UNKNOWN,"Fetching auth token failed: "+n.message);return this.z_(s)}))}))}G_(e,t){const n=this.Q_(this.D_);this.stream=this.j_(e,t),this.stream.Zo((()=>{n((()=>this.listener.Zo()))})),this.stream.Yo((()=>{n((()=>(this.state=2,this.v_=this.Ci.enqueueAfterDelay(this.S_,1e4,(()=>(this.O_()&&(this.state=3),Promise.resolve()))),this.listener.Yo())))})),this.stream.t_((s=>{n((()=>this.z_(s)))})),this.stream.onMessage((s=>{n((()=>++this.F_==1?this.H_(s):this.onNext(s)))}))}N_(){this.state=5,this.M_.p_((async()=>{this.state=0,this.start()}))}z_(e){return C(Pd,`close with error: ${e}`),this.stream=null,this.close(4,e)}Q_(e){return t=>{this.Ci.enqueueAndForget((()=>this.D_===e?t():(C(Pd,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class xv extends Wm{constructor(e,t,n,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}H_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=$w(this.serializer,e),n=(function(i){if(!("targetChange"in i))return U.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?U.min():o.readTime?we(o.readTime):U.min()})(e);return this.listener.J_(t,n)}Z_(e){const t={};t.database=lc(this.serializer),t.addTarget=(function(i,o){let c;const u=o.target;if(c=ro(u)?{documents:fm(i,u)}:{query:pm(i,u).ft},c.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){c.resumeToken=cm(i,o.resumeToken);const h=cc(i,o.expectedCount);h!==null&&(c.expectedCount=h)}else if(o.snapshotVersion.compareTo(U.min())>0){c.readTime=vr(i,o.snapshotVersion.toTimestamp());const h=cc(i,o.expectedCount);h!==null&&(c.expectedCount=h)}return c})(this.serializer,e);const n=zw(this.serializer,e);n&&(t.labels=n),this.K_(t)}X_(e){const t={};t.database=lc(this.serializer),t.removeTarget=e,this.K_(t)}}class Ov extends Wm{constructor(e,t,n,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}get Y_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}W_(){this.Y_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}H_(e){return F(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,F(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){F(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=jw(e.writeResults,e.commitTime),n=we(e.commitTime);return this.listener.na(n,t)}ra(){const e={};e.database=lc(this.serializer),this.K_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map((n=>Ls(this.serializer,n)))};this.K_(t)}}/**
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
 */class Mv{}class Lv extends Mv{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new V(R.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(e,t,n,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.Wo(e,uc(t,n),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===R.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new V(R.UNKNOWN,i.toString())}))}jo(e,t,n,s,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,c])=>this.connection.jo(e,uc(t,n),s,o,c,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===R.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new V(R.UNKNOWN,o.toString())}))}terminate(){this.ia=!0,this.connection.terminate()}}function Fv(r,e,t,n){return new Lv(r,e,t,n)}class Uv{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve()))))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(fe(t),this.aa=!1):C("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
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
 */const On="RemoteStore";class Bv{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.Ra=[],this.Aa=i,this.Aa.Mo((o=>{n.enqueueAndForget((async()=>{qn(this)&&(C(On,"Restarting streams for network reachability change."),await(async function(u){const h=L(u);h.Ea.add(4),await ni(h),h.Va.set("Unknown"),h.Ea.delete(4),await Fo(h)})(this))}))})),this.Va=new Uv(n,s)}}async function Fo(r){if(qn(r))for(const e of r.Ra)await e(!0)}async function ni(r){for(const e of r.Ra)await e(!1)}function Uo(r,e){const t=L(r);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),du(t)?hu(t):Mr(t).O_()&&lu(t,e))}function br(r,e){const t=L(r),n=Mr(t);t.Ia.delete(e),n.O_()&&Qm(t,e),t.Ia.size===0&&(n.O_()?n.L_():qn(t)&&t.Va.set("Unknown"))}function lu(r,e){if(r.da.$e(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(U.min())>0){const t=r.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}Mr(r).Z_(e)}function Qm(r,e){r.da.$e(e),Mr(r).X_(e)}function hu(r){r.da=new xw({getRemoteKeysForTarget:e=>r.remoteSyncer.getRemoteKeysForTarget(e),At:e=>r.Ia.get(e)||null,ht:()=>r.datastore.serializer.databaseId}),Mr(r).start(),r.Va.ua()}function du(r){return qn(r)&&!Mr(r).x_()&&r.Ia.size>0}function qn(r){return L(r).Ea.size===0}function Jm(r){r.da=void 0}async function qv(r){r.Va.set("Online")}async function $v(r){r.Ia.forEach(((e,t)=>{lu(r,e)}))}async function jv(r,e){Jm(r),du(r)?(r.Va.ha(e),hu(r)):r.Va.set("Unknown")}async function zv(r,e,t){if(r.Va.set("Online"),e instanceof am&&e.state===2&&e.cause)try{await(async function(s,i){const o=i.cause;for(const c of i.targetIds)s.Ia.has(c)&&(await s.remoteSyncer.rejectListen(c,o),s.Ia.delete(c),s.da.removeTarget(c))})(r,e)}catch(n){C(On,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await po(r,n)}else if(e instanceof Bi?r.da.Xe(e):e instanceof om?r.da.st(e):r.da.tt(e),!t.isEqual(U.min()))try{const n=await Um(r.localStore);t.compareTo(n)>=0&&await(function(i,o){const c=i.da.Tt(o);return c.targetChanges.forEach(((u,h)=>{if(u.resumeToken.approximateByteSize()>0){const f=i.Ia.get(h);f&&i.Ia.set(h,f.withResumeToken(u.resumeToken,o))}})),c.targetMismatches.forEach(((u,h)=>{const f=i.Ia.get(u);if(!f)return;i.Ia.set(u,f.withResumeToken(pe.EMPTY_BYTE_STRING,f.snapshotVersion)),Qm(i,u);const m=new pt(f.target,u,h,f.sequenceNumber);lu(i,m)})),i.remoteSyncer.applyRemoteEvent(c)})(r,t)}catch(n){C(On,"Failed to raise snapshot:",n),await po(r,n)}}async function po(r,e,t){if(!tn(e))throw e;r.Ea.add(1),await ni(r),r.Va.set("Offline"),t||(t=()=>Um(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{C(On,"Retrying IndexedDB access"),await t(),r.Ea.delete(1),await Fo(r)}))}function Ym(r,e){return e().catch((t=>po(r,t,e)))}async function Or(r){const e=L(r),t=Xt(e);let n=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:wn;for(;Kv(e);)try{const s=await Pv(e.localStore,n);if(s===null){e.Ta.length===0&&t.L_();break}n=s.batchId,Gv(e,s)}catch(s){await po(e,s)}Xm(e)&&Zm(e)}function Kv(r){return qn(r)&&r.Ta.length<10}function Gv(r,e){r.Ta.push(e);const t=Xt(r);t.O_()&&t.Y_&&t.ea(e.mutations)}function Xm(r){return qn(r)&&!Xt(r).x_()&&r.Ta.length>0}function Zm(r){Xt(r).start()}async function Hv(r){Xt(r).ra()}async function Wv(r){const e=Xt(r);for(const t of r.Ta)e.ea(t.mutations)}async function Qv(r,e,t){const n=r.Ta.shift(),s=Yc.from(n,e,t);await Ym(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await Or(r)}async function Jv(r,e){e&&Xt(r).Y_&&await(async function(n,s){if((function(o){return sm(o)&&o!==R.ABORTED})(s.code)){const i=n.Ta.shift();Xt(n).B_(),await Ym(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await Or(n)}})(r,e),Xm(r)&&Zm(r)}async function Cd(r,e){const t=L(r);t.asyncQueue.verifyOperationInProgress(),C(On,"RemoteStore received new credentials");const n=qn(t);t.Ea.add(3),await ni(t),n&&t.Va.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Fo(t)}async function yc(r,e){const t=L(r);e?(t.Ea.delete(2),await Fo(t)):e||(t.Ea.add(2),await ni(t),t.Va.set("Unknown"))}function Mr(r){return r.ma||(r.ma=(function(t,n,s){const i=L(t);return i.sa(),new xv(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Zo:qv.bind(null,r),Yo:$v.bind(null,r),t_:jv.bind(null,r),J_:zv.bind(null,r)}),r.Ra.push((async e=>{e?(r.ma.B_(),du(r)?hu(r):r.Va.set("Unknown")):(await r.ma.stop(),Jm(r))}))),r.ma}function Xt(r){return r.fa||(r.fa=(function(t,n,s){const i=L(t);return i.sa(),new Ov(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Zo:()=>Promise.resolve(),Yo:Hv.bind(null,r),t_:Jv.bind(null,r),ta:Wv.bind(null,r),na:Qv.bind(null,r)}),r.Ra.push((async e=>{e?(r.fa.B_(),await Or(r)):(await r.fa.stop(),r.Ta.length>0&&(C(On,`Stopping write stream with ${r.Ta.length} pending writes`),r.Ta=[]))}))),r.fa}/**
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
 */class fu{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Qe,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const o=Date.now()+n,c=new fu(e,t,o,s,i);return c.start(n),c}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new V(R.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function pu(r,e){if(fe("AsyncQueue",`${e}: ${r}`),tn(r))return new V(R.UNAVAILABLE,`${e}: ${r}`);throw r}/**
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
 */class ur{static emptySet(e){return new ur(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||O.comparator(t.key,n.key):(t,n)=>O.comparator(t.key,n.key),this.keyedMap=ls(),this.sortedSet=new ie(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,n)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof ur)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new ur;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
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
 */class Vd{constructor(){this.ga=new ie(O.comparator)}track(e){const t=e.doc.key,n=this.ga.get(t);n?e.type!==0&&n.type===3?this.ga=this.ga.insert(t,e):e.type===3&&n.type!==1?this.ga=this.ga.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.ga=this.ga.remove(t):e.type===1&&n.type===2?this.ga=this.ga.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):M(63341,{Vt:e,pa:n}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal(((t,n)=>{e.push(n)})),e}}class Sr{constructor(e,t,n,s,i,o,c,u,h){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=c,this.excludesMetadataChanges=u,this.hasCachedResults=h}static fromInitialDocuments(e,t,n,s,i){const o=[];return t.forEach((c=>{o.push({type:0,doc:c})})),new Sr(e,t,ur.emptySet(t),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&ko(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
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
 */class Yv{constructor(){this.wa=void 0,this.ba=[]}Sa(){return this.ba.some((e=>e.Da()))}}class Xv{constructor(){this.queries=kd(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,n){const s=L(t),i=s.queries;s.queries=kd(),i.forEach(((o,c)=>{for(const u of c.ba)u.onError(n)}))})(this,new V(R.ABORTED,"Firestore shutting down"))}}function kd(){return new bt((r=>jp(r)),ko)}async function mu(r,e){const t=L(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.Sa()&&e.Da()&&(n=2):(i=new Yv,n=e.Da()?0:1);try{switch(n){case 0:i.wa=await t.onListen(s,!0);break;case 1:i.wa=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const c=pu(o,`Initialization of query '${Zn(e.query)}' failed`);return void e.onError(c)}t.queries.set(s,i),i.ba.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&_u(t)}async function gu(r,e){const t=L(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const o=i.ba.indexOf(e);o>=0&&(i.ba.splice(o,1),i.ba.length===0?s=e.Da()?0:1:!i.Sa()&&e.Da()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function Zv(r,e){const t=L(r);let n=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const c of o.ba)c.Fa(s)&&(n=!0);o.wa=s}}n&&_u(t)}function eA(r,e,t){const n=L(r),s=n.queries.get(e);if(s)for(const i of s.ba)i.onError(t);n.queries.delete(e)}function _u(r){r.Ca.forEach((e=>{e.next()}))}var Ic,Dd;(Dd=Ic||(Ic={})).Ma="default",Dd.Cache="cache";class yu{constructor(e,t,n){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new Sr(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const n=t!=="Offline";return(!this.options.Ka||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Sr.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==Ic.Cache}}/**
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
 */class eg{constructor(e){this.key=e}}class tg{constructor(e){this.key=e}}class tA{constructor(e,t){this.query=e,this.Za=t,this.Xa=null,this.hasCachedResults=!1,this.current=!1,this.Ya=G(),this.mutatedKeys=G(),this.eu=Kp(e),this.tu=new ur(this.eu)}get nu(){return this.Za}ru(e,t){const n=t?t.iu:new Vd,s=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,c=!1;const u=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,h=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(e.inorderTraversal(((f,m)=>{const g=s.get(f),S=Zs(this.query,m)?m:null,k=!!g&&this.mutatedKeys.has(g.key),D=!!S&&(S.hasLocalMutations||this.mutatedKeys.has(S.key)&&S.hasCommittedMutations);let N=!1;g&&S?g.data.isEqual(S.data)?k!==D&&(n.track({type:3,doc:S}),N=!0):this.su(g,S)||(n.track({type:2,doc:S}),N=!0,(u&&this.eu(S,u)>0||h&&this.eu(S,h)<0)&&(c=!0)):!g&&S?(n.track({type:0,doc:S}),N=!0):g&&!S&&(n.track({type:1,doc:g}),N=!0,(u||h)&&(c=!0)),N&&(S?(o=o.add(S),i=D?i.add(f):i.delete(f)):(o=o.delete(f),i=i.delete(f)))})),this.query.limit!==null)for(;o.size>this.query.limit;){const f=this.query.limitType==="F"?o.last():o.first();o=o.delete(f.key),i=i.delete(f.key),n.track({type:1,doc:f})}return{tu:o,iu:n,Ss:c,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort(((f,m)=>(function(S,k){const D=N=>{switch(N){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return M(20277,{Vt:N})}};return D(S)-D(k)})(f.type,m.type)||this.eu(f.doc,m.doc))),this.ou(n),s=s??!1;const c=t&&!s?this._u():[],u=this.Ya.size===0&&this.current&&!s?1:0,h=u!==this.Xa;return this.Xa=u,o.length!==0||h?{snapshot:new Sr(this.query,e.tu,i,o,e.mutatedKeys,u===0,h,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:c}:{au:c}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Vd,mutatedKeys:this.mutatedKeys,Ss:!1},!1)):{au:[]}}uu(e){return!this.Za.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach((t=>this.Za=this.Za.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.Za=this.Za.delete(t))),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Ya;this.Ya=G(),this.tu.forEach((n=>{this.uu(n.key)&&(this.Ya=this.Ya.add(n.key))}));const t=[];return e.forEach((n=>{this.Ya.has(n)||t.push(new tg(n))})),this.Ya.forEach((n=>{e.has(n)||t.push(new eg(n))})),t}cu(e){this.Za=e.ks,this.Ya=G();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Sr.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Xa===0,this.hasCachedResults)}}const Lr="SyncEngine";class nA{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class rA{constructor(e){this.key=e,this.hu=!1}}class sA{constructor(e,t,n,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new bt((c=>jp(c)),ko),this.Iu=new Map,this.Eu=new Set,this.Ru=new ie(O.comparator),this.Au=new Map,this.Vu=new ru,this.du={},this.mu=new Map,this.fu=xn.ar(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function iA(r,e,t=!0){const n=Bo(r);let s;const i=n.Tu.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=await ng(n,e,t,!0),s}async function oA(r,e){const t=Bo(r);await ng(t,e,!0,!1)}async function ng(r,e,t,n){const s=await lo(r.localStore,$e(e)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,t);let c;return n&&(c=await Iu(r,e,i,o==="current",s.resumeToken)),r.isPrimaryClient&&t&&Uo(r.remoteStore,s),c}async function Iu(r,e,t,n,s){r.pu=(m,g,S)=>(async function(D,N,z,B){let q=N.view.ru(z);q.Ss&&(q=await mc(D.localStore,N.query,!1).then((({documents:E})=>N.view.ru(E,q))));const ne=B&&B.targetChanges.get(N.targetId),Y=B&&B.targetMismatches.get(N.targetId)!=null,X=N.view.applyChanges(q,D.isPrimaryClient,ne,Y);return Ec(D,N.targetId,X.au),X.snapshot})(r,m,g,S);const i=await mc(r.localStore,e,!0),o=new tA(e,i.ks),c=o.ru(i.documents),u=ti.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),h=o.applyChanges(c,r.isPrimaryClient,u);Ec(r,t,h.au);const f=new nA(e,t,o);return r.Tu.set(e,f),r.Iu.has(t)?r.Iu.get(t).push(e):r.Iu.set(t,[e]),h.snapshot}async function aA(r,e,t){const n=L(r),s=n.Tu.get(e),i=n.Iu.get(s.targetId);if(i.length>1)return n.Iu.set(s.targetId,i.filter((o=>!ko(o,e)))),void n.Tu.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await Ar(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),t&&br(n.remoteStore,s.targetId),Rr(n,s.targetId)})).catch(en)):(Rr(n,s.targetId),await Ar(n.localStore,s.targetId,!0))}async function cA(r,e){const t=L(r),n=t.Tu.get(e),s=t.Iu.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),br(t.remoteStore,n.targetId))}async function uA(r,e,t){const n=vu(r);try{const s=await(function(o,c){const u=L(o),h=Z.now(),f=c.reduce(((S,k)=>S.add(k.key)),G());let m,g;return u.persistence.runTransaction("Locally write mutations","readwrite",(S=>{let k=qe(),D=G();return u.xs.getEntries(S,f).next((N=>{k=N,k.forEach(((z,B)=>{B.isValidDocument()||(D=D.add(z))}))})).next((()=>u.localDocuments.getOverlayedDocuments(S,k))).next((N=>{m=N;const z=[];for(const B of c){const q=Vw(B,m.get(B.key).overlayedDocument);q!=null&&z.push(new St(B.key,q,xp(q.value.mapValue),he.exists(!0)))}return u.mutationQueue.addMutationBatch(S,h,z,c)})).next((N=>{g=N;const z=N.applyToLocalDocumentSet(m,D);return u.documentOverlayCache.saveOverlays(S,N.batchId,z)}))})).then((()=>({batchId:g.batchId,changes:Hp(m)})))})(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),(function(o,c,u){let h=o.du[o.currentUser.toKey()];h||(h=new ie(j)),h=h.insert(c,u),o.du[o.currentUser.toKey()]=h})(n,s.batchId,t),await rn(n,s.changes),await Or(n.remoteStore)}catch(s){const i=pu(s,"Failed to persist write");t.reject(i)}}async function rg(r,e){const t=L(r);try{const n=await Sv(t.localStore,e);e.targetChanges.forEach(((s,i)=>{const o=t.Au.get(i);o&&(F(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.hu=!0:s.modifiedDocuments.size>0?F(o.hu,14607):s.removedDocuments.size>0&&(F(o.hu,42227),o.hu=!1))})),await rn(t,n,e)}catch(n){await en(n)}}function Nd(r,e,t){const n=L(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.Tu.forEach(((i,o)=>{const c=o.view.va(e);c.snapshot&&s.push(c.snapshot)})),(function(o,c){const u=L(o);u.onlineState=c;let h=!1;u.queries.forEach(((f,m)=>{for(const g of m.ba)g.va(c)&&(h=!0)})),h&&_u(u)})(n.eventManager,e),s.length&&n.Pu.J_(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function lA(r,e,t){const n=L(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Au.get(e),i=s&&s.key;if(i){let o=new ie(O.comparator);o=o.insert(i,ce.newNoDocument(i,U.min()));const c=G().add(i),u=new ei(U.min(),new Map,new ie(j),o,c);await rg(n,u),n.Ru=n.Ru.remove(i),n.Au.delete(e),wu(n)}else await Ar(n.localStore,e,!1).then((()=>Rr(n,e,t))).catch(en)}async function hA(r,e){const t=L(r),n=e.batch.batchId;try{const s=await bv(t.localStore,e);Tu(t,n,null),Eu(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await rn(t,s)}catch(s){await en(s)}}async function dA(r,e,t){const n=L(r);try{const s=await(function(o,c){const u=L(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",(h=>{let f;return u.mutationQueue.lookupMutationBatch(h,c).next((m=>(F(m!==null,37113),f=m.keys(),u.mutationQueue.removeMutationBatch(h,m)))).next((()=>u.mutationQueue.performConsistencyCheck(h))).next((()=>u.documentOverlayCache.removeOverlaysForBatchId(h,f,c))).next((()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(h,f))).next((()=>u.localDocuments.getDocuments(h,f)))}))})(n.localStore,e);Tu(n,e,t),Eu(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await rn(n,s)}catch(s){await en(s)}}function Eu(r,e){(r.mu.get(e)||[]).forEach((t=>{t.resolve()})),r.mu.delete(e)}function Tu(r,e,t){const n=L(r);let s=n.du[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.du[n.currentUser.toKey()]=s}}function Rr(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Iu.get(e))r.Tu.delete(n),t&&r.Pu.yu(n,t);r.Iu.delete(e),r.isPrimaryClient&&r.Vu.Gr(e).forEach((n=>{r.Vu.containsKey(n)||sg(r,n)}))}function sg(r,e){r.Eu.delete(e.path.canonicalString());const t=r.Ru.get(e);t!==null&&(br(r.remoteStore,t),r.Ru=r.Ru.remove(e),r.Au.delete(t),wu(r))}function Ec(r,e,t){for(const n of t)n instanceof eg?(r.Vu.addReference(n.key,e),fA(r,n)):n instanceof tg?(C(Lr,"Document no longer in limbo: "+n.key),r.Vu.removeReference(n.key,e),r.Vu.containsKey(n.key)||sg(r,n.key)):M(19791,{wu:n})}function fA(r,e){const t=e.key,n=t.path.canonicalString();r.Ru.get(t)||r.Eu.has(n)||(C(Lr,"New document in limbo: "+t),r.Eu.add(n),wu(r))}function wu(r){for(;r.Eu.size>0&&r.Ru.size<r.maxConcurrentLimboResolutions;){const e=r.Eu.values().next().value;r.Eu.delete(e);const t=new O(J.fromString(e)),n=r.fu.next();r.Au.set(n,new rA(t)),r.Ru=r.Ru.insert(t,n),Uo(r.remoteStore,new pt($e(Xs(t.path)),n,"TargetPurposeLimboResolution",Oe.ce))}}async function rn(r,e,t){const n=L(r),s=[],i=[],o=[];n.Tu.isEmpty()||(n.Tu.forEach(((c,u)=>{o.push(n.pu(u,e,t).then((h=>{var f;if((h||t)&&n.isPrimaryClient){const m=h?!h.fromCache:(f=t==null?void 0:t.targetChanges.get(u.targetId))==null?void 0:f.current;n.sharedClientState.updateQueryState(u.targetId,m?"current":"not-current")}if(h){s.push(h);const m=ou.Es(u.targetId,h);i.push(m)}})))})),await Promise.all(o),n.Pu.J_(s),await(async function(u,h){const f=L(u);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",(m=>v.forEach(h,(g=>v.forEach(g.Ts,(S=>f.persistence.referenceDelegate.addReference(m,g.targetId,S))).next((()=>v.forEach(g.Is,(S=>f.persistence.referenceDelegate.removeReference(m,g.targetId,S)))))))))}catch(m){if(!tn(m))throw m;C(au,"Failed to update sequence numbers: "+m)}for(const m of h){const g=m.targetId;if(!m.fromCache){const S=f.vs.get(g),k=S.snapshotVersion,D=S.withLastLimboFreeSnapshotVersion(k);f.vs=f.vs.insert(g,D)}}})(n.localStore,i))}async function pA(r,e){const t=L(r);if(!t.currentUser.isEqual(e)){C(Lr,"User change. New user:",e.toKey());const n=await Fm(t.localStore,e);t.currentUser=e,(function(i,o){i.mu.forEach((c=>{c.forEach((u=>{u.reject(new V(R.CANCELLED,o))}))})),i.mu.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await rn(t,n.Ns)}}function mA(r,e){const t=L(r),n=t.Au.get(e);if(n&&n.hu)return G().add(n.key);{let s=G();const i=t.Iu.get(e);if(!i)return s;for(const o of i){const c=t.Tu.get(o);s=s.unionWith(c.view.nu)}return s}}async function gA(r,e){const t=L(r),n=await mc(t.localStore,e.query,!0),s=e.view.cu(n);return t.isPrimaryClient&&Ec(t,e.targetId,s.au),s}async function _A(r,e){const t=L(r);return qm(t.localStore,e).then((n=>rn(t,n)))}async function yA(r,e,t,n){const s=L(r),i=await(function(c,u){const h=L(c),f=L(h.mutationQueue);return h.persistence.runTransaction("Lookup mutation documents","readonly",(m=>f.Xn(m,u).next((g=>g?h.localDocuments.getDocuments(m,g):v.resolve(null)))))})(s.localStore,e);i!==null?(t==="pending"?await Or(s.remoteStore):t==="acknowledged"||t==="rejected"?(Tu(s,e,n||null),Eu(s,e),(function(c,u){L(L(c).mutationQueue).nr(u)})(s.localStore,e)):M(6720,"Unknown batchState",{bu:t}),await rn(s,i)):C(Lr,"Cannot apply mutation batch with id: "+e)}async function IA(r,e){const t=L(r);if(Bo(t),vu(t),e===!0&&t.gu!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),s=await xd(t,n.toArray());t.gu=!0,await yc(t.remoteStore,!0);for(const i of s)Uo(t.remoteStore,i)}else if(e===!1&&t.gu!==!1){const n=[];let s=Promise.resolve();t.Iu.forEach(((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?n.push(o):s=s.then((()=>(Rr(t,o),Ar(t.localStore,o,!0)))),br(t.remoteStore,o)})),await s,await xd(t,n),(function(o){const c=L(o);c.Au.forEach(((u,h)=>{br(c.remoteStore,h)})),c.Vu.zr(),c.Au=new Map,c.Ru=new ie(O.comparator)})(t),t.gu=!1,await yc(t.remoteStore,!1)}}async function xd(r,e,t){const n=L(r),s=[],i=[];for(const o of e){let c;const u=n.Iu.get(o);if(u&&u.length!==0){c=await lo(n.localStore,$e(u[0]));for(const h of u){const f=n.Tu.get(h),m=await gA(n,f);m.snapshot&&i.push(m.snapshot)}}else{const h=await Bm(n.localStore,o);c=await lo(n.localStore,h),await Iu(n,ig(h),o,!1,c.resumeToken)}s.push(c)}return n.Pu.J_(i),s}function ig(r){return $p(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function EA(r){return(function(t){return L(L(t).persistence).hs()})(L(r).localStore)}async function TA(r,e,t,n){const s=L(r);if(s.gu)return void C(Lr,"Ignoring unexpected query state notification.");const i=s.Iu.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{const o=await qm(s.localStore,zp(i[0])),c=ei.createSynthesizedRemoteEventForCurrentChange(e,t==="current",pe.EMPTY_BYTE_STRING);await rn(s,o,c);break}case"rejected":await Ar(s.localStore,e,!0),Rr(s,e,n);break;default:M(64155,t)}}async function wA(r,e,t){const n=Bo(r);if(n.gu){for(const s of e){if(n.Iu.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){C(Lr,"Adding an already active target "+s);continue}const i=await Bm(n.localStore,s),o=await lo(n.localStore,i);await Iu(n,ig(i),o.targetId,!1,o.resumeToken),Uo(n.remoteStore,o)}for(const s of t)n.Iu.has(s)&&await Ar(n.localStore,s,!1).then((()=>{br(n.remoteStore,s),Rr(n,s)})).catch(en)}}function Bo(r){const e=L(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=rg.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=mA.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=lA.bind(null,e),e.Pu.J_=Zv.bind(null,e.eventManager),e.Pu.yu=eA.bind(null,e.eventManager),e}function vu(r){const e=L(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=hA.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=dA.bind(null,e),e}class Fs{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Lo(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return Lm(this.persistence,new Mm,e.initialUser,this.serializer)}Cu(e){return new su(Mo.Vi,this.serializer)}Du(e){return new Gm}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Fs.provider={build:()=>new Fs};class vA extends Fs{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){F(this.persistence.referenceDelegate instanceof uo,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new Vm(n,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?Pe.withCacheSize(this.cacheSizeBytes):Pe.DEFAULT;return new su((n=>uo.Vi(n,t)),this.serializer)}}class og extends Fs{constructor(e,t,n){super(),this.xu=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.xu.initialize(this,e),await vu(this.xu.syncEngine),await Or(this.xu.remoteStore),await this.persistence.zi((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}vu(e){return Lm(this.persistence,new Mm,e.initialUser,this.serializer)}Fu(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new Vm(n,e.asyncQueue,t)}Mu(e,t){const n=new VT(t,this.persistence);return new CT(e.asyncQueue,n)}Cu(e){const t=Om(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?Pe.withCacheSize(this.cacheSizeBytes):Pe.DEFAULT;return new iu(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,Hm(),$i(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Du(e){return new Gm}}class AA extends og{constructor(e,t){super(e,t,!1),this.xu=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.xu.syncEngine;this.sharedClientState instanceof Na&&(this.sharedClientState.syncEngine={So:yA.bind(null,t),Do:TA.bind(null,t),Co:wA.bind(null,t),hs:EA.bind(null,t),bo:_A.bind(null,t)},await this.sharedClientState.start()),await this.persistence.zi((async n=>{await IA(this.xu.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())}))}Du(e){const t=Hm();if(!Na.v(t))throw new V(R.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=Om(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new Na(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class Us{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>Nd(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=pA.bind(null,this.syncEngine),await yc(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new Xv})()}createDatastore(e){const t=Lo(e.databaseInfo.databaseId),n=Nv(e.databaseInfo);return Fv(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return(function(n,s,i,o,c){return new Bv(n,s,i,o,c)})(this.localStore,this.datastore,e.asyncQueue,(t=>Nd(this.syncEngine,t,0)),(function(){return Rd.v()?new Rd:new Cv})())}createSyncEngine(e,t){return(function(s,i,o,c,u,h,f){const m=new sA(s,i,o,c,u,h);return f&&(m.gu=!0),m})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){const i=L(s);C(On,"RemoteStore shutting down."),i.Ea.add(5),await ni(i),i.Aa.shutdown(),i.Va.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Us.provider={build:()=>new Us};/**
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
 */class Au{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):fe("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
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
 */let bA=class{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new V(R.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await(async function(s,i){const o=L(s),c={documents:i.map((m=>Ms(o.serializer,m)))},u=await o.jo("BatchGetDocuments",o.serializer.databaseId,J.emptyPath(),c,i.length),h=new Map;u.forEach((m=>{const g=qw(o.serializer,m);h.set(g.key.toString(),g)}));const f=[];return i.forEach((m=>{const g=h.get(m.toString());F(!!g,55234,{key:m}),f.push(g)})),f})(this.datastore,e);return t.forEach((n=>this.recordVersion(n))),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(e.toString())}delete(e){this.write(new xr(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach((t=>{e.delete(t.key.toString())})),e.forEach(((t,n)=>{const s=O.fromPath(n);this.mutations.push(new Qc(s,this.precondition(s)))})),await(async function(n,s){const i=L(n),o={writes:s.map((c=>Ls(i.serializer,c)))};await i.Wo("Commit",i.serializer.databaseId,J.emptyPath(),o)})(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw M(50498,{Gu:e.constructor.name});t=U.min()}const n=this.readVersions.get(e.key.toString());if(n){if(!t.isEqual(n))throw new V(R.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(U.min())?he.exists(!1):he.updateTime(t):he.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(U.min()))throw new V(R.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return he.updateTime(t)}return he.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}};/**
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
 */class SA{constructor(e,t,n,s,i){this.asyncQueue=e,this.datastore=t,this.options=n,this.updateFunction=s,this.deferred=i,this.zu=n.maxAttempts,this.M_=new uu(this.asyncQueue,"transaction_retry")}ju(){this.zu-=1,this.Hu()}Hu(){this.M_.p_((async()=>{const e=new bA(this.datastore),t=this.Ju(e);t&&t.then((n=>{this.asyncQueue.enqueueAndForget((()=>e.commit().then((()=>{this.deferred.resolve(n)})).catch((s=>{this.Zu(s)}))))})).catch((n=>{this.Zu(n)}))}))}Ju(e){try{const t=this.updateFunction(e);return!Qs(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}Zu(e){this.zu>0&&this.Xu(e)?(this.zu-=1,this.asyncQueue.enqueueAndForget((()=>(this.Hu(),Promise.resolve())))):this.deferred.reject(e)}Xu(e){if((e==null?void 0:e.name)==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!sm(t)}return!1}}/**
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
 */const Zt="FirestoreClient";class RA{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=Re.UNAUTHENTICATED,this.clientId=Mc.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async o=>{C(Zt,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(n,(o=>(C(Zt,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Qe;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=pu(t,"Failed to shutdown persistence");e.reject(n)}})),e.promise}}async function Oa(r,e){r.asyncQueue.verifyOperationInProgress(),C(Zt,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await Fm(e.localStore,s),n=s)})),e.persistence.setDatabaseDeletedListener((()=>r.terminate())),r._offlineComponents=e}async function Od(r,e){r.asyncQueue.verifyOperationInProgress();const t=await PA(r);C(Zt,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener((n=>Cd(e.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>Cd(e.remoteStore,s))),r._onlineComponents=e}async function PA(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){C(Zt,"Using user provided OfflineComponentProvider");try{await Oa(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===R.FAILED_PRECONDITION||s.code===R.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;lr("Error using user provided cache. Falling back to memory cache: "+t),await Oa(r,new Fs)}}else C(Zt,"Using default OfflineComponentProvider"),await Oa(r,new vA(void 0));return r._offlineComponents}async function bu(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(C(Zt,"Using user provided OnlineComponentProvider"),await Od(r,r._uninitializedComponentsProvider._online)):(C(Zt,"Using default OnlineComponentProvider"),await Od(r,new Us))),r._onlineComponents}function CA(r){return bu(r).then((e=>e.syncEngine))}function VA(r){return bu(r).then((e=>e.datastore))}async function mo(r){const e=await bu(r),t=e.eventManager;return t.onListen=iA.bind(null,e.syncEngine),t.onUnlisten=aA.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=oA.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=cA.bind(null,e.syncEngine),t}function kA(r,e,t,n){const s=new Au(n),i=new yu(e,s,t);return r.asyncQueue.enqueueAndForget((async()=>mu(await mo(r),i))),()=>{s.Nu(),r.asyncQueue.enqueueAndForget((async()=>gu(await mo(r),i)))}}function ag(r,e,t={}){const n=new Qe;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,c,u,h){const f=new Au({next:g=>{f.Nu(),o.enqueueAndForget((()=>gu(i,m)));const S=g.docs.has(c);!S&&g.fromCache?h.reject(new V(R.UNAVAILABLE,"Failed to get document because the client is offline.")):S&&g.fromCache&&u&&u.source==="server"?h.reject(new V(R.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):h.resolve(g)},error:g=>h.reject(g)}),m=new yu(Xs(c.path),f,{includeMetadataChanges:!0,Ka:!0});return mu(i,m)})(await mo(r),r.asyncQueue,e,t,n))),n.promise}function DA(r,e,t={}){const n=new Qe;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,c,u,h){const f=new Au({next:g=>{f.Nu(),o.enqueueAndForget((()=>gu(i,m))),g.fromCache&&u.source==="server"?h.reject(new V(R.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):h.resolve(g)},error:g=>h.reject(g)}),m=new yu(c,f,{includeMetadataChanges:!0,Ka:!0});return mu(i,m)})(await mo(r),r.asyncQueue,e,t,n))),n.promise}function NA(r,e){const t=new Qe;return r.asyncQueue.enqueueAndForget((async()=>uA(await CA(r),e,t))),t.promise}function xA(r,e,t){const n=new Qe;return r.asyncQueue.enqueueAndForget((async()=>{const s=await VA(r);new SA(r.asyncQueue,s,t,e,n).ju()})),n.promise}/**
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
 */function cg(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
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
 */const OA="ComponentProvider",Md=new Map;function MA(r,e,t,n,s){return new sw(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,cg(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n)}/**
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
 */const LA="firestore.googleapis.com",Ld=!0;class Fd{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new V(R.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=LA,this.ssl=Ld}else this.host=e.host,this.ssl=e.ssl??Ld;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=bm;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Cm)throw new V(R.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}bT("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=cg(e.experimentalLongPollingOptions??{}),(function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new V(R.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new V(R.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new V(R.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Su{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Fd({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new V(R.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new V(R.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Fd(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new gT;switch(n.type){case"firstParty":return new IT(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new V(R.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const n=Md.get(t);n&&(C(OA,"Removing Datastore"),Md.delete(t),n.terminate())})(this),Promise.resolve()}}/**
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
 */class lt{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new lt(this.firestore,e,this._query)}}class ue{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Ht(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ue(this.firestore,e,this._key)}toJSON(){return{type:ue._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(Ws(t,ue._jsonSchema))return new ue(e,n||null,new O(J.fromString(t.referencePath)))}}ue._jsonSchemaVersion="firestore/documentReference/1.0",ue._jsonSchema={type:ge("string",ue._jsonSchemaVersion),referencePath:ge("string")};class Ht extends lt{constructor(e,t,n){super(e,t,Xs(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ue(this.firestore,null,new O(e))}withConverter(e){return new Ht(this.firestore,e,this._path)}}function OS(r,e,...t){if(r=se(r),ap("collection","path",e),r instanceof Su){const n=J.fromString(e,...t);return Ph(n),new Ht(r,null,n)}{if(!(r instanceof ue||r instanceof Ht))throw new V(R.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(J.fromString(e,...t));return Ph(n),new Ht(r.firestore,null,n)}}function MS(r,e,...t){if(r=se(r),arguments.length===1&&(e=Mc.newId()),ap("doc","path",e),r instanceof Su){const n=J.fromString(e,...t);return Rh(n),new ue(r,null,new O(n))}{if(!(r instanceof ue||r instanceof Ht))throw new V(R.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(J.fromString(e,...t));return Rh(n),new ue(r.firestore,r instanceof Ht?r.converter:null,new O(n))}}/**
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
 */const Ud="AsyncQueue";class Bd{constructor(e=Promise.resolve()){this.Yu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new uu(this,"async_queue_retry"),this._c=()=>{const n=$i();n&&C(Ud,"Visibility state changed to "+n.visibilityState),this.M_.w_()},this.ac=e;const t=$i();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=$i();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new Qe;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Yu.push(e),this.lc())))}async lc(){if(this.Yu.length!==0){try{await this.Yu[0](),this.Yu.shift(),this.M_.reset()}catch(e){if(!tn(e))throw e;C(Ud,"Operation failed with retryable error: "+e)}this.Yu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((n=>{throw this.nc=n,this.rc=!1,fe("INTERNAL UNHANDLED ERROR: ",qd(n)),n})).then((n=>(this.rc=!1,n))))));return this.ac=t,t}enqueueAfterDelay(e,t,n){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const s=fu.createAndSchedule(this,e,t,n,(i=>this.hc(i)));return this.tc.push(s),s}uc(){this.nc&&M(47125,{Pc:qd(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,n)=>t.targetTimeMs-n.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}Rc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function qd(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}class Xe extends Su{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new Bd,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Bd(e),this._firestoreClient=void 0,await e}}}function LS(r,e,t){t||(t=no);const n=Cr(r,"firestore");if(n.isInitialized(t)){const s=n.getImmediate({identifier:t}),i=n.getOptions(t);if(bn(i,e))return s;throw new V(R.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new V(R.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Cm)throw new V(R.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&Pr(e.host)&&lf(e.host),n.initialize({options:e,instanceIdentifier:t})}function $n(r){if(r._terminated)throw new V(R.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||FA(r),r._firestoreClient}function FA(r){var n,s,i,o;const e=r._freezeSettings(),t=MA(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new RA(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&(function(u){const h=u==null?void 0:u._online.build();return{_offline:u==null?void 0:u._offline.build(h),_online:h}})(r._componentsProvider))}/**
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
 */class Be{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Be(pe.fromBase64String(e))}catch(t){throw new V(R.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Be(pe.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Be._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Ws(e,Be._jsonSchema))return Be.fromBase64String(e.bytes)}}Be._jsonSchemaVersion="firestore/bytes/1.0",Be._jsonSchema={type:ge("string",Be._jsonSchemaVersion),bytes:ge("string")};/**
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
 */class ri{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new V(R.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new le(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
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
 */class qo{constructor(e){this._methodName=e}}/**
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
 */class ot{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new V(R.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new V(R.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return j(this._lat,e._lat)||j(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:ot._jsonSchemaVersion}}static fromJSON(e){if(Ws(e,ot._jsonSchema))return new ot(e.latitude,e.longitude)}}ot._jsonSchemaVersion="firestore/geoPoint/1.0",ot._jsonSchema={type:ge("string",ot._jsonSchemaVersion),latitude:ge("number"),longitude:ge("number")};/**
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
 */class Je{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Je._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Ws(e,Je._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Je(e.vectorValues);throw new V(R.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Je._jsonSchemaVersion="firestore/vectorValue/1.0",Je._jsonSchema={type:ge("string",Je._jsonSchemaVersion),vectorValues:ge("object")};/**
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
 */const UA=/^__.*__$/;class BA{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new St(e,this.data,this.fieldMask,t,this.fieldTransforms):new Nr(e,this.data,t,this.fieldTransforms)}}class ug{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new St(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function lg(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw M(40011,{dataSource:r})}}class Ru{constructor(e,t,n,s,i,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new Ru({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return go(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if(lg(this.dataSource)&&UA.test(e))throw this.createError('Document fields cannot begin and end with "__"')}}class qA{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Lo(e)}createContext(e,t,n,s=!1){return new Ru({dataSource:e,methodName:t,targetDoc:n,path:le.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Fr(r){const e=r._freezeSettings(),t=Lo(r._databaseId);return new qA(r._databaseId,!!e.ignoreUndefinedProperties,t)}function Pu(r,e,t,n,s,i={}){const o=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);Du("Data must be an object, but it was:",o,n);const c=dg(n,o);let u,h;if(i.merge)u=new Me(o.fieldMask),h=o.fieldTransforms;else if(i.mergeFields){const f=[];for(const m of i.mergeFields){const g=Mn(e,m,t);if(!o.contains(g))throw new V(R.INVALID_ARGUMENT,`Field '${g}' is specified in your field mask but missing from your input data.`);mg(f,g)||f.push(g)}u=new Me(f),h=o.fieldTransforms.filter((m=>u.covers(m.field)))}else u=null,h=o.fieldTransforms;return new BA(new Ae(c),u,h)}class $o extends qo{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof $o}}class Cu extends qo{constructor(e,t){super(e),this.Vc=t}_toFieldTransform(e){const t=new wr(e.serializer,Jp(e.serializer,this.Vc));return new tm(e.path,t)}isEqual(e){return e instanceof Cu&&this.Vc===e.Vc}}function Vu(r,e,t,n){const s=r.createContext(1,e,t);Du("Data must be an object, but it was:",s,n);const i=[],o=Ae.empty();nn(n,((u,h)=>{const f=pg(e,u,t);h=se(h);const m=s.childContextForFieldPath(f);if(h instanceof $o)i.push(f);else{const g=si(h,m);g!=null&&(i.push(f),o.set(f,g))}}));const c=new Me(i);return new ug(o,c,s.fieldTransforms)}function ku(r,e,t,n,s,i){const o=r.createContext(1,e,t),c=[Mn(e,n,t)],u=[s];if(i.length%2!=0)throw new V(R.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let g=0;g<i.length;g+=2)c.push(Mn(e,i[g])),u.push(i[g+1]);const h=[],f=Ae.empty();for(let g=c.length-1;g>=0;--g)if(!mg(h,c[g])){const S=c[g];let k=u[g];k=se(k);const D=o.childContextForFieldPath(S);if(k instanceof $o)h.push(S);else{const N=si(k,D);N!=null&&(h.push(S),f.set(S,N))}}const m=new Me(h);return new ug(f,m,o.fieldTransforms)}function hg(r,e,t,n=!1){return si(t,r.createContext(n?4:3,e))}function si(r,e){if(fg(r=se(r)))return Du("Unsupported field value:",e,r),dg(r,e);if(r instanceof qo)return(function(n,s){if(!lg(s.dataSource))throw s.createError(`${n._methodName}() can only be used with update() and set()`);if(!s.path)throw s.createError(`${n._methodName}() is not currently supported inside arrays`);const i=n._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return(function(n,s){const i=[];let o=0;for(const c of n){let u=si(c,s.childContextForArray(o));u==null&&(u={nullValue:"NULL_VALUE"}),i.push(u),o++}return{arrayValue:{values:i}}})(r,e)}return(function(n,s){if((n=se(n))===null)return{nullValue:"NULL_VALUE"};if(typeof n=="number")return Jp(s.serializer,n);if(typeof n=="boolean")return{booleanValue:n};if(typeof n=="string")return{stringValue:n};if(n instanceof Date){const i=Z.fromDate(n);return{timestampValue:vr(s.serializer,i)}}if(n instanceof Z){const i=new Z(n.seconds,1e3*Math.floor(n.nanoseconds/1e3));return{timestampValue:vr(s.serializer,i)}}if(n instanceof ot)return{geoPointValue:{latitude:n.latitude,longitude:n.longitude}};if(n instanceof Be)return{bytesValue:cm(s.serializer,n._byteString)};if(n instanceof ue){const i=s.databaseId,o=n.firestore._databaseId;if(!o.isEqual(i))throw s.createError(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:eu(n.firestore._databaseId||s.databaseId,n._key.path)}}if(n instanceof Je)return(function(o,c){const u=o instanceof Je?o.toArray():o;return{mapValue:{fields:{[jc]:{stringValue:zc},[_r]:{arrayValue:{values:u.map((f=>{if(typeof f!="number")throw c.createError("VectorValues must only contain numeric values.");return Wc(c.serializer,f)}))}}}}}})(n,s);if(Im(n))return n._toProto(s.serializer);throw s.createError(`Unsupported field value: ${vo(n)}`)})(r,e)}function dg(r,e){const t={};return bp(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):nn(r,((n,s)=>{const i=si(s,e.childContextForField(n));i!=null&&(t[n]=i)})),{mapValue:{fields:t}}}function fg(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof Z||r instanceof ot||r instanceof Be||r instanceof ue||r instanceof qo||r instanceof Je||Im(r))}function Du(r,e,t){if(!fg(t)||!cp(t)){const n=vo(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function Mn(r,e,t){if((e=se(e))instanceof ri)return e._internalPath;if(typeof e=="string")return pg(r,e);throw go("Field path arguments must be of type string or ",r,!1,void 0,t)}const $A=new RegExp("[~\\*/\\[\\]]");function pg(r,e,t){if(e.search($A)>=0)throw go(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new ri(...e.split("."))._internalPath}catch{throw go(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function go(r,e,t,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let c=`Function ${e}() called with invalid data`;t&&(c+=" (via `toFirestore()`)"),c+=". ";let u="";return(i||o)&&(u+=" (found",i&&(u+=` in field ${n}`),o&&(u+=` in document ${s}`),u+=")"),new V(R.INVALID_ARGUMENT,c+r+u)}function mg(r,e){return r.some((t=>t.isEqual(e)))}/**
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
 */class gg{convertValue(e,t="none"){switch(Qt(e)){case 0:return null;case 1:return e.booleanValue;case 2:return ae(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Tt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw M(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return nn(e,((s,i)=>{n[s]=this.convertValue(i,t)})),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[_r].arrayValue)==null?void 0:s.values)==null?void 0:i.map((o=>ae(o.doubleValue)));return new Je(t)}convertGeoPoint(e){return new ot(ae(e.latitude),ae(e.longitude))}convertArray(e,t){return(e.values||[]).map((n=>this.convertValue(n,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const n=Co(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(ks(e));default:return null}}convertTimestamp(e){const t=Et(e);return new Z(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=J.fromString(e);F(ym(n),9688,{name:e});const s=new Cn(n.get(1),n.get(3)),i=new O(n.popFirst(5));return s.isEqual(t)||fe(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
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
 */class jo extends gg{constructor(e){super(),this.firestore=e}convertBytes(e){return new Be(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}function FS(r){return new Cu("increment",r)}const $d="@firebase/firestore",jd="4.12.0";/**
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
 */function zd(r){return(function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}/**
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
 */class Bs{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new ue(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new jA(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(Mn("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class jA extends Bs{data(){return super.data()}}/**
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
 */function _g(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new V(R.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Nu{}class zo extends Nu{}function US(r,e,...t){let n=[];e instanceof Nu&&n.push(e),n=n.concat(t),(function(i){const o=i.filter((u=>u instanceof xu)).length,c=i.filter((u=>u instanceof Ko)).length;if(o>1||o>0&&c>0)throw new V(R.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(n);for(const s of n)r=s._apply(r);return r}class Ko extends zo{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new Ko(e,t,n)}_apply(e){const t=this._parse(e);return yg(e._query,t),new lt(e.firestore,e.converter,ac(e._query,t))}_parse(e){const t=Fr(e.firestore);return(function(i,o,c,u,h,f,m){let g;if(h.isKeyField()){if(f==="array-contains"||f==="array-contains-any")throw new V(R.INVALID_ARGUMENT,`Invalid Query. You can't perform '${f}' queries on documentId().`);if(f==="in"||f==="not-in"){Gd(m,f);const k=[];for(const D of m)k.push(Kd(u,i,D));g={arrayValue:{values:k}}}else g=Kd(u,i,m)}else f!=="in"&&f!=="not-in"&&f!=="array-contains-any"||Gd(m,f),g=hg(c,o,m,f==="in"||f==="not-in");return W.create(h,f,g)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function BS(r,e,t){const n=e,s=Mn("where",r);return Ko._create(s,n,t)}class xu extends Nu{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new xu(e,t)}_parse(e){const t=this._queryConstraints.map((n=>n._parse(e))).filter((n=>n.getFilters().length>0));return t.length===1?t[0]:ee.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:((function(s,i){let o=s;const c=i.getFlattenedFilters();for(const u of c)yg(o,u),o=ac(o,u)})(e._query,t),new lt(e.firestore,e.converter,ac(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Ou extends zo{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new Ou(e,t)}_apply(e){const t=(function(s,i,o){if(s.startAt!==null)throw new V(R.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new V(R.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new xs(i,o)})(e._query,this._field,this._direction);return new lt(e.firestore,e.converter,yw(e._query,t))}}function qS(r,e="asc"){const t=e,n=Mn("orderBy",r);return Ou._create(n,t)}class Mu extends zo{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new Mu(e,t,n)}_apply(e){return new lt(e.firestore,e.converter,io(e._query,this._limit,this._limitType))}}function $S(r){return ST("limit",r),Mu._create("limit",r,"F")}class Lu extends zo{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Lu(e,t,n)}_apply(e){const t=zA(e,this.type,this._docOrFields,this._inclusive);return new lt(e.firestore,e.converter,Iw(e._query,t))}}function jS(...r){return Lu._create("startAfter",r,!1)}function zA(r,e,t,n){if(t[0]=se(t[0]),t[0]instanceof Bs)return(function(i,o,c,u,h){if(!u)throw new V(R.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${c}().`);const f=[];for(const m of ar(i))if(m.field.isKeyField())f.push(Vn(o,u.key));else{const g=u.data.field(m.field);if(Po(g))throw new V(R.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+m.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(g===null){const S=m.field.canonicalString();throw new V(R.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${S}' (used as the orderBy) does not exist.`)}f.push(g)}return new Yt(f,h)})(r._query,r.firestore._databaseId,e,t[0]._document,n);{const s=Fr(r.firestore);return(function(o,c,u,h,f,m){const g=o.explicitOrderBy;if(f.length>g.length)throw new V(R.INVALID_ARGUMENT,`Too many arguments provided to ${h}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const S=[];for(let k=0;k<f.length;k++){const D=f[k];if(g[k].field.isKeyField()){if(typeof D!="string")throw new V(R.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${h}(), but got a ${typeof D}`);if(!Gc(o)&&D.indexOf("/")!==-1)throw new V(R.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${h}() must be a plain document ID, but '${D}' contains a slash.`);const N=o.path.child(J.fromString(D));if(!O.isDocumentKey(N))throw new V(R.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${h}() must result in a valid document path, but '${N}' is not because it contains an odd number of segments.`);const z=new O(N);S.push(Vn(c,z))}else{const N=hg(u,h,D);S.push(N)}}return new Yt(S,m)})(r._query,r.firestore._databaseId,s,e,t,n)}}function Kd(r,e,t){if(typeof(t=se(t))=="string"){if(t==="")throw new V(R.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Gc(e)&&t.indexOf("/")!==-1)throw new V(R.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(J.fromString(t));if(!O.isDocumentKey(n))throw new V(R.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Vn(r,new O(n))}if(t instanceof ue)return Vn(r,t._key);throw new V(R.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${vo(t)}.`)}function Gd(r,e){if(!Array.isArray(r)||r.length===0)throw new V(R.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function yg(r,e){const t=(function(s,i){for(const o of s)for(const c of o.getFlattenedFilters())if(i.indexOf(c.op)>=0)return c.op;return null})(r.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new V(R.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new V(R.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}function Fu(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}class KA extends gg{constructor(e){super(),this.firestore=e}convertBytes(e){return new Be(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}class GA{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=QA(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}function zS(r){return new GA(r)}class HA{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Us.provider,this._offlineComponentProvider={build:t=>new og(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class WA{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Us.provider,this._offlineComponentProvider={build:t=>new AA(t,e==null?void 0:e.cacheSizeBytes)}}}function QA(r){return new HA(r==null?void 0:r.forceOwnership)}function KS(){return new WA}class rr{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Wt extends Bs{constructor(e,t,n,s,i,o){super(e,t,n,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new ji(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(Mn("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new V(R.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=Wt._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}Wt._jsonSchemaVersion="firestore/documentSnapshot/1.0",Wt._jsonSchema={type:ge("string",Wt._jsonSchemaVersion),bundleSource:ge("string","DocumentSnapshot"),bundleName:ge("string"),bundle:ge("string")};class ji extends Wt{data(e={}){return super.data(e)}}class An{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new rr(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((n=>{e.call(t,new ji(this._firestore,this._userDataWriter,n.key,n,new rr(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new V(R.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map((c=>{const u=new ji(s._firestore,s._userDataWriter,c.doc.key,c.doc,new rr(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);return c.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}}))}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((c=>i||c.type!==3)).map((c=>{const u=new ji(s._firestore,s._userDataWriter,c.doc.key,c.doc,new rr(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);let h=-1,f=-1;return c.type!==0&&(h=o.indexOf(c.doc.key),o=o.delete(c.doc.key)),c.type!==1&&(o=o.add(c.doc),f=o.indexOf(c.doc.key)),{type:JA(c.type),doc:u,oldIndex:h,newIndex:f}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new V(R.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=An._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Mc.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function JA(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return M(61501,{type:r})}}/**
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
 */An._jsonSchemaVersion="firestore/querySnapshot/1.0",An._jsonSchema={type:ge("string",An._jsonSchemaVersion),bundleSource:ge("string","QuerySnapshot"),bundleName:ge("string"),bundle:ge("string")};const YA={maxAttempts:5};/**
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
 */class XA{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=Fr(e)}set(e,t,n){this._verifyNotCommitted();const s=jt(e,this._firestore),i=Fu(s.converter,t,n),o=Pu(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,he.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=jt(e,this._firestore);let o;return o=typeof(t=se(t))=="string"||t instanceof ri?ku(this._dataReader,"WriteBatch.update",i._key,t,n,s):Vu(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,he.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=jt(e,this._firestore);return this._mutations=this._mutations.concat(new xr(t._key,he.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new V(R.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function jt(r,e){if((r=se(r)).firestore!==e)throw new V(R.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
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
 */class ZA{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=Fr(e)}get(e){const t=jt(e,this._firestore),n=new KA(this._firestore);return this._transaction.lookup([t._key]).then((s=>{if(!s||s.length!==1)return M(24041);const i=s[0];if(i.isFoundDocument())return new Bs(this._firestore,n,i.key,i,t.converter);if(i.isNoDocument())return new Bs(this._firestore,n,t._key,null,t.converter);throw M(18433,{doc:i})}))}set(e,t,n){const s=jt(e,this._firestore),i=Fu(s.converter,t,n),o=Pu(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,n);return this._transaction.set(s._key,o),this}update(e,t,n,...s){const i=jt(e,this._firestore);let o;return o=typeof(t=se(t))=="string"||t instanceof ri?ku(this._dataReader,"Transaction.update",i._key,t,n,s):Vu(this._dataReader,"Transaction.update",i._key,t),this._transaction.update(i._key,o),this}delete(e){const t=jt(e,this._firestore);return this._transaction.delete(t._key),this}}/**
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
 */class eb extends ZA{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=jt(e,this._firestore),n=new jo(this._firestore);return super.get(e).then((s=>new Wt(this._firestore,n,t._key,s._document,new rr(!1,!1),t.converter)))}}function GS(r,e,t){r=Ce(r,Xe);const n={...YA,...t};(function(o){if(o.maxAttempts<1)throw new V(R.INVALID_ARGUMENT,"Max attempts must be at least 1")})(n);const s=$n(r);return xA(s,(i=>e(new eb(r,i))),n)}/**
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
 */function HS(r){r=Ce(r,ue);const e=Ce(r.firestore,Xe),t=$n(e);return ag(t,r._key).then((n=>Uu(e,r,n)))}function WS(r){r=Ce(r,ue);const e=Ce(r.firestore,Xe),t=$n(e);return ag(t,r._key,{source:"server"}).then((n=>Uu(e,r,n)))}function QS(r){r=Ce(r,lt);const e=Ce(r.firestore,Xe),t=$n(e),n=new jo(e);return _g(r._query),DA(t,r._query).then((s=>new An(e,n,r,s)))}function JS(r,e,t){r=Ce(r,ue);const n=Ce(r.firestore,Xe),s=Fu(r.converter,e,t),i=Fr(n);return Go(n,[Pu(i,"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,he.none())])}function YS(r,e,t,...n){r=Ce(r,ue);const s=Ce(r.firestore,Xe),i=Fr(s);let o;return o=typeof(e=se(e))=="string"||e instanceof ri?ku(i,"updateDoc",r._key,e,t,n):Vu(i,"updateDoc",r._key,e),Go(s,[o.toMutation(r._key,he.exists(!0))])}function XS(r){return Go(Ce(r.firestore,Xe),[new xr(r._key,he.none())])}function ZS(r,...e){var h,f,m;r=se(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||zd(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(zd(e[n])){const g=e[n];e[n]=(h=g.next)==null?void 0:h.bind(g),e[n+1]=(f=g.error)==null?void 0:f.bind(g),e[n+2]=(m=g.complete)==null?void 0:m.bind(g)}let i,o,c;if(r instanceof ue)o=Ce(r.firestore,Xe),c=Xs(r._key.path),i={next:g=>{e[n]&&e[n](Uu(o,r,g))},error:e[n+1],complete:e[n+2]};else{const g=Ce(r,lt);o=Ce(g.firestore,Xe),c=g._query;const S=new jo(o);i={next:k=>{e[n]&&e[n](new An(o,S,g,k))},error:e[n+1],complete:e[n+2]},_g(r._query)}const u=$n(o);return kA(u,c,s,i)}function Go(r,e){const t=$n(r);return NA(t,e)}function Uu(r,e,t){const n=t.docs.get(e._key),s=new jo(r);return new Wt(r,s,e._key,n,new rr(t.hasPendingWrites,t.fromCache),e.converter)}function eR(r){return r=Ce(r,Xe),$n(r),new XA(r,(e=>Go(r,e)))}(function(e,t=!0){pT(Vr),at(new Ye("firestore",((n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),c=new Xe(new _T(n.getProvider("auth-internal")),new ET(o,n.getProvider("app-check-internal")),iw(o,s),o);return i={useFetchStreams:t,...i},c._setSettings(i),c}),"PUBLIC").setMultipleInstances(!0)),ze($d,jd,e),ze($d,jd,"esm2020")})();const Ig="@firebase/installations",Bu="0.6.20";/**
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
 */const Eg=1e4,Tg=`w:${Bu}`,wg="FIS_v2",tb="https://firebaseinstallations.googleapis.com/v1",nb=3600*1e3,rb="installations",sb="Installations";/**
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
 */const ib={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},Ln=new Un(rb,sb,ib);function vg(r){return r instanceof ut&&r.code.includes("request-failed")}/**
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
 */function Ag({projectId:r}){return`${tb}/projects/${r}/installations`}function bg(r){return{token:r.token,requestStatus:2,expiresIn:ab(r.expiresIn),creationTime:Date.now()}}async function Sg(r,e){const n=(await e.json()).error;return Ln.create("request-failed",{requestName:r,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function Rg({apiKey:r}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":r})}function ob(r,{refreshToken:e}){const t=Rg(r);return t.append("Authorization",cb(e)),t}async function Pg(r){const e=await r();return e.status>=500&&e.status<600?r():e}function ab(r){return Number(r.replace("s","000"))}function cb(r){return`${wg} ${r}`}/**
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
 */async function ub({appConfig:r,heartbeatServiceProvider:e},{fid:t}){const n=Ag(r),s=Rg(r),i=e.getImmediate({optional:!0});if(i){const h=await i.getHeartbeatsHeader();h&&s.append("x-firebase-client",h)}const o={fid:t,authVersion:wg,appId:r.appId,sdkVersion:Tg},c={method:"POST",headers:s,body:JSON.stringify(o)},u=await Pg(()=>fetch(n,c));if(u.ok){const h=await u.json();return{fid:h.fid||t,registrationStatus:2,refreshToken:h.refreshToken,authToken:bg(h.authToken)}}else throw await Sg("Create Installation",u)}/**
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
 */function Cg(r){return new Promise(e=>{setTimeout(e,r)})}/**
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
 */function lb(r){return btoa(String.fromCharCode(...r)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const hb=/^[cdef][\w-]{21}$/,Tc="";function db(){try{const r=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(r),r[0]=112+r[0]%16;const t=fb(r);return hb.test(t)?t:Tc}catch{return Tc}}function fb(r){return lb(r).substr(0,22)}/**
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
 */function Ho(r){return`${r.appName}!${r.appId}`}/**
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
 */const Vg=new Map;function kg(r,e){const t=Ho(r);Dg(t,e),pb(t,e)}function Dg(r,e){const t=Vg.get(r);if(t)for(const n of t)n(e)}function pb(r,e){const t=mb();t&&t.postMessage({key:r,fid:e}),gb()}let Tn=null;function mb(){return!Tn&&"BroadcastChannel"in self&&(Tn=new BroadcastChannel("[Firebase] FID Change"),Tn.onmessage=r=>{Dg(r.data.key,r.data.fid)}),Tn}function gb(){Vg.size===0&&Tn&&(Tn.close(),Tn=null)}/**
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
 */const _b="firebase-installations-database",yb=1,Fn="firebase-installations-store";let Ma=null;function qu(){return Ma||(Ma=Io(_b,yb,{upgrade:(r,e)=>{switch(e){case 0:r.createObjectStore(Fn)}}})),Ma}async function _o(r,e){const t=Ho(r),s=(await qu()).transaction(Fn,"readwrite"),i=s.objectStore(Fn),o=await i.get(t);return await i.put(e,t),await s.done,(!o||o.fid!==e.fid)&&kg(r,e.fid),e}async function Ng(r){const e=Ho(r),n=(await qu()).transaction(Fn,"readwrite");await n.objectStore(Fn).delete(e),await n.done}async function Wo(r,e){const t=Ho(r),s=(await qu()).transaction(Fn,"readwrite"),i=s.objectStore(Fn),o=await i.get(t),c=e(o);return c===void 0?await i.delete(t):await i.put(c,t),await s.done,c&&(!o||o.fid!==c.fid)&&kg(r,c.fid),c}/**
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
 */async function $u(r){let e;const t=await Wo(r.appConfig,n=>{const s=Ib(n),i=Eb(r,s);return e=i.registrationPromise,i.installationEntry});return t.fid===Tc?{installationEntry:await e}:{installationEntry:t,registrationPromise:e}}function Ib(r){const e=r||{fid:db(),registrationStatus:0};return xg(e)}function Eb(r,e){if(e.registrationStatus===0){if(!navigator.onLine){const s=Promise.reject(Ln.create("app-offline"));return{installationEntry:e,registrationPromise:s}}const t={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},n=Tb(r,t);return{installationEntry:t,registrationPromise:n}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:wb(r)}:{installationEntry:e}}async function Tb(r,e){try{const t=await ub(r,e);return _o(r.appConfig,t)}catch(t){throw vg(t)&&t.customData.serverCode===409?await Ng(r.appConfig):await _o(r.appConfig,{fid:e.fid,registrationStatus:0}),t}}async function wb(r){let e=await Hd(r.appConfig);for(;e.registrationStatus===1;)await Cg(100),e=await Hd(r.appConfig);if(e.registrationStatus===0){const{installationEntry:t,registrationPromise:n}=await $u(r);return n||t}return e}function Hd(r){return Wo(r,e=>{if(!e)throw Ln.create("installation-not-found");return xg(e)})}function xg(r){return vb(r)?{fid:r.fid,registrationStatus:0}:r}function vb(r){return r.registrationStatus===1&&r.registrationTime+Eg<Date.now()}/**
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
 */async function Ab({appConfig:r,heartbeatServiceProvider:e},t){const n=bb(r,t),s=ob(r,t),i=e.getImmediate({optional:!0});if(i){const h=await i.getHeartbeatsHeader();h&&s.append("x-firebase-client",h)}const o={installation:{sdkVersion:Tg,appId:r.appId}},c={method:"POST",headers:s,body:JSON.stringify(o)},u=await Pg(()=>fetch(n,c));if(u.ok){const h=await u.json();return bg(h)}else throw await Sg("Generate Auth Token",u)}function bb(r,{fid:e}){return`${Ag(r)}/${e}/authTokens:generate`}/**
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
 */async function ju(r,e=!1){let t;const n=await Wo(r.appConfig,i=>{if(!Og(i))throw Ln.create("not-registered");const o=i.authToken;if(!e&&Pb(o))return i;if(o.requestStatus===1)return t=Sb(r,e),i;{if(!navigator.onLine)throw Ln.create("app-offline");const c=Vb(i);return t=Rb(r,c),c}});return t?await t:n.authToken}async function Sb(r,e){let t=await Wd(r.appConfig);for(;t.authToken.requestStatus===1;)await Cg(100),t=await Wd(r.appConfig);const n=t.authToken;return n.requestStatus===0?ju(r,e):n}function Wd(r){return Wo(r,e=>{if(!Og(e))throw Ln.create("not-registered");const t=e.authToken;return kb(t)?{...e,authToken:{requestStatus:0}}:e})}async function Rb(r,e){try{const t=await Ab(r,e),n={...e,authToken:t};return await _o(r.appConfig,n),t}catch(t){if(vg(t)&&(t.customData.serverCode===401||t.customData.serverCode===404))await Ng(r.appConfig);else{const n={...e,authToken:{requestStatus:0}};await _o(r.appConfig,n)}throw t}}function Og(r){return r!==void 0&&r.registrationStatus===2}function Pb(r){return r.requestStatus===2&&!Cb(r)}function Cb(r){const e=Date.now();return e<r.creationTime||r.creationTime+r.expiresIn<e+nb}function Vb(r){const e={requestStatus:1,requestTime:Date.now()};return{...r,authToken:e}}function kb(r){return r.requestStatus===1&&r.requestTime+Eg<Date.now()}/**
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
 */async function Db(r){const e=r,{installationEntry:t,registrationPromise:n}=await $u(e);return n?n.catch(console.error):ju(e).catch(console.error),t.fid}/**
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
 */async function Nb(r,e=!1){const t=r;return await xb(t),(await ju(t,e)).token}async function xb(r){const{registrationPromise:e}=await $u(r);e&&await e}/**
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
 */function Ob(r){if(!r||!r.options)throw La("App Configuration");if(!r.name)throw La("App Name");const e=["projectId","apiKey","appId"];for(const t of e)if(!r.options[t])throw La(t);return{appName:r.name,projectId:r.options.projectId,apiKey:r.options.apiKey,appId:r.options.appId}}function La(r){return Ln.create("missing-app-config-values",{valueName:r})}/**
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
 */const Mg="installations",Mb="installations-internal",Lb=r=>{const e=r.getProvider("app").getImmediate(),t=Ob(e),n=Cr(e,"heartbeat");return{app:e,appConfig:t,heartbeatServiceProvider:n,_delete:()=>Promise.resolve()}},Fb=r=>{const e=r.getProvider("app").getImmediate(),t=Cr(e,Mg).getImmediate();return{getId:()=>Db(t),getToken:s=>Nb(t,s)}};function Ub(){at(new Ye(Mg,Lb,"PUBLIC")),at(new Ye(Mb,Fb,"PRIVATE"))}Ub();ze(Ig,Bu);ze(Ig,Bu,"esm2020");/**
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
 */const Bb="/firebase-messaging-sw.js",qb="/firebase-cloud-messaging-push-scope",Lg="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",$b="https://fcmregistrations.googleapis.com/v1",Fg="google.c.a.c_id",jb="google.c.a.c_l",zb="google.c.a.ts",Kb="google.c.a.e",Qd=1e4;var Jd;(function(r){r[r.DATA_MESSAGE=1]="DATA_MESSAGE",r[r.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(Jd||(Jd={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var qs;(function(r){r.PUSH_RECEIVED="push-received",r.NOTIFICATION_CLICKED="notification-clicked"})(qs||(qs={}));/**
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
 */function ht(r){const e=new Uint8Array(r);return btoa(String.fromCharCode(...e)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Gb(r){const e="=".repeat((4-r.length%4)%4),t=(r+e).replace(/\-/g,"+").replace(/_/g,"/"),n=atob(t),s=new Uint8Array(n.length);for(let i=0;i<n.length;++i)s[i]=n.charCodeAt(i);return s}/**
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
 */const Fa="fcm_token_details_db",Hb=5,Yd="fcm_token_object_Store";async function Wb(r){if("databases"in indexedDB&&!(await indexedDB.databases()).map(i=>i.name).includes(Fa))return null;let e=null;return(await Io(Fa,Hb,{upgrade:async(n,s,i,o)=>{if(s<2||!n.objectStoreNames.contains(Yd))return;const c=o.objectStore(Yd),u=await c.index("fcmSenderId").get(r);if(await c.clear(),!!u){if(s===2){const h=u;if(!h.auth||!h.p256dh||!h.endpoint)return;e={token:h.fcmToken,createTime:h.createTime??Date.now(),subscriptionOptions:{auth:h.auth,p256dh:h.p256dh,endpoint:h.endpoint,swScope:h.swScope,vapidKey:typeof h.vapidKey=="string"?h.vapidKey:ht(h.vapidKey)}}}else if(s===3){const h=u;e={token:h.fcmToken,createTime:h.createTime,subscriptionOptions:{auth:ht(h.auth),p256dh:ht(h.p256dh),endpoint:h.endpoint,swScope:h.swScope,vapidKey:ht(h.vapidKey)}}}else if(s===4){const h=u;e={token:h.fcmToken,createTime:h.createTime,subscriptionOptions:{auth:ht(h.auth),p256dh:ht(h.p256dh),endpoint:h.endpoint,swScope:h.swScope,vapidKey:ht(h.vapidKey)}}}}}})).close(),await wa(Fa),await wa("fcm_vapid_details_db"),await wa("undefined"),Qb(e)?e:null}function Qb(r){if(!r||!r.subscriptionOptions)return!1;const{subscriptionOptions:e}=r;return typeof r.createTime=="number"&&r.createTime>0&&typeof r.token=="string"&&r.token.length>0&&typeof e.auth=="string"&&e.auth.length>0&&typeof e.p256dh=="string"&&e.p256dh.length>0&&typeof e.endpoint=="string"&&e.endpoint.length>0&&typeof e.swScope=="string"&&e.swScope.length>0&&typeof e.vapidKey=="string"&&e.vapidKey.length>0}/**
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
 */const Jb="firebase-messaging-database",Yb=1,$s="firebase-messaging-store";let Ua=null;function Ug(){return Ua||(Ua=Io(Jb,Yb,{upgrade:(r,e)=>{switch(e){case 0:r.createObjectStore($s)}}})),Ua}async function Xb(r){const e=Bg(r),n=await(await Ug()).transaction($s).objectStore($s).get(e);if(n)return n;{const s=await Wb(r.appConfig.senderId);if(s)return await zu(r,s),s}}async function zu(r,e){const t=Bg(r),s=(await Ug()).transaction($s,"readwrite");return await s.objectStore($s).put(e,t),await s.done,e}function Bg({appConfig:r}){return r.appId}/**
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
 */const Zb={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},ke=new Un("messaging","Messaging",Zb);/**
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
 */async function eS(r,e){const t=await Gu(r),n=qg(e),s={method:"POST",headers:t,body:JSON.stringify(n)};let i;try{i=await(await fetch(Ku(r.appConfig),s)).json()}catch(o){throw ke.create("token-subscribe-failed",{errorInfo:o==null?void 0:o.toString()})}if(i.error){const o=i.error.message;throw ke.create("token-subscribe-failed",{errorInfo:o})}if(!i.token)throw ke.create("token-subscribe-no-token");return i.token}async function tS(r,e){const t=await Gu(r),n=qg(e.subscriptionOptions),s={method:"PATCH",headers:t,body:JSON.stringify(n)};let i;try{i=await(await fetch(`${Ku(r.appConfig)}/${e.token}`,s)).json()}catch(o){throw ke.create("token-update-failed",{errorInfo:o==null?void 0:o.toString()})}if(i.error){const o=i.error.message;throw ke.create("token-update-failed",{errorInfo:o})}if(!i.token)throw ke.create("token-update-no-token");return i.token}async function nS(r,e){const n={method:"DELETE",headers:await Gu(r)};try{const i=await(await fetch(`${Ku(r.appConfig)}/${e}`,n)).json();if(i.error){const o=i.error.message;throw ke.create("token-unsubscribe-failed",{errorInfo:o})}}catch(s){throw ke.create("token-unsubscribe-failed",{errorInfo:s==null?void 0:s.toString()})}}function Ku({projectId:r}){return`${$b}/projects/${r}/registrations`}async function Gu({appConfig:r,installations:e}){const t=await e.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":r.apiKey,"x-goog-firebase-installations-auth":`FIS ${t}`})}function qg({p256dh:r,auth:e,endpoint:t,vapidKey:n}){const s={web:{endpoint:t,auth:e,p256dh:r}};return n!==Lg&&(s.web.applicationPubKey=n),s}/**
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
 */const rS=10080*60*1e3;async function sS(r){const e=await oS(r.swRegistration,r.vapidKey),t={vapidKey:r.vapidKey,swScope:r.swRegistration.scope,endpoint:e.endpoint,auth:ht(e.getKey("auth")),p256dh:ht(e.getKey("p256dh"))},n=await Xb(r.firebaseDependencies);if(n){if(aS(n.subscriptionOptions,t))return Date.now()>=n.createTime+rS?iS(r,{token:n.token,createTime:Date.now(),subscriptionOptions:t}):n.token;try{await nS(r.firebaseDependencies,n.token)}catch(s){console.warn(s)}return Xd(r.firebaseDependencies,t)}else return Xd(r.firebaseDependencies,t)}async function iS(r,e){try{const t=await tS(r.firebaseDependencies,e),n={...e,token:t,createTime:Date.now()};return await zu(r.firebaseDependencies,n),t}catch(t){throw t}}async function Xd(r,e){const n={token:await eS(r,e),createTime:Date.now(),subscriptionOptions:e};return await zu(r,n),n.token}async function oS(r,e){const t=await r.pushManager.getSubscription();return t||r.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Gb(e)})}function aS(r,e){const t=e.vapidKey===r.vapidKey,n=e.endpoint===r.endpoint,s=e.auth===r.auth,i=e.p256dh===r.p256dh;return t&&n&&s&&i}/**
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
 */function Zd(r){const e={from:r.from,collapseKey:r.collapse_key,messageId:r.fcmMessageId};return cS(e,r),uS(e,r),lS(e,r),e}function cS(r,e){if(!e.notification)return;r.notification={};const t=e.notification.title;t&&(r.notification.title=t);const n=e.notification.body;n&&(r.notification.body=n);const s=e.notification.image;s&&(r.notification.image=s);const i=e.notification.icon;i&&(r.notification.icon=i)}function uS(r,e){e.data&&(r.data=e.data)}function lS(r,e){var s,i,o,c;if(!e.fcmOptions&&!((s=e.notification)!=null&&s.click_action))return;r.fcmOptions={};const t=((i=e.fcmOptions)==null?void 0:i.link)??((o=e.notification)==null?void 0:o.click_action);t&&(r.fcmOptions.link=t);const n=(c=e.fcmOptions)==null?void 0:c.analytics_label;n&&(r.fcmOptions.analyticsLabel=n)}/**
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
 */function hS(r){return typeof r=="object"&&!!r&&Fg in r}/**
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
 */function dS(r){if(!r||!r.options)throw Ba("App Configuration Object");if(!r.name)throw Ba("App Name");const e=["projectId","apiKey","appId","messagingSenderId"],{options:t}=r;for(const n of e)if(!t[n])throw Ba(n);return{appName:r.name,projectId:t.projectId,apiKey:t.apiKey,appId:t.appId,senderId:t.messagingSenderId}}function Ba(r){return ke.create("missing-app-config-values",{valueName:r})}/**
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
 */class fS{constructor(e,t,n){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const s=dS(e);this.firebaseDependencies={app:e,appConfig:s,installations:t,analyticsProvider:n}}_delete(){return Promise.resolve()}}/**
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
 */async function pS(r){try{r.swRegistration=await navigator.serviceWorker.register(Bb,{scope:qb}),r.swRegistration.update().catch(()=>{}),await mS(r.swRegistration)}catch(e){throw ke.create("failed-service-worker-registration",{browserErrorMessage:e==null?void 0:e.message})}}async function mS(r){return new Promise((e,t)=>{const n=setTimeout(()=>t(new Error(`Service worker not registered after ${Qd} ms`)),Qd),s=r.installing||r.waiting;r.active?(clearTimeout(n),e()):s?s.onstatechange=i=>{var o;((o=i.target)==null?void 0:o.state)==="activated"&&(s.onstatechange=null,clearTimeout(n),e())}:(clearTimeout(n),t(new Error("No incoming service worker found.")))})}/**
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
 */async function gS(r,e){if(!e&&!r.swRegistration&&await pS(r),!(!e&&r.swRegistration)){if(!(e instanceof ServiceWorkerRegistration))throw ke.create("invalid-sw-registration");r.swRegistration=e}}/**
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
 */async function _S(r,e){e?r.vapidKey=e:r.vapidKey||(r.vapidKey=Lg)}/**
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
 */async function $g(r,e){if(!navigator)throw ke.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw ke.create("permission-blocked");return await _S(r,e==null?void 0:e.vapidKey),await gS(r,e==null?void 0:e.serviceWorkerRegistration),sS(r)}/**
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
 */async function yS(r,e,t){const n=IS(e);(await r.firebaseDependencies.analyticsProvider.get()).logEvent(n,{message_id:t[Fg],message_name:t[jb],message_time:t[zb],message_device_time:Math.floor(Date.now()/1e3)})}function IS(r){switch(r){case qs.NOTIFICATION_CLICKED:return"notification_open";case qs.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function ES(r,e){const t=e.data;if(!t.isFirebaseMessaging)return;r.onMessageHandler&&t.messageType===qs.PUSH_RECEIVED&&(typeof r.onMessageHandler=="function"?r.onMessageHandler(Zd(t)):r.onMessageHandler.next(Zd(t)));const n=t.data;hS(n)&&n[Kb]==="1"&&await yS(r,t.messageType,n)}const ef="@firebase/messaging",tf="0.12.24";/**
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
 */const TS=r=>{const e=new fS(r.getProvider("app").getImmediate(),r.getProvider("installations-internal").getImmediate(),r.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",t=>ES(e,t)),e},wS=r=>{const e=r.getProvider("messaging").getImmediate();return{getToken:n=>$g(e,n)}};function vS(){at(new Ye("messaging",TS,"PUBLIC")),at(new Ye("messaging-internal",wS,"PRIVATE")),ze(ef,tf),ze(ef,tf,"esm2020")}/**
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
 */async function AS(){try{await pf()}catch{return!1}return typeof window<"u"&&wc()&&F_()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */function bS(r,e){if(!navigator)throw ke.create("only-available-in-window");return r.onMessageHandler=e,()=>{r.onMessageHandler=null}}/**
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
 */function tR(r=_f()){return AS().then(e=>{if(!e)throw ke.create("unsupported-browser")},e=>{throw ke.create("indexed-db-unsupported")}),Cr(se(r),"messaging").getImmediate()}async function nR(r,e){return r=se(r),$g(r,e)}function rR(r,e){return r=se(r),bS(r,e)}vS();export{ZS as A,SS as B,kS as C,PS as D,CS as E,Ft as G,Z as T,LS as a,tR as b,WS as c,MS as d,KS as e,nR as f,DS as g,OS as h,jy as i,XS as j,RS as k,VS as l,FS as m,BS as n,rR as o,zS as p,US as q,QS as r,JS as s,HS as t,YS as u,GS as v,eR as w,$S as x,qS as y,jS as z};
