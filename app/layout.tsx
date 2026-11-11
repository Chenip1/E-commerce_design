import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'图匠室 · 商品创意工作台',icons:{icon:{url:'/tujiangshi-icon.png',type:'image/png',sizes:'96x96'}},description:'让每一次上新，都有好设计。商品资料、创作方向、可编辑营销套图。'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
