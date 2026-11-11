import { createRoot } from 'react-dom/client';
import Workbench from './app/workbench';
import './app/globals.css';
import './pages.css';

createRoot(document.getElementById('root')!).render(
  <>
    <aside className="pages-status">
      GitHub Pages 体验版 · 草稿保存在当前浏览器
      <a href="https://shangxin-workshop-yiping.shadyorbit13.chatgpt.site/" target="_blank" rel="noopener noreferrer">打开完整版 ↗</a>
    </aside>
    <Workbench />
  </>,
);
