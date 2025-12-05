# WebSocket Real-Time Application

تطبيق WebSocket حقيقي وكامل باستخدام Node.js ومكتبة `ws`، جاهز للنشر على Railway.

## الميزات الرئيسية

- **WebSocket حقيقي 100%**: Handshake كامل مع Status 101
- **Node.js Runtime**: استخدام مكتبة `ws` الرسمية
- **Broadcasting**: إرسال الرسائل بين جميع المستخدمين
- **Auto-reconnect**: إعادة اتصال تلقائي
- **Production Ready**: جاهز للنشر المباشر
- **واجهة عربية**: تصميم عصري مع دعم الوضع الليلي

## البدء السريع

### التثبيت

\`\`\`bash
npm install
\`\`\`

### التشغيل محلياً

\`\`\`bash
npm run dev
\`\`\`

افتح [http://localhost:3000](http://localhost:3000)

WebSocket server سيكون على: `ws://localhost:3000/api/ws`

### البناء للإنتاج

\`\`\`bash
npm run build
npm start
\`\`\`

## النشر على Railway

راجع [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) للتعليمات الكاملة.

### الخطوات الأساسية:

1. ارفع الكود على GitHub
2. اربط المستودع مع Railway
3. Railway سينشر التطبيق تلقائياً!

## البنية التقنية

- **Frontend**: Next.js 16 + React 19.2
- **Backend**: Node.js + Express-like server
- **WebSocket**: مكتبة `ws` النقية
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui

## الملفات الرئيسية

- `server.js` - WebSocket Server حقيقي
- `app/page.tsx` - واجهة المستخدم والـ Client
- `Dockerfile` - للنشر على Railway
- `railway.json` - تكوين Railway

## التحقق من WebSocket

في Chrome DevTools:
1. Network → WS filter
2. يجب أن ترى Status: **101 Switching Protocols** ✅

## الترخيص

MIT
\`\`\`

```ts file="app/api/websocket/route.ts" isDeleted="true"
...deleted...
