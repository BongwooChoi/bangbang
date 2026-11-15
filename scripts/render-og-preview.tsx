import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { BookVillage } from '../src/components/book-village';
import { Mascot } from '../src/components/mascot';

// tsx's standalone renderer also supports the app's JSX-preserve compilation.
Object.assign(globalThis, { React });
const css = ['globals.css', 'paper.css', 'book-world.css'].map(name => readFileSync(new URL(`../src/app/${name}`, import.meta.url), 'utf8')).join('\n');
const village = renderToStaticMarkup(<BookVillage onBrowse={() => {}} onDraw={() => {}} count={0} busy={false} error="" onRetry={() => {}}/>);
const mascot = renderToStaticMarkup(<Mascot size={53}/>);

// The exact same CSS 3D shops as the app, with no restaurant data or API requests.
process.stdout.write(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=1200,initial-scale=1"><title>뱅뱅밥 공유 이미지</title><style>${css}
html,body{width:1200px;height:630px;overflow:hidden;margin:0}body{background:radial-gradient(ellipse at 20% 0,#f1eee1,#d6ddcb);font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif}
.social-book{position:absolute;inset:38px 30px 43px;border:8px solid #637d68;border-bottom-width:12px;border-radius:8px 22px 22px 8px;background:#fff9e9;box-shadow:0 3px 0 #e7d9bb,0 7px 0 #bdaf8f,0 11px 0 #506952,7px 22px 26px #4c583c2b}
.social-book:before{content:'';position:absolute;inset:5px;border:1px solid #e3d3b4;border-radius:3px 12px 12px 3px}.social-book:after{content:'';position:absolute;top:0;bottom:0;left:49%;width:18px;background:linear-gradient(90deg,transparent,#826b4322,transparent)}
.social-copy{position:absolute;left:44px;top:29px;z-index:2}.social-brand{display:flex;align-items:center;gap:10px;font-size:29px;font-weight:800;color:#3e523c}.social-brand small{font-size:15px;font-weight:500;margin-left:10px;color:#718161}.social-copy h1{margin:40px 0 26px;font-size:46px;line-height:1.42;letter-spacing:-2px;font-weight:900;color:#394b38}.social-copy h1 span{box-shadow:0 -12px 0 #f1c6a88a inset}.social-question{font-size:23px;font-weight:700;color:#567454;letter-spacing:-1px}.social-detail{font-size:21px;color:#6d785e;margin-top:7px}.social-area{position:absolute;left:48px;bottom:28px;font-size:17px;color:#7c836a;letter-spacing:.3px}.social-ribbon{position:absolute;right:51px;top:-21px;background:#e5bf9e;border:1px solid #cfb18c;padding:8px 19px 11px;border-radius:6px 10px 0 0;color:#6d684e;font-size:15px;font-weight:700;transform:rotate(2deg)}
.social-world{position:absolute;right:-3px;top:14px;width:620px;height:490px;z-index:1}.village-chapter{display:block;width:620px;height:490px;padding:0;min-height:0;max-height:none;overflow:visible}.village-heading,.village-controls,.village-actions,.village-status,.world-location{display:none}.world-camera{width:620px;height:490px;min-height:0}.world-orbit{--world-scale:.79!important}.village-plane{top:50%;transform:translate(-50%,-40%) rotateX(51deg) rotateZ(-19deg) scale3d(.79,.79,.79)}.shop-building,.world-mascot>span{animation:none!important}.world-shop:hover .shop-building{translate:none}.world-mascot:disabled{opacity:1}.social-world button{cursor:default}
</style><body><main class="social-book"><div class="social-ribbon">우리 동네 맛집 팝업북</div><div class="social-copy"><div class="social-brand">${mascot}<span>뱅뱅밥</span><small>한 끼를 펼치는 시간</small></div><h1>오늘 점심,<br/><span>한 장 펼쳐볼까요?</span></h1><p class="social-question">“30대 여성이 많이 찾는 카페”</p><p class="social-detail">카드 데이터와 AI로 찾아요.</p></div><div class="social-world">${village}</div><div class="social-area">강남역 · 뱅뱅사거리 · 양재역</div></main></body></html>`);
