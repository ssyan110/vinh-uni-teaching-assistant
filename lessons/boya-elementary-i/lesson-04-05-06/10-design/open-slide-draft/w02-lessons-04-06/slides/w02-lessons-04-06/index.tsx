import type { Page, SlideMeta } from '@open-slide/core';
import page01 from './assets/page-01.png';
import page02 from './assets/page-02.png';
import page03 from './assets/page-03.png';
import page04 from './assets/page-04.png';
import page05 from './assets/page-05.png';
import page06 from './assets/page-06.png';
import page07 from './assets/page-07.png';
import page08 from './assets/page-08.png';
import page09 from './assets/page-09.png';
import page10 from './assets/page-10.png';
import page11 from './assets/page-11.png';
import page12 from './assets/page-12.png';
import page13 from './assets/page-13.png';
import page14 from './assets/page-14.png';
import page15 from './assets/page-15.png';
import page16 from './assets/page-16.png';
import page17 from './assets/page-17.png';
import page18 from './assets/page-18.png';
import page19 from './assets/page-19.png';
import page20 from './assets/page-20.png';
import page21 from './assets/page-21.png';
import page22 from './assets/page-22.png';
import page23 from './assets/page-23.png';

export const meta: SlideMeta = {
  title: '初級起步篇｜第 4–6 課（合併授課）',
  createdAt: '2026-09-27T05:37:58.358Z',
};

const references = [
  page01, page02, page03, page04, page05, page06, page07, page08,
  page09, page10, page11, page12, page13, page14, page15, page16,
  page17, page18, page19, page20, page21, page22, page23,
];

const pages = references.map((src, index): Page => {
  const ReferencePage: Page = () => (
    <img
      src={src}
      alt={`課堂參考投影片第 ${index + 1} 頁，原圖完整保留`}
      draggable={false}
      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
    />
  );
  return ReferencePage;
});

export default pages satisfies Page[];
