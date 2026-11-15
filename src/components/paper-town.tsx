'use client';
import React, { useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';

function Shop({ x, y, color, roof, label, delay = 0 }: { x: number; y: number; color: string; roof: string; label: string; delay?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-5 83 72 106 124 78 52 61Z" fill="#51452d" opacity=".12"/>
    <g className="paper-pop" style={{ '--pop-delay': `${delay}ms` } as CSSProperties}>
      <path d="M0 0 28-18 108 1 80 22Z" fill={roof}/>
      <path d="M80 22 108 1 108 82 80 104Z" fill={color}/>
      <path d="M80 22 108 1 108 82 80 104Z" fill="#614831" opacity=".13"/>
      <path d="M0 0 80 22 80 104 0 82Z" fill={color} stroke="#fffaf0" strokeWidth="2"/>
      <path d="M7 7 72 25 72 44 7 27Z" fill="#fffaf0"/>
      <text x="40" y="25" textAnchor="middle" transform="rotate(15 40 25)" fontSize="11" fontWeight="800" fill="#5a5945">{label}</text>
      <path d="M-7 39 73 61 83 44 3 22Z" fill={roof}/>
      <path d="M8 43 18 46 28 29 18 26ZM33 50 43 53 53 36 43 33ZM58 57 68 60 78 43 68 40Z" fill="#fff9e9"/>
      <path d="M-7 39 73 61 73 67-7 45Z" fill={roof}/>
      <path d="M10 55 33 61 33 88 10 82Z" fill="#edf4e9" stroke="#e5bd91" strokeWidth="2"/>
      <path d="M44 65 66 71 66 99 44 93Z" fill="#698875"/>
      <path d="M48 69 62 73 62 85 48 81Z" fill="#cce0c8"/><circle cx="60" cy="90" r="1.5" fill="#f9e7b4"/>
      <path d="M89 33 100 25 100 44 89 52Z" fill="#fff4d9"/>
      <path d="M0 82 80 104 89 99 9 78Z" fill="#e3c99e"/>
      <path d="M22 58 22 85M10 68 33 74" stroke="#d4b58f" strokeWidth="2"/>
    </g>
  </g>;
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="7" rx="24" ry="7" fill="#596d40" opacity=".12"/>
    <path d="M-3-45 3-45 3 8-3 8Z" fill="#b28e65"/>
    <path d="M0-86C-30-65-34-30 0-21 34-30 30-65 0-86Z" fill="#8da77b"/>
    <path d="M0-86V-21C34-30 30-65 0-86Z" fill="#6d8d65"/>
    <path d="M0-66V-24" stroke="#c3d2a3" strokeWidth="1.5"/>
  </g>;
}

/** Decorative paper village, not a geographic map or actual store imagery. */
export function PaperTownArt() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="paper-town-art" viewBox="0 0 660 440" fill="none" aria-hidden="true" style={{ fontFamily: 'Malgun Gothic, Apple SD Gothic Neo, sans-serif' }}>
    <ellipse cx="333" cy="369" rx="259" ry="35" fill="#b5a285" opacity=".13"/>
    <g className="paper-book">
      <path d="M39 268 301 169 620 270 360 408 39 294Z" fill="#65816b"/>
      <path d="M39 284 360 399 620 263 620 282 360 420 39 304Z" fill="#4e6a56"/>
      <path d="M47 270 301 176 611 271 360 402 47 291Z" fill="#e7d8b9"/>
      <path d="M48 281 360 391 610 265M49 287 360 398 610 272" stroke="#fff7e4" strokeWidth="2"/>
      <path d="M42 261 293 154Q310 163 328 183L360 389Q340 373 319 371L42 277Z" fill="#fff8e6"/>
      <path d="M328 183Q340 164 362 159L616 253 360 389Z" fill="#f3e8ce"/>
      <path d="M328 183 360 389" stroke="#cdbb99" strokeWidth="2"/>
      <path d="M324 184 354 382" stroke="#fffdf4" strokeWidth="3"/>
      <path d="M76 255 289 175 313 182 99 264Z" fill="#dee5c7"/>
      <path d="M382 183 583 256 377 363 361 345 552 257 371 195Z" fill="#d6dfbf"/>
      <path d="M145 304 449 193 486 207 184 318Z" fill="#ddcfb7"/>
      <path d="M214 204 501 308 468 326 183 216Z" fill="#ddcfb7"/>
      <path d="M163 309 465 200M201 211 482 318" stroke="#fffcf0" strokeWidth="2" strokeDasharray="9 7"/>
      <path d="m300 254 29 11m-33-3 29 11m-33-3 29 11m-33-3 29 11" stroke="#fffbeb" strokeWidth="5"/>
      <path d="m348 240 28 10m-20-14 28 10m-20-14 28 10" stroke="#fffbeb" strokeWidth="5"/>
      <path d="m137 292 22 8m-16-12 22 8m-16-12 22 8" stroke="#fffbeb" strokeWidth="4"/>
      <path d="M361 391 381 381 397 416 383 412 375 426Z" fill="#dd846c"/>
    </g>
    <g opacity=".8" fill="#fffaf1"><path d="M176 95c-20 0-19-17-6-21 0-18 26-24 34-7 18-5 29 23 8 28Z"/><path d="M471 95c-15 0-16-14-4-18 5-19 26-14 29 0 17-1 19 18 3 18Z"/></g>
    <circle cx="551" cy="106" r="23" fill="#edc77d"/><path d="m551 71 0-8m0 86v-8m35-35h8m-86 0h8m10-25-6-6m50 50 6 6m-50-6-6 6m50-50 6-6" stroke="#dfbc77" strokeWidth="2" strokeLinecap="round"/>
    <Tree x={314} y={195} scale={.68}/>
    <Shop x={215} y={132} color="#f3d3a0" roof="#cd886a" label="동네 식당" delay={130}/>
    <Shop x={398} y={177} color="#e0e5c4" roof="#86a18a" label="커피 한 잔" delay={260}/>
    <Tree x={516} y={265} scale={.8}/>
    <Tree x={122} y={248} scale={.83}/>
    <Shop x={184} y={234} color="#f5c8b5" roof="#da826c" label="오늘의 한 끼" delay={390}/>
    <g transform="translate(360 288)" className="paper-pin">
      <path d="M0 0V-51" stroke="#779174" strokeWidth="3"/>
      <path d="M-52-72Q0-82 52-72V-44Q0-34-52-44Z" fill="#fffdf3" stroke="#c4cba8" strokeWidth="2"/>
      <text x="0" y="-52" fill="#526b4c" fontSize="15" fontWeight="800" textAnchor="middle">뱅뱅사거리</text>
      <path d="m-4 1 8 2 5-4-9-2Z" fill="#9da681"/>
    </g>
    <g transform="translate(427 289) rotate(8)">
      <ellipse cx="0" cy="43" rx="33" ry="8" fill="#938362" opacity=".17"/>
      <path d="M-19-6c-11-11-19 4-16 13h67C36-10 15-13 7-7-1-25-20-24-19-6Z" fill="#fffdf3" stroke="#fffdf3" strokeWidth="8"/>
      <path d="M-35 7H33Q27 43-1 43-29 43-35 7Z" fill="#eea38d" stroke="#fffdf3" strokeWidth="6"/>
      <path d="M-28 14H27" stroke="#ffead1" strokeWidth="3"/>
      <circle cx="-12" cy="24" r="2.5" fill="#536048"/><circle cx="11" cy="24" r="2.5" fill="#536048"/>
      <path d="M-6 31q5 6 10 0" stroke="#536048" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M-16-27q-5-7 2-14M4-31q-4-7 3-14" stroke="#cea481" strokeWidth="3" strokeLinecap="round"/>
    </g>
    <g fill="#dd8c79"><path d="m102 157 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z"/><path d="m546 313 2 5 6 1-4 4 1 5-5-2-4 2 1-5-4-4 5-1Z"/></g>
    <path d="M119 354q-13-5-20 5m17-1q-8 4-4 12M536 356q6-16 17-8m-14 10q17-7 19 4" stroke="#8fa87e" strokeWidth="3" strokeLinecap="round"/>
    <text x="201" y="374" fill="#8c9477" fontSize="10" transform="rotate(20 201 374)" letterSpacing="2">A LITTLE LUNCH TOWN</text>
  </svg>;
}

export function PaperTown() {
  const [paused, setPaused] = useState(false);
  return <div className={`paper-town ${paused ? 'is-paused' : ''}`}>
    <div className="paper-town-stage"><PaperTownArt/></div>
    <div className="paper-town-caption"><span>접어둔 동네를, 활짝.</span><button className="paper-motion" type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? '종이 동네 움직임 재생' : '종이 동네 움직임 멈추기'}>{paused ? <Play size={12}/> : <Pause size={12}/>}<span>{paused ? '움직임 켜기' : '움직임 끄기'}</span></button></div>
  </div>;
}
